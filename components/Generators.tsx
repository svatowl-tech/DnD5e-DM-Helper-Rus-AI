
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
    generateImage,
    AVAILABLE_MODELS,
    getActiveModel,
    setActiveModel,
} from '../services/polzaService';
import { NpcData, SavedImage, GeneratorsProps } from '../types';
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
    Image as ImageIcon,
    ZoomIn,
    Save,
    FileText,
    Swords,
    UserPlus
} from 'lucide-react';
import SmartText from './SmartText';

type ToolType = 'npc' | 'loot' | 'trinket' | 'desc' | 'shop' | 'quest' | 'location' | 'board' | 'puzzle';

const TOOLS = [
    { id: 'npc', label: 'NPC', icon: <User className="w-4 h-4"/> },
    { id: 'desc', label: 'Нарратор', icon: <Eye className="w-4 h-4"/> },
    { id: 'shop', label: 'Магазин', icon: <Store className="w-4 h-4"/> },
    { id: 'loot', label: 'Лут', icon: <Coins className="w-4 h-4"/> },
    { id: 'trinket', label: 'Мелочь', icon: <Sparkles className="w-4 h-4"/> },
    { id: 'quest', label: 'Квест', icon: <HelpCircle className="w-4 h-4"/> },
    { id: 'location', label: 'Место', icon: <Map className="w-4 h-4"/> },
    { id: 'board', label: 'Доска', icon: <Scroll className="w-4 h-4"/> },
    { id: 'puzzle', label: 'Загадка', icon: <FileQuestion className="w-4 h-4"/> },
];

