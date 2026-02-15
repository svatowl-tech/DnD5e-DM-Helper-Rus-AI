
import React, { useState, useEffect, useRef } from 'react';
import { LocationData, LoreEntry, LocationTrackerProps, Note, SavedImage, TravelState, CampaignNpc, FullQuest, BestiaryEntry } from '../types';
import { parseLoreFromText, generateFullLocation, generateLocationContent, generateExtendedDetails, generateMultiverseBreach, generateRealityGlitch, generateImage, generateNpc, generateQuest, generateMonster, enhanceEntityDraft } from '../services/polzaService';
import { getMonstersByCr, getMonsterDetails } from '../services/dndApiService';
import { Route, Signpost, DoorOpen, Home, Landmark, Castle, Trees, Beer, Mountain, Tent, Zap, Church, Skull, Ghost, Anchor, LandPlot, ShieldAlert, Pickaxe, Wheat, Ship, ShoppingBag, Gavel, Globe, PackagePlus, Gem, BookOpen, Swords, MapPinned, MapPin, X, PenTool, Loader, Plus, Sparkles, Feather, Archive, ScrollText, FileText, RefreshCcw, UserPlus } from 'lucide-react';
import { FAERUN_LORE } from '../data/faerunLore';
import { useAudio } from '../contexts/AudioContext';
import { useToast } from '../contexts/ToastContext';

import HandbookSidebar from './location/HandbookSidebar';
import RegionView from './location/RegionView';
import LocationDetailView from './location/LocationDetailView';
import TravelManager from './TravelManager';
import BestiaryBrowser from './BestiaryBrowser';

// --- Constants ---
const GENERIC_LOCATIONS = [
    { label: 'Дорога', icon: <Route className="w-6 h-6 text-amber-700"/>, type: 'Старая дорога' },
    { label: 'Улица', icon: <Signpost className="w-6 h-6 text-slate-400"/>, type: 'Городская улица' },
    { label: 'Дом', icon: <DoorOpen className="w-6 h-6 text-orange-400"/>, type: 'Обычный дом' },
    { label: 'Деревня', icon: <Home className="w-6 h-6 text-green-500"/>, type: 'Деревня' },
    { label: 'Город', icon: <Landmark className="w-6 h-6 text-blue-400"/>, type: 'Торговый город' },
    { label: 'Руины', icon: <Castle className="w-6 h-6 text-gray-400"/>, type: 'Древние руины' },
    { label: 'Лес', icon: <Trees className="w-6 h-6 text-emerald-500"/>, type: 'Лесная чаща' },
    { label: 'Таверна', icon: <Beer className="w-6 h-6 text-yellow-500"/>, type: 'Таверна' },
    { label: 'Пещера', icon: <Mountain className="w-6 h-6 text-stone-500"/>, type: 'Пещера' },
    { label: 'Лагерь', icon: <Tent className="w-6 h-6 text-orange-400"/>, type: 'Лагерь' },
    { label: 'Башня', icon: <Zap className="w-6 h-6 text-purple-500"/>, type: 'Башня мага' },
    { label: 'Храм', icon: <Church className="w-6 h-6 text-gold-500"/>, type: 'Храм' },
    { label: 'Подземелье', icon: <Skull className="w-6 h-6 text-red-500"/>, type: 'Подземелье' },
    { label: 'Кладбище', icon: <Ghost className="w-6 h-6 text-gray-300"/>, type: 'Кладбище' },
];

