
import React, { useState, useMemo } from 'react';
import { CONDITIONS } from '../constants';
import { RULES_DATA } from '../data/rulesData';
import { RuleSection } from '../types';
import { Search, Sword, Map, Users, Crown, Zap, Skull, BookOpen, X, ChevronDown, ChevronUp, Sparkles, Loader } from 'lucide-react';
import { generateExtendedDetails } from '../services/polzaService';

type Category = 'all' | 'combat' | 'exploration' | 'social' | 'magic' | 'dm' | 'conditions' | 'spells';

const RuleCard: React.FC<{ rule: RuleSection, onSpellClick?: (spell: string) => void }> = ({ rule, onSpellClick }) => {
    const [expanded, setExpanded] = useState(false);
    
    // Heuristic to determine if card is "long"
    const isLong = (rule.content?.length || 0) > 200 || (rule.table?.length || 0) > 6 || (rule.list?.length || 0) > 6;
    const showExpand = isLong && !expanded;

    return (
        <div className="bg-dnd-card border border-gray-700 rounded-lg shadow-lg flex flex-col transition-colors hover:border-gray-600 overflow-hidden">
            <div className="p-4 pb-2">
                <h3 className="font-serif font-bold text-lg text-gold-500 border-b border-gray-700 pb-2 mb-2 flex justify-between items-center">
                    {rule.title}
                    {rule.category === 'conditions' && <Skull className="w-4 h-4 text-red-900/50"/>}
                    {rule.category === 'spells' && <Sparkles className="w-4 h-4 text-purple-900/50"/>}
                </h3>
            </div>
            
            <div className={`px-4 pb-4 space-y-3 overflow-hidden transition-all duration-300 ${showExpand ? 'max-h-48 relative' : 'max-h-full'}`}>
                {rule.content && (
                    <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{rule.content}</p>
                )}

                {rule.list && (
                    <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                        {rule.list.map((item, idx) => (
                            <li key={idx} className="pl-1 marker:text-gray-600">{item}</li>
                        ))}
                    </ul>
                )}

                {rule.table && (
                    <div className="text-sm w-full bg-gray-900/30 rounded border border-gray-800 overflow-hidden">
                        {rule.table.map((row, idx) => (
                            <div 
                                key={idx} 
                                className={`flex justify-between py-2 px-3 border-b border-gray-800 last:border-0 hover:bg-gray-800/50 ${rule.category === 'spells' ? 'cursor-pointer hover:bg-indigo-900/30 hover:text-indigo-200 transition-colors' : ''}`}
                                onClick={() => rule.category === 'spells' && onSpellClick && onSpellClick(row.label)}
                            >
                                <span className="font-bold text-gray-400 w-2/3 pr-2">{row.label}</span>
                                <span className="text-gray-500 text-xs w-1/3 text-right border-l border-gray-800 pl-2 flex items-center justify-end italic">{row.value}</span>
                            </div>
                        ))}
                    </div>
                )}

                {showExpand && (
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-dnd-card to-transparent pointer-events-none" />
                )}
            </div>
            
            {isLong && (
                <button 
                    onClick={() => setExpanded(!expanded)}
                    className="w-full py-2 bg-gray-800/50 hover:bg-gray-800 text-xs text-gray-400 hover:text-gold-500 flex justify-center items-center gap-1 border-t border-gray-700 transition-colors"
                >
                    {expanded ? <><ChevronUp className="w-3 h-3"/> Свернуть</> : <><ChevronDown className="w-3 h-3"/> Показать все</>}
                </button>
            )}
        </div>
    );
};

