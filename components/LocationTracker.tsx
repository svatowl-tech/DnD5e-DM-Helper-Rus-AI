
import React, { useState, useEffect } from 'react';
import { LocationData, PartyMember, Combatant, EntityType, LoreEntry, LogEntry, LocationTrackerProps, Note } from '../types';
import { parseLoreFromText, generateEncounterIntro, generateScenarioDescription, generateFullLocation, generateLocationContent, generateExtendedDetails } from '../services/polzaService';
import { getMonstersByCr } from '../services/dndApiService';
import { MapPin, Users, Skull, Sparkles, BookOpen, Loader, Search, Eye, ChevronRight, ArrowRight, Menu, Map, Copy, Plus, Home, Trees, Tent, Castle, ArrowLeft, LandPlot, Landmark, Beer, Footprints, ShieldAlert, Ghost, Info, X, Save, FileText, RefreshCcw } from 'lucide-react';
import { FAERUN_LORE } from '../data/faerunLore';

const LocationTracker: React.FC<LocationTrackerProps> = ({ addLog, onSaveNote }) => {
    const [lore, setLore] = useState<LoreEntry[]>(() => {
        // Initialize from storage or fallback to default constant
        const savedLore = localStorage.getItem('dmc_lore');
        return savedLore ? JSON.parse(savedLore) : FAERUN_LORE;
    });
    const [location, setLocation] = useState<LocationData | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<LoreEntry | null>(null);
    const [loreInput, setLoreInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [generatingSection, setGeneratingSection] = useState<string | null>(null);
    const [party, setParty] = useState<PartyMember[]>([]);
    const [showLoreInput, setShowLoreInput] = useState(false);
    const [encounterLoading, setEncounterLoading] = useState(false);
    const [encounterIntro, setEncounterIntro] = useState('');
    const [showHandbook, setShowHandbook] = useState(true);
    const [handbookSearch, setHandbookSearch] = useState('');
    const [expandedRegion, setExpandedRegion] = useState<string | null>(null);

    // Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string>('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalCategory, setModalCategory] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    // Persist Lore whenever it changes
    useEffect(() => {
        localStorage.setItem('dmc_lore', JSON.stringify(lore));
    }, [lore]);

    useEffect(() => {
        const savedParty = localStorage.getItem('dmc_party');
        if (savedParty) setParty(JSON.parse(savedParty).filter((p: PartyMember) => p.active));
        
        const savedLoc = localStorage.getItem('dmc_active_location');
        if (savedLoc) setLocation(JSON.parse(savedLoc));
        
        const savedRegionId = localStorage.getItem('dmc_active_region_id');
        if (savedRegionId) {
            const region = lore.find(r => r.id === savedRegionId);
            if (region) setSelectedRegion(region);
        }
    }, []); // Run once on mount, but relies on 'lore' which is initialized synchronously

    // Keep region reference updated if lore changes
    useEffect(() => {
        if (selectedRegion) {
            const updatedRegion = lore.find(r => r.id === selectedRegion.id);
            if (updatedRegion) setSelectedRegion(updatedRegion);
        }
    }, [lore]);

    useEffect(() => {
        if (location) {
            localStorage.setItem('dmc_active_location', JSON.stringify(location));
        } else {
            localStorage.removeItem('dmc_active_location');
        }
    }, [location]);

    useEffect(() => {
        if (selectedRegion) {
            localStorage.setItem('dmc_active_region_id', selectedRegion.id);
        } else {
            localStorage.removeItem('dmc_active_region_id');
        }
    }, [selectedRegion]);

    const handleParseLore = async () => {
        if (!loreInput) return;
        setLoading(true);
        try {
            const data = await parseLoreFromText(loreInput);
            setLocation(data);
            setShowLoreInput(false);
            setLoreInput('');
            setShowHandbook(false);
        } catch (e) {
            alert("Ошибка анализа текста.");
        } finally {
            setLoading(false);
        }
    };

    const loadFromHandbook = (loc: LocationData) => {
        setLocation(loc);
        setShowHandbook(false);
        setEncounterIntro(''); 
    };

    const selectRegion = (region: LoreEntry) => {
        setSelectedRegion(region);
        setExpandedRegion(region.id);
        setLocation(null); 
        setShowHandbook(false); 
    };

    const handleGenerateLocation = async (type: string) => {
        if (!selectedRegion) return;
        setLoading(true);
        try {
            const newLocation = await generateFullLocation(selectedRegion.name, type);
            // Ensure unique ID for tracking
            newLocation.id = Date.now().toString();
            setLocation(newLocation);
        } catch (e) {
            console.error(e);
            alert("Не удалось сгенерировать локацию.");
        } finally {
            setLoading(false);
        }
    };

    // Save current location to the selected region in Lore
    const handleSaveLocationToHandbook = () => {
        if (!selectedRegion || !location) return;

        setLore(prevLore => {
            return prevLore.map(region => {
                if (region.id === selectedRegion.id) {
                    // Check if location already exists (by ID if available, or Name)
                    const existingIndex = region.locations.findIndex(l => 
                        (location.id && l.id === location.id) || l.name === location.name
                    );

                    const updatedLocations = [...region.locations];
                    const locationToSave = { ...location, id: location.id || Date.now().toString() };

                    if (existingIndex >= 0) {
                        updatedLocations[existingIndex] = locationToSave;
                        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Локация "${location.name}" обновлена в справочнике.`, type: 'system' });
                    } else {
                        updatedLocations.push(locationToSave);
                        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Локация "${location.name}" добавлена в справочник.`, type: 'system' });
                    }
                    
                    return { ...region, locations: updatedLocations };
                }
                return region;
            });
        });
        
        // Update current location to have the ID if it was new
        if (!location.id) {
             setLocation(prev => prev ? ({...prev, id: Date.now().toString()}) : null);
        }
    };

    const handleGenerateContent = async (category: 'npc' | 'secret' | 'loot' | 'quest') => {
        if (!location) return;
        setGeneratingSection(category);
        try {
            const newItems = await generateLocationContent(location.name, category);
            
            setLocation(prev => {
                if (!prev) return null;
                const updated = { ...prev };
                if (category === 'npc') updated.npcs = [...prev.npcs, ...newItems];
                if (category === 'secret') updated.secrets = [...prev.secrets, ...newItems];
                if (category === 'loot') updated.loot = [...prev.loot, ...newItems];
                if (category === 'quest') updated.quests = [...(prev.quests || []), ...newItems];
                return updated;
            });

        } catch (e) {
            console.error(e);
        } finally {
            setGeneratingSection(null);
        }
    };

    const generateAtmosphere = async () => {
        if (!location) return;
        setLoading(true);
        try {
            const text = await generateScenarioDescription(location.name + ". " + location.atmosphere);
            setEncounterIntro(text); 
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const generateEncounter = async () => {
        if (party.length === 0) {
            alert("Нет активных героев.");
            return;
        }
        setEncounterLoading(true);
        setEncounterIntro('');

        const avgLevel = party.reduce((sum, p) => sum + p.level, 0) / party.length;
        const minCr = Math.max(0, Math.floor(avgLevel / 4));
        const maxCr = Math.max(1, Math.ceil(avgLevel)); 

        const monsterTypeContext = location?.monsters && location.monsters.length > 0 
            ? location.monsters[Math.floor(Math.random() * location.monsters.length)] 
            : undefined;

        try {
            const candidates = await getMonstersByCr(minCr, maxCr, monsterTypeContext);
            
            if (candidates.length === 0) {
                alert("Монстры не найдены (API).");
                return;
            }

            const currentCombatants: Combatant[] = JSON.parse(localStorage.getItem('dmc_combatants') || '[]');
            const newMonsters: Combatant[] = candidates.map((m, i) => ({
                id: Date.now().toString() + i,
                name: m.name,
                type: EntityType.MONSTER,
                initiative: Math.floor(Math.random() * 20) + 1,
                hp: 10 + (avgLevel * 5), 
                maxHp: 10 + (avgLevel * 5),
                ac: 10 + Math.floor(avgLevel / 2),
                conditions: [],
                notes: `CR ${avgLevel}`
            }));

            const intro = await generateEncounterIntro(candidates.map(c => c.name), location?.name || 'Местность');
            setEncounterIntro(intro);

            localStorage.setItem('dmc_combatants', JSON.stringify([...currentCombatants, ...newMonsters]));

        } catch (e) {
            console.error(e);
        } finally {
            setEncounterLoading(false);
        }
    };

    const handleCopyToLog = (category: string, text: string) => {
        addLog({
            id: Date.now().toString(),
            timestamp: Date.now(),
            text: `[${category}] ${text}`,
            type: 'story'
        });
    };

    const handleSaveModalToJournal = () => {
        if (!location || !modalContent) return;
        
        const newNote: Note = {
            id: Date.now().toString(),
            title: `${modalCategory.toUpperCase()}: ${modalTitle}`,
            // We now save HTML content directly because CampaignNotes supports view/edit modes
            content: modalContent, 
            tags: [location.name, modalCategory, selectedRegion?.name || 'Unknown'],
            type: 'npc', 
            date: new Date().toISOString()
        };

        onSaveNote(newNote);
        setModalOpen(false); // Automatically close modal after saving
    };

    // Extended Details Handler
    const openDetailModal = async (category: string, name: string) => {
        if (!location) return;
        setModalOpen(true);
        setModalTitle(name);
        setModalCategory(category);
        setModalContent('');
        setModalLoading(true);
        
        try {
            const content = await generateExtendedDetails(category, name, location.name);
            setModalContent(content);
        } catch (e) {
            setModalContent("<p class='text-red-400'>Не удалось загрузить информацию. Попробуйте еще раз. (Возможно, проблемы с сетью или блокировщиком рекламы)</p>");
        } finally {
            setModalLoading(false);
        }
    };

    // Filter Handbook
    const filteredLore = lore.filter(region => 
        region.name.toLowerCase().includes(handbookSearch.toLowerCase()) ||
        region.locations.some(l => l.name.toLowerCase().includes(handbookSearch.toLowerCase()))
    );

    return (
        <div className="h-full flex gap-4 relative">
            
            {/* Handbook Sidebar */}
            <div className={`fixed md:static inset-y-0 left-0 z-20 w-80 bg-gray-900 border-r border-gray-700 transform transition-transform duration-300 flex flex-col ${showHandbook ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-dnd-darker">
                    <h2 className="font-serif font-bold text-gold-500 flex items-center gap-2">
                        <BookOpen className="w-5 h-5"/> Справочник
                    </h2>
                    <button onClick={() => setShowHandbook(false)} className="md:hidden text-gray-400"><ArrowRight /></button>
                </div>
                
                <div className="p-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500"/>
                        <input 
                            className="w-full bg-gray-800 border border-gray-600 rounded pl-8 pr-2 py-2 text-sm text-white focus:border-gold-500 outline-none"
                            placeholder="Поиск региона..."
                            value={handbookSearch}
                            onChange={e => setHandbookSearch(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {filteredLore.map(region => (
                        <div key={region.id} className={`border rounded overflow-hidden transition-colors ${selectedRegion?.id === region.id ? 'border-gold-600 bg-gray-800' : 'border-gray-700 bg-gray-800/30'}`}>
                            <div className="flex items-center justify-between p-1 pr-2">
                                <button 
                                    onClick={() => selectRegion(region)}
                                    className="flex-1 text-left p-2 font-bold text-gray-200 text-sm hover:text-gold-400"
                                >
                                    {region.name}
                                </button>
                                <button 
                                    onClick={() => setExpandedRegion(expandedRegion === region.id ? null : region.id)}
                                    className="p-2 text-gray-500 hover:text-white"
                                >
                                    <ChevronRight className={`w-4 h-4 transition-transform ${expandedRegion === region.id ? 'rotate-90' : ''}`}/>
                                </button>
                            </div>
                            
                            {expandedRegion === region.id && (
                                <div className="bg-gray-900/80 p-2 border-t border-gray-700 space-y-1 animate-in fade-in slide-in-from-top-1">
                                    {region.locations.map((loc, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => loadFromHandbook(loc)}
                                            className="w-full text-left text-xs text-blue-300 hover:text-white hover:bg-blue-900/30 px-2 py-1.5 rounded flex items-center gap-2"
                                        >
                                            <MapPin className="w-3 h-3" /> {loc.name}
                                        </button>
                                    ))}
                                    {region.locations.length === 0 && <span className="text-xs text-gray-500 px-2">Нет локаций</span>}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                <div className="p-2 border-t border-gray-700">
                    <button 
                        onClick={() => { setShowLoreInput(true); setShowHandbook(false); }}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-xs flex justify-center items-center gap-2"
                    >
                        <Sparkles className="w-3 h-3" /> AI Импорт текста
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden w-full bg-dnd-dark relative">
                
                {/* Mobile Toggle */}
                {!showHandbook && (
                    <button 
                        onClick={() => setShowHandbook(true)}
                        className="md:hidden absolute top-4 left-4 z-10 bg-gray-800 p-2 rounded border border-gray-600 text-white shadow-lg"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                {/* Modal Overlay */}
                {modalOpen && (
                    <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-2xl max-h-[80vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden">
                            <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                                <h3 className="text-xl font-serif font-bold text-gold-500">{modalTitle}</h3>
                                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50">
                                {modalLoading ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-gold-500 gap-3">
                                        <Loader className="w-8 h-8 animate-spin" />
                                        <span className="text-sm font-mono">Мастер размышляет...</span>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-300 [&_h1]:text-gold-500 [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-gold-500 [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-gold-500 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3:first-child]:mt-0 [&_h4]:text-gold-400 [&_h4]:font-bold [&_h4]:mb-2 [&_strong]:text-white [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_p]:mb-3" dangerouslySetInnerHTML={{__html: modalContent}} />
                                )}
                            </div>
                            <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-between">
                                {modalCategory && !modalLoading && !modalContent.includes('Не удалось') && (
                                     <button 
                                        onClick={() => openDetailModal(modalCategory, modalTitle)}
                                        className="bg-gray-800 hover:bg-gray-700 text-gold-500 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 border border-gray-600"
                                    >
                                        <RefreshCcw className="w-4 h-4" /> Повторить
                                    </button>
                                )}
                                <div className="flex gap-2 ml-auto">
                                    <button 
                                        onClick={handleSaveModalToJournal}
                                        disabled={modalLoading || modalContent.includes('Не удалось')}
                                        className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FileText className="w-4 h-4" /> Сохранить в Журнал
                                    </button>
                                    <button 
                                        onClick={() => {
                                            addLog({
                                                id: Date.now().toString(), 
                                                timestamp: Date.now(), 
                                                text: `Мастер изучает детали: ${modalTitle}`, 
                                                type: 'system'
                                            });
                                            setModalOpen(false);
                                        }}
                                        className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded text-sm font-bold"
                                    >
                                        Закрыть
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {showLoreInput ? (
                     <div className="flex-1 p-4 flex flex-col items-center justify-center animate-in fade-in">
                         <div className="w-full max-w-2xl bg-dnd-card border border-gray-700 rounded-lg p-6 shadow-xl">
                            <h3 className="text-xl font-serif font-bold text-gold-500 mb-4">AI Импорт локации</h3>
                            <p className="text-sm text-gray-400 mb-4">Вставьте любой текст из книги приключений, и ИИ структурирует его.</p>
                            <textarea 
                                className="w-full h-48 bg-gray-900 border border-gray-600 rounded p-3 text-sm text-gray-300 focus:border-gold-500 outline-none resize-none"
                                placeholder="Вставьте текст..."
                                value={loreInput}
                                onChange={e => setLoreInput(e.target.value)}
                            />
                            <div className="flex gap-3 mt-4 justify-end">
                                <button onClick={() => setShowLoreInput(false)} className="text-gray-400 hover:text-white px-4">Отмена</button>
                                <button 
                                    disabled={loading}
                                    onClick={handleParseLore}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4"/>}
                                    Обработать
                                </button>
                            </div>
                         </div>
                     </div>
                ) : !location ? (
                    // Region Dashboard or Empty State
                    selectedRegion ? (
                        <div className="flex-1 overflow-y-auto p-6 animate-in fade-in relative">
                            
                            {/* Back Button */}
                            <button 
                                onClick={() => { setSelectedRegion(null); setShowHandbook(true); }}
                                className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 px-3 py-2 rounded-full transition-colors text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" /> Справочник
                            </button>

                            <div className="max-w-4xl mx-auto mt-8">
                                <div className="border-b border-gray-700 pb-4 mb-6">
                                    <div className="flex items-end gap-4 mb-2">
                                        <h1 className="text-4xl font-serif font-bold text-gold-500">{selectedRegion.name}</h1>
                                        {selectedRegion.capital && <span className="text-gray-400 text-sm pb-2">Столица: {selectedRegion.capital}</span>}
                                    </div>
                                    <p className="text-lg text-gray-300 italic leading-relaxed">{selectedRegion.description}</p>
                                    {selectedRegion.ruler && <p className="text-sm text-gray-500 mt-2">Правитель: {selectedRegion.ruler}</p>}
                                </div>

                                <div className="grid gap-8">
                                    {/* Static Locations */}
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                                            <Map className="w-5 h-5 text-blue-400"/> Известные места
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {selectedRegion.locations.map((loc, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => loadFromHandbook(loc)}
                                                    className="bg-dnd-card border border-gray-700 p-4 rounded-lg text-left hover:border-gold-500 hover:bg-gray-800 transition-all group"
                                                >
                                                    <div className="font-bold text-lg text-gold-500 group-hover:text-white">{loc.name}</div>
                                                    <div className="text-xs text-gray-500 uppercase mb-2">{loc.type || 'Локация'}</div>
                                                    <p className="text-sm text-gray-400 line-clamp-2">{loc.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Generators */}
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-400"/> Создать новое место (AI)
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Малая деревня/Хутор')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <Home className="w-6 h-6 text-green-500 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Деревня</span>
                                            </button>
                                             <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Крупный город/Торговый пост')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <Landmark className="w-6 h-6 text-blue-400 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Город</span>
                                            </button>
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Древние руины')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <Castle className="w-6 h-6 text-gray-400 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Руины</span>
                                            </button>
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Подземелье/Пещера')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <LandPlot className="w-6 h-6 text-stone-500 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Подземелье</span>
                                            </button>
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Таверна/Постоялый двор')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <Beer className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Таверна</span>
                                            </button>
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Дикая местность/Лес')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <Trees className="w-6 h-6 text-green-700 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Глушь</span>
                                            </button>
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Лагерь/Стоянка')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <Tent className="w-6 h-6 text-orange-500 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Лагерь</span>
                                            </button>
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Дорога/Тракт')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <Footprints className="w-6 h-6 text-yellow-700 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Дорога</span>
                                            </button>
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Крепость/Форпост')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <ShieldAlert className="w-6 h-6 text-red-500 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Крепость</span>
                                            </button>
                                            <button 
                                                disabled={loading}
                                                onClick={() => handleGenerateLocation('Аномалия/Мистическое место')}
                                                className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                            >
                                                <Ghost className="w-6 h-6 text-purple-400 group-hover:scale-110 transition-transform"/>
                                                <span className="font-bold">Тайна</span>
                                            </button>
                                        </div>
                                        {loading && (
                                            <div className="mt-4 text-center text-gold-500 animate-pulse flex items-center justify-center gap-2">
                                                <Loader className="animate-spin w-5 h-5"/> Создаем уникальное место в {selectedRegion.name}...
                                            </div>
                                        )}
                                    </section>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                            <MapPin className="w-16 h-16 opacity-20 mb-4" />
                            <p className="text-xl font-serif">Выберите регион из справочника слева.</p>
                            <p className="text-sm mt-2">Вы сможете выбрать известные локации или сгенерировать новые.</p>
                        </div>
                    )
                ) : (
                    // Location Details View
                    <div className="flex-1 flex flex-col gap-4 overflow-hidden h-full animate-in fade-in">
                        {/* Header */}
                        <div className="bg-dnd-card p-5 rounded-lg border border-gray-700 flex flex-col md:flex-row justify-between gap-4 shrink-0">
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-3xl font-serif font-bold text-gold-500">{location.name}</h1>
                                    <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded border border-gray-700">{location.type || 'Локация'}</span>
                                </div>
                                <p className="text-gray-300 italic border-l-2 border-gold-600 pl-3 py-1 mb-2">{location.atmosphere}</p>
                                <p className="text-sm text-gray-400">{location.description}</p>
                            </div>
                            <div className="flex flex-col gap-2 min-w-[180px]">
                                <button 
                                    onClick={handleSaveLocationToHandbook}
                                    className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded border border-green-600 text-sm flex items-center gap-2 font-bold shadow-md"
                                    title="Сохранить текущее состояние локации в справочник региона"
                                >
                                    <Save className="w-4 h-4" /> Сохранить
                                </button>
                                <button 
                                    onClick={() => {
                                        setLocation(null);
                                        // Do not show handbook automatically, go to region view
                                    }}
                                    className="bg-gray-800 hover:bg-gray-700 text-gold-500 hover:text-gold-400 px-4 py-2 rounded border border-gray-600 text-sm flex items-center gap-2"
                                >
                                    <Map className="w-4 h-4" /> К Региону
                                </button>
                                <button 
                                    onClick={generateAtmosphere}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded border border-gray-600 text-sm flex items-center gap-2"
                                >
                                    <Eye className="w-4 h-4" /> Описать (AI)
                                </button>
                                <button 
                                    onClick={generateEncounter}
                                    disabled={encounterLoading}
                                    className="bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700 px-4 py-2 rounded text-sm flex items-center gap-2 font-bold transition-colors disabled:opacity-50"
                                >
                                    {encounterLoading ? <Loader className="animate-spin w-4 h-4"/> : <Skull className="w-4 h-4" />}
                                    Энкаунтер!
                                </button>
                            </div>
                        </div>

                        {/* Generated Intro Box */}
                        {encounterIntro && (
                            <div className="bg-red-950/40 border-l-4 border-red-600 p-4 rounded-r-lg animate-in fade-in slide-in-from-top-2 shrink-0">
                                <h4 className="text-red-400 text-xs uppercase tracking-widest mb-1 font-bold flex items-center gap-2">
                                    <Sparkles className="w-3 h-3"/> Нарратор
                                </h4>
                                <p className="text-gray-200 font-serif leading-relaxed">{encounterIntro}</p>
                            </div>
                        )}

                        {/* Details Grid */}
                        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
                            
                            {/* NPCs */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                                    <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2">
                                        <Users className="w-4 h-4"/> Обитатели
                                    </h3>
                                    <button 
                                        onClick={() => handleGenerateContent('npc')}
                                        disabled={!!generatingSection}
                                        className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                    >
                                        {generatingSection === 'npc' ? <Loader className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>} AI
                                    </button>
                                </div>

                                {location.npcs.length === 0 && <p className="text-gray-600 text-sm italic">Нет важных NPC.</p>}
                                {location.npcs.map((npc, i) => (
                                    <div key={i} className="bg-gray-800/50 p-3 rounded border border-gray-700 hover:border-gray-600 transition-colors group relative">
                                        <div className="flex justify-between pr-12">
                                            <span className="font-bold text-gold-500">{npc.name}</span>
                                            <span className="text-xs text-gray-500">{npc.race} {npc.class}</span>
                                        </div>
                                        <p className="text-sm text-gray-300 mt-1">{npc.description}</p>
                                        {npc.personality && <p className="text-xs text-gray-500 mt-1 italic">"{npc.personality}"</p>}
                                        
                                        <div className="absolute top-2 right-2 flex gap-1">
                                            <button 
                                                onClick={() => openDetailModal('npc', npc.name)}
                                                className="p-1.5 bg-blue-900 text-blue-200 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-800"
                                                title="Подробнее (AI)"
                                            >
                                                <Info className="w-3 h-3" />
                                            </button>
                                            <button 
                                                onClick={() => handleCopyToLog('NPC', `${npc.name} (${npc.race}): ${npc.description}`)}
                                                className="p-1.5 bg-gray-700 text-gray-300 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-600 hover:text-white"
                                                title="Копировать в лог"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Secrets & Loot & Quests */}
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2">
                                        <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2">
                                            <Sparkles className="w-4 h-4"/> Квесты
                                        </h3>
                                        <button 
                                            onClick={() => handleGenerateContent('quest')}
                                            disabled={!!generatingSection}
                                            className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {generatingSection === 'quest' ? <Loader className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>} AI
                                        </button>
                                    </div>
                                    {(!location.quests || location.quests.length === 0) && <p className="text-gray-600 text-sm italic">Нет квестов.</p>}
                                    <ul className="space-y-2">
                                        {location.quests && location.quests.map((q, i) => (
                                            <li key={i} className="text-sm bg-indigo-900/20 p-2 rounded border border-indigo-900/40 group relative pr-14">
                                                <div className="font-bold text-indigo-300">{q.title}</div>
                                                <div className="text-gray-400">{q.description}</div>
                                                <div className="absolute top-2 right-2 flex gap-1">
                                                    <button 
                                                        onClick={() => openDetailModal('quest', q.title)}
                                                        className="p-1.5 bg-indigo-800 text-indigo-100 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-700"
                                                        title="Подробнее (AI)"
                                                    >
                                                        <Info className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCopyToLog('Квест', `${q.title}: ${q.description}`)}
                                                        className="p-1.5 bg-indigo-900 text-indigo-200 rounded opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-800"
                                                        title="Копировать в лог"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2">
                                        <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2">
                                            <Eye className="w-4 h-4"/> Тайны
                                        </h3>
                                        <button 
                                            onClick={() => handleGenerateContent('secret')}
                                            disabled={!!generatingSection}
                                            className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {generatingSection === 'secret' ? <Loader className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>} AI
                                        </button>
                                    </div>
                                    <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                                        {location.secrets.map((s, i) => (
                                            <li key={i} className="group flex justify-between items-start py-1 hover:bg-gray-800/50 rounded px-2 -ml-2 transition-colors">
                                                <span>{s}</span>
                                                <div className="flex gap-1 ml-2">
                                                    <button 
                                                        onClick={() => openDetailModal('secret', s)}
                                                        className="p-1 text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Подробнее"
                                                    >
                                                        <Info className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCopyToLog('Тайна', s)}
                                                        className="p-1 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        title="Копировать в лог"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                        {location.secrets.length === 0 && <li className="text-gray-600 italic list-none">Нет тайн.</li>}
                                    </ul>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2">
                                        <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2">
                                            <Sparkles className="w-4 h-4"/> Ценности
                                        </h3>
                                        <button 
                                            onClick={() => handleGenerateContent('loot')}
                                            disabled={!!generatingSection}
                                            className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {generatingSection === 'loot' ? <Loader className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>} AI
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {location.loot.map((l, i) => (
                                            <div key={i} className="relative group inline-flex">
                                                <span 
                                                    onClick={() => openDetailModal('loot', l)}
                                                    className="text-xs bg-gray-800 px-2 py-1 rounded text-gold-600 border border-gray-700 cursor-pointer hover:bg-gray-700 hover:border-gold-500 transition-colors"
                                                >
                                                    {l}
                                                </span>
                                                <button 
                                                    onClick={() => handleCopyToLog('Лут', l)}
                                                    className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-gray-600"
                                                    title="Копировать"
                                                >
                                                    <Copy className="w-2 h-2" />
                                                </button>
                                            </div>
                                        ))}
                                        {location.loot.length === 0 && <span className="text-gray-600 italic text-sm">Пусто.</span>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LocationTracker;
