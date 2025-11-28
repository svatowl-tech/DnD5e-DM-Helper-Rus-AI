

import React, { useState, useEffect } from 'react';
import { Search, Skull, Plus, Loader, X, Shield, Heart, Zap, Star, Bookmark, Database, Sparkles, Trash2, Save, Bot } from 'lucide-react';
import { searchMonsters, getMonsterDetails, ApiMonsterSummary, ApiMonsterDetails } from '../services/dndApiService';
import { calculateEncounterDifficulty, EncounterResult } from '../services/encounterService';
import { generateMonster } from '../services/polzaService';
import { PartyMember, EntityType, BestiaryEntry } from '../types';
import SmartText from './SmartText';

interface BestiaryBrowserProps {
  onClose: () => void;
  onAddMonster: (monster: BestiaryEntry, count: number) => void;
}

// Mapping common Russian terms to English SRD search terms
const RU_TO_EN_MAP: Record<string, string> = {
    'гоблин': 'goblin',
    'орк': 'orc',
    'скелет': 'skeleton',
    'зомби': 'zombie',
    'дракон': 'dragon',
    'волк': 'wolf',
    'медведь': 'bear',
    'великан': 'giant',
    'тролль': 'troll',
    'упырь': 'ghoul',
    'призрак': 'ghost',
    'вампир': 'vampire',
    'лич': 'lich',
    'демон': 'demon',
    'дьявол': 'devil',
    'страж': 'guard',
    'бандит': 'bandit',
    'культист': 'cultist',
    'маг': 'mage',
    'паук': 'spider',
    'крыса': 'rat',
    'сова': 'owl',
    'слизь': 'ooze',
    'элементаль': 'elemental'
};

const CATEGORIES = [
    { id: 'humanoid', label: 'Гуманоиды', search: 'humanoid', icon: '👤' },
    { id: 'undead', label: 'Нежить', search: 'zombie', icon: '💀' },
    { id: 'dragon', label: 'Драконы', search: 'dragon', icon: '🐲' },
    { id: 'beast', label: 'Звери', search: 'wolf', icon: '🐾' },
    { id: 'fiend', label: 'Исчадия', search: 'demon', icon: '🔥' },
    { id: 'giant', label: 'Великаны', search: 'giant', icon: '🗿' },
];

