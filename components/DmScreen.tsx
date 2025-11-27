
import React, { useState, useMemo, useEffect } from 'react';
import { CONDITIONS } from '../constants';
import { RULES_DATA } from '../data/rulesData';
import { EQUIPMENT_DB, EquipmentItem } from '../data/equipmentData';
import { RuleSection, SavedImage } from '../types';
import { Search, Sword, Map, Users, Crown, Zap, Skull, BookOpen, X, ChevronDown, ChevronUp, Sparkles, Loader, Shield, Backpack, PenTool, Hammer, Image as ImageIcon, Eye, FlaskConical, Dices, Database, Globe, ScrollText, ChevronLeft, Menu, Layout } from 'lucide-react';
import { generateExtendedDetails, generateItemCustomization, generateImage } from '../services/polzaService';
import { searchSpells, getSpellDetails, searchEquipment, getEquipmentDetails, searchMagicItems, getMagicItemDetails, searchRules, getRuleDetails, ApiReference } from '../services/dndApiService';

interface DmScreenProps {
    onImageGenerated?: (image: SavedImage) => void;
    onShowImage?: (image: SavedImage) => void;
}

type LocalCategory = 'all' | 'combat' | 'exploration' | 'social' | 'magic' | 'dm' | 'conditions' | 'spells' | 'equipment' | 'alchemy' | 'lazy' | 'crafting';
type ApiCategory = 'spells' | 'equipment' | 'magic-items' | 'rules';