const LOCATION_STATUSES = [
    { id: 'peaceful', label: 'Спокойно', color: 'text-green-400 border-green-500/50 bg-green-900/20' },
    { id: 'tension', label: 'Напряжение', color: 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20' },
    { id: 'under_attack', label: 'В бою', color: 'text-orange-500 border-orange-500/50 bg-orange-900/20' },
    { id: 'cursed', label: 'Проклято', color: 'text-purple-400 border-purple-500/50 bg-purple-900/20' },
    { id: 'destroyed', label: 'Уничтожено', color: 'text-gray-500 border-gray-500/50 line-through bg-black/40' },
    { id: 'occupied', label: 'Захвачено', color: 'text-red-400 border-red-500/50 bg-red-900/20' },
];

const LocationTracker: React.FC<LocationTrackerProps> = ({ addLog, onSaveNote, onImageGenerated, onShowImage }) => {
    const { autoPlayMusic } = useAudio();
    const { showToast } = useToast();

    // Data State
    const [lore, setLore] = useState<LoreEntry[]>(() => {
        const savedLore = localStorage.getItem('dmc_lore');
        return savedLore ? JSON.parse(savedLore) : FAERUN_LORE;
    });
    const [trackerNpcs, setTrackerNpcs] = useState<CampaignNpc[]>([]);
    const [trackerQuests, setTrackerQuests] = useState<FullQuest[]>([]);
    const [party, setParty] = useState<any[]>([]);
    
    // UI/Navigation State
    const [location, setLocation] = useState<LocationData | null>(null);
    const [locationStack, setLocationStack] = useState<LocationData[]>([]); // For navigating sub-locations
    const [selectedRegion, setSelectedRegion] = useState<LoreEntry | null>(null);
    const [activeView, setActiveView] = useState<'details' | 'travel'>('details');
    const [showHandbook, setShowHandbook] = useState(true);
    const [handbookSearch, setHandbookSearch] = useState('');
    const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
    
    // Processing State
    const [loading, setLoading] = useState(false);
    const [breachLoading, setBreachLoading] = useState(false);
    const [generatingMonster, setGeneratingMonster] = useState<string | null>(null);
    const [loreInput, setLoreInput] = useState('');
    const [showLoreInput, setShowLoreInput] = useState(false);

    // Modal States (Global for the tracker)
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string>('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalCategory, setModalCategory] = useState('');
    const [modalLoading, setModalLoading] = useState(false);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addEntityType, setAddEntityType] = useState<'npc' | 'quest'>('npc');
    const [addEntityName, setAddEntityName] = useState('');
    const [addEntityDesc, setAddEntityDesc] = useState('');
    const [useAiGeneration, setUseAiGeneration] = useState(false);
    const [addLoading, setAddLoading] = useState(false);

    const [creationModal, setCreationModal] = useState<{ type: 'region' | 'location', isOpen: boolean }>({ type: 'region', isOpen: false });
    const [creationData, setCreationData] = useState({ name: '', type: '', description: '' });
    const [enhancing, setEnhancing] = useState(false);

    const [showBestiary, setShowBestiary] = useState(false);

    // Travel State
    const [activeTravelPlan, setActiveTravelPlan] = useState<TravelState | null>(null);

    // --- Effects & Initialization ---
    useEffect(() => localStorage.setItem('dmc_lore', JSON.stringify(lore)), [lore]);

    useEffect(() => {
        loadTrackerData();
        const savedLoc = localStorage.getItem('dmc_active_location');
        if (savedLoc) setLocation(JSON.parse(savedLoc));
        
        const savedRegionId = localStorage.getItem('dmc_active_region_id');
        if (savedRegionId) {
            const region = lore.find(r => r.id === savedRegionId);
            if (region) setSelectedRegion(region);
        }
        
        const savedTravel = localStorage.getItem('dmc_active_travel');
        if (savedTravel) {
            const state = JSON.parse(savedTravel);
            setActiveTravelPlan(state);
            if (state.result) setActiveView('travel');
        }

        const handleUpdateNpcs = () => loadTrackerData();
        const handleUpdateQuests = () => loadTrackerData();
        const handleUpdateParty = () => loadTrackerData();

        window.addEventListener('dmc-update-npcs', handleUpdateNpcs);
        window.addEventListener('dmc-update-quests', handleUpdateQuests);
        window.addEventListener('dmc-update-party', handleUpdateParty);
        window.addEventListener('dmc-open-travel', () => setActiveView('travel'));

        return () => {
            window.removeEventListener('dmc-update-npcs', handleUpdateNpcs);
            window.removeEventListener('dmc-update-quests', handleUpdateQuests);
            window.removeEventListener('dmc-update-party', handleUpdateParty);
            window.removeEventListener('dmc-open-travel', () => setActiveView('travel'));
        };
    }, []);

    useEffect(() => {
        if (selectedRegion) {
            const updatedRegion = lore.find(r => r.id === selectedRegion.id);
            if (updatedRegion) setSelectedRegion(updatedRegion);
        }
    }, [lore]);

    useEffect(() => {
        if (location) localStorage.setItem('dmc_active_location', JSON.stringify(location));
        else {
            localStorage.removeItem('dmc_active_location');
            // If location is cleared, also clear the stack to reset navigation state when backing out completely
            if (locationStack.length === 0) setLocationStack([]); 
        }
    }, [location]);

    useEffect(() => {
        if (selectedRegion) localStorage.setItem('dmc_active_region_id', selectedRegion.id);
        else localStorage.removeItem('dmc_active_region_id');
    }, [selectedRegion]);

    useEffect(() => {
        if (activeTravelPlan) localStorage.setItem('dmc_active_travel', JSON.stringify(activeTravelPlan));
        else localStorage.removeItem('dmc_active_travel');
    }, [activeTravelPlan]);

    const loadTrackerData = () => {
        const savedNpcs = localStorage.getItem('dmc_npcs');
        if (savedNpcs) setTrackerNpcs(JSON.parse(savedNpcs));
        const savedQuests = localStorage.getItem('dmc_quests');
        if (savedQuests) setTrackerQuests(JSON.parse(savedQuests));
        const savedParty = localStorage.getItem('dmc_party');
        if (savedParty) setParty(JSON.parse(savedParty).filter((p: any) => p.active));
    };

    // --- Core Logic Handlers ---

    const updateLocation = (loc: LocationData) => {
        setLocation(loc);
        setLocationStack([]); // Reset stack on new main location selection from sidebar
        setShowHandbook(false);
        setActiveView('details');
        autoPlayMusic('location', `${loc.type} ${loc.name} ${loc.atmosphere}`);
    };

    const handleNavigateSubLocation = (subLoc: LocationData) => {
        if (!location) return;
        setLocationStack(prev => [...prev, location]); // Push current to stack
        setLocation(subLoc); // Set new
        autoPlayMusic('location', `${subLoc.type} ${subLoc.name} ${subLoc.atmosphere}`);
    };

    const handleNavigateBack = () => {
        if (locationStack.length > 0) {
            const prev = locationStack[locationStack.length - 1];
            setLocation(prev);
            setLocationStack(prevStack => prevStack.slice(0, -1));
        } else {
            setLocation(null); // Back to region view
        }
    };

    const handleAddSubLocation = (newSub: LocationData) => {
        if (!location) return;
        const updatedLocation = {
            ...location,
            subLocations: [newSub, ...(location.subLocations || [])]
        };
        setLocation(updatedLocation);
        
        // Try to sync with Lore if this is a top-level location being edited
        // Note: Deep sync (editing sub-locations of sub-locations) is complex with current structure,
        // so we mainly sync if we are at the top level of the region.
        if (selectedRegion) {
            setLore(prevLore => prevLore.map(r => {
                if (r.id === selectedRegion.id) {
                    return {
                        ...r,
                        locations: r.locations.map(l => l.id === location.id || l.name === location.name ? updatedLocation : l)
                    };
                }
                return r;
            }));
        }
        showToast("Новая локация добавлена", "success");
    };

    const handleGenerateLocation = async (type: string) => {
        if (!selectedRegion) return;
        setLoading(true);
        try {
            const newLoc = await generateFullLocation(selectedRegion.name, type);
            newLoc.id = Date.now().toString();
            setLore(prev => prev.map(r => r.id === selectedRegion.id ? { ...r, locations: [newLoc, ...r.locations] } : r));
            updateLocation(newLoc);
            showToast("Локация создана", "success");
        } catch (e: any) { showToast(e.message, "error"); } finally { setLoading(false); }
    };

    const handleGenerateBreach = async () => {
        setBreachLoading(true);
        try {
            const breach = await generateMultiverseBreach();
            breach.id = Date.now().toString();
            updateLocation(breach);
        } catch (e: any) { showToast(e.message, "error"); } finally { setBreachLoading(false); }
    };

    const handleCreateManual = () => {
        if (!creationData.name) { showToast("Введите название", "warning"); return; }
        if (creationModal.type === 'region') {
            const newRegion: LoreEntry = {
                id: Date.now().toString(),
                name: creationData.name,
                description: creationData.description,
                capital: creationData.type,
                locations: []
            };
            setLore(prev => [newRegion, ...prev]);
            setSelectedRegion(newRegion);
            setExpandedRegion(newRegion.id);
            showToast(`Регион "${newRegion.name}" создан`, "success");
        } else {
            if (!selectedRegion) { showToast("Сначала выберите регион", "error"); return; }
            const newLocation: LocationData = {
                id: Date.now().toString(),
                name: creationData.name,
                type: creationData.type || 'Локация',
                description: creationData.description || 'Новое место.',
                atmosphere: 'Спокойная.',
                npcs: [], quests: [], loot: [], monsters: [], secrets: []
            };
            setLore(prev => prev.map(r => r.id === selectedRegion.id ? { ...r, locations: [newLocation, ...r.locations] } : r));
            updateLocation(newLocation);
            showToast(`Локация "${newLocation.name}" создана`, "success");
        }
        setCreationModal({ ...creationModal, isOpen: false });
    };

    const handleEnhanceManualData = async () => {
        if (!creationData.name) { showToast("Введите название", "warning"); return; }
        setEnhancing(true);
        try {
            const enhanced = await enhanceEntityDraft(creationModal.type, creationData);
            setCreationData(prev => ({
                ...prev,
                type: (prev.type || enhanced.suggestedType) || prev.type,
                description: prev.description ? prev.description + "\n\n" + enhanced.addedDescription : enhanced.addedDescription
            }));
            showToast("Описание дополнено AI", "success");
        } catch (e: any) { showToast(e.message, "error"); } finally { setEnhancing(false); }
    };

    const handleAddEntity = async () => {
        if (!location || !addEntityName) return;
        setAddLoading(true);
        try {
            if (addEntityType === 'npc') {
                let npcData: any = { name: addEntityName, description: addEntityDesc, location: location.name, race: 'Гуманоид', status: 'alive' };
                if (useAiGeneration) {
                    const aiResult = await generateNpc(addEntityName + " " + addEntityDesc);
                    npcData = { ...npcData, ...aiResult, location: location.name };
                }
                window.dispatchEvent(new CustomEvent('dmc-add-npc', { detail: npcData }));
            } else {
                let questData: any = { title: addEntityName, description: addEntityDesc, giver: location.name, location: location.name, status: 'active' };
                if (useAiGeneration) {
                    const aiHtml = await generateQuest('3', addEntityName + ". " + addEntityDesc + ". Context: " + location.name);
                    questData.description = aiHtml;
                    questData.summary = "Сгенерировано AI";
                }
                window.dispatchEvent(new CustomEvent('dmc-add-quest', { detail: questData }));
            }
            setIsAddModalOpen(false);
            setAddEntityName('');
            setAddEntityDesc('');
        } catch (e: any) { alert(e.message); } finally { setAddLoading(false); }
    };

    const handleParseLore = async () => {
        if (!loreInput) return;
        setLoading(true);
        try {
            const data = await parseLoreFromText(loreInput);
            updateLocation(data);
            setShowLoreInput(false);
            setLoreInput('');
        } catch (e: any) { alert(e.message); } finally { setLoading(false); }
    };

    const handleTravelComplete = (newLocation: LocationData, newRegionId?: string) => {
        if (newRegionId) {
            const newRegion = lore.find(r => r.id === newRegionId);
            if (newRegion) setSelectedRegion(newRegion);
             // Save if new
             setLore(prevLore => {
                return prevLore.map(region => {
                    if (region.id === newRegion?.id) {
                        const exists = region.locations.some(l => l.id === newLocation.id || l.name === newLocation.name);
                        if (!exists) return { ...region, locations: [newLocation, ...region.locations] };
                    }
                    return region;
                });
            });
        }
        updateLocation(newLocation);
        setActiveTravelPlan(null);
        showToast(`Прибытие в ${newLocation.name}`, 'success');
    };

    // --- Modal Handlers ---

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
        } catch (e: any) { setModalContent(`Ошибка: ${e.message}`); } finally { setModalLoading(false); }
    };

    const handleCopyToLog = (category: string, text: string) => {
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[${category}] ${text}`, type: 'story' });
        showToast("Добавлено в летопись", 'success');
    };

    const handleSaveModalToJournal = () => {
        if (!location || !modalContent) return;
        onSaveNote({
            id: Date.now().toString(),
            title: `${modalCategory.toUpperCase()}: ${modalTitle}`,
            content: modalContent, 
            tags: [location.name, modalCategory, selectedRegion?.name || 'Unknown'],
            type: 'npc', 
            date: new Date().toISOString()
        });
        setModalOpen(false);
        showToast("Сохранено в журнал", "success");
    };

    const handleSaveModalToTracker = () => {
        if (!location || !modalContent || modalCategory !== 'npc') return;
        const plainText = modalContent.replace(/<[^>]*>?/gm, ' ');
        window.dispatchEvent(new CustomEvent('dmc-add-npc', {
            detail: {
                name: modalTitle,
                race: 'Неизвестно',
                description: plainText.substring(0, 150) + "...",
                location: location.name,
                status: 'alive',
                attitude: 'neutral',
                notes: modalContent
            }
        }));
        setModalOpen(false);
    };

    const handleAddMonsterSmart = async (monsterName: string) => {
        if (generatingMonster) return;
        setGeneratingMonster(monsterName);
        try {
            const stats = await generateMonster(monsterName);
            const event = new CustomEvent('dmc-add-combatant', {
                detail: { 
                    name: stats.name, type: 'MONSTER', monsterType: stats.type,
                    hp: stats.hp, ac: stats.ac, cr: stats.cr, xp: stats.xp,
                    initiative: 10 + Math.floor(Math.random() * 5),
                    notes: `CR ${stats.cr} (AI). ${location?.name || ''}`,
                    actions: stats.actions?.map((a: any) => `<b>${a.name}:</b> ${a.desc}`) || []
                }
            });
            window.dispatchEvent(event);
            showToast(`${stats.name} добавлен в бой`, 'success');
        } catch (e: any) { alert(e.message); } finally { setGeneratingMonster(null); }
    };

    const handleGenerateNpcImage = async (name: string, description: string) => {
        if (!confirm(`Сгенерировать портрет для ${name}? Это займет некоторое время.`)) return;
        try {
            const shortDesc = description.substring(0, 200);
            const prompt = `Fantasy portrait of ${name}. ${shortDesc}. Detailed digital art style.`;
            const url = await generateImage(prompt, "1:1");
            const newImage: SavedImage = { id: Date.now().toString(), url: url, title: name, type: 'npc', timestamp: Date.now() };
            if (onImageGenerated) onImageGenerated(newImage);
            showToast(`Портрет ${name} создан`, 'success');
        } catch(e: any) { alert("Ошибка: " + e.message); }
    };

    const filteredLore = lore.filter(r => r.name.toLowerCase().includes(handbookSearch.toLowerCase()));
    
    // Determine back button state
    const hasParent = locationStack.length > 0;
    const parentName = hasParent 
        ? locationStack[locationStack.length - 1].name 
        : selectedRegion?.name || 'Справочник';

    return (
        <div className="h-full flex gap-4 relative">
            
            {/* --- Modals Block --- */}
            {/* Detail Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-2xl max-h-[80vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-serif font-bold text-gold-500">{modalTitle}</h3>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 bg-gray-900 custom-scrollbar">
                            {modalLoading ? (
                                <div className="flex justify-center text-gold-500 gap-3">
                                    <Loader className="w-8 h-8 animate-spin" />
                                    <span className="text-sm">Мастер размышляет...</span>
                                </div>
                            ) : (
                                <div 
                                    className="text-sm text-gray-200 [&_*]:!bg-transparent [&_*]:!text-gray-200 [&_strong]:!text-white [&_h1]:!text-gold-500 [&_h2]:!text-gold-500 [&_h3]:!text-gold-500" 
                                    dangerouslySetInnerHTML={{__html: modalContent}} 
                                />
                            )}
                        </div>
                        <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-between shrink-0 flex-wrap gap-2">
                             {modalCategory && !modalLoading && !modalContent.includes('Ошибка') && (
                                <button onClick={() => openDetailModal(modalCategory, modalTitle)} className="bg-gray-800 hover:bg-gray-700 text-gold-500 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 border border-gray-600"><RefreshCcw className="w-4 h-4" /> Повторить</button>
                            )}
                            <div className="flex gap-2 ml-auto">
                                <button onClick={() => handleCopyToLog(modalCategory, `${modalTitle}: ${modalContent.replace(/<[^>]*>?/gm, ' ').substring(0, 100)}...`)} disabled={modalLoading} className="bg-blue-900 hover:bg-blue-800 text-blue-200 px-4 py-2 rounded text-sm font-bold flex items-center gap-2 border border-blue-800"><Feather className="w-4 h-4" /> В Летопись</button>
                                {modalCategory === 'npc' && <button onClick={handleSaveModalToTracker} className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"><UserPlus className="w-4 h-4" /> В Трекер NPC</button>}
                                {modalCategory === 'loot' && <button onClick={() => { window.dispatchEvent(new CustomEvent('dmc-add-to-stash', { detail: { itemName: modalTitle, itemDescription: modalContent.replace(/<[^>]*>?/gm, ' ') } })); setModalOpen(false); }} className="bg-yellow-600 hover:bg-yellow-500 text-black px-4 py-2 rounded text-sm font-bold flex items-center gap-2"><Archive className="w-4 h-4" /> В Общий Мешок</button>}
                                {modalCategory === 'quest' && <button onClick={() => { window.dispatchEvent(new CustomEvent('dmc-add-quest', { detail: { title: modalTitle, description: modalContent, summary: modalContent.replace(/<[^>]*>?/gm, ' ').substring(0, 100)+'...', giver: location?.name, status: 'active' } })); setModalOpen(false); }} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2"><ScrollText className="w-4 h-4" /> В Трекер</button>}
                                <button onClick={handleSaveModalToJournal} disabled={modalLoading || modalContent.includes('Ошибка')} className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 disabled:opacity-50"><FileText className="w-4 h-4" /> В Журнал</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bestiary Modal */}
            {showBestiary && <BestiaryBrowser onClose={() => setShowBestiary(false)} onAddMonster={(m, c) => { if(location) { const newMons = Array(c).fill(m.name); setLocation({...location, monsters: [...(location.monsters||[]), ...newMons]}); showToast(`Добавлено ${c} x ${m.name}`); setShowBestiary(false); }}} />}

            {/* Manual Creation Modal */}
            {creationModal.isOpen && (
                <div className="fixed inset-0 z-[75] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-serif font-bold text-white">{creationModal.type === 'region' ? 'Новый Регион' : 'Новая Локация'}</h3>
                            <button onClick={() => setCreationModal({...creationModal, isOpen: false})}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Название</label><input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" value={creationData.name} onChange={e => setCreationData({...creationData, name: e.target.value})} autoFocus/></div>
                            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">{creationModal.type === 'region' ? 'Столица' : 'Тип'}</label><input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" value={creationData.type} onChange={e => setCreationData({...creationData, type: e.target.value})}/></div>
                            <div className="flex flex-col h-32"><div className="flex justify-between items-center mb-1"><label className="text-xs text-gray-500 uppercase font-bold">Описание</label><button onClick={handleEnhanceManualData} disabled={enhancing || !creationData.name} className="text-xs text-purple-400 hover:text-purple-200 flex items-center gap-1 disabled:opacity-50">{enhancing ? <Loader className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} Улучшить (AI)</button></div><textarea className="w-full flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-white resize-none focus:border-gold-500 outline-none" value={creationData.description} onChange={e => setCreationData({...creationData, description: e.target.value})}/></div>
                        </div>
                        <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-2">
                            <button onClick={() => setCreationModal({...creationModal, isOpen: false})} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Отмена</button>
                            <button onClick={handleCreateManual} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold text-sm shadow-lg">Создать</button>
                        </div>
                    </div>
                </div>
            )}

             {/* Add Custom Entity Modal */}
             {isAddModalOpen && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2"><PenTool className="w-5 h-5 text-gold-500"/> Добавить в локацию</h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex bg-gray-800 rounded p-1"><button onClick={() => setAddEntityType('npc')} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${addEntityType === 'npc' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}>NPC</button><button onClick={() => setAddEntityType('quest')} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${addEntityType === 'quest' ? 'bg-orange-600 text-white' : 'text-gray-400 hover:text-white'}`}>Квест</button></div>
                            <div className="flex bg-gray-800 rounded p-1 mb-2"><button onClick={() => setUseAiGeneration(false)} className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${!useAiGeneration ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Вручную</button><button onClick={() => setUseAiGeneration(true)} className={`flex-1 py-1.5 text-xs font-bold rounded transition-colors ${useAiGeneration ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>AI Генерация</button></div>
                            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">Название</label><input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" value={addEntityName} onChange={e => setAddEntityName(e.target.value)} autoFocus placeholder="Имя NPC или Название квеста" /></div>
                            <div><label className="text-xs text-gray-500 uppercase font-bold block mb-1">{useAiGeneration ? 'Идея / Ключевые слова' : 'Описание'}</label><textarea className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white h-24 resize-none focus:border-gold-500 outline-none" value={addEntityDesc} onChange={e => setAddEntityDesc(e.target.value)} placeholder={useAiGeneration ? "Опишите, что сгенерировать..." : "Введите описание..."} /></div>
                        </div>
                        <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-2">
                            <button onClick={setIsAddModalOpen.bind(null, false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Отмена</button>
                            <button onClick={handleAddEntity} disabled={addLoading || !addEntityName} className="bg-gold-600 hover:bg-gold-500 text-black px-6 py-2 rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50">{addLoading ? <Loader className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} {useAiGeneration ? 'Сгенерировать' : 'Добавить'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Lore Input Modal */}
            {showLoreInput && (
                <div className="absolute inset-0 z-50 bg-dnd-dark flex flex-col items-center justify-center p-4 animate-in fade-in">
                     <div className="w-full max-w-2xl bg-dnd-card border border-gray-700 rounded-lg p-6 shadow-xl">
                        <h3 className="text-xl font-serif font-bold text-gold-500 mb-4">AI Импорт текста</h3>
                        <p className="text-sm text-gray-400 mb-4">Вставьте любой текст из книги приключений, и ИИ структурирует его.</p>
                        <textarea className="w-full h-48 bg-gray-900 border border-gray-600 rounded p-3 text-sm text-gray-300 focus:border-gold-500 outline-none resize-none" placeholder="Вставьте текст..." value={loreInput} onChange={e => setLoreInput(e.target.value)}/>
                        <div className="flex gap-3 mt-4 justify-end">
                            <button onClick={() => setShowLoreInput(false)} className="text-gray-400 hover:text-white px-4">Отмена</button>
                            <button disabled={loading} onClick={handleParseLore} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded font-bold flex items-center gap-2 disabled:opacity-50">{loading ? <Loader className="animate-spin w-4 h-4"/> : <Sparkles className="w-4 h-4"/>} Обработать</button>
                        </div>
                     </div>
                 </div>
            )}

            <HandbookSidebar 
                showHandbook={showHandbook} setShowHandbook={setShowHandbook}
                handbookSearch={handbookSearch} setHandbookSearch={setHandbookSearch}
                filteredLore={filteredLore} selectedRegion={selectedRegion}
                selectRegion={(r) => { setSelectedRegion(r); setLocation(null); setShowHandbook(false); setActiveView('details'); }}
                expandedRegion={expandedRegion} setExpandedRegion={setExpandedRegion}
                openCreationModal={(t) => { setCreationModal({type: t, isOpen: true}); setCreationData({name:'',type:'',description:''}); }}
                loadFromHandbook={updateLocation} setShowLoreInput={setShowLoreInput}
                getStatusStyle={(s) => LOCATION_STATUSES.find(st => st.id === s)?.color || ''}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden bg-dnd-dark relative">
                {!location && activeView !== 'travel' ? (
                    selectedRegion ? (
                        <RegionView 
                            selectedRegion={selectedRegion}
                            onBackToHandbook={() => { setSelectedRegion(null); setShowHandbook(true); }}
                            onTravelMode={() => setActiveView('travel')}
                            activeTravelPlan={activeTravelPlan}
                            loadFromHandbook={updateLocation}
                            handleGenerateBreach={handleGenerateBreach}
                            openCreationModal={(t) => { setCreationModal({type: t, isOpen: true}); setCreationData({name:'',type:'',description:''}); }}
                            handleGenerateLocation={handleGenerateLocation}
                            loading={loading} breachLoading={breachLoading}
                            getStatusStyle={(s) => LOCATION_STATUSES.find(st => st.id === s)?.color || ''}
                            getStatusLabel={(s) => LOCATION_STATUSES.find(st => st.id === s)?.label || ''}
                            genericLocations={GENERIC_LOCATIONS}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                            <MapPin className="w-16 h-16 opacity-20 mb-4" />
                            <p className="text-xl font-serif">Выберите регион из справочника.</p>
                            <p className="text-sm mt-2">Вы сможете выбрать известные локации или сгенерировать новые.</p>
                        </div>
                    )
                ) : activeView === 'travel' ? (
                    <TravelManager 
                        isOpen={true} onClose={() => setActiveView('details')}
                        currentLocation={location} currentRegion={selectedRegion}
                        allLore={lore} addLog={addLog} travelState={activeTravelPlan}
                        onTravelComplete={handleTravelComplete}
                        onUpdateTravelState={setActiveTravelPlan} onGenerateLocation={updateLocation}
                        onCancelTravel={() => setActiveTravelPlan(null)}
                    />
                ) : (
                    location && <LocationDetailView 
                        location={location} setLocation={setLocation}
                        onClose={handleNavigateBack}
                        onImageGenerated={onImageGenerated} onShowImage={onShowImage}
                        addLog={addLog} onSaveNote={onSaveNote}
                        onOpenDetailModal={openDetailModal}
                        onFightNpc={(npc) => { window.dispatchEvent(new CustomEvent('dmc-add-combatant', { detail: { name: npc.name, type: 'MONSTER', notes: npc.description, hp: 20, ac: 10, initiative: 10 } })); showToast(`${npc.name} в бою`, "warning"); }}
                        onSaveNpc={(npc) => { window.dispatchEvent(new CustomEvent('dmc-add-npc', { detail: { ...npc, location: location.name } })); showToast("NPC сохранен", "success"); }}
                        onTrackQuest={(q) => { window.dispatchEvent(new CustomEvent('dmc-add-quest', { detail: { title: q.title, description: q.description, giver: location.name } })); showToast("Квест отслеживается", "success"); }}
                        onCopyToLog={handleCopyToLog}
                        onGenerateNpcImage={handleGenerateNpcImage}
                        party={party}
                        getStatusStyle={(s) => LOCATION_STATUSES.find(st => st.id === s)?.color || ''}
                        LOCATION_STATUSES={LOCATION_STATUSES}
                        openBestiary={() => setShowBestiary(true)}
                        onAddMonsterSmart={handleAddMonsterSmart}
                        generatingMonster={generatingMonster}
                        hasParent={locationStack.length > 0}
                        parentName={locationStack.length > 0 ? locationStack[locationStack.length - 1].name : selectedRegion?.name || 'Справочник'}
                        onNavigateSubLocation={handleNavigateSubLocation}
                        onAddSubLocation={handleAddSubLocation}
                    />
                )}
            </div>
        </div>
    );
};

export default LocationTracker;