const BestiaryBrowser: React.FC<BestiaryBrowserProps> = ({ onClose, onAddMonster }) => {
  const [activeTab, setActiveTab] = useState<'srd' | 'local'>('srd');
  const [query, setQuery] = useState('');
  
  // SRD Data
  const [srdResults, setSrdResults] = useState<ApiMonsterSummary[]>([]);
  
  // Local Data
  const [localMonsters, setLocalMonsters] = useState<BestiaryEntry[]>(() => {
      const saved = localStorage.getItem('dmc_local_bestiary');
      return saved ? JSON.parse(saved) : [];
  });

  // UI State
  const [loading, setLoading] = useState(false);
  const [selectedMonster, setSelectedMonster] = useState<BestiaryEntry | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [count, setCount] = useState(1);
  
  // Encounter Calculation
  const [difficulty, setDifficulty] = useState<EncounterResult | null>(null);
  const [party, setParty] = useState<PartyMember[]>([]);

  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<'ai' | 'manual'>('ai');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiCr, setAiCr] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [manualForm, setManualForm] = useState<Partial<BestiaryEntry>>({
      name: '', type: 'Монстр', ac: 10, hp: 10, cr: '1', xp: 200,
      stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }
  });

  useEffect(() => {
      const saved = localStorage.getItem('dmc_party');
      if (saved) setParty(JSON.parse(saved));
  }, []);

  useEffect(() => {
      localStorage.setItem('dmc_local_bestiary', JSON.stringify(localMonsters));
  }, [localMonsters]);

  // Calc difficulty when selection changes
  useEffect(() => {
      if (!selectedMonster || party.length === 0) {
          setDifficulty(null);
          return;
      }
      
      // Mock combatants for calculation
      const mockMonsters = Array(count).fill(null).map(() => ({
          id: 'mock',
          name: selectedMonster.name,
          type: EntityType.MONSTER,
          hp: selectedMonster.hp,
          maxHp: selectedMonster.hp,
          ac: selectedMonster.ac, 
          initiative: 10, 
          conditions: [], 
          notes: '',
          xp: selectedMonster.xp
      }));

      const res = calculateEncounterDifficulty(party, mockMonsters);
      setDifficulty(res);

  }, [selectedMonster, count, party]);

  // Search SRD
  useEffect(() => {
    if (activeTab !== 'srd') return;

    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        let searchTerm = query.toLowerCase();
        const mapped = RU_TO_EN_MAP[searchTerm];
        if (mapped) searchTerm = mapped;
        else {
            const foundKey = Object.keys(RU_TO_EN_MAP).find(k => k.startsWith(searchTerm));
            if (foundKey) searchTerm = RU_TO_EN_MAP[foundKey];
        }

        const data = await searchMonsters(searchTerm);
        setSrdResults(data);
        setLoading(false);
      } else if (query.length === 0) {
        setSrdResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query, activeTab]);

  const handleSelectSRD = async (summary: ApiMonsterSummary) => {
    setDetailsLoading(true);
    setSelectedMonster(null);
    setCount(1);
    try {
        const details = await getMonsterDetails(summary.index);
        if (details) {
            // Convert SRD format to BestiaryEntry
            const entry: BestiaryEntry = {
                id: details.index,
                name: details.name,
                type: details.type,
                hp: details.hit_points,
                ac: typeof details.armor_class === 'number' ? details.armor_class : (details.armor_class as any)[0]?.value || 10,
                cr: details.challenge_rating,
                xp: details.xp,
                stats: {
                    str: (details as any).strength || 10,
                    dex: (details as any).dexterity || 10,
                    con: (details as any).constitution || 10,
                    int: (details as any).intelligence || 10,
                    wis: (details as any).wisdom || 10,
                    cha: (details as any).charisma || 10
                },
                actions: (details as any).actions?.map((a: any) => ({ name: a.name, desc: a.desc })) || [],
                source: 'srd'
            };
            setSelectedMonster(entry);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setDetailsLoading(false);
    }
  };

  const handleSelectLocal = (monster: BestiaryEntry) => {
      setSelectedMonster(monster);
      setCount(1);
  };

  const handleAdd = () => {
    if (selectedMonster) {
      onAddMonster(selectedMonster, count);
      setCount(1);
    }
  };

  // AI Generation Logic
  const handleAiGenerate = async () => {
      setAiLoading(true);
      try {
          const result = await generateMonster(aiPrompt, aiCr);
          setLocalMonsters(prev => [result, ...prev]);
          setShowAddModal(false);
          setAiPrompt('');
          setAiCr('');
          alert("Монстр создан и добавлен в локальный бестиарий.");
      } catch (e: any) {
          alert("Ошибка генерации: " + e.message);
      } finally {
          setAiLoading(false);
      }
  };

  // Manual Save Logic
  const handleManualSave = () => {
      if (!manualForm.name) return;
      const newMonster: BestiaryEntry = {
          id: Date.now().toString(),
          name: manualForm.name || 'Монстр',
          type: manualForm.type || 'Монстр',
          ac: Number(manualForm.ac) || 10,
          hp: Number(manualForm.hp) || 10,
          cr: manualForm.cr || 0,
          xp: Number(manualForm.xp) || 0,
          stats: manualForm.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
          actions: [],
          description: manualForm.description || '',
          source: 'local'
      };
      setLocalMonsters(prev => [newMonster, ...prev]);
      setShowAddModal(false);
      setManualForm({ name: '', type: 'Монстр', ac: 10, hp: 10, cr: '1', xp: 200, stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 } });
  };

  const handleDeleteLocal = (id: string) => {
      if (window.confirm("Удалить монстра из бестиария?")) {
          setLocalMonsters(prev => prev.filter(m => m.id !== id));
          if (selectedMonster?.id === id) setSelectedMonster(null);
      }
  };

  const applyCategory = (search: string) => {
      setQuery(''); 
      setActiveTab('srd');
      setLoading(true);
      searchMonsters(search).then(data => {
          setSrdResults(data);
          setLoading(false);
      });
  };

  const getDifficultyColor = (diff?: string) => {
      switch(diff) {
          case 'Trivial': return 'text-gray-400';
          case 'Easy': return 'text-green-400';
          case 'Medium': return 'text-yellow-400';
          case 'Hard': return 'text-orange-500';
          case 'Deadly': return 'text-red-500 font-bold';
          default: return 'text-gray-400';
      }
  };

  const filteredLocal = localMonsters.filter(m => m.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-2 sm:p-4 animate-in fade-in duration-200">
      
      {/* Add Modal */}
      {showAddModal && (
          <div className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4">
              <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                  <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="text-lg font-serif font-bold text-white">Добавить монстра</h3>
                      <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
                  </div>
                  
                  <div className="flex bg-gray-800 p-1 shrink-0">
                      <button onClick={() => setAddMode('ai')} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${addMode === 'ai' ? 'bg-gold-600 text-black' : 'text-gray-400 hover:text-white'}`}>AI Генератор</button>
                      <button onClick={() => setAddMode('manual')} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${addMode === 'manual' ? 'bg-gold-600 text-black' : 'text-gray-400 hover:text-white'}`}>Вручную</button>
                  </div>

                  <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                      {addMode === 'ai' ? (
                          <div className="space-y-4">
                              <div>
                                  <label className="text-xs text-gray-500 uppercase font-bold">Описание / Идея</label>
                                  <textarea 
                                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white h-32 resize-none focus:border-gold-500 outline-none"
                                      placeholder="Напр. Ледяной паук, который взрывается при смерти..."
                                      value={aiPrompt}
                                      onChange={e => setAiPrompt(e.target.value)}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs text-gray-500 uppercase font-bold">Примерный CR (Optional)</label>
                                  <input 
                                      className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white focus:border-gold-500 outline-none"
                                      placeholder="Напр. 3 или 1/2"
                                      value={aiCr}
                                      onChange={e => setAiCr(e.target.value)}
                                  />
                              </div>
                              <div className="p-3 bg-indigo-900/20 border border-indigo-500/30 rounded text-xs text-indigo-200">
                                  AI создаст полный статблок, включая характеристики и действия.
                              </div>
                          </div>
                      ) : (
                          <div className="space-y-3">
                              <input className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="Имя" value={manualForm.name} onChange={e => setManualForm({...manualForm, name: e.target.value})} />
                              <div className="grid grid-cols-2 gap-2">
                                  <input className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="Тип" value={manualForm.type} onChange={e => setManualForm({...manualForm, type: e.target.value})} />
                                  <input className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="CR" value={manualForm.cr} onChange={e => setManualForm({...manualForm, cr: e.target.value})} />
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                  <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="AC" value={manualForm.ac} onChange={e => setManualForm({...manualForm, ac: Number(e.target.value)})} />
                                  <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="HP" value={manualForm.hp} onChange={e => setManualForm({...manualForm, hp: Number(e.target.value)})} />
                                  <input type="number" className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white" placeholder="XP" value={manualForm.xp} onChange={e => setManualForm({...manualForm, xp: Number(e.target.value)})} />
                              </div>
                              <div>
                                  <label className="text-xs text-gray-500">Заметки / Описание</label>
                                  <textarea className="w-full bg-gray-900 border border-gray-700 rounded p-2 text-white h-20" value={manualForm.description} onChange={e => setManualForm({...manualForm, description: e.target.value})} />
                              </div>
                          </div>
                      )}
                  </div>

                  <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-2">
                      <button onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Отмена</button>
                      {addMode === 'ai' ? (
                           <button onClick={handleAiGenerate} disabled={aiLoading || !aiPrompt} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                               {aiLoading ? <Loader className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} Создать
                           </button>
                      ) : (
                           <button onClick={handleManualSave} disabled={!manualForm.name} className="bg-gold-600 hover:bg-gold-500 text-black px-6 py-2 rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                               <Save className="w-4 h-4"/> Сохранить
                           </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      <div className="bg-dnd-dark border border-gold-600 w-full max-w-5xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 bg-gray-900 border-b border-gold-600/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-gold-500">
            <Skull className="w-6 h-6" />
            <h2 className="font-serif font-bold text-lg sm:text-xl">Бестиарий</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden flex-col sm:flex-row">
          
          {/* Left Panel: Search & List */}
          <div className="w-full sm:w-1/3 lg:w-1/4 border-r border-gray-700 flex flex-col bg-gray-900/50">
            
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
                <button 
                    onClick={() => setActiveTab('srd')}
                    className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'srd' ? 'bg-dnd-card text-gold-500 border-b-2 border-gold-500' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <Database className="w-4 h-4"/> SRD
                </button>
                <button 
                    onClick={() => setActiveTab('local')}
                    className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'local' ? 'bg-dnd-card text-gold-500 border-b-2 border-gold-500' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <Bot className="w-4 h-4"/> Мои
                </button>
            </div>

            <div className="p-3 border-b border-gray-700 space-y-3 shrink-0">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                    <input 
                    className="w-full bg-gray-800 border border-gray-600 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-gold-500 outline-none placeholder-gray-500"
                    placeholder={activeTab === 'srd' ? "Поиск в базе..." : "Поиск в своих..."}
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    autoFocus
                    />
                </div>
                
                {activeTab === 'srd' ? (
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => applyCategory(cat.search)}
                                className="text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-600 hover:border-gold-500 rounded px-2 py-1 text-gray-300 flex items-center gap-1 transition-all"
                            >
                                <span>{cat.icon}</span> {cat.label}
                            </button>
                        ))}
                    </div>
                ) : (
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="w-full py-2 bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-700 rounded text-xs font-bold text-indigo-200 flex justify-center items-center gap-2 transition-colors"
                    >
                        <Plus className="w-4 h-4"/> Добавить / AI
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loading && <div className="text-center py-4 text-gray-500 flex flex-col items-center gap-2"><Loader className="w-5 h-5 animate-spin"/><span>Ищем...</span></div>}
              
              {/* SRD LIST */}
              {activeTab === 'srd' && !loading && (
                  <>
                    {srdResults.length === 0 && <div className="text-center py-10 text-gray-500 text-sm opacity-50">Введите название или категорию</div>}
                    {srdResults.map(r => (
                        <div
                            key={r.index}
                            onClick={() => handleSelectSRD(r)}
                            className={`w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center transition-colors cursor-pointer group ${selectedMonster?.id === r.index ? 'bg-gold-600 text-black font-bold' : 'text-gray-300 hover:bg-gray-800'}`}
                        >
                            <span className="truncate pr-2">{r.name}</span>
                        </div>
                    ))}
                  </>
              )}

              {/* LOCAL LIST */}
              {activeTab === 'local' && (
                  <>
                    {filteredLocal.length === 0 && <div className="text-center py-10 text-gray-500 text-sm opacity-50">Пусто</div>}
                    {filteredLocal.map(m => (
                        <div
                            key={m.id}
                            onClick={() => handleSelectLocal(m)}
                            className={`w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center transition-colors cursor-pointer group ${selectedMonster?.id === m.id ? 'bg-gold-600 text-black font-bold' : 'text-gray-300 hover:bg-gray-800'}`}
                        >
                            <span className="truncate pr-2">{m.name}</span>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteLocal(m.id); }} className="text-gray-500 hover:text-red-500 p-1">
                                <Trash2 className="w-3 h-3"/>
                            </button>
                        </div>
                    ))}
                  </>
              )}
            </div>
          </div>

          {/* Right Panel: Details & Add */}
          <div className="flex-1 flex flex-col bg-dnd-darker min-h-[300px] sm:min-h-0">
            {detailsLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gold-500">
                  <Loader className="w-10 h-10 animate-spin" />
                  <span className="font-serif text-sm">Загрузка характеристик...</span>
               </div>
            ) : selectedMonster ? (
              <div className="flex-1 flex flex-col h-full">
                {/* Stats View */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
                  <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-3xl font-serif font-bold text-white leading-tight">{selectedMonster.name}</h3>
                        <p className="text-gold-500 italic capitalize mt-1">{selectedMonster.type} • CR {selectedMonster.cr} ({selectedMonster.xp} XP)</p>
                        {selectedMonster.source === 'ai' && <span className="text-[10px] bg-indigo-900 text-indigo-200 px-1 rounded ml-2">AI Generated</span>}
                      </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase mb-1 flex justify-center items-center gap-1"><Shield className="w-3 h-3"/> AC</div>
                      <div className="text-2xl font-bold text-white">{selectedMonster.ac}</div>
                    </div>
                    <div className="text-center border-l border-gray-700">
                       <div className="text-xs text-gray-500 uppercase mb-1 flex justify-center items-center gap-1"><Heart className="w-3 h-3"/> HP</div>
                      <div className="text-2xl font-bold text-green-500">{selectedMonster.hp}</div>
                    </div>
                    <div className="text-center border-l border-gray-700">
                       <div className="text-xs text-gray-500 uppercase mb-1 flex justify-center items-center gap-1"><Zap className="w-3 h-3"/> Иниц</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {Math.floor((selectedMonster.stats.dex - 10) / 2) >= 0 ? '+' : ''}{Math.floor((selectedMonster.stats.dex - 10) / 2)}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Table */}
                  <div className="bg-gray-900/30 rounded border border-gray-800 p-3 text-sm space-y-1 font-mono text-gray-300">
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>STR</span> <span>{selectedMonster.stats.str} ({Math.floor((selectedMonster.stats.str - 10) / 2)})</span></div>
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>DEX</span> <span>{selectedMonster.stats.dex} ({Math.floor((selectedMonster.stats.dex - 10) / 2)})</span></div>
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>CON</span> <span>{selectedMonster.stats.con} ({Math.floor((selectedMonster.stats.con - 10) / 2)})</span></div>
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>INT</span> <span>{selectedMonster.stats.int} ({Math.floor((selectedMonster.stats.int - 10) / 2)})</span></div>
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>WIS</span> <span>{selectedMonster.stats.wis} ({Math.floor((selectedMonster.stats.wis - 10) / 2)})</span></div>
                      <div className="flex justify-between"><span>CHA</span> <span>{selectedMonster.stats.cha} ({Math.floor((selectedMonster.stats.cha - 10) / 2)})</span></div>
                  </div>
                  
                  {selectedMonster.description && (
                      <div className="bg-black/20 p-3 rounded border-l-2 border-gold-600 text-sm text-gray-300 italic">
                          <SmartText content={selectedMonster.description} />
                      </div>
                  )}

                  {selectedMonster.actions && selectedMonster.actions.length > 0 && (
                      <div className="space-y-2">
                          <h4 className="text-gold-500 font-bold text-sm uppercase border-b border-gray-700 pb-1">Действия</h4>
                          {selectedMonster.actions.map((action, i) => (
                              <div key={i} className="text-sm text-gray-300">
                                  <span className="font-bold text-white">{action.name}.</span> {action.desc}
                              </div>
                          ))}
                      </div>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-gray-900 border-t border-gray-800 flex flex-col gap-3 shrink-0">
                   
                   {/* Difficulty Prediction */}
                   {difficulty && (
                       <div className="flex justify-between items-center bg-gray-800 p-2 rounded border border-gray-700">
                           <span className="text-xs text-gray-400">Сложность для группы:</span>
                           <span className={`text-sm font-bold ${getDifficultyColor(difficulty.difficulty)} uppercase`}>{difficulty.difficulty === 'Deadly' ? 'Смертельно' : difficulty.difficulty === 'Hard' ? 'Сложно' : difficulty.difficulty === 'Medium' ? 'Средне' : 'Легко'}</span>
                       </div>
                   )}

                   <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                       <div className="flex items-center gap-3 w-full sm:w-auto justify-center">
                          <label className="text-sm text-gray-400 font-bold">Количество:</label>
                          <div className="flex items-center bg-gray-800 rounded border border-gray-700">
                            <button onClick={() => setCount(Math.max(1, count - 1))} className="px-3 py-2 hover:bg-gray-700 text-gold-500 font-bold text-lg">-</button>
                            <span className="px-3 font-bold min-w-[2.5rem] text-center text-white">{count}</span>
                            <button onClick={() => setCount(count + 1)} className="px-3 py-2 hover:bg-gray-700 text-gold-500 font-bold text-lg">+</button>
                          </div>
                       </div>
                       <button 
                          onClick={handleAdd}
                          className="w-full sm:w-auto bg-dnd-red hover:bg-red-700 text-white px-6 py-3 rounded font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-900/20 active:scale-95"
                       >
                          <Plus className="w-5 h-5" /> Добавить в бой
                       </button>
                   </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-40 p-4 text-center">
                 <Skull className="w-20 h-20 mb-4 stroke-1" />
                 <p className="text-lg">Выберите монстра слева</p>
                 <p className="text-xs mt-2">Используйте SRD или создайте своего с помощью AI</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestiaryBrowser;