const RuleCard: React.FC<{ rule: RuleSection, onSpellClick?: (spell: string) => void }> = ({ rule, onSpellClick }) => {
    const [expanded, setExpanded] = useState(false);
    
    const isLong = (rule.content?.length || 0) > 200 || (rule.table?.length || 0) > 6 || (rule.list?.length || 0) > 6;
    const showExpand = isLong && !expanded;

    return (
        <div className="bg-dnd-card border border-gray-700 rounded-lg shadow-lg flex flex-col transition-colors hover:border-gray-600 overflow-hidden">
            <div className="p-4 pb-2">
                <h3 className="font-serif font-bold text-lg text-gold-500 border-b border-gray-700 pb-2 mb-2 flex justify-between items-center">
                    {rule.title}
                    {rule.category === 'conditions' && <Skull className="w-4 h-4 text-red-900/50"/>}
                    {rule.category === 'spells' && <Sparkles className="w-4 h-4 text-purple-900/50"/>}
                    {rule.category === 'alchemy' && <FlaskConical className="w-4 h-4 text-green-900/50"/>}
                    {rule.category === 'lazy' && <Dices className="w-4 h-4 text-blue-500/50"/>}
                    {rule.category === 'crafting' && <Hammer className="w-4 h-4 text-orange-500/50"/>}
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
  const [dataSource, setDataSource] = useState<'local' | 'api'>('local');
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<LocalCategory>('all');
  const [apiCategory, setApiCategory] = useState<ApiCategory>('spells');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // API State
  const [apiResults, setApiResults] = useState<ApiReference[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  // Modal states
  const [spellModalOpen, setSpellModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  
  // Content states
  const [selectedSpell, setSelectedSpell] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<Partial<EquipmentItem> | null>(null);
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

  // LOCAL SEARCH
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

  // API SEARCH
  useEffect(() => {
      if (dataSource !== 'api') return;

      const timer = setTimeout(async () => {
          if (search.length >= 2) {
              setApiLoading(true);
              let results: ApiReference[] = [];
              
              switch(apiCategory) {
                  case 'spells': results = await searchSpells(search); break;
                  case 'equipment': results = await searchEquipment(search); break;
                  case 'magic-items': results = await searchMagicItems(search); break;
                  case 'rules': results = await searchRules(search); break;
              }
              setApiResults(results);
              setApiLoading(false);
          } else {
              setApiResults([]);
          }
      }, 600);

      return () => clearTimeout(timer);
  }, [search, dataSource, apiCategory]);

  // CATEGORIES
  const localCategories: { id: LocalCategory; label: string; icon: React.ReactNode }[] = [
      { id: 'all', label: 'Все', icon: <BookOpen className="w-4 h-4"/> },
      { id: 'lazy', label: 'Ленивый ДМ', icon: <Dices className="w-4 h-4"/> },
      { id: 'crafting', label: 'Ремесло', icon: <Hammer className="w-4 h-4"/> },
      { id: 'combat', label: 'Бой', icon: <Sword className="w-4 h-4"/> },
      { id: 'exploration', label: 'Мир', icon: <Map className="w-4 h-4"/> },
      { id: 'social', label: 'Социум', icon: <Users className="w-4 h-4"/> },
      { id: 'magic', label: 'Магия', icon: <Zap className="w-4 h-4"/> },
      { id: 'dm', label: 'Мастер', icon: <Crown className="w-4 h-4"/> },
      { id: 'conditions', label: 'Состояния', icon: <Skull className="w-4 h-4"/> },
      { id: 'spells', label: 'Заклинания', icon: <Sparkles className="w-4 h-4"/> },
      { id: 'equipment', label: 'Снаряжение', icon: <Backpack className="w-4 h-4"/> },
      { id: 'alchemy', label: 'Алхимия', icon: <FlaskConical className="w-4 h-4"/> },
  ];

  const apiCategories: { id: ApiCategory; label: string; icon: React.ReactNode }[] = [
      { id: 'spells', label: 'Заклинания', icon: <Sparkles className="w-4 h-4"/> },
      { id: 'equipment', label: 'Снаряжение', icon: <Backpack className="w-4 h-4"/> },
      { id: 'magic-items', label: 'Маг. Предметы', icon: <Crown className="w-4 h-4"/> },
      { id: 'rules', label: 'Правила', icon: <ScrollText className="w-4 h-4"/> },
  ];

  // FORMATTERS
  const formatApiSpell = (data: any): string => {
      return `
        <div class="space-y-2">
            <div class="flex justify-between text-sm italic text-gray-400">
                <span>${data.level > 0 ? `Level ${data.level}` : 'Cantrip'} ${data.school?.name}</span>
                <span>${data.components?.join(', ')}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm bg-gray-800 p-2 rounded border border-gray-700">
                <div><strong>Время:</strong> ${data.casting_time}</div>
                <div><strong>Дистанция:</strong> ${data.range}</div>
                <div><strong>Длительность:</strong> ${data.duration}</div>
                <div><strong>Ритуал:</strong> ${data.ritual ? 'Да' : 'Нет'}</div>
            </div>
            <div class="mt-4 text-gray-300 space-y-2">
                ${data.desc?.map((d: string) => `<p>${d}</p>`).join('')}
            </div>
            ${data.higher_level ? `<div class="mt-4 pt-2 border-t border-gray-700"><strong class="text-purple-400">На высоких уровнях:</strong> ${data.higher_level.map((d: string) => `<p class="text-sm">${d}</p>`).join('')}</div>` : ''}
            ${data.classes ? `<div class="mt-4 text-xs text-gray-500">Классы: ${data.classes.map((c: any) => c.name).join(', ')}</div>` : ''}
        </div>
      `;
  };

  const formatApiRule = (data: any): string => {
      return `
        <div class="space-y-4 text-gray-300">
            <h2 class="text-xl font-bold text-gold-500">${data.name}</h2>
            ${data.desc}
        </div>
      `;
  };

  // CLICK HANDLERS
  const handleSpellClick = async (spellName: string, isApiIndex: boolean = false) => {
    setSelectedSpell(isApiIndex ? spellName : spellName);
    setSpellModalOpen(true);
    setLoadingContent(true);
    setModalContent('');

    try {
        if (isApiIndex) {
             const details = await getSpellDetails(spellName); // spellName is index here
             setModalContent(formatApiSpell(details));
             setSelectedSpell(details.name);
        } else {
             // Legacy AI generation
             const content = await generateExtendedDetails('spell', spellName, 'D&D 5e');
             setModalContent(content);
        }
    } catch (e: any) {
        setModalContent(`<div class="text-red-400 p-4 bg-red-900/20 rounded border border-red-900">Ошибка загрузки: ${e.message}</div>`);
    } finally {
        setLoadingContent(false);
    }
  };

  const handleItemClick = (item: Partial<EquipmentItem>) => {
      setSelectedItem(item);
      setCustomizedItem(null);
      setCustomizationPrompt('');
      setItemImage(null);
      setItemModalOpen(true);
  };

  const handleApiItemClick = async (index: string, category: ApiCategory) => {
      setLoadingContent(true);
      setItemModalOpen(true);
      setSelectedItem(null); // Clear previous

      try {
          let data;
          if (category === 'equipment') data = await getEquipmentDetails(index);
          else if (category === 'magic-items') data = await getMagicItemDetails(index);
          else if (category === 'rules') {
              data = await getRuleDetails(index);
              setModalContent(formatApiRule(data));
              setSpellModalOpen(true); // Use generic text modal for rules
              setItemModalOpen(false);
              setSelectedSpell(data.name);
              setLoadingContent(false);
              return;
          }

          if (data) {
              setSelectedItem({
                  name: data.name,
                  category: data.equipment_category?.name || 'Item',
                  cost: data.cost ? `${data.cost.quantity} ${data.cost.unit}` : '—',
                  weight: data.weight || 0,
                  description: data.desc?.join('\n\n') || 'Нет описания.'
              });
          }
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingContent(false);
      }
  };

  const handleCustomizeItem = async () => {
      if (!selectedItem) return;
      setLoadingContent(true);
      try {
          const result = await generateItemCustomization(selectedItem.name || 'Item', selectedItem.category || 'Gear', customizationPrompt);
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
          let prompt = `Fantasy RPG item icon: ${selectedItem.name}, ${selectedItem.category}. ${selectedItem.description?.substring(0, 100) || ''}. White background, high quality digital art.`;
          if (customizedItem) {
              prompt = `Fantasy RPG item icon: ${customizedItem.name}. Visual description: ${customizedItem.visual}. Magical artifact style. White background.`;
          }
          const url = await generateImage(prompt, "1:1");
          
          const newImage: SavedImage = {
              id: Date.now().toString(),
              url: url,
              title: customizedItem ? customizedItem.name : selectedItem.name || 'Item',
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
  
  const scrollToRule = (id: string) => {
      const element = document.getElementById(`rule-${id}`);
      if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
  };

  return (
    <div className="h-full flex flex-col space-y-4 relative">
        {/* Spell / Rule Modal */}
        {spellModalOpen && (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-dnd-card border-2 border-indigo-600 w-full max-w-2xl max-h-[80vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-serif font-bold text-indigo-400 flex items-center gap-2">
                            <Sparkles className="w-5 h-5"/> {selectedSpell}
                        </h3>
                        <button onClick={() => setSpellModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 custom-scrollbar">
                        {loadingContent ? (
                            <div className="flex flex-col items-center justify-center h-40 text-indigo-400 gap-3">
                                <Loader className="w-8 h-8 animate-spin" />
                                <span className="text-sm font-mono">Листаем гримуар...</span>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-300 [&_h1]:text-indigo-400 [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-indigo-400 [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-indigo-400 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3:first-child]:mt-0 [&_h4]:text-indigo-300 [&_h4]:font-bold [&_h4]:mb-2 [&_strong]:text-white [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_p]:mb-3" dangerouslySetInnerHTML={{__html: modalContent}} />
                        )}
                    </div>
                    <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-end shrink-0">
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
        {itemModalOpen && (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-lg max-h-[90vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
                    <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                        <h3 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2">
                            {loadingContent ? 'Загрузка...' : selectedItem?.name}
                        </h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleGenerateItemImage} 
                                disabled={imageLoading || loadingContent}
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
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 space-y-6 custom-scrollbar">
                        
                        {loadingContent ? (
                             <div className="flex justify-center py-10"><Loader className="w-8 h-8 animate-spin text-gold-500"/></div>
                        ) : selectedItem && (
                        <>
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
                                <div className="text-sm text-gray-300 italic border-l-2 border-gray-600 pl-3 whitespace-pre-wrap">
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
                        </>
                        )}

                    </div>
                    <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-end shrink-0">
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

        {/* Search & Categories Sidebar + Content Area */}
        <div className="flex flex-col md:flex-row gap-4 items-start h-full overflow-hidden">
             
             {/* Left Panel: Sidebar (Collapsible on Desktop, Stacked/Dynamic on Mobile) */}
             <div className={`
                flex flex-col bg-dnd-card rounded-lg border border-gray-700 transition-all duration-300 ease-in-out shrink-0 overflow-hidden
                ${isSidebarOpen 
                    ? 'w-full h-auto max-h-[40vh] md:h-full md:w-80 md:max-h-full opacity-100' 
                    : 'h-0 w-full md:w-0 md:h-full opacity-0 border-0 m-0 p-0'
                }
             `}>
                
                {/* Source Toggle */}
                <div className="flex border-b border-gray-700 shrink-0">
                    <button 
                        onClick={() => { setDataSource('local'); setSearch(''); }}
                        className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${dataSource === 'local' ? 'bg-gray-800 text-gold-500 border-b-2 border-gold-500' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <BookOpen className="w-4 h-4"/> Справочник
                    </button>
                    <button 
                        onClick={() => { setDataSource('api'); setSearch(''); }}
                        className={`flex-1 py-3 text-sm font-bold flex justify-center items-center gap-2 ${dataSource === 'api' ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        <Globe className="w-4 h-4"/> SRD (API)
                    </button>
                </div>

                <div className="p-3 space-y-3 border-b border-gray-700 shrink-0">
                    <div className="relative group">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500 group-focus-within:text-gold-500 transition-colors" />
                        <input 
                            className="w-full bg-gray-900 border border-gray-600 rounded pl-9 pr-8 py-2 text-sm text-white focus:border-gold-500 outline-none placeholder-gray-500 transition-all"
                            placeholder={dataSource === 'api' ? "Поиск в SRD..." : "Поиск в базе..."}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-2 top-2.5 text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                        )}
                    </div>

                    {/* Categories Grid */}
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                         {dataSource === 'local' ? (
                             localCategories.map(cat => (
                                 <button
                                    key={cat.id}
                                    onClick={() => { setActiveCategory(cat.id); setSearch(''); }}
                                    className={`text-xs py-1.5 px-2 rounded border text-left flex items-center gap-2 ${activeCategory === cat.id ? 'bg-gold-600 text-black border-gold-500 font-bold' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gold-500'}`}
                                 >
                                     {cat.icon} {cat.label}
                                 </button>
                             ))
                         ) : (
                             apiCategories.map(cat => (
                                 <button
                                    key={cat.id}
                                    onClick={() => { setApiCategory(cat.id); setSearch(''); }}
                                    className={`text-xs py-1.5 px-2 rounded border text-left flex items-center gap-2 ${apiCategory === cat.id ? 'bg-blue-600 text-white border-blue-500 font-bold' : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-blue-500'}`}
                                 >
                                     {cat.icon} {cat.label}
                                 </button>
                             ))
                         )}
                    </div>
                </div>
                
                {/* Results List */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar min-h-0">
                    {dataSource === 'api' ? (
                        <>
                            {apiLoading && <div className="text-center py-4 text-blue-400 flex flex-col items-center gap-2"><Loader className="w-5 h-5 animate-spin"/><span>Поиск в сети...</span></div>}
                            {!apiLoading && apiResults.length === 0 && search.length > 1 && <div className="text-center py-4 text-gray-500">Ничего не найдено</div>}
                            
                            {apiResults.map((item) => (
                                <div
                                    key={item.index}
                                    onClick={() => handleApiItemClick(item.index, apiCategory)}
                                    className="w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center transition-colors cursor-pointer hover:bg-gray-800 text-gray-300 border border-transparent hover:border-gray-600"
                                >
                                    <span className="truncate">{item.name}</span>
                                    <span className="text-[10px] text-gray-500 uppercase bg-black/20 px-1 rounded">API</span>
                                </div>
                            ))}
                        </>
                    ) : (
                        // LOCAL RESULTS (Split logic)
                        <>
                           {activeCategory === 'equipment' || (activeCategory === 'all' && search) ? (
                               filteredEquipment.map(item => (
                                   <div 
                                       key={item.index} 
                                       onClick={() => handleItemClick(item)}
                                       className="w-full text-left px-3 py-2 rounded text-sm flex justify-between items-center transition-colors cursor-pointer hover:bg-gray-800 text-gray-300 border border-transparent hover:border-gray-600"
                                   >
                                       <span className="truncate">{item.name}</span>
                                       <span className="text-xs text-gray-500">{item.cost}</span>
                                   </div>
                               ))
                           ) : null}
                           
                           {(activeCategory !== 'equipment' || (activeCategory === 'all' && search)) && filteredRules.map(rule => (
                               <button 
                                   key={rule.id} 
                                   onClick={() => scrollToRule(rule.id)}
                                   className="w-full text-left px-3 py-2 rounded text-sm block hover:bg-gray-800 text-gray-400 hover:text-white transition-colors truncate"
                               >
                                   {rule.title}
                               </button>
                           ))}
                        </>
                    )}
                </div>
             </div>

             {/* Right Panel: Content */}
             <div className="flex-1 h-full flex flex-col bg-dnd-card/50 rounded-lg border border-gray-700 overflow-hidden relative transition-all">
                  {/* Toolbar / Toggle */}
                  <div className="p-2 border-b border-gray-700 bg-gray-900/30 flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-1.5 bg-gray-800 hover:bg-gray-700 text-gold-500 rounded border border-gray-600 transition-colors flex items-center gap-2"
                        title={isSidebarOpen ? "Свернуть меню" : "Развернуть меню"}
                      >
                        {isSidebarOpen ? (
                            <><ChevronLeft className="w-4 h-4"/><span className="text-xs hidden sm:inline">Свернуть</span></>
                        ) : (
                            <><Menu className="w-4 h-4"/><span className="text-xs hidden sm:inline">Меню</span></>
                        )}
                      </button>
                      <span className="text-xs text-gray-500 font-bold uppercase tracking-wider ml-2">
                        {dataSource === 'api' ? 'API: ' + apiCategories.find(c => c.id === apiCategory)?.label : localCategories.find(c => c.id === activeCategory)?.label}
                      </span>
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                      {dataSource === 'api' ? (
                          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                              <Globe className="w-16 h-16 mb-4 stroke-1"/>
                              <p>Выберите элемент из списка слева для просмотра подробностей.</p>
                          </div>
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 auto-rows-min">
                             {activeCategory === 'equipment' ? (
                                  // Equipment Grid in right panel if category is explicitly equipment
                                  filteredEquipment.map((item) => (
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
                                ))
                             ) : (
                                 // Rule Cards
                                 filteredRules.map((rule) => (
                                    <div id={`rule-${rule.id}`} key={rule.id}>
                                        <RuleCard rule={rule} onSpellClick={(name) => handleSpellClick(name, false)} />
                                    </div>
                                 ))
                             )}
                             
                             {((activeCategory === 'equipment' && filteredEquipment.length === 0) || (activeCategory !== 'equipment' && filteredRules.length === 0)) && (
                                <div className="col-span-full text-center py-20 text-gray-500 opacity-50 flex flex-col items-center">
                                    <BookOpen className="w-16 h-16 mb-4 stroke-1"/>
                                    <p className="text-lg">Ничего не найдено</p>
                                </div>
                             )}
                        </div>
                      )}
                  </div>
             </div>
        </div>
    </div>
  );
};

export default DmScreen;
