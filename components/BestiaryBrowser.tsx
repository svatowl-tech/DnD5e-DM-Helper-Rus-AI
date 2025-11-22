
import React, { useState, useEffect } from 'react';
import { Search, Skull, Plus, Loader, X, Shield, Heart, Zap, Star, Bookmark } from 'lucide-react';
import { searchMonsters, getMonsterDetails, ApiMonsterSummary, ApiMonsterDetails } from '../services/dndApiService';
import { calculateEncounterDifficulty, EncounterResult } from '../services/encounterService';
import { PartyMember, EntityType } from '../types';

interface BestiaryBrowserProps {
  onClose: () => void;
  onAddMonster: (monster: ApiMonsterDetails, count: number) => void;
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
  const [activeTab, setActiveTab] = useState<'search' | 'favorites'>('search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiMonsterSummary[]>([]);
  const [favorites, setFavorites] = useState<ApiMonsterSummary[]>(() => {
      const saved = localStorage.getItem('dmc_bestiary_favorites');
      return saved ? JSON.parse(saved) : [];
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedMonster, setSelectedMonster] = useState<ApiMonsterDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [count, setCount] = useState(1);
  
  // Encounter Calculation
  const [difficulty, setDifficulty] = useState<EncounterResult | null>(null);
  const [party, setParty] = useState<PartyMember[]>([]);

  useEffect(() => {
      const saved = localStorage.getItem('dmc_party');
      if (saved) setParty(JSON.parse(saved));
  }, []);

  useEffect(() => {
      localStorage.setItem('dmc_bestiary_favorites', JSON.stringify(favorites));
  }, [favorites]);

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
          hp: selectedMonster.hit_points,
          maxHp: selectedMonster.hit_points,
          ac: 10, initiative: 10, conditions: [], notes: '',
          xp: selectedMonster.xp
      }));

      const res = calculateEncounterDifficulty(party, mockMonsters);
      setDifficulty(res);

  }, [selectedMonster, count, party]);

  useEffect(() => {
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
        setResults(data);
        setLoading(false);
      } else if (query.length === 0) {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (summary: ApiMonsterSummary) => {
    setDetailsLoading(true);
    setSelectedMonster(null);
    setCount(1);
    try {
        const details = await getMonsterDetails(summary.index);
        setSelectedMonster(details);
    } catch (e) {
        console.error(e);
    } finally {
        setDetailsLoading(false);
    }
  };

  const handleAdd = () => {
    if (selectedMonster) {
      onAddMonster(selectedMonster, count);
      setCount(1);
    }
  };

  const toggleFavorite = (e: React.MouseEvent, summary: ApiMonsterSummary) => {
      e.stopPropagation();
      const exists = favorites.some(f => f.index === summary.index);
      if (exists) {
          setFavorites(prev => prev.filter(f => f.index !== summary.index));
      } else {
          setFavorites(prev => [...prev, summary]);
      }
  };

  const isFavorite = (index: string) => favorites.some(f => f.index === index);

  const getAc = (m: ApiMonsterDetails) => {
    if (Array.isArray(m.armor_class)) {
      return m.armor_class[0]?.value || 10;
    }
    return m.armor_class || 10;
  };

  const applyCategory = (search: string) => {
      setQuery(''); 
      setLoading(true);
      searchMonsters(search).then(data => {
          setResults(data);
          setLoading(false);
      });
  };

  const displayList = activeTab === 'favorites' ? favorites : results;

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

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-dnd-dark border border-gold-600 w-full max-w-5xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 bg-gray-900 border-b border-gold-600/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3 text-gold-500">
            <Skull className="w-6 h-6" />
            <h2 className="font-serif font-bold text-lg sm:text-xl">Бестиарий (SRD)</h2>
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
                    onClick={() => setActiveTab('search')}
                    className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'search' ? 'bg-dnd-card text-gold-500 border-b-2 border-gold-500' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <Search className="w-4 h-4"/> Поиск
                </button>
                <button 
                    onClick={() => setActiveTab('favorites')}
                    className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${activeTab === 'favorites' ? 'bg-dnd-card text-gold-500 border-b-2 border-gold-500' : 'text-gray-400 hover:bg-gray-800'}`}
                >
                    <Star className="w-4 h-4"/> Избранное
                </button>
            </div>

            {activeTab === 'search' && (
                <div className="p-3 border-b border-gray-700 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                        <input 
                        className="w-full bg-gray-800 border border-gray-600 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-gold-500 outline-none placeholder-gray-500"
                        placeholder="Поиск (например: Орк)..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        autoFocus
                        />
                    </div>
                    
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
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {loading && <div className="text-center py-4 text-gray-500 flex flex-col items-center gap-2"><Loader className="w-5 h-5 animate-spin"/><span>Ищем в архивах...</span></div>}
              
              {!loading && displayList.length === 0 && (
                <div className="text-center py-10 text-gray-500 text-sm flex flex-col items-center opacity-50">
                    {activeTab === 'search' ? (
                        <>
                            <Search className="w-10 h-10 mb-2"/>
                            <p>Введите название или категорию</p>
                        </>
                    ) : (
                        <>
                            <Bookmark className="w-10 h-10 mb-2"/>
                            <p>Избранных монстров нет</p>
                        </>
                    )}
                </div>
              )}

              {displayList.map(r => {
                const active = selectedMonster?.index === r.index;
                const fav = isFavorite(r.index);
                return (
                    <div
                        key={r.index}
                        onClick={() => handleSelect(r)}
                        className={`w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center transition-colors cursor-pointer group ${active ? 'bg-gold-600 text-black font-bold' : 'text-gray-300 hover:bg-gray-800'}`}
                    >
                        <span className="truncate pr-2">{r.name}</span>
                        <button 
                            onClick={(e) => toggleFavorite(e, r)}
                            className={`p-1 rounded hover:bg-black/20 ${fav ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600 group-hover:text-gray-400'}`}
                        >
                            <Star className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                        </button>
                    </div>
                );
              })}
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
                        <p className="text-gold-500 italic capitalize mt-1">{selectedMonster.type} • CR {selectedMonster.challenge_rating} ({selectedMonster.xp} XP)</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase mb-1 flex justify-center items-center gap-1"><Shield className="w-3 h-3"/> AC</div>
                      <div className="text-2xl font-bold text-white">{getAc(selectedMonster)}</div>
                    </div>
                    <div className="text-center border-l border-gray-700">
                       <div className="text-xs text-gray-500 uppercase mb-1 flex justify-center items-center gap-1"><Heart className="w-3 h-3"/> HP</div>
                      <div className="text-2xl font-bold text-green-500">{selectedMonster.hit_points}</div>
                    </div>
                    <div className="text-center border-l border-gray-700">
                       <div className="text-xs text-gray-500 uppercase mb-1 flex justify-center items-center gap-1"><Zap className="w-3 h-3"/> Иниц</div>
                      <div className="text-2xl font-bold text-blue-400">
                        {Math.floor((selectedMonster.dexterity - 10) / 2) >= 0 ? '+' : ''}{Math.floor((selectedMonster.dexterity - 10) / 2)}
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Table */}
                  <div className="bg-gray-900/30 rounded border border-gray-800 p-3 text-sm space-y-1 font-mono text-gray-300">
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>STR</span> <span>{selectedMonster.strength} ({Math.floor((selectedMonster.strength - 10) / 2)})</span></div>
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>DEX</span> <span>{selectedMonster.dexterity} ({Math.floor((selectedMonster.dexterity - 10) / 2)})</span></div>
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>CON</span> <span>{selectedMonster.constitution} ({Math.floor((selectedMonster.constitution - 10) / 2)})</span></div>
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>INT</span> <span>{selectedMonster.intelligence} ({Math.floor((selectedMonster.intelligence - 10) / 2)})</span></div>
                      <div className="flex justify-between border-b border-gray-800 pb-1"><span>WIS</span> <span>{selectedMonster.wisdom} ({Math.floor((selectedMonster.wisdom - 10) / 2)})</span></div>
                      <div className="flex justify-between"><span>CHA</span> <span>{selectedMonster.charisma} ({Math.floor((selectedMonster.charisma - 10) / 2)})</span></div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    * SRD данные (Open Game License).
                  </div>
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
                 <p className="text-xs mt-2">Используйте поиск или категории</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestiaryBrowser;
