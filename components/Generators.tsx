
import React, { useState, useEffect } from 'react';
import { 
    generateNpc, 
    generateLoot, 
    generateScenarioDescription, 
    generateShop, 
    generateQuest, 
    generateMinorLocation, 
    generateJobBoard, 
    generatePuzzle,
    generateTrinket,
    AVAILABLE_MODELS,
    getActiveModel,
    setActiveModel,
    setCustomApiKey,
    getCustomApiKey
} from '../services/polzaService';
import { NpcData } from '../types';
import { 
    Sparkles, 
    Loader, 
    Copy, 
    Check, 
    User, 
    Coins, 
    Eye, 
    Store, 
    Map, 
    FileQuestion, 
    Scroll, 
    HelpCircle,
    Bot,
    Settings,
    Save,
    Key
} from 'lucide-react';

type ToolType = 'npc' | 'loot' | 'trinket' | 'desc' | 'shop' | 'quest' | 'location' | 'board' | 'puzzle';

const TOOLS = [
    { id: 'npc', label: 'NPC', icon: <User className="w-4 h-4"/> },
    { id: 'desc', label: 'Нарратор', icon: <Eye className="w-4 h-4"/> },
    { id: 'shop', label: 'Магазин', icon: <Store className="w-4 h-4"/> },
    { id: 'loot', label: 'Сокровище', icon: <Coins className="w-4 h-4"/> },
    { id: 'trinket', label: 'Мелочевка', icon: <Sparkles className="w-4 h-4"/> },
    { id: 'quest', label: 'Квест', icon: <HelpCircle className="w-4 h-4"/> },
    { id: 'location', label: 'Место', icon: <Map className="w-4 h-4"/> },
    { id: 'board', label: 'Доска', icon: <Scroll className="w-4 h-4"/> },
    { id: 'puzzle', label: 'Загадка', icon: <FileQuestion className="w-4 h-4"/> },
];

