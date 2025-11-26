
import React, { useState, useEffect } from 'react';
import { LocationData, PartyMember, Combatant, EntityType, LoreEntry, LocationTrackerProps, Note, SavedImage, TravelResult, CampaignNpc, FullQuest, TravelState } from '../types';
import { parseLoreFromText, generateEncounterIntro, generateScenarioDescription, generateFullLocation, generateLocationContent, generateExtendedDetails, generateMultiverseBreach, generateRealityGlitch, generateImage, generateNpc, generateQuest } from '../services/polzaService';
import { getMonstersByCr } from '../services/dndApiService';
import { MapPin, Users, Skull, Sparkles, BookOpen, Loader, Search, Eye, ChevronRight, ArrowRight, Menu, Map, Copy, Plus, Home, Trees, Tent, Castle, ArrowLeft, LandPlot, Landmark, Beer, Footprints, ShieldAlert, Ghost, Info, X, Save, FileText, RefreshCcw, ChevronDown, ChevronUp, Zap, Anchor, Globe, Hexagon, Activity, Radio, Flame, Image as ImageIcon, ZoomIn, Church, Building, Mountain, ScrollText, Swords, UserPlus, Pickaxe, Wheat, Ship, ShoppingBag, Gavel, Gem, Compass, UserSquare2, PenTool, Wand2 } from 'lucide-react';
import { FAERUN_LORE } from '../data/faerunLore';
import { useAudio } from '../contexts/AudioContext';
import SmartText from './SmartText';
import TravelManager from './TravelManager';

// Extended location types for the generator grid
const GENERIC_LOCATIONS = [
    { label: 'Деревня', icon: <Home className="w-6 h-6 text-green-500"/>, type: 'Небольшая деревня' },
    { label: 'Город', icon: <Landmark className="w-6 h-6 text-blue-400"/>, type: 'Крупный торговый город' },
    { label: 'Руины', icon: <Castle className="w-6 h-6 text-gray-400"/>, type: 'Древние руины' },
    { label: 'Лес', icon: <Trees className="w-6 h-6 text-emerald-500"/>, type: 'Лесная чаща' },
    { label: 'Таверна', icon: <Beer className="w-6 h-6 text-yellow-500"/>, type: 'Придорожная таверна' },
    { label: 'Пещера', icon: <Mountain className="w-6 h-6 text-stone-500"/>, type: 'Глубокая пещера' },
    { label: 'Лагерь', icon: <Tent className="w-6 h-6 text-orange-400"/>, type: 'Лагерь бандитов или наемников' },
    { label: 'Башня Мага', icon: <Zap className="w-6 h-6 text-purple-500"/>, type: 'Одинокая башня волшебника' },
    { label: 'Храм', icon: <Church className="w-6 h-6 text-gold-500"/>, type: 'Забытый храм' },
    { label: 'Подземелье', icon: <Skull className="w-6 h-6 text-red-500"/>, type: 'Опасное подземелье' },
    { label: 'Кладбище', icon: <Ghost className="w-6 h-6 text-gray-300"/>, type: 'Старое кладбище' },
    { label: 'Порт', icon: <Anchor className="w-6 h-6 text-blue-600"/>, type: 'Портовый док' },
    { label: 'Мост', icon: <LandPlot className="w-6 h-6 text-stone-400"/>, type: 'Переправа или мост' },
    { label: 'Оазис', icon: <Trees className="w-6 h-6 text-teal-400"/>, type: 'Оазис в пустоши' },
    { label: 'Крепость', icon: <ShieldAlert className="w-6 h-6 text-zinc-400"/>, type: 'Военный форпост' },
    { label: 'Шахта', icon: <Pickaxe className="w-6 h-6 text-stone-600"/>, type: 'Заброшенная шахта' },
    { label: 'Ферма', icon: <Wheat className="w-6 h-6 text-yellow-600"/>, type: 'Одинокая ферма' },
    { label: 'Корабль', icon: <Ship className="w-6 h-6 text-blue-500"/>, type: 'Корабль (или обломки)' },
    { label: 'Рынок', icon: <ShoppingBag className="w-6 h-6 text-orange-500"/>, type: 'Шумный рынок' },
    { label: 'Тюрьма', icon: <Gavel className="w-6 h-6 text-gray-500"/>, type: 'Темница или тюрьма' },
    { label: 'Портал', icon: <Globe className="w-6 h-6 text-purple-400"/>, type: 'Древний портал' },
    { label: 'Усадьба', icon: <Home className="w-6 h-6 text-indigo-400"/>, type: 'Богатое поместье' },
    { label: 'Сокровищница', icon: <Gem className="w-6 h-6 text-pink-500"/>, type: 'Тайная сокровищница' },
    { label: 'Библиотека', icon: <BookOpen className="w-6 h-6 text-amber-700"/>, type: 'Древняя библиотека' },
    { label: 'Арена', icon: <Swords className="w-6 h-6 text-red-600"/>, type: 'Бойцовская арена' },
];