const DmScreen: React.FC = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  
  // Modal state for spells
  const [spellModalOpen, setSpellModalOpen] = useState(false);
  const [selectedSpell, setSelectedSpell] = useState<string>('');
  const [spellContent, setSpellContent] = useState<string>('');
  const [loadingSpell, setLoadingSpell] = useState(false);

  // Transform CONSTANTS conditions to standard RuleSection format
  const conditionRules: RuleSection[] = useMemo(() => CONDITIONS.map(c => ({
    id: c.id,
    title: c.name,
    category: 'conditions',
    content: c.description,
    list: c.duration ? [`Длительность: ${c.duration} раундов`] : undefined
  })), []);

  const allRules = useMemo(() => [...RULES_DATA, ...conditionRules], [conditionRules]);

  const filteredRules = useMemo(() => {
    let data = allRules;
    
    if (activeCategory !== 'all') {
        data = data.filter(r => r.category === activeCategory);
    }

    if (!search.trim()) return data;

    const lowerSearch = search.toLowerCase();
    return data.filter(r => 
      r.title.toLowerCase().includes(lowerSearch) ||
      r.content?.toLowerCase().includes(lowerSearch) ||
      r.table?.some(t => t.label.toLowerCase().includes(lowerSearch) || t.value.toLowerCase().includes(lowerSearch)) ||
      r.list?.some(l => l.toLowerCase().includes(lowerSearch))
    );
  }, [search, activeCategory, allRules]);

  const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
      { id: 'all', label: 'Все', icon: <BookOpen className="w-4 h-4"/> },
      { id: 'combat', label: 'Бой', icon: <Sword className="w-4 h-4"/> },
      { id: 'exploration', label: 'Мир', icon: <Map className="w-4 h-4"/> },
      { id: 'social', label: 'Социум', icon: <Users className="w-4 h-4"/> },
      { id: 'magic', label: 'Магия', icon: <Zap className="w-4 h-4"/> },
      { id: 'dm', label: 'Мастер', icon: <Crown className="w-4 h-4"/> },
      { id: 'conditions', label: 'Состояния', icon: <Skull className="w-4 h-4"/> },
      { id: 'spells', label: 'Заклинания', icon: <Sparkles className="w-4 h-4"/> },
  ];

  const handleSpellClick = async (spellName: string) => {
    setSelectedSpell(spellName);
    setSpellModalOpen(true);
    setLoadingSpell(true);
    setSpellContent('');

    try {
        const content = await generateExtendedDetails('spell', spellName, 'D&D 5e');
        setSpellContent(content);
    } catch (e: any) {
        setSpellContent(`<div class="text-red-400 p-4 bg-red-900/20 rounded border border-red-900">Ошибка загрузки: ${e.message}</div>`);
    } finally {
        setLoadingSpell(false);
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 relative">
        {/* Spell Modal */}
        {spellModalOpen && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-dnd-card border-2 border-indigo-600 w-full max-w-2xl max-h-[80vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-serif font-bold text-indigo-400 flex items-center gap-2">
                            <Sparkles className="w-5 h-5"/> {selectedSpell}
                        </h3>
                        <button onClick={() => setSpellModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50">
                        {loadingSpell ? (
                            <div className="flex flex-col items-center justify-center h-40 text-indigo-400 gap-3">
                                <Loader className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-mono">Листаем гримуар...</span>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-300 [&_h1]:text-indigo-400 [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-indigo-400 [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-indigo-400 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3:first-child]:mt-0 [&_h4]:text-indigo-300 [&_h4]:font-bold [&_h4]:mb-2 [&_strong]:text-white [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_p]:mb-3" dangerouslySetInnerHTML={{__html: spellContent}} />
                        )}
                    </div>
                    <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-end">
                        <button 
                            onClick={() => setSpellModalOpen(false)}
                            className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold"
                        >
                            Закрыть
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center bg-dnd-card p-4 rounded-lg border border-gray-700 shrink-0 shadow-sm">
            <div className="relative w-full md:w-72 group">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-gold-500 transition-colors" />
                <input 
                    className="w-full bg-gray-800 border border-gray-600 rounded pl-9 pr-8 py-2 text-sm text-white focus:border-gold-500 outline-none placeholder-gray-500 transition-all"
                    placeholder="Поиск (напр. Укрытие, Прыжок)..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                {search && (
                    <button 
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-2.5 text-gray-500 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>
            <div className="flex gap-2 overflow-x-auto w-full pb-2 md:pb-0 custom-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                            activeCategory === cat.id 
                            ? 'bg-gold-600 text-black shadow-md shadow-gold-900/20 scale-105' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border border-gray-700'
                        }`}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
                {filteredRules.map((rule) => (
                    <RuleCard key={rule.id} rule={rule} onSpellClick={handleSpellClick} />
                ))}
                {filteredRules.length === 0 && (
                    <div className="col-span-full text-center py-20 text-gray-500 opacity-50 flex flex-col items-center">
                        <BookOpen className="w-16 h-16 mb-4 stroke-1"/>
                        <p className="text-lg">Ничего не найдено</p>
                        <p className="text-sm">Попробуйте изменить запрос или категорию</p>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default DmScreen;