const Generators: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('npc');
  const [selectedModel, setSelectedModel] = useState(getActiveModel());
  const [showSettings, setShowSettings] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  // State inputs
  const [npcKeywords, setNpcKeywords] = useState('');
  const [lootLevel, setLootLevel] = useState(1);
  const [lootType, setLootType] = useState('Сундук босса');
  const [trinketContext, setTrinketContext] = useState('в карманах бандита');
  const [descContext, setDescContext] = useState('');
  const [shopType, setShopType] = useState('Кузница');
  const [shopLoc, setShopLoc] = useState('Деревня');
  const [questLevel, setQuestLevel] = useState('1-3');
  const [questContext, setQuestContext] = useState('Лесная дорога');
  const [locType, setLocType] = useState('Заброшенная башня');
  const [boardSetting, setBoardSetting] = useState('Портовый город');
  const [puzzleDiff, setPuzzleDiff] = useState('Средняя');
  const [puzzleTheme, setPuzzleTheme] = useState('Зеркала');

  // Outputs
  const [generatedNpc, setGeneratedNpc] = useState<NpcData | null>(null);
  const [generatedText, setGeneratedText] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
      const storedKey = getCustomApiKey();
      if (storedKey) setApiKeyInput(storedKey);
  }, []);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSelectedModel(val);
      setActiveModel(val);
  };

  const handleSaveKey = () => {
      setCustomApiKey(apiKeyInput);
      setShowSettings(false);
      setErrorText(''); // Clear previous errors
      alert("Ключ сохранен! Теперь генераторы должны работать.");
  };

  const runGenerator = async (fn: () => Promise<any>) => {
      setLoading(true);
      setGeneratedNpc(null);
      setGeneratedText('');
      setErrorText('');
      try {
          const result = await fn();
          if (typeof result === 'object') {
              setGeneratedNpc(result);
          } else {
              setGeneratedText(result);
          }
      } catch (e: any) {
          console.error(e);
          setErrorText(e.message || "Ошибка генерации. Проверьте настройки API.");
      } finally {
          setLoading(false);
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col gap-4">
      
      {/* Controls Header */}
      <div className="flex items-center gap-2 bg-dnd-card px-4 py-2 rounded border border-gray-700 relative">
        <div className="flex items-center gap-2 text-gold-500">
            <Bot className="w-5 h-5" />
            <span className="text-sm font-bold uppercase hidden md:inline">Модель:</span>
        </div>
        <select 
            value={selectedModel}
            onChange={handleModelChange}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white outline-none focus:border-gold-500 flex-1"
        >
            {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
            ))}
        </select>
        
        <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded border transition-colors ${showSettings ? 'bg-gold-600 text-black border-gold-500' : 'bg-gray-800 text-gray-400 border-gray-600 hover:text-white'}`}
            title="Настройки API Key"
        >
            <Settings className="w-4 h-4" />
        </button>

        {/* Settings Dropdown */}
        {showSettings && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-gray-900 border border-gold-500 rounded shadow-2xl p-4 z-20 animate-in fade-in slide-in-from-top-2">
                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Key className="w-4 h-4"/> API Configuration</h4>
                <p className="text-xs text-gray-400 mb-3">
                    Если генерация не работает (ошибка 401), укажите ваш ключ от Polza.AI здесь.
                </p>
                <input 
                    type="password" 
                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white mb-3 outline-none focus:border-gold-500"
                    placeholder="sk-..."
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                />
                <button 
                    onClick={handleSaveKey}
                    className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 rounded flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4"/> Сохранить
                </button>
            </div>
        )}
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-3 md:grid-cols-9 gap-2 shrink-0">
          {TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as ToolType)}
                className={`flex flex-col items-center justify-center p-2 rounded border transition-all text-xs font-bold uppercase tracking-wide ${
                    activeTool === tool.id 
                    ? 'bg-gold-600 text-black border-gold-500 shadow-lg scale-105' 
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
                }`}
              >
                  {tool.icon}
                  <span className="mt-1">{tool.label}</span>
              </button>
          ))}
      </div>

      {/* Input Area */}
      <div className="bg-dnd-card p-4 rounded-lg border border-gray-700 shrink-0">
        {activeTool === 'npc' && (
            <div className="flex gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white" 
                    value={npcKeywords} onChange={e => setNpcKeywords(e.target.value)} placeholder="Ключевые слова (напр. сварливый гном)" />
                <button disabled={loading} onClick={() => runGenerator(() => generateNpc(npcKeywords || 'случайный'))} 
                    className="bg-dnd-red hover:bg-red-700 text-white px-4 rounded flex items-center gap-2 font-bold">{loading ? <Loader className="animate-spin"/> : 'Создать'}</button>
            </div>
        )}

        {activeTool === 'loot' && (
             <div className="flex gap-2 items-end">
                <div className="w-20">
                    <label className="text-xs text-gray-500">Уровень</label>
                    <input type="number" className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white" value={lootLevel} onChange={e => setLootLevel(Number(e.target.value))} />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-gray-500">Контекст</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white" value={lootType} onChange={e => setLootType(e.target.value)} />
                </div>
                <button disabled={loading} onClick={() => runGenerator(() => generateLoot(lootLevel, lootType))} 
                    className="bg-gold-600 hover:bg-gold-500 text-black px-4 py-2 rounded font-bold">{loading ? <Loader className="animate-spin"/> : 'Генерация'}</button>
            </div>
        )}

        {activeTool === 'trinket' && (
            <div className="flex gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white" 
                    value={trinketContext} onChange={e => setTrinketContext(e.target.value)} placeholder="Где ищем? (напр. в старом шкафу)" />
                <button disabled={loading} onClick={() => runGenerator(() => generateTrinket(trinketContext))} 
                    className="bg-gold-600 hover:bg-gold-500 text-black px-4 rounded font-bold">{loading ? <Loader className="animate-spin"/> : 'Искать'}</button>
            </div>
        )}

        {activeTool === 'desc' && (
             <div className="flex gap-2">
                <textarea className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white h-20 resize-none" 
                    value={descContext} onChange={e => setDescContext(e.target.value)} placeholder="Что видят игроки? (напр. Древний храм в джунглях)" />
                <button disabled={loading} onClick={() => runGenerator(() => generateScenarioDescription(descContext))} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 rounded font-bold">{loading ? <Loader className="animate-spin"/> : 'Описать'}</button>
            </div>
        )}

        {activeTool === 'shop' && (
            <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-xs text-gray-500">Тип магазина</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white" value={shopType} onChange={e => setShopType(e.target.value)} />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-gray-500">Локация</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white" value={shopLoc} onChange={e => setShopLoc(e.target.value)} />
                </div>
                <button disabled={loading} onClick={() => runGenerator(() => generateShop(shopType, shopLoc))} 
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold">{loading ? <Loader className="animate-spin"/> : 'Открыть'}</button>
            </div>
        )}

        {activeTool === 'quest' && (
             <div className="flex gap-2 items-end">
                <div className="w-24">
                    <label className="text-xs text-gray-500">Уровень</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white" value={questLevel} onChange={e => setQuestLevel(e.target.value)} />
                </div>
                <div className="flex-1">
                    <label className="text-xs text-gray-500">Контекст</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white" value={questContext} onChange={e => setQuestContext(e.target.value)} />
                </div>
                <button disabled={loading} onClick={() => runGenerator(() => generateQuest(questLevel, questContext))} 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold">{loading ? <Loader className="animate-spin"/> : 'Квест'}</button>
            </div>
        )}

        {activeTool === 'location' && (
             <div className="flex gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white" 
                    value={locType} onChange={e => setLocType(e.target.value)} placeholder="Тип места (напр. Лагерь гоблинов)" />
                <button disabled={loading} onClick={() => runGenerator(() => generateMinorLocation(locType))} 
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 rounded font-bold">{loading ? <Loader className="animate-spin"/> : 'Создать'}</button>
            </div>
        )}

        {activeTool === 'board' && (
             <div className="flex gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white" 
                    value={boardSetting} onChange={e => setBoardSetting(e.target.value)} placeholder="Поселение (напр. Шахтерский городок)" />
                <button disabled={loading} onClick={() => runGenerator(() => generateJobBoard(boardSetting))} 
                    className="bg-yellow-700 hover:bg-yellow-600 text-white px-4 rounded font-bold">{loading ? <Loader className="animate-spin"/> : 'Доска'}</button>
            </div>
        )}

        {activeTool === 'puzzle' && (
             <div className="flex gap-2 items-end">
                <div className="flex-1">
                    <label className="text-xs text-gray-500">Сложность</label>
                    <select className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white" value={puzzleDiff} onChange={e => setPuzzleDiff(e.target.value)}>
                        <option>Лёгкая</option>
                        <option>Средняя</option>
                        <option>Смертельная</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-xs text-gray-500">Тема</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white" value={puzzleTheme} onChange={e => setPuzzleTheme(e.target.value)} />
                </div>
                <button disabled={loading} onClick={() => runGenerator(() => generatePuzzle(puzzleDiff, puzzleTheme))} 
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold">{loading ? <Loader className="animate-spin"/> : 'Загадка'}</button>
            </div>
        )}
      </div>

      {/* Result Area */}
      <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 p-4 overflow-y-auto relative">
         {errorText && (
             <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded flex flex-col items-center justify-center gap-2 animate-in fade-in">
                 <div className="font-bold flex items-center gap-2"><Bot className="w-5 h-5"/> Ошибка AI</div>
                 <p className="text-center text-sm">{errorText}</p>
                 <button 
                    onClick={() => setShowSettings(true)}
                    className="mt-2 bg-red-700 hover:bg-red-600 text-white px-4 py-1 rounded text-sm font-bold"
                 >
                    Настроить API Key
                 </button>
             </div>
         )}

         {generatedNpc && !errorText && (
             <div className="space-y-4 text-gray-200 animate-in fade-in">
                 <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-serif text-gold-500 font-bold">{generatedNpc.name}</h3>
                    <button onClick={() => copyToClipboard(JSON.stringify(generatedNpc, null, 2))} className="text-gray-500 hover:text-white">
                        {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                    </button>
                 </div>
                 <p className="italic text-gray-400">{generatedNpc.race} {generatedNpc.class}</p>
                 
                 <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Внешность</span>
                        <p className="text-sm">{generatedNpc.description}</p>
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Личность</span>
                        <p className="text-sm">{generatedNpc.personality}</p>
                    </div>
                 </div>

                 <div className="border-l-2 border-gold-500 pl-3 py-1">
                    <span className="text-xs text-gold-500 uppercase tracking-widest">Голос</span>
                    <p className="text-lg font-serif italic">"{generatedNpc.voice}"</p>
                 </div>
                 
                 <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-red-900/20 border border-red-900/50 p-3 rounded">
                        <span className="text-xs text-red-400 uppercase tracking-widest">Секрет</span>
                        <p className="text-red-200 text-sm">{generatedNpc.secret}</p>
                    </div>
                    <div className="bg-indigo-900/20 border border-indigo-900/50 p-3 rounded">
                        <span className="text-xs text-indigo-400 uppercase tracking-widest">Квест</span>
                        <p className="text-indigo-200 text-sm">{generatedNpc.hook}</p>
                    </div>
                 </div>
             </div>
         )}

         {generatedText && !errorText && (
             <div className="animate-in fade-in text-sm text-gray-300 [&_h1]:text-gold-500 [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-gold-500 [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-gold-500 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3:first-child]:mt-0 [&_h4]:text-gold-400 [&_h4]:font-bold [&_h4]:mb-2 [&_strong]:text-white [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_p]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:p-2 [&_th]:border-b [&_th]:border-gray-700 [&_td]:p-2 [&_td]:border-b [&_td]:border-gray-800">
                 <div className="flex justify-end mb-2 sticky top-0 bg-gray-900 py-2 z-10 border-b border-gray-800">
                    <button onClick={() => copyToClipboard(generatedText)} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs uppercase font-bold">
                        {copied ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>} Копировать
                    </button>
                 </div>
                 <div dangerouslySetInnerHTML={{__html: generatedText}} />
             </div>
         )}

         {!generatedNpc && !generatedText && !loading && !errorText && (
             <div className="h-full flex flex-col items-center justify-center text-gray-600 italic opacity-40">
                 <Sparkles className="w-12 h-12 mb-2" />
                 <p>Выберите инструмент и нажмите кнопку</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default Generators;