const LocationTracker: React.FC<LocationTrackerProps> = ({ addLog, onSaveNote, onImageGenerated, onShowImage }) => {
    // Audio Context for automation
    const { playPlaylist } = useAudio();

    const [lore, setLore] = useState<LoreEntry[]>(() => {
        const savedLore = localStorage.getItem('dmc_lore');
        return savedLore ? JSON.parse(savedLore) : FAERUN_LORE;
    });
    
    // Global Tracker Data
    const [trackerNpcs, setTrackerNpcs] = useState<CampaignNpc[]>([]);
    const [trackerQuests, setTrackerQuests] = useState<FullQuest[]>([]);

    const [location, setLocation] = useState<LocationData | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<LoreEntry | null>(null);
    const [loreInput, setLoreInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [breachLoading, setBreachLoading] = useState(false); 
    const [generatingSection, setGeneratingSection] = useState<string | null>(null);
    const [party, setParty] = useState<PartyMember[]>([]);
    const [showLoreInput, setShowLoreInput] = useState(false);
    const [encounterLoading, setEncounterLoading] = useState(false);
    const [encounterIntro, setEncounterIntro] = useState('');
    const [showHandbook, setShowHandbook] = useState(true);
    const [handbookSearch, setHandbookSearch] = useState('');
    const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    const [showTravel, setShowTravel] = useState(false);
    
    // Travel State Persistence
    const [activeTravelPlan, setActiveTravelPlan] = useState<TravelState | null>(null);

    // Image Generation State
    const [locationImage, setLocationImage] = useState<SavedImage | null>(null);
    const [imageLoading, setImageLoading] = useState(false);

    // Modal State (Detail)
    const [modalOpen, setModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<string>('');
    const [modalTitle, setModalTitle] = useState('');
    const [modalCategory, setModalCategory] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    // Add Custom Entity Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addEntityType, setAddEntityType] = useState<'npc' | 'quest'>('npc');
    const [addEntityName, setAddEntityName] = useState('');
    const [addEntityDesc, setAddEntityDesc] = useState('');
    const [useAiGeneration, setUseAiGeneration] = useState(false);
    const [addLoading, setAddLoading] = useState(false);

    // --- INITIALIZATION & LISTENERS ---

    const loadTrackerData = () => {
        const savedNpcs = localStorage.getItem('dmc_npcs');
        if (savedNpcs) setTrackerNpcs(JSON.parse(savedNpcs));
        const savedQuests = localStorage.getItem('dmc_quests');
        if (savedQuests) setTrackerQuests(JSON.parse(savedQuests));
    };

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
        
        const savedTravel = localStorage.getItem('dmc_active_travel');
        if (savedTravel) setActiveTravelPlan(JSON.parse(savedTravel));

        loadTrackerData();

        // Listen for updates from other components
        const handleUpdateNpcs = () => loadTrackerData();
        const handleUpdateQuests = () => loadTrackerData();

        window.addEventListener('dmc-update-npcs', handleUpdateNpcs);
        window.addEventListener('dmc-update-quests', handleUpdateQuests);

        return () => {
            window.removeEventListener('dmc-update-npcs', handleUpdateNpcs);
            window.removeEventListener('dmc-update-quests', handleUpdateQuests);
        };
    }, []); 

    useEffect(() => {
        if (selectedRegion) {
            const updatedRegion = lore.find(r => r.id === selectedRegion.id);
            if (updatedRegion) setSelectedRegion(updatedRegion);
        }
    }, [lore]);

    useEffect(() => {
        if (location) {
            localStorage.setItem('dmc_active_location', JSON.stringify(location));
            setLocationImage(null); 
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

    useEffect(() => {
        if (activeTravelPlan) {
            localStorage.setItem('dmc_active_travel', JSON.stringify(activeTravelPlan));
        } else {
            localStorage.removeItem('dmc_active_travel');
        }
    }, [activeTravelPlan]);

    // --- DATA MERGING LOGIC ---

    const getMergedNpcs = () => {
        if (!location) return [];
        
        const activeNpcs = trackerNpcs.filter(n => n.location === location.name);
        const loreNpcs = location.npcs || [];
        
        // If name matches, use Tracker version (it's persistent/active)
        const merged = [
            ...activeNpcs.map(n => ({ ...n, source: 'tracker', original: n })),
            ...loreNpcs.filter(ln => !activeNpcs.some(an => an.name === ln.name)).map(n => ({ ...n, source: 'lore', original: n }))
        ];
        return merged;
    };

    const getMergedQuests = () => {
        if (!location) return [];

        const activeQuests = trackerQuests.filter(q => q.location === location.name || q.giver === location.name);
        const loreQuests = location.quests || [];

        // Quests usually don't duplicate names as often, but same logic applies
        const merged = [
            ...activeQuests.map(q => ({ 
                title: q.title, 
                description: q.summary || q.description, // Use summary for list view
                source: 'tracker',
                original: q
            })),
            ...loreQuests.filter(lq => !activeQuests.some(aq => aq.title === lq.title)).map(q => ({
                ...q,
                source: 'lore',
                original: q
            }))
        ];
        return merged;
    };

    // --- ACTION HANDLERS ---

    const setLocationAndLog = (loc: LocationData) => {
        setLocation(loc);
        setShowHandbook(false);
        setEncounterIntro('');
        
        addLog({
            id: Date.now().toString(),
            timestamp: Date.now(),
            text: `[Локация] ${loc.name}`, 
            type: 'story'
        });

        triggerLocationMusic(loc);
    };

    const handleTravelUpdate = (state: TravelState) => {
        setActiveTravelPlan(state);
    };

    const handleTravelComplete = (newLocation: LocationData, newRegionId?: string) => {
        if (newRegionId) {
            const newRegion = lore.find(r => r.id === newRegionId);
            if (newRegion) setSelectedRegion(newRegion);
        }
        setLocationAndLog(newLocation);
        setActiveTravelPlan(null);
    };

    const triggerLocationMusic = (loc: LocationData) => {
        const text = (loc.type + ' ' + loc.name + ' ' + loc.atmosphere).toLowerCase();
        let playlistId = 'atmosphere'; 

        if (loc.originWorld) playlistId = 'scifi';
        else if (text.includes('лес') || text.includes('роща') || text.includes('чаща') || text.includes('forest')) playlistId = 'forest';
        else if (text.includes('подземел') || text.includes('пещер') || text.includes('склеп') || text.includes('руины') || text.includes('dungeon')) playlistId = 'dungeon';
        else if (text.includes('таверна') || text.includes('трактир') || text.includes('inn') || text.includes('tavern')) playlistId = 'tavern';
        else if (text.includes('город') || text.includes('порт') || text.includes('столица') || text.includes('city')) playlistId = 'city';
        else if (text.includes('пустын') || text.includes('песк') || text.includes('восток') || text.includes('desert')) playlistId = 'eastern';

        playPlaylist(playlistId, true);
    };

    const handleOpenItem = (item: any) => {
        if (item.source === 'tracker') {
            const type = addEntityType === 'npc' ? 'npc' : 'quest'; // Just for type inference
            // Open global detail modal for tracker items
            const event = new CustomEvent('dmc-show-details', {
                detail: { type: item.original.race ? 'npc' : 'quest', id: item.original.name || item.original.title, title: item.original.name || item.original.title }
            });
            window.dispatchEvent(event);
        } else {
            // Open AI detail modal for lore items
            openDetailModal(item.original.race ? 'npc' : 'quest', item.original.name || item.original.title);
        }
    };

    const handleAddEntity = async () => {
        if (!location || !addEntityName) return;
        setAddLoading(true);

        try {
            if (addEntityType === 'npc') {
                let npcData: Partial<CampaignNpc> = {
                    name: addEntityName,
                    description: addEntityDesc,
                    location: location.name,
                    race: 'Гуманоид',
                    class: 'Обыватель',
                    status: 'alive',
                    attitude: 'neutral'
                };

                if (useAiGeneration) {
                    const aiResult = await generateNpc(addEntityName + " " + addEntityDesc);
                    npcData = { ...npcData, ...aiResult, location: location.name };
                }

                const event = new CustomEvent('dmc-add-npc', { detail: npcData });
                window.dispatchEvent(event);
            } else {
                let questData: Partial<FullQuest> = {
                    title: addEntityName,
                    description: addEntityDesc,
                    giver: location.name,
                    location: location.name,
                    summary: addEntityDesc,
                    status: 'active'
                };

                if (useAiGeneration) {
                    // Using generateQuest which returns HTML, parsing manually for now or using it as desc
                    const aiHtml = await generateQuest('3', addEntityName + ". " + addEntityDesc + ". Context: " + location.name);
                    questData.description = aiHtml;
                    questData.summary = "Сгенерировано AI";
                }

                const event = new CustomEvent('dmc-add-quest', { detail: questData });
                window.dispatchEvent(event);
            }
            
            setIsAddModalOpen(false);
            setAddEntityName('');
            setAddEntityDesc('');
        } catch (e: any) {
            alert("Ошибка добавления: " + e.message);
        } finally {
            setAddLoading(false);
        }
    };

    const handleFightNpc = (npc: any) => {
        const event = new CustomEvent('dmc-add-combatant', {
            detail: {
                name: npc.name,
                type: 'MONSTER',
                notes: `${npc.race || ''} ${npc.class || ''}. ${npc.description}`,
                hp: 20, ac: 12, initiative: 10
            }
        });
        window.dispatchEvent(event);
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `${npc.name} атакует! (Добавлен в бой)`, type: 'combat' });
    };

    const handleSaveNpcToTracker = (npc: any) => {
        const event = new CustomEvent('dmc-add-npc', {
            detail: {
                name: npc.name,
                race: npc.race,
                description: npc.description,
                personality: npc.personality,
                location: location?.name || 'Неизвестно',
                status: 'alive',
                attitude: 'neutral'
            }
        });
        window.dispatchEvent(event);
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `${npc.name} добавлен в NPC Трекер.`, type: 'system' });
    };

    const handleTrackQuest = (quest: any) => {
        const event = new CustomEvent('dmc-add-quest', { 
            detail: {
                title: quest.title,
                description: quest.description,
                giver: location?.name || 'Локация',
                location: location?.name
            } 
        });
        window.dispatchEvent(event);
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Квест "${quest.title}" добавлен в Трекер.`, type: 'system' });
    };

    // ... Existing Handlers ...
    const handleParseLore = async () => {
        if (!loreInput) return;
        setLoading(true);
        try {
            const data = await parseLoreFromText(loreInput);
            setLocationAndLog(data);
            setShowLoreInput(false);
            setLoreInput('');
        } catch (e: any) {
            alert(`Ошибка анализа: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const loadFromHandbook = (loc: LocationData) => {
        setLocationAndLog(loc);
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
            newLocation.id = Date.now().toString();
            setLocationAndLog(newLocation);
        } catch (e: any) {
            console.error(e);
            alert(`Не удалось сгенерировать локацию: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBreach = async () => {
        setBreachLoading(true); 
        try {
            const breach = await generateMultiverseBreach();
            breach.id = Date.now().toString();
            await new Promise(r => setTimeout(r, 1500));
            setLocationAndLog(breach);
            addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[КОВЧЕГ] ⚠️ ВНИМАНИЕ! Обнаружен разлом: ${breach.name}. Источник: ${breach.originWorld}.`, type: 'combat' });
        } catch (e: any) {
            alert(`Ошибка генерации разлома: ${e.message}. Попробуйте еще раз.`);
        } finally {
            setBreachLoading(false);
        }
    };

    const handleGenerateGlitch = async () => {
        if (!location) return;
        setLoading(true);
        try {
            const glitch = await generateRealityGlitch(location.name);
            setModalTitle(`Аномалия: ${glitch.name}`);
            setModalContent(`<p class="text-lg text-purple-300 font-bold border-l-4 border-purple-500 pl-4 py-2 bg-purple-900/20">${glitch.effect}</p>`);
            setModalCategory('glitch');
            setModalOpen(true);
            addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[АНОМАЛИЯ] ${glitch.name}: ${glitch.effect}`, type: 'combat' });
        } catch (e: any) {
            alert(`Ошибка: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLocationToHandbook = () => {
        if (!selectedRegion || !location) return;
        setLore(prevLore => {
            return prevLore.map(region => {
                if (region.id === selectedRegion.id) {
                    const existingIndex = region.locations.findIndex(l => (location.id && l.id === location.id) || l.name === location.name);
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
        if (!location.id) { setLocation(prev => prev ? ({...prev, id: Date.now().toString()}) : null); }
    };

    const handleGenerateContent = async (category: 'npc' | 'secret' | 'loot' | 'quest') => {
        if (!location) return;
        setGeneratingSection(category);
        try {
            const newItems = await generateLocationContent(location.name, category);
            setLocation(prev => {
                if (!prev) return null;
                const updated = { ...prev };
                if (category === 'npc') updated.npcs = [...(prev.npcs || []), ...newItems];
                if (category === 'secret') updated.secrets = [...(prev.secrets || []), ...newItems];
                if (category === 'loot') updated.loot = [...(prev.loot || []), ...newItems];
                if (category === 'quest') updated.quests = [...(prev.quests || []), ...newItems];
                return updated;
            });
        } catch (e: any) {
            console.error(e);
            alert(`Ошибка генерации контента: ${e.message}`);
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
        } catch (e: any) {
            console.error(e);
            alert(`Ошибка генерации описания: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    const generateEncounter = async () => {
        if (party.length === 0) { alert("Нет активных героев."); return; }
        setEncounterLoading(true);
        setEncounterIntro('');
        const avgLevel = party.reduce((sum, p) => sum + p.level, 0) / party.length;
        const minCr = Math.max(0, Math.floor(avgLevel / 4));
        const maxCr = Math.max(1, Math.ceil(avgLevel)); 
        const monsterTypeContext = location?.monsters && location.monsters.length > 0 ? location.monsters[Math.floor(Math.random() * location.monsters.length)] : undefined;
        try {
            const candidates = await getMonstersByCr(minCr, maxCr, monsterTypeContext);
            if (candidates.length === 0) { alert("Монстры не найдены (API)."); return; }
            const currentCombatants: Combatant[] = JSON.parse(localStorage.getItem('dmc_combatants') || '[]');
            const newMonsters: Combatant[] = candidates.map((m, i) => ({
                id: Date.now().toString() + i,
                name: m.name,
                type: EntityType.MONSTER,
                initiative: Math.floor(Math.random() * 20) + 1,
                hp: 10 + (avgLevel * 5), maxHp: 10 + (avgLevel * 5), ac: 10 + Math.floor(avgLevel / 2), conditions: [], notes: `CR ${avgLevel}`
            }));
            const intro = await generateEncounterIntro(candidates.map(c => c.name), location?.name || 'Местность');
            setEncounterIntro(intro);
            localStorage.setItem('dmc_combatants', JSON.stringify([...currentCombatants, ...newMonsters]));
            window.dispatchEvent(new Event('dmc-update-combat'));
        } catch (e: any) {
            console.error(e);
            alert(`Ошибка создания энкаунтера: ${e.message}`);
        } finally {
            setEncounterLoading(false);
        }
    };

    const handleCopyToLog = (category: string, text: string) => {
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[${category}] ${text}`, type: 'story' });
    };

    const handleSaveModalToJournal = () => {
        if (!location || !modalContent) return;
        const newNote: Note = {
            id: Date.now().toString(),
            title: `${modalCategory.toUpperCase()}: ${modalTitle}`,
            content: modalContent, 
            tags: [location.name, modalCategory, selectedRegion?.name || 'Unknown'],
            type: 'npc', 
            date: new Date().toISOString()
        };
        onSaveNote(newNote);
        setModalOpen(false);
    };

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
        } catch (e: any) {
            setModalContent(`<p class='text-red-400'>Ошибка: ${e.message}</p>`);
        } finally {
            setModalLoading(false);
        }
    };

    const handleGenerateLocationImage = async () => {
        if (!location) return;
        setImageLoading(true);
        try {
            const prompt = `Fantasy landscape: ${location.name}, ${location.type}. ${location.atmosphere}. ${location.description}. Cinematic lighting, highly detailed, digital art.`;
            const url = await generateImage(prompt, "16:9");
            const newImage: SavedImage = { id: Date.now().toString(), url: url, title: location.name, type: 'location', timestamp: Date.now() };
            setLocationImage(newImage);
            if (onImageGenerated) onImageGenerated(newImage);
        } catch (e: any) {
            alert("Ошибка генерации изображения: " + e.message);
        } finally {
            setImageLoading(false);
        }
    };

    const handleGenerateNpcImage = async (name: string, description: string) => {
        if (!confirm(`Сгенерировать портрет для ${name}? Это займет некоторое время.`)) return;
        try {
            const prompt = `Fantasy portrait of ${name}. ${description}. Detailed digital art style.`;
            const url = await generateImage(prompt, "1:1");
            const newImage: SavedImage = { id: Date.now().toString(), url: url, title: name, type: 'npc', timestamp: Date.now() };
            if (onImageGenerated) onImageGenerated(newImage);
            addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Портрет ${name} добавлен в галерею.`, type: 'system' });
        } catch(e: any) {
            alert("Ошибка: " + e.message);
        }
    };

    const handleSetGeneratedLocation = (newLocation: LocationData) => {
        setLocationAndLog(newLocation);
    };

    const filteredLore = lore.filter(region => 
        region.name.toLowerCase().includes(handbookSearch.toLowerCase()) ||
        region.locations.some(l => l.name.toLowerCase().includes(handbookSearch.toLowerCase()))
    );

    return (
        <div className="h-full flex gap-4 relative">
            
            <TravelManager 
                isOpen={showTravel}
                onClose={() => setShowTravel(false)}
                currentLocation={location}
                currentRegion={selectedRegion}
                allLore={lore}
                onTravelComplete={handleTravelComplete}
                addLog={addLog}
                travelState={activeTravelPlan}
                onUpdateTravelState={handleTravelUpdate}
                onGenerateLocation={handleSetGeneratedLocation}
                onCancelTravel={() => setActiveTravelPlan(null)}
            />

            {/* Add Custom Entity Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                                <PenTool className="w-5 h-5 text-gold-500"/> Добавить в локацию
                            </h3>
                            <button onClick={() => setIsAddModalOpen(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="flex bg-gray-800 rounded p-1">
                                <button onClick={() => setAddEntityType('npc')} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${addEntityType === 'npc' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>NPC</button>
                                <button onClick={() => setAddEntityType('quest')} className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${addEntityType === 'quest' ? 'bg-gray-700 text-white' : 'text-gray-400'}`}>Квест</button>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Название</label>
                                <input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" value={addEntityName} onChange={e => setAddEntityName(e.target.value)} autoFocus />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Описание / Ключевые слова</label>
                                <textarea className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white h-24 resize-none focus:border-gold-500 outline-none" value={addEntityDesc} onChange={e => setAddEntityDesc(e.target.value)} />
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={useAiGeneration} onChange={e => setUseAiGeneration(e.target.checked)} className="accent-gold-600" />
                                <span className="text-sm text-gray-300">Использовать AI для генерации деталей</span>
                            </label>
                        </div>
                        <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-2">
                            <button onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Отмена</button>
                            <button onClick={handleAddEntity} disabled={addLoading || !addEntityName} className="bg-gold-600 hover:bg-gold-500 text-black px-6 py-2 rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                                {addLoading ? <Loader className="w-4 h-4 animate-spin"/> : <Plus className="w-4 h-4"/>} Добавить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Handbook Sidebar */}
            <div className={`fixed xl:static inset-y-0 left-0 z-30 w-80 bg-gray-900 border-r border-gray-700 transform transition-transform duration-300 flex flex-col ${showHandbook ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0`}>
                {/* ... existing sidebar content ... */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-dnd-darker shrink-0">
                    <h2 className="font-serif font-bold text-gold-500 flex items-center gap-2">
                        <BookOpen className="w-5 h-5"/> Справочник
                    </h2>
                    <button onClick={() => setShowHandbook(false)} className="xl:hidden text-gray-400"><ArrowRight /></button>
                </div>
                
                <div className="p-2 shrink-0">
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

                <div className="p-2 border-t border-gray-700 shrink-0">
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
                
                {!showHandbook && (
                    <button 
                        onClick={() => setShowHandbook(true)}
                        className="xl:hidden absolute top-2 left-2 z-10 bg-gray-800 p-2 rounded border border-gray-600 text-white shadow-lg opacity-80 hover:opacity-100"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}

                {/* Detail Modal */}
                {modalOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                        <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-2xl max-h-[80vh] rounded-lg shadow-2xl flex flex-col relative overflow-hidden" onClick={e => e.stopPropagation()}>
                            <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                                <h3 className="text-xl font-serif font-bold text-gold-500">{modalTitle}</h3>
                                <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 custom-scrollbar">
                                {modalLoading ? (
                                    <div className="flex flex-col items-center justify-center h-40 text-gold-500 gap-3">
                                        <Loader className="w-8 h-8 animate-spin" />
                                        <span className="text-sm font-mono">Мастер размышляет...</span>
                                    </div>
                                ) : (
                                    <div className="text-sm text-gray-300 [&_h1]:text-gold-500 [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-gold-500 [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-gold-500 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3:first-child]:mt-0 [&_h4]:text-gold-400 [&_h4]:font-bold [&_h4]:mb-2 [&_strong]:text-white [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_p]:mb-3" dangerouslySetInnerHTML={{__html: modalContent}} />
                                )}
                            </div>
                            <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-between shrink-0">
                                {modalCategory && !modalLoading && !modalContent.includes('Ошибка') && (
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
                                        disabled={modalLoading || modalContent.includes('Ошибка')}
                                        className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FileText className="w-4 h-4" /> Сохранить в Журнал
                                    </button>
                                    <button 
                                        onClick={() => {
                                            addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Мастер изучает детали: ${modalTitle}`, type: 'system' });
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
                        <div className="flex-1 overflow-y-auto p-6 animate-in fade-in relative custom-scrollbar">
                            {/* ... region content ... */}
                            <button 
                                onClick={() => { setSelectedRegion(null); setShowHandbook(true); }}
                                className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 px-3 py-2 rounded-full transition-colors text-sm"
                            >
                                <ArrowLeft className="w-4 h-4" /> Справочник
                            </button>

                            <div className="max-w-4xl mx-auto mt-8 pb-20">
                                {/* ... same region details ... */}
                                <div className="border-b border-gray-700 pb-4 mb-6">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-end gap-4">
                                            <h1 className="text-4xl font-serif font-bold text-gold-500">{selectedRegion.name}</h1>
                                            {selectedRegion.capital && <span className="text-gray-400 text-sm pb-2">Столица: {selectedRegion.capital}</span>}
                                        </div>
                                        <button 
                                            onClick={() => setShowTravel(true)}
                                            className={`bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 border border-gray-600 ${activeTravelPlan ? 'animate-pulse border-gold-500 text-gold-500' : ''}`}
                                        >
                                            <Compass className="w-5 h-5"/> {activeTravelPlan ? 'Продолжить путь' : 'Путешествие'}
                                        </button>
                                    </div>
                                    <SmartText content={selectedRegion.description} className="text-lg text-gray-300 italic leading-relaxed" />
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

                                    {/* Project Ark Generators */}
                                    <section className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg">
                                        <h3 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2">
                                            <Hexagon className="w-5 h-5 text-indigo-400"/> Проект «Ковчег»
                                        </h3>
                                        <div className="flex flex-col sm:flex-row gap-3">
                                             <button 
                                                disabled={loading || breachLoading}
                                                onClick={handleGenerateBreach}
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/50 group"
                                            >
                                                <Globe className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"/>
                                                <div>
                                                    <div className="font-bold text-lg">Вызвать Разлом</div>
                                                    <div className="text-xs opacity-80 font-normal">Слияние Мультивселенных</div>
                                                </div>
                                            </button>
                                        </div>
                                    </section>

                                    {/* Standard Generators */}
                                    <section>
                                        <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-purple-400"/> Обычные локации (AI)
                                        </h3>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                                            {GENERIC_LOCATIONS.map((loc, i) => (
                                                <button 
                                                    key={i}
                                                    disabled={loading}
                                                    onClick={() => handleGenerateLocation(loc.type)}
                                                    className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors disabled:opacity-50 text-sm group"
                                                >
                                                    <div className="group-hover:scale-110 transition-transform duration-200">{loc.icon}</div>
                                                    <span className="font-bold text-center">{loc.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {loading && (
                                            <div className="mt-4 text-center text-gold-500 animate-pulse flex items-center justify-center gap-2">
                                                <Loader className="animate-spin w-5 h-5"/> Создаем локацию в {selectedRegion.name}...
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
                    <div className="flex-1 overflow-y-auto h-full animate-in fade-in custom-scrollbar p-4 space-y-4 pb-20">
                        {/* ... location header ... */}
                        <div className={`px-4 py-3 rounded-lg border shrink-0 shadow-md ${location.originWorld ? 'bg-indigo-950/30 border-indigo-500' : 'bg-dnd-card border-gray-700'}`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <h1 className="text-2xl font-serif font-bold text-gold-500 truncate">{location.name}</h1>
                                    {location.originWorld ? (
                                        <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded border border-indigo-400 hidden sm:inline-block shrink-0 animate-pulse">
                                            Разлом: {location.originWorld}
                                        </span>
                                    ) : (
                                        <span className="bg-gray-800 text-gray-400 text-xs px-2 py-0.5 rounded border border-gray-700 hidden sm:inline-block shrink-0">{location.type || 'Локация'}</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button 
                                        onClick={() => setShowTravel(true)}
                                        className={`text-gold-500 hover:text-white p-2 bg-gray-800 rounded-full ${activeTravelPlan ? 'animate-pulse border border-gold-500' : ''}`}
                                        title={activeTravelPlan ? "Продолжить путешествие" : "Отправиться в путь"}
                                    >
                                        <Compass className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={handleGenerateLocationImage}
                                        disabled={imageLoading}
                                        className="text-gold-500 hover:text-white p-2 bg-gray-800 rounded-full"
                                        title="Визуализировать локацию"
                                    >
                                        {imageLoading ? <Loader className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4"/>}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setLocation(null);
                                        }}
                                        className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full"
                                    >
                                        <Map className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={handleSaveLocationToHandbook}
                                        className="text-green-400 hover:text-white p-2 bg-gray-800 rounded-full"
                                        title="Сохранить"
                                    >
                                        <Save className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* ... image preview ... */}
                            {locationImage && (
                                <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden mb-4 relative group border border-gray-600 shadow-lg animate-in fade-in zoom-in duration-300">
                                    <img src={locationImage.url} alt={location.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                    
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                                        <a href={locationImage.url} target="_blank" rel="noopener noreferrer" className="bg-black/50 p-2 rounded text-white hover:bg-black/80">
                                            <ZoomIn className="w-5 h-5" />
                                        </a>
                                        {onShowImage && (
                                            <button 
                                                onClick={() => onShowImage(locationImage)}
                                                className="bg-gold-600 text-black px-3 py-2 rounded font-bold flex items-center gap-2 hover:bg-white"
                                            >
                                                <Eye className="w-5 h-5" /> Показать игрокам
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ... description & buttons ... */}
                            <div className="flex gap-2 items-start text-xs sm:text-sm text-gray-400 relative">
                                <div className={`flex-1 border-l-2 pl-2 transition-all duration-300 ${descriptionExpanded ? '' : 'line-clamp-2'} ${location.originWorld ? 'border-indigo-500 text-indigo-200' : 'border-gold-600'}`}>
                                    <SmartText content={`<span class="italic">${location.atmosphere}</span> <span class="not-italic text-gray-500">— ${location.description}</span>`} />
                                </div>
                                <button onClick={() => setDescriptionExpanded(!descriptionExpanded)} className="p-1 text-gray-500 hover:text-white">
                                    {descriptionExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                </button>
                            </div>

                            {(location.anomalyEffect || location.anchor) && (
                                <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                    {location.anomalyEffect && (
                                        <div className="bg-purple-900/30 border border-purple-600/50 p-2 rounded flex items-start gap-2">
                                            <Zap className="w-4 h-4 text-purple-400 shrink-0"/>
                                            <SmartText content={location.anomalyEffect} className="text-purple-200 font-bold" />
                                        </div>
                                    )}
                                    {location.anchor && (
                                        <div className="bg-blue-900/30 border border-blue-600/50 p-2 rounded flex items-start gap-2">
                                            <Anchor className="w-4 h-4 text-blue-400 shrink-0"/>
                                            <span className="text-blue-200">Якорь: {location.anchor}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 mt-3">
                                <button 
                                    onClick={generateAtmosphere}
                                    className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded border border-gray-600 text-xs flex justify-center items-center gap-2"
                                >
                                    <Eye className="w-3 h-3" /> Описать
                                </button>
                                <button 
                                    onClick={handleGenerateGlitch}
                                    className="bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700 py-2 rounded text-xs flex justify-center items-center gap-2 font-bold"
                                    title="Создать временную аномалию"
                                >
                                    {loading ? <Loader className="w-3 h-3 animate-spin"/> : <Zap className="w-3 h-3"/>}
                                    Аномалия
                                </button>
                                <button 
                                    onClick={generateEncounter}
                                    disabled={encounterLoading}
                                    className="bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700 py-2 rounded text-xs flex justify-center items-center gap-2 font-bold transition-colors disabled:opacity-50"
                                >
                                    {encounterLoading ? <Loader className="animate-spin w-3 h-3"/> : <Skull className="w-3 h-3" />}
                                    Энкаунтер
                                </button>
                            </div>
                        </div>

                        {encounterIntro && (
                            <div className="bg-red-950/40 border-l-4 border-red-600 p-4 rounded-r-lg animate-in fade-in slide-in-from-top-2 shrink-0 max-h-40 overflow-y-auto">
                                <h4 className="text-red-400 text-xs uppercase tracking-widest mb-1 font-bold flex items-center gap-2">
                                    <Sparkles className="w-3 h-3"/> Нарратор
                                </h4>
                                <p className="text-gray-200 font-serif leading-relaxed text-sm">{encounterIntro}</p>
                            </div>
                        )}

                        {location.breachEvent && (
                            <div className="bg-orange-900/20 border border-orange-500/50 rounded-lg p-4 animate-in fade-in shrink-0">
                                <div className="flex items-center gap-2 mb-2">
                                    <Flame className="w-5 h-5 text-orange-500 animate-pulse"/>
                                    <h3 className="font-bold text-orange-300 uppercase tracking-wider text-sm">Активное событие: {location.breachEvent.title}</h3>
                                </div>
                                <p className="text-sm text-gray-300 mb-2 italic">{location.breachEvent.description}</p>
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {location.breachEvent.threats?.map((threat, i) => (
                                        <span key={i} className="text-xs bg-red-900/40 text-red-300 px-2 py-0.5 rounded border border-red-800">{threat}</span>
                                    ))}
                                </div>
                                <div className="bg-gray-900/50 p-2 rounded border-l-2 border-orange-500 text-xs text-gray-400">
                                    <span className="font-bold text-orange-400">Цель:</span> {location.breachEvent.goal}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                            {/* NPCs */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center border-b border-gray-700 pb-1 sticky top-0 bg-dnd-dark z-10 pt-2">
                                    <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2">
                                        <Users className="w-4 h-4"/> Обитатели
                                    </h3>
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => { setAddEntityType('npc'); setIsAddModalOpen(true); }}
                                            className="text-xs bg-green-800 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3"/> Свой
                                        </button>
                                        <button 
                                            onClick={() => handleGenerateContent('npc')}
                                            disabled={!!generatingSection}
                                            className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {generatingSection === 'npc' ? <Loader className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>} AI
                                        </button>
                                    </div>
                                </div>

                                {(getMergedNpcs()).length === 0 && <p className="text-gray-600 text-sm italic">Нет важных NPC.</p>}
                                {getMergedNpcs().map((item, i) => {
                                    const npc = item.original as CampaignNpc; // Casting for safety
                                    return (
                                        <div 
                                            key={i} 
                                            onClick={() => handleOpenItem(item)}
                                            className={`p-3 rounded border transition-colors group relative cursor-pointer hover:bg-gray-800/80 ${item.source === 'tracker' ? 'bg-indigo-950/20 border-indigo-500/50' : 'bg-gray-800/50 border-gray-700'}`}
                                        >
                                            <div className="flex justify-between pr-24">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-bold ${item.source === 'tracker' ? 'text-indigo-300' : 'text-gold-500'}`}>{npc.name}</span>
                                                    {item.source === 'tracker' && <UserSquare2 className="w-3 h-3 text-indigo-400" title="В базе NPC"/>}
                                                </div>
                                                <span className="text-xs text-gray-500">{npc.race} {npc.class}</span>
                                            </div>
                                            <SmartText content={npc.description} className="text-sm text-gray-300 mt-1 block line-clamp-2" />
                                            {npc.personality && <p className="text-xs text-gray-500 mt-1 italic line-clamp-1">"{npc.personality}"</p>}
                                            
                                            <div className="absolute top-2 right-2 flex gap-1" onClick={e => e.stopPropagation()}>
                                                {item.source === 'lore' && (
                                                    <button 
                                                        onClick={() => handleSaveNpcToTracker(npc)}
                                                        className="p-1.5 bg-indigo-900/50 text-indigo-200 rounded hover:bg-indigo-800 border border-indigo-800"
                                                        title="В базу (Сохранить NPC)"
                                                    >
                                                        <UserPlus className="w-3 h-3" />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => handleFightNpc(npc)}
                                                    className="p-1.5 bg-red-900/80 text-red-200 rounded hover:bg-red-800 border border-red-800"
                                                    title="Атаковать (В инициативу)"
                                                >
                                                    <Swords className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => handleGenerateNpcImage(npc.name, npc.description)}
                                                    className="p-1.5 bg-purple-900 text-purple-200 rounded hover:bg-purple-800"
                                                    title="Нарисовать"
                                                >
                                                    <ImageIcon className="w-3 h-3" />
                                                </button>
                                                <button 
                                                    onClick={() => handleCopyToLog('NPC', `${npc.name} (${npc.race}): ${npc.description}`)}
                                                    className="p-1.5 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 hover:text-white"
                                                    title="Копировать в лог"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Secrets & Loot & Quests */}
                            <div className="space-y-4">
                                {/* ... Quest Section ... */}
                                <div>
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2 sticky top-0 bg-dnd-dark z-10 pt-2">
                                        <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2">
                                            <Sparkles className="w-4 h-4"/> Квесты
                                        </h3>
                                        <div className="flex gap-1">
                                            <button 
                                                onClick={() => { setAddEntityType('quest'); setIsAddModalOpen(true); }}
                                                className="text-xs bg-green-800 hover:bg-green-700 text-white px-2 py-1 rounded flex items-center gap-1"
                                            >
                                                <Plus className="w-3 h-3"/> Свой
                                            </button>
                                            <button 
                                                onClick={() => handleGenerateContent('quest')}
                                                disabled={!!generatingSection}
                                                className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                            >
                                                {generatingSection === 'quest' ? <Loader className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>} AI
                                            </button>
                                        </div>
                                    </div>
                                    {getMergedQuests().length === 0 && <p className="text-gray-600 text-sm italic">Нет квестов.</p>}
                                    <ul className="space-y-2">
                                        {getMergedQuests().map((item, i) => {
                                            const q = item.original;
                                            return (
                                                <li key={i} className={`text-sm p-2 rounded border group relative pr-20 cursor-pointer hover:bg-gray-800/80 ${item.source === 'tracker' ? 'bg-indigo-950/20 border-indigo-500/50' : 'bg-indigo-900/20 border-indigo-900/40'}`} onClick={() => handleOpenItem(item)}>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`font-bold ${item.source === 'tracker' ? 'text-green-400' : 'text-indigo-300'}`}>{q.title}</div>
                                                        {item.source === 'tracker' && <ScrollText className="w-3 h-3 text-green-500" title="В трекере"/>}
                                                    </div>
                                                    <SmartText content={item.description} className="text-gray-400 line-clamp-2" />
                                                    <div className="absolute top-2 right-2 flex gap-1" onClick={e => e.stopPropagation()}>
                                                        {item.source === 'lore' && (
                                                            <button 
                                                                onClick={() => handleTrackQuest(q)}
                                                                className="p-1.5 bg-green-900/80 text-green-200 rounded hover:bg-green-800 border border-green-800"
                                                                title="Взять квест"
                                                            >
                                                                <ScrollText className="w-3 h-3" />
                                                                <Plus className="w-2 h-2 absolute top-0 right-0 -mr-1 -mt-1 bg-green-500 rounded-full text-black"/>
                                                            </button>
                                                        )}
                                                        <button 
                                                            onClick={() => handleCopyToLog('Квест', `${q.title}: ${item.description}`)}
                                                            className="p-1.5 bg-indigo-900 text-indigo-200 rounded hover:bg-indigo-800"
                                                            title="Копировать в лог"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>

                                {/* ... Secret Section ... */}
                                <div>
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2 sticky top-0 bg-dnd-dark z-10">
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
                                        {(location.secrets || []).map((s, i) => (
                                            <li key={i} className="group flex justify-between items-start py-1 hover:bg-gray-800/50 rounded px-2 -ml-2 transition-colors">
                                                <SmartText content={s} />
                                                <div className="flex gap-1 ml-2">
                                                    <button 
                                                        onClick={() => openDetailModal('secret', s)}
                                                        className="p-1 text-blue-400 hover:text-blue-300"
                                                        title="Подробнее"
                                                    >
                                                        <Info className="w-3 h-3" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleCopyToLog('Тайна', s)}
                                                        className="p-1 text-gray-500 hover:text-white"
                                                        title="Копировать в лог"
                                                    >
                                                        <Copy className="w-3 h-3" />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                        {(location.secrets || []).length === 0 && <li className="text-gray-600 italic list-none">Нет тайн.</li>}
                                    </ul>
                                </div>

                                {/* ... Loot Section ... */}
                                <div>
                                    <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2 sticky top-0 bg-dnd-dark z-10">
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
                                        {(location.loot || []).map((l, i) => (
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
                                        {(location.loot || []).length === 0 && <span className="text-gray-600 italic text-sm">Пусто.</span>}
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