const Generators: React.FC<GeneratorsProps> = ({ onImageGenerated, onShowImage, addLog }) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [activeTool, setActiveTool] = useState<ToolType>('npc');
  const [selectedModel, setSelectedModel] = useState(getActiveModel());
  
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
  const [generatedImage, setGeneratedImage] = useState<SavedImage | null>(null);
  const [errorText, setErrorText] = useState<string>('');
  const [copied, setCopied] = useState(false);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setSelectedModel(val);
      setActiveModel(val);
  };

  const runGenerator = async (fn: () => Promise<any>) => {
      setLoading(true);
      setGeneratedNpc(null);
      setGeneratedText('');
      setGeneratedImage(null);
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

  const handleGenerateNpcPortrait = async () => {
      if (!generatedNpc) return;
      setImageLoading(true);
      try {
          const prompt = `Fantasy RPG portrait of ${generatedNpc.name}, ${generatedNpc.race} ${generatedNpc.class}. ${generatedNpc.description}. Detailed, digital art style, 4k.`;
          const url = await generateImage(prompt, "1:1");
          
          const newImage: SavedImage = {
              id: Date.now().toString(),
              url: url,
              title: generatedNpc.name,
              type: 'npc',
              timestamp: Date.now()
          };
          
          setGeneratedImage(newImage);
          if (onImageGenerated) onImageGenerated(newImage);

      } catch (e: any) {
          setErrorText("Ошибка генерации изображения: " + e.message);
      } finally {
          setImageLoading(false);
      }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const saveToLog = () => {
      if (generatedNpc) {
          addLog({
              id: Date.now().toString(),
              timestamp: Date.now(),
              text: `[NPC] Создан: ${generatedNpc.name} (${generatedNpc.race} ${generatedNpc.class})`,
              type: 'story'
          });
          alert("NPC сохранен в лог сессии.");
      } else if (generatedText) {
          let prefix = "[Инфо]";
          if (activeTool === 'loot') prefix = "[Лут]";
          if (activeTool === 'location') prefix = "[Локация]";
          if (activeTool === 'quest') prefix = "[Квест]";
          
          // Strip HTML for log
          const cleanText = generatedText.replace(/<[^>]*>?/gm, ' ').substring(0, 200) + "...";
          
          addLog({
              id: Date.now().toString(),
              timestamp: Date.now(),
              text: `${prefix} Сгенерировано: ${cleanText}`,
              type: 'story'
          });
          alert("Информация сохранена в лог сессии.");
      }
  };

  const saveToNpcTracker = () => {
      if (!generatedNpc) return;
      const event = new CustomEvent('dmc-add-npc', {
          detail: {
              ...generatedNpc,
              imageUrl: generatedImage?.url, // Pass the image URL to the tracker
              location: 'Неизвестно',
              status: 'alive',
              attitude: 'neutral'
          }
      });
      window.dispatchEvent(event);
      alert(`${generatedNpc.name} сохранен в Трекере NPC.`);
  };

  const saveToNotes = () => {
      let title = "Новая заметка";
      let content = "";
      let tags: string[] = ['AI'];

      if (generatedNpc) {
          title = `NPC: ${generatedNpc.name}`;
          content = `
            <h3>${generatedNpc.name}</h3>
            <p><strong>Раса/Класс:</strong> ${generatedNpc.race} ${generatedNpc.class}</p>
            <p><strong>Описание:</strong> ${generatedNpc.description}</p>
            <p><strong>Характер:</strong> ${generatedNpc.personality}</p>
            <p><strong>Голос:</strong> ${generatedNpc.voice}</p>
            <p><strong>Секрет:</strong> ${generatedNpc.secret}</p>
            <p><strong>Квест:</strong> ${generatedNpc.hook}</p>
          `;
          tags.push('npc');
      } else if (generatedText) {
          title = `AI ${TOOLS.find(t => t.id === activeTool)?.label || 'Генерация'}`;
          content = generatedText;
          tags.push(activeTool);
      }

      const event = new CustomEvent('dmc-add-note', { 
          detail: {
              title,
              content,
              tags
          } 
      });
      window.dispatchEvent(event);
      addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Заметка "${title}" сохранена.`, type: 'system' });
  };

  const sendNpcToCombat = () => {
      if (!generatedNpc) return;
      const event = new CustomEvent('dmc-add-combatant', {
          detail: {
              name: generatedNpc.name,
              type: 'MONSTER',
              notes: `${generatedNpc.race} ${generatedNpc.class}. ${generatedNpc.description}`,
              hp: 20, // Default generic stats
              ac: 12,
              initiative: 10
          }
      });
      window.dispatchEvent(event);
      addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `${generatedNpc.name} добавлен в бой.`, type: 'combat' });
  };

  return (
    <div className="h-full flex flex-col gap-4">
      
      {/* Controls Header */}
      <div className="flex items-center gap-2 bg-dnd-card px-4 py-2 rounded border border-gray-700 shrink-0">
        <div className="flex items-center gap-2 text-gold-500">
            <Bot className="w-5 h-5" />
            <span className="text-xs font-bold uppercase hidden md:inline">Модель:</span>
        </div>
        <select 
            value={selectedModel}
            onChange={handleModelChange}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-1.5 text-xs text-white outline-none focus:border-gold-500 flex-1 truncate"
        >
            {AVAILABLE_MODELS.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
            ))}
        </select>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 shrink-0">
          {TOOLS.map(tool => (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id as ToolType)}
                className={`flex flex-col items-center justify-center p-2 rounded border transition-all text-[10px] sm:text-xs font-bold uppercase tracking-wide ${
                    activeTool === tool.id 
                    ? 'bg-gold-600 text-black border-gold-500 shadow-lg scale-105 z-10' 
                    : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white'
                }`}
              >
                  {tool.icon}
                  <span className="mt-1">{tool.label}</span>
              </button>
          ))}
      </div>

      {/* Input Area */}
      <div className="bg-dnd-card p-4 rounded-lg border border-gray-700 shrink-0 shadow-sm">
        {activeTool === 'npc' && (
            <div className="flex flex-col sm:flex-row gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" 
                    value={npcKeywords} onChange={e => setNpcKeywords(e.target.value)} placeholder="Ключевые слова (напр. сварливый гном)" />
                <button disabled={loading} onClick={() => runGenerator(() => generateNpc(npcKeywords || 'случайный'))} 
                    className="bg-dnd-red hover:bg-red-700 text-white px-4 py-2 rounded flex justify-center items-center gap-2 font-bold text-sm sm:w-auto w-full">{loading ? <Loader className="animate-spin"/> : 'Создать'}</button>
            </div>
        )}

        {activeTool === 'loot' && (
             <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="flex gap-2">
                    <div className="w-16">
                        <label className="text-[10px] text-gray-500 uppercase">Уровень</label>
                        <input type="number" className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" value={lootLevel} onChange={e => setLootLevel(Number(e.target.value))} />
                    </div>
                </div>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase">Контекст</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" value={lootType} onChange={e => setLootType(e.target.value)} />
                </div>
                <button disabled={loading} onClick={() => runGenerator(() => generateLoot(lootLevel, lootType))} 
                    className="bg-gold-600 hover:bg-gold-500 text-black px-4 py-2 rounded font-bold text-sm">{loading ? <Loader className="animate-spin"/> : 'Генерация'}</button>
            </div>
        )}

        {activeTool === 'trinket' && (
            <div className="flex flex-col sm:flex-row gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" 
                    value={trinketContext} onChange={e => setTrinketContext(e.target.value)} placeholder="Где ищем? (напр. в старом шкафу)" />
                <button disabled={loading} onClick={() => runGenerator(() => generateTrinket(trinketContext))} 
                    className="bg-gold-600 hover:bg-gold-500 text-black px-4 py-2 rounded font-bold text-sm">{loading ? <Loader className="animate-spin"/> : 'Искать'}</button>
            </div>
        )}

        {activeTool === 'desc' && (
             <div className="flex flex-col sm:flex-row gap-2">
                <textarea className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm h-20 resize-none" 
                    value={descContext} onChange={e => setDescContext(e.target.value)} placeholder="Что видят игроки?" />
                <button disabled={loading} onClick={() => runGenerator(() => generateScenarioDescription(descContext))} 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold text-sm">{loading ? <Loader className="animate-spin"/> : 'Описать'}</button>
            </div>
        )}

        {activeTool === 'shop' && (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase">Тип</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" value={shopType} onChange={e => setShopType(e.target.value)} />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase">Локация</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" value={shopLoc} onChange={e => setShopLoc(e.target.value)} />
                </div>
                <button disabled={loading} onClick={() => runGenerator(() => generateShop(shopType, shopLoc))} 
                    className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold text-sm">{loading ? <Loader className="animate-spin"/> : 'Открыть'}</button>
            </div>
        )}

        {activeTool === 'quest' && (
             <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="w-24">
                    <label className="text-[10px] text-gray-500 uppercase">Уровень</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" value={questLevel} onChange={e => setQuestLevel(e.target.value)} />
                </div>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase">Контекст</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" value={questContext} onChange={e => setQuestContext(e.target.value)} />
                </div>
                <button disabled={loading} onClick={() => runGenerator(() => generateQuest(questLevel, questContext))} 
                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold text-sm">{loading ? <Loader className="animate-spin"/> : 'Квест'}</button>
            </div>
        )}

        {activeTool === 'location' && (
             <div className="flex flex-col sm:flex-row gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" 
                    value={locType} onChange={e => setLocType(e.target.value)} placeholder="Тип места (напр. Лагерь гоблинов)" />
                <button disabled={loading} onClick={() => runGenerator(() => generateMinorLocation(locType))} 
                    className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded font-bold text-sm">{loading ? <Loader className="animate-spin"/> : 'Создать'}</button>
            </div>
        )}

        {activeTool === 'board' && (
             <div className="flex flex-col sm:flex-row gap-2">
                <input className="flex-1 bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" 
                    value={boardSetting} onChange={e => setBoardSetting(e.target.value)} placeholder="Поселение (напр. Шахтерский городок)" />
                <button disabled={loading} onClick={() => runGenerator(() => generateJobBoard(boardSetting))} 
                    className="bg-yellow-700 hover:bg-yellow-600 text-white px-4 py-2 rounded font-bold text-sm">{loading ? <Loader className="animate-spin"/> : 'Доска'}</button>
            </div>
        )}

        {activeTool === 'puzzle' && (
             <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase">Сложность</label>
                    <select className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" value={puzzleDiff} onChange={e => setPuzzleDiff(e.target.value)}>
                        <option>Лёгкая</option>
                        <option>Средняя</option>
                        <option>Смертельная</option>
                    </select>
                </div>
                <div className="flex-1">
                    <label className="text-[10px] text-gray-500 uppercase">Тема</label>
                    <input className="w-full bg-gray-800 border border-gray-600 p-2 rounded text-white text-sm" value={puzzleTheme} onChange={e => setPuzzleTheme(e.target.value)} />
                </div>
                <button disabled={loading} onClick={() => runGenerator(() => generatePuzzle(puzzleDiff, puzzleTheme))} 
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded font-bold text-sm">{loading ? <Loader className="animate-spin"/> : 'Загадка'}</button>
            </div>
        )}
      </div>

      {/* Result Area */}
      <div className="flex-1 bg-gray-900 rounded-lg border border-gray-800 p-4 overflow-y-auto relative custom-scrollbar">
         {errorText && (
             <div className="bg-red-900/30 border border-red-500 text-red-200 p-4 rounded flex flex-col items-center justify-center gap-2 animate-in fade-in">
                 <div className="font-bold flex items-center gap-2"><Bot className="w-5 h-5"/> Ошибка AI</div>
                 <p className="text-center text-sm">{errorText}</p>
             </div>
         )}

         {generatedNpc && !errorText && (
             <div className="space-y-4 text-gray-200 animate-in fade-in">
                 <div className="flex justify-between items-start">
                    <h3 className="text-2xl font-serif text-gold-500 font-bold">{generatedNpc.name}</h3>
                    <div className="flex gap-2">
                        <button onClick={saveToNpcTracker} className="text-indigo-400 hover:text-white" title="Сохранить в Трекер NPC">
                            <UserPlus className="w-5 h-5"/>
                        </button>
                        <button onClick={saveToNotes} className="text-green-400 hover:text-white" title="Сохранить в Заметки">
                            <FileText className="w-5 h-5"/>
                        </button>
                        <button onClick={sendNpcToCombat} className="text-red-400 hover:text-white" title="В бой">
                            <Swords className="w-5 h-5"/>
                        </button>
                        <button onClick={saveToLog} className="text-blue-400 hover:text-white" title="Добавить в Лог">
                            <Save className="w-5 h-5"/>
                        </button>
                        <button 
                            onClick={handleGenerateNpcPortrait} 
                            disabled={imageLoading}
                            className="text-indigo-400 hover:text-indigo-200 disabled:opacity-50"
                            title="Сгенерировать портрет"
                        >
                            {imageLoading ? <Loader className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5"/>}
                        </button>
                        <button onClick={() => copyToClipboard(JSON.stringify(generatedNpc, null, 2))} className="text-gray-500 hover:text-white">
                            {copied ? <Check className="w-4 h-4"/> : <Copy className="w-4 h-4"/>}
                        </button>
                    </div>
                 </div>
                 
                 {/* Generated Image Display */}
                 {generatedImage && (
                     <div className="w-full max-w-xs mx-auto rounded-lg overflow-hidden border-2 border-gold-600 shadow-lg relative group">
                         <img src={generatedImage.url} alt={generatedImage.title} className="w-full h-auto" />
                         
                         <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                             {onShowImage && (
                                 <button 
                                    onClick={() => onShowImage(generatedImage)}
                                    className="bg-gold-600 text-black px-3 py-1 rounded font-bold flex items-center gap-1 text-sm hover:bg-white"
                                 >
                                     <Eye className="w-4 h-4" /> Показать игрокам
                                 </button>
                             )}
                         </div>
                     </div>
                 )}

                 <p className="italic text-gray-400">{generatedNpc.race} {generatedNpc.class}</p>
                 
                 <div className="grid gap-4 md:grid-cols-2">
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Внешность</span>
                        <SmartText content={generatedNpc.description} className="text-sm" />
                    </div>
                    <div className="bg-gray-800 p-3 rounded border border-gray-700">
                        <span className="text-xs text-gray-500 uppercase tracking-widest block mb-1">Личность</span>
                        <SmartText content={generatedNpc.personality} className="text-sm" />
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
                 <div className="flex justify-end gap-2 mb-2 sticky top-0 bg-gray-900 py-2 z-10 border-b border-gray-800">
                    <button onClick={saveToNotes} className="text-green-400 hover:text-white flex items-center gap-1 text-xs uppercase font-bold">
                        <FileText className="w-3 h-3"/> Заметка
                    </button>
                    <button onClick={saveToLog} className="text-blue-400 hover:text-white flex items-center gap-1 text-xs uppercase font-bold">
                        <Save className="w-3 h-3"/> В лог
                    </button>
                    <button onClick={() => copyToClipboard(generatedText)} className="text-gray-400 hover:text-white flex items-center gap-1 text-xs uppercase font-bold">
                        {copied ? <Check className="w-3 h-3"/> : <Copy className="w-3 h-3"/>} Копировать
                    </button>
                 </div>
                 <SmartText content={generatedText} />
             </div>
         )}

         {!generatedNpc && !generatedText && !loading && !errorText && (
             <div className="h-full flex flex-col items-center justify-center text-gray-600 italic opacity-40">
                 <Sparkles className="w-12 h-12 mb-2" />
                 <p className="text-center text-xs sm:text-sm px-4">Выберите инструмент, заполните поля и нажмите кнопку.</p>
             </div>
         )}
      </div>
    </div>
  );
};

export default Generators;
