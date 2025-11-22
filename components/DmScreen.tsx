
import React, { useState, useMemo } from 'react';
import { CONDITIONS } from '../constants';
import { RULES_DATA } from '../data/rulesData';
import { EQUIPMENT_DB, EquipmentItem } from '../data/equipmentData';
import { RuleSection, SavedImage } from '../types';
import { Search, Sword, Map, Users, Crown, Zap, Skull, BookOpen, X, ChevronDown, ChevronUp, Sparkles, Loader, Shield, Backpack, PenTool, Hammer, Image as ImageIcon, ZoomIn, Eye } from 'lucide-react';
import { generateExtendedDetails, generateItemCustomization, generateImage } from '../services/polzaService';

interface DmScreenProps {
    onImageGenerated?: (image: SavedImage) => void;
    onShowImage?: (image: SavedImage) => void;
}

type Category = 'all' | 'combat' | 'exploration' | 'social' | 'magic' | 'dm' | 'conditions' | 'spells' | 'equipment';

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

const DmScreen: React.FC<DmScreenProps> = ({ onImageGenerated, onShowImage }) => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  
  // Modal states
  const [spellModalOpen, setSpellModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  
  // Content states
  const [selectedSpell, setSelectedSpell] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<EquipmentItem | null>(null);
  const [modalContent, setModalContent] = useState<string>('');
  const [loadingContent, setLoadingContent] = useState(false);
  const [customizedItem, setCustomizedItem] = useState<any>(null);
  const [customizationPrompt, setCustomizationPrompt] = useState('');
  
  const [itemImage, setItemImage] = useState<SavedImage | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

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
    
    if (activeCategory !== 'all' && activeCategory !== 'equipment') {
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

  const filteredEquipment = useMemo(() => {
      let data = EQUIPMENT_DB;
      if (!search.trim()) return data;
      const lowerSearch = search.toLowerCase();
      return data.filter(i => 
          i.name.toLowerCase().includes(lowerSearch) || 
          i.category.toLowerCase().includes(lowerSearch) ||
          i.subcategory?.toLowerCase().includes(lowerSearch)
      );
  }, [search]);

  const categories: { id: Category; label: string; icon: React.ReactNode }[] = [
      { id: 'all', label: 'Все', icon: <BookOpen className="w-4 h-4"/> },
      { id: 'equipment', label: 'Снаряжение', icon: <Backpack className="w-4 h-4"/> },
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
    setLoadingContent(true);
    setModalContent('');

    try {
        const content = await generateExtendedDetails('spell', spellName, 'D&D 5e');
        setModalContent(content);
    } catch (e: any) {
        setModalContent(`<div class="text-red-400 p-4 bg-red-900/20 rounded border border-red-900">Ошибка загрузки: ${e.message}</div>`);
    } finally {
        setLoadingContent(false);
    }
  };

  const handleItemClick = (item: EquipmentItem) => {
      setSelectedItem(item);
      setCustomizedItem(null);
      setCustomizationPrompt('');
      setItemImage(null);
      setItemModalOpen(true);
  };

  const handleCustomizeItem = async () => {
      if (!selectedItem) return;
      setLoadingContent(true);
      try {
          const result = await generateItemCustomization(selectedItem.name, selectedItem.subcategory || selectedItem.category, customizationPrompt);
          setCustomizedItem(result);
      } catch (e: any) {
          alert("Ошибка AI: " + e.message);
      } finally {
          setLoadingContent(false);
      }
  };

  const handleGenerateItemImage = async () => {
      if (!selectedItem) return;
      setImageLoading(true);
      try {
          let prompt = `Fantasy RPG item icon: ${selectedItem.name}, ${selectedItem.category}. ${selectedItem.description || ''}. White background, high quality digital art.`;
          if (customizedItem) {
              prompt = `Fantasy RPG item icon: ${customizedItem.name}. Visual description: ${customizedItem.visual}. Magical artifact style. White background.`;
          }
          const url = await generateImage(prompt, "1:1");
          
          const newImage: SavedImage = {
              id: Date.now().toString(),
              url: url,
              title: customizedItem ? customizedItem.name : selectedItem.name,
              type: 'item',
              timestamp: Date.now()
          };

          setItemImage(newImage);
          if (onImageGenerated) onImageGenerated(newImage);

      } catch (e: any) {
          alert("Ошибка генерации: " + e.message);
      } finally {
          setImageLoading(false);
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
                        {loadingContent ? (
                            <div className="flex flex-col items-center justify-center h-40 text-indigo-400 gap-3">
                                <Loader className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-mono">Листаем гримуар...</span>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-300 [&_h1]:text-indigo-400 [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-indigo-400 [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-indigo-400 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3:first-child]:mt-0 [&_h4]:text-indigo-300 [&_h4]:font-bold [&_h4]:mb-2 [&_strong]:text-white [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_p]:mb-3" dangerouslySetInnerHTML={{__html: modalContent}} />
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

        {/* Item Modal */}
        {itemModalOpen && selectedItem && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-lg max-h-[90vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2">
                            {selectedItem.name}
                        </h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleGenerateItemImage} 
                                disabled={imageLoading}
                                className="text-gold-500 hover:text-white p-1"
                                title="Визуализировать предмет"
                            >
                                {imageLoading ? <Loader className="w-5 h-5 animate-spin"/> : <ImageIcon className="w-5 h-5"/>}
                            </button>
                            <button onClick={() => setItemModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 space-y-6">
                        
                        {itemImage && (
                            <div className="w-full h-48 bg-black/50 rounded border border-gray-600 flex items-center justify-center overflow-hidden relative group">
                                <img src={itemImage.url} alt={selectedItem.name} className="h-full w-auto object-contain" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                    {onShowImage && (
                                        <button 
                                            onClick={() => onShowImage(itemImage)}
                                            className="bg-gold-600 text-black px-3 py-1 rounded font-bold flex items-center gap-1 text-xs hover:bg-white"
                                        >
                                            <Eye className="w-3 h-3" /> Показать
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Base Stats */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                <span className="text-gray-500 block text-xs uppercase">Тип</span>
                                <span className="text-white font-bold">{selectedItem.category} ({selectedItem.subcategory || 'General'})</span>
                            </div>
                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                <span className="text-gray-500 block text-xs uppercase">Стоимость / Вес</span>
                                <span className="text-white font-bold">{selectedItem.cost} / {selectedItem.weight} lb.</span>
                            </div>
                            {selectedItem.damage && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700 col-span-2">
                                    <span className="text-gray-500 block text-xs uppercase">Урон</span>
                                    <span className="text-red-400 font-bold">{selectedItem.damage} {selectedItem.damageType}</span>
                                    {selectedItem.properties && (
                                        <div className="mt-1 flex flex-wrap gap-1">
                                            {selectedItem.properties.map(p => (
                                                <span key={p} className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">{p}</span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                            {selectedItem.ac && (
                                <div className="bg-gray-800 p-3 rounded border border-gray-700 col-span-2">
                                    <span className="text-gray-500 block text-xs uppercase">Защита</span>
                                    <div className="flex justify-between items-center">
                                        <span className="text-blue-400 font-bold">AC {selectedItem.ac}</span>
                                        {selectedItem.dexBonus && <span className="text-xs text-gray-400">+ DEX {selectedItem.maxDexBonus ? `(Max ${selectedItem.maxDexBonus})` : ''}</span>}
                                        {selectedItem.stealthDisadvantage && <span className="text-xs text-red-400">Stealth Disadv.</span>}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedItem.description && (
                            <div className="text-sm text-gray-300 italic border-l-2 border-gray-600 pl-3">
                                {selectedItem.description}
                            </div>
                        )}

                        {/* AI Customization Section */}
                        <div className="border-t border-gray-700 pt-4">
                            <div className="mb-4">
                                <h4 className="font-bold text-purple-400 flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4"/> Уникальный предмет</h4>
                                
                                {!customizedItem && (
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
                                            placeholder="Пожелания (напр. 'Проклятый меч вампира')"
                                            value={customizationPrompt}
                                            onChange={e => setCustomizationPrompt(e.target.value)}
                                        />
                                    </div>
                                )}

                                <button 
                                    onClick={handleCustomizeItem}
                                    disabled={loadingContent}
                                    className="w-full text-xs bg-purple-900/50 hover:bg-purple-800 text-purple-200 px-3 py-2 rounded border border-purple-700 flex justify-center items-center gap-2 transition-colors disabled:opacity-50 font-bold"
                                >
                                    {loadingContent ? <Loader className="w-3 h-3 animate-spin"/> : <PenTool className="w-3 h-3"/>}
                                    {customizedItem ? 'Пересоздать' : 'Сгенерировать особенности'}
                                </button>
                            </div>

                            {customizedItem ? (
                                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 space-y-3 animate-in fade-in">
                                    <h5 className="font-serif font-bold text-lg text-purple-300">{customizedItem.name}</h5>
                                    <p className="text-xs text-gray-400">{customizedItem.visual}</p>
                                    
                                    <div className="text-sm text-gray-300 italic">"{customizedItem.history}"</div>
                                    
                                    <div className="grid gap-2 text-sm">
                                        <div className="flex gap-2 items-start">
                                            <span className="text-green-400 font-bold shrink-0">[+]</span>
                                            <span>{customizedItem.positive}</span>
                                        </div>
                                        <div className="flex gap-2 items-start">
                                            <span className="text-red-400 font-bold shrink-0">[-]</span>
                                            <span>{customizedItem.negative}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-xs text-gray-600 py-4 border border-dashed border-gray-800 rounded">
                                    Введите пожелания и нажмите кнопку, чтобы превратить этот предмет в уникальный артефакт.
                                </div>
                            )}
                        </div>

                    </div>
                    <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-end">
                        <button 
                            onClick={() => setItemModalOpen(false)}
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
                    placeholder={activeCategory === 'equipment' ? "Поиск снаряжения..." : "Поиск правил..."}
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
            <div className="flex gap-2 overflow-x-auto w-full pb-4 md:pb-0 whitespace-nowrap no-scrollbar touch-pan-x snap-x">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
                        className={`snap-start flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all border ${
                            activeCategory === cat.id 
                            ? 'bg-gold-600 text-black shadow-md shadow-gold-900/20 border-gold-500' 
                            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white border-gray-700'
                        }`}
                    >
                        {cat.icon} {cat.label}
                    </button>
                ))}
            </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
            
            {activeCategory === 'equipment' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {filteredEquipment.map((item) => (
                        <div 
                            key={item.index} 
                            onClick={() => handleItemClick(item)}
                            className="bg-gray-800/50 border border-gray-700 p-3 rounded hover:bg-gray-700 cursor-pointer flex justify-between items-center group transition-colors"
                        >
                            <div>
                                <div className="font-bold text-gray-200 group-hover:text-gold-500 transition-colors">{item.name}</div>
                                <div className="text-xs text-gray-500">{item.subcategory || item.category}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gold-600">{item.cost}</div>
                                <div className="text-xs text-gray-600">{item.weight} lb</div>
                            </div>
                        </div>
                    ))}
                    {filteredEquipment.length === 0 && (
                        <div className="col-span-full text-center py-20 text-gray-500 opacity-50">Ничего не найдено</div>
                    )}
                </div>
            ) : (
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
            )}
        </div>
    </div>
  );
};

export default DmScreen;
