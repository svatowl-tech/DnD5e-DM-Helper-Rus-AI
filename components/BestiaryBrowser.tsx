
import React, { useState, useEffect } from 'react';
import { Search, Skull, Plus, Loader, X, Shield, Heart, Zap } from 'lucide-react';
import { searchMonsters, getMonsterDetails, ApiMonsterSummary, ApiMonsterDetails } from '../services/dndApiService';

interface BestiaryBrowserProps {
  onClose: () => void;
  onAddMonster: (monster: ApiMonsterDetails, count: number) => void;
}

const BestiaryBrowser: React.FC<BestiaryBrowserProps> = ({ onClose, onAddMonster }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiMonsterSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedMonster, setSelectedMonster] = useState<ApiMonsterDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [count, setCount] = useState(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length >= 2) {
        setLoading(true);
        const data = await searchMonsters(query);
        setResults(data);
        setLoading(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = async (summary: ApiMonsterSummary) => {
    setDetailsLoading(true);
    setSelectedMonster(null);
    const details = await getMonsterDetails(summary.index);
    setSelectedMonster(details);
    setDetailsLoading(false);
  };

  const handleAdd = () => {
    if (selectedMonster) {
      onAddMonster(selectedMonster, count);
      setCount(1); 
      // We don't close automatically to allow adding different monsters
    }
  };

  // Helper to parse AC
  const getAc = (m: ApiMonsterDetails) => {
    if (Array.isArray(m.armor_class)) {
      return m.armor_class[0]?.value || 10;
    }
    return m.armor_class || 10;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-dnd-dark border border-gold-600 w-full max-w-4xl h-[80vh] rounded-lg shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="p-4 bg-gray-900 border-b border-gold-600/50 flex justify-between items-center">
          <div className="flex items-center gap-3 text-gold-500">
            <Skull className="w-6 h-6" />
            <h2 className="font-serif font-bold text-xl">Бестиарий (SRD)</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel: Search & List */}
          <div className="w-1/3 border-r border-gray-700 flex flex-col bg-gray-900/50">
            <div className="p-3 border-b border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input 
                  className="w-full bg-gray-800 border border-gray-600 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-gold-500 outline-none placeholder-gray-500"
                  placeholder="Поиск (напр. Goblin)..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loading && <div className="text-center py-4 text-gray-500"><Loader className="w-5 h-5 animate-spin mx-auto"/></div>}
              {!loading && results.length === 0 && query.length > 1 && (
                <div className="text-center py-4 text-gray-500 text-sm">Ничего не найдено</div>
              )}
              {results.map(r => (
                <button
                  key={r.index}
                  onClick={() => handleSelect(r)}
                  className={`w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center transition-colors ${selectedMonster?.index === r.index ? 'bg-gold-600 text-black font-bold' : 'text-gray-300 hover:bg-gray-800'}`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {/* Right Panel: Details & Add */}
          <div className="flex-1 flex flex-col bg-dnd-darker">
            {detailsLoading ? (
               <div className="flex-1 flex items-center justify-center">
                  <Loader className="w-8 h-8 text-gold-500 animate-spin" />
               </div>
            ) : selectedMonster ? (
              <div className="flex-1 flex flex-col">
                {/* Stats View */}
                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                  <div>
                    <h3 className="text-3xl font-serif font-bold text-white">{selectedMonster.name}</h3>
                    <p className="text-gold-500 italic capitalize">{selectedMonster.type} • CR {selectedMonster.challenge_rating} ({selectedMonster.xp} XP)</p>
                  </div>

                  <div className="grid grid-cols-3 gap-4 bg-gray-800/50 p-4 rounded-lg border border-gray-700">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 uppercase mb-1 flex justify-center items-center gap-1"><Shield className="w-3 h-3"/> Armor Class</div>
                      <div className="text-xl font-bold text-white">{getAc(selectedMonster)}</div>
                    </div>
                    <div className="text-center border-l border-gray-700">
                       <div className="text-xs text-gray-500 uppercase mb-1 flex justify-center items-center gap-1"><Heart className="w-3 h-3"/> Hit Points</div>
                      <div className="text-xl font-bold text-green-500">{selectedMonster.hit_points}</div>
                    </div>
                    <div className="text-center border-l border-gray-700">
                       <div className="text-xs text-gray-500 uppercase mb-1 flex justify-center items-center gap-1"><Zap className="w-3 h-3"/> DEX</div>
                      <div className="text-xl font-bold text-blue-400">{selectedMonster.dexterity} <span className="text-sm text-gray-500">({Math.floor((selectedMonster.dexterity - 10) / 2) >= 0 ? '+' : ''}{Math.floor((selectedMonster.dexterity - 10) / 2)})</span></div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 text-center">
                    * Данные предоставлены D&D 5e API (SRD). Некоторые уникальные монстры могут отсутствовать.
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-gray-900 border-t border-gray-800 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <label className="text-sm text-gray-400">Количество:</label>
                      <div className="flex items-center bg-gray-800 rounded border border-gray-700">
                        <button onClick={() => setCount(Math.max(1, count - 1))} className="px-3 py-1 hover:bg-gray-700">-</button>
                        <span className="px-2 font-bold min-w-[2rem] text-center">{count}</span>
                        <button onClick={() => setCount(count + 1)} className="px-3 py-1 hover:bg-gray-700">+</button>
                      </div>
                   </div>
                   <button 
                      onClick={handleAdd}
                      className="bg-dnd-red hover:bg-red-700 text-white px-6 py-2 rounded font-bold flex items-center gap-2 transition-all"
                   >
                      <Plus className="w-5 h-5" /> Добавить в бой
                   </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 opacity-50">
                 <Skull className="w-16 h-16 mb-4" />
                 <p>Выберите монстра из списка слева</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BestiaryBrowser;
