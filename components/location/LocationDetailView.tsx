
import React, { useState, useEffect } from 'react';
import { MapPin, X, Save, Eye, Map, ImageIcon, Loader, Zap, Skull, ShieldAlert, PackagePlus, Users, Sparkles, Plus, Feather, ScrollText, Anchor, ChevronDown, ChevronUp, Swords, BookOpen, UserPlus, Upload, Building, ArrowRight, ArrowLeft } from 'lucide-react';
import { LocationData, SavedImage, Note, CampaignNpc, FullQuest, Tab, EntityType, TrackedItem } from '../../types';
import SmartText from '../SmartText';
import LootInteraction from '../LootInteraction';
import LocationLootModal from './LocationLootModal';
import { generateImage, generateScenarioDescription, generateRealityGlitch, generateLocationContent, generateExtendedDetails, generateEncounterIntro, generateMonster, generateSubLocation } from '../../services/polzaService';
import { getMonstersByCr, getMonsterDetails } from '../../services/dndApiService';
import { useToast } from '../../contexts/ToastContext';
import { useAudio } from '../../contexts/AudioContext';

interface LocationDetailViewProps {
    location: LocationData;
    setLocation: (l: LocationData | null) => void;
    onClose: () => void;
    onImageGenerated?: (i: SavedImage) => void;
    onShowImage?: (i: SavedImage) => void;
    addLog: (e: any) => void;
    onSaveNote: (n: Note) => void;
    onOpenDetailModal: (category: string, name: string) => void;
    onFightNpc: (npc: any) => void;
    onSaveNpc: (npc: any) => void;
    onTrackQuest: (quest: any) => void;
    onCopyToLog: (cat: string, text: string) => void;
    onGenerateNpcImage: (name: string, desc: string) => void;
    party: any[];
    getStatusStyle: (s?: string) => string;
    LOCATION_STATUSES: any[];
    openBestiary: () => void;
    onAddMonsterSmart: (name: string) => void;
    generatingMonster: string | null;
    hasParent?: boolean;
    parentName?: string;
    onNavigateSubLocation?: (loc: LocationData) => void;
    onAddSubLocation?: (loc: LocationData) => void;
}

const LocationDetailView: React.FC<LocationDetailViewProps> = ({
    location, setLocation, onClose, onImageGenerated, onShowImage, addLog, onSaveNote,
    onOpenDetailModal, onFightNpc, onSaveNpc, onTrackQuest, onCopyToLog, onGenerateNpcImage,
    party, getStatusStyle, LOCATION_STATUSES, openBestiary, onAddMonsterSmart, generatingMonster,
    hasParent, parentName, onNavigateSubLocation, onAddSubLocation
}) => {
    const [imageLoading, setImageLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [encounterLoading, setEncounterLoading] = useState(false);
    const [genText, setGenText] = useState('');
    const [genSection, setGenSection] = useState<string | null>(null);
    const [descriptionExpanded, setDescriptionExpanded] = useState(false);
    
    // Sub-location generation state
    const [showAddSubLocModal, setShowAddSubLocModal] = useState(false);
    const [subLocName, setSubLocName] = useState('');
    const [subLocLoading, setSubLocLoading] = useState(false);
    
    // Loot Modal
    const [showLootModal, setShowLootModal] = useState(false);
    const [locationItems, setLocationItems] = useState<TrackedItem[]>([]);

    const { showToast } = useToast();
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    
    // Load linked equipment
    useEffect(() => {
        const loadItems = () => {
             const allItems: TrackedItem[] = JSON.parse(localStorage.getItem('dmc_equipment') || '[]');
             const relevant = allItems.filter(i => i.status === 'location' && i.ownerId === location.id);
             setLocationItems(relevant);
        };
        loadItems();
        window.addEventListener('dmc-update-equipment', loadItems);
        return () => window.removeEventListener('dmc-update-equipment', loadItems);
    }, [location.id]);

    const handleGenImage = async () => {
        setImageLoading(true);
        try {
            const shortDesc = location.description.substring(0, 250);
            const prompt = `Fantasy landscape: ${location.name}, ${location.type}. ${location.atmosphere}. ${shortDesc}. Cinematic lighting, highly detailed, digital art.`;
            const url = await generateImage(prompt, "16:9");
            const newLoc = {...location, imageUrl: url};
            setLocation(newLoc);
            if (onImageGenerated) onImageGenerated({ id: Date.now().toString(), url, title: location.name, type: 'location', timestamp: Date.now() });
        } catch (e: any) { alert(e.message); } finally { setImageLoading(false); }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { showToast("Файл слишком большой", "error"); return; }
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const newLoc = { ...location, imageUrl: result };
            setLocation(newLoc);
            if (onImageGenerated) onImageGenerated({ id: Date.now().toString(), url: result, title: location.name, type: 'location', timestamp: Date.now() });
        };
        reader.readAsDataURL(file);
    };

    const handleGenAtmosphere = async () => {
        setLoading(true);
        try {
            const text = await generateScenarioDescription(location.name + ". " + location.atmosphere);
            setGenText(text);
        } catch (e: any) { alert(e.message); } finally { setLoading(false); }
    };

    const handleGenContent = async (cat: 'npc' | 'secret' | 'loot' | 'quest') => {
        setGenSection(cat);
        try {
            const items = await generateLocationContent(location.name, cat);
            const updated = { ...location };
            if (cat === 'npc') updated.npcs = [...(location.npcs || []), ...items];
            if (cat === 'secret') updated.secrets = [...(location.secrets || []), ...items];
            if (cat === 'loot') updated.loot = [...(location.loot || []), ...items];
            if (cat === 'quest') updated.quests = [...(location.quests || []), ...items];
            setLocation(updated);
        } catch (e: any) { alert(e.message); } finally { setGenSection(null); }
    };

    const generateEncounter = async () => {
        if (party.length === 0) { alert("Нет активных героев."); return; }
        setEncounterLoading(true);
        setGenText('');
        const avgLevel = party.reduce((sum, p) => sum + p.level, 0) / party.length;
        const minCr = Math.max(0, Math.floor(avgLevel / 4));
        const maxCr = Math.max(1, Math.ceil(avgLevel)); 
        const monsterTypeContext = location?.monsters && location.monsters.length > 0 ? location.monsters[Math.floor(Math.random() * location.monsters.length)] : undefined;
        try {
            const candidates = await getMonstersByCr(minCr, maxCr, monsterTypeContext);
            if (candidates.length === 0) { alert("Монстры не найдены (API)."); return; }
            
            const intro = await generateEncounterIntro(candidates.map(c => c.name), location?.name || 'Местность');
            setGenText(intro);

            for (const c of candidates) {
                const details = await getMonsterDetails(c.index);
                const acValue = typeof details.armor_class === 'number' ? details.armor_class : (details.armor_class as any)[0]?.value || 10;
                
                const event = new CustomEvent('dmc-add-combatant', {
                    detail: {
                        name: details.name,
                        type: 'MONSTER',
                        monsterType: details.type,
                        hp: details.hit_points,
                        ac: acValue,
                        cr: details.challenge_rating,
                        xp: details.xp,
                        initiative: Math.floor(Math.random() * 20) + 1 + Math.floor((details.dexterity - 10) / 2),
                        notes: `Источник: Глава SRD. ${location?.name || ''}`,
                        stats: { str: details.strength, dex: details.dexterity, con: details.constitution, int: details.intelligence, wis: details.wisdom, cha: details.charisma },
                        actions: details.actions?.map((a: any) => `<b>${a.name}:</b> ${a.desc}`) || []
                    }
                });
                window.dispatchEvent(event);
            }
        } catch (e: any) { console.error(e); alert(`Ошибка: ${e.message}`); } finally { setEncounterLoading(false); }
    };

    const handleGenerateGlitch = async () => {
        setLoading(true);
        try {
            const glitch = await generateRealityGlitch(location.name);
            onOpenDetailModal('glitch', `Аномалия: ${glitch.name}`); 
            setGenText(`[АНОМАЛИЯ] ${glitch.name}: ${glitch.effect}`);
        } catch (e: any) { alert(e.message); } finally { setLoading(false); }
    };

    const handleAiGenerateSubLocation = async () => {
        if (!subLocName) { showToast("Введите название или идею", "warning"); return; }
        setSubLocLoading(true);
        try {
            const newSubLoc = await generateSubLocation(location.name, subLocName);
            newSubLoc.id = Date.now().toString(); // Ensure ID
            onAddSubLocation?.(newSubLoc);
            setSubLocName('');
            setShowAddSubLocModal(false);
        } catch (e: any) {
            showToast(e.message, "error");
        } finally {
            setSubLocLoading(false);
        }
    };

    const handleManualAddSubLocation = () => {
        if (!subLocName) { showToast("Введите название", "warning"); return; }
        const newSubLoc: LocationData = {
            id: Date.now().toString(),
            name: subLocName,
            type: "Место",
            description: "Новая локация.",
            atmosphere: "Спокойная.",
            npcs: [], quests: [], loot: [], secrets: [], monsters: []
        };
        onAddSubLocation?.(newSubLoc);
        setSubLocName('');
        setShowAddSubLocModal(false);
    };

    const updateStatus = (val: string) => setLocation({ ...location, status: val });

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
             
             {/* Sub-location Modal */}
             {showAddSubLocModal && (
                <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl overflow-hidden">
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-serif font-bold text-white">Добавить место</h3>
                            <button onClick={() => setShowAddSubLocModal(false)}><X className="w-5 h-5 text-gray-400"/></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Название или Идея</label>
                                <textarea 
                                    className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none resize-none h-24"
                                    placeholder="Напр. 'Таверна Старый Башмак' или 'Секретная комната с алтарем'..."
                                    value={subLocName} 
                                    onChange={e => setSubLocName(e.target.value)}
                                    autoFocus
                                />
                            </div>
                            <div className="text-xs text-gray-500 italic">
                                AI создаст описание, атмосферу, NPC и секреты на основе вашего запроса.
                            </div>
                        </div>
                        <div className="p-4 border-t border-gray-700 bg-gray-900 flex gap-2">
                             <button 
                                onClick={handleManualAddSubLocation} 
                                className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded font-bold text-sm"
                             >
                                 Пустая
                             </button>
                             <button 
                                onClick={handleAiGenerateSubLocation} 
                                disabled={subLocLoading || !subLocName}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                             >
                                 {subLocLoading ? <Loader className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} 
                                 AI Генерация
                             </button>
                        </div>
                    </div>
                </div>
            )}

            <LocationLootModal 
                isOpen={showLootModal} 
                onClose={() => setShowLootModal(false)} 
                location={location} 
                setLocation={setLocation} 
                trackedLoot={locationItems} 
            />

            {/* Top Navigation Bar for clearer hierarchy */}
            <div className="bg-gray-900 border-b border-gray-700 px-4 py-2 flex items-center gap-2 shrink-0">
                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 text-gold-500 hover:text-white transition-colors text-sm font-bold uppercase tracking-wider"
                >
                    <ArrowLeft className="w-4 h-4"/> 
                    {hasParent ? `Назад: ${parentName}` : `К Региону: ${parentName || 'Карта'}`}
                </button>
                {hasParent && <div className="text-gray-600 text-xs px-2">/</div>}
                <div className="text-gray-400 text-xs truncate max-w-[200px]">{location.name}</div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar pb-20">
                {/* Header Card */}
                <div className={`px-4 py-3 rounded-lg border shrink-0 shadow-md ${location.originWorld ? 'bg-indigo-950/30 border-indigo-500' : 'bg-dnd-card border-gray-700'}`}>
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <h1 className="text-2xl font-serif font-bold text-gold-500 truncate">{location.name}</h1>
                            <select 
                                className={`text-xs px-2 py-0.5 rounded border font-bold uppercase outline-none cursor-pointer appearance-none ${getStatusStyle(location.status || 'peaceful')}`}
                                value={location.status || 'peaceful'}
                                onChange={(e) => updateStatus(e.target.value)}
                            >
                                {LOCATION_STATUSES.map(s => <option key={s.id} value={s.id} className="bg-gray-800 text-gray-300 normal-case font-normal">{s.label}</option>)}
                            </select>
                            {location.originWorld && <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded border border-indigo-400 hidden sm:inline-block shrink-0 animate-pulse">Разлом: {location.originWorld}</span>}
                            <button onClick={() => addLog({id: Date.now().toString(), timestamp: Date.now(), text: `[Локация] Прибытие в ${location.name}.`, type: 'story'})} className="text-gray-500 hover:text-green-400"><Feather className="w-4 h-4"/></button>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                            <button onClick={() => fileInputRef.current?.click()} className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full" title="Загрузить"><Upload className="w-4 h-4"/></button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                            <button onClick={handleGenImage} disabled={imageLoading} className="text-gold-500 hover:text-white p-2 bg-gray-800 rounded-full" title="AI Арт">
                                {imageLoading ? <Loader className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4"/>}
                            </button>
                            <button onClick={() => { onSaveNote({id: Date.now().toString(), title: location.name, content: JSON.stringify(location), tags:['location'], type:'location', date: new Date().toISOString()}); showToast("Сохранено в заметки", "success"); }} className="text-green-400 hover:text-white p-2 bg-gray-800 rounded-full"><Save className="w-4 h-4" /></button>
                        </div>
                    </div>

                    {location.imageUrl && (
                        <div className="w-full h-64 md:h-80 rounded-lg overflow-hidden mb-4 relative group border border-gray-600 shadow-lg">
                            <img src={location.imageUrl} alt={location.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                                <button onClick={() => onShowImage?.({id:'t', url: location.imageUrl!, title: location.name, type: 'location', timestamp: 0})} className="bg-gold-600 text-black px-3 py-2 rounded font-bold flex items-center gap-2"><Eye className="w-4 h-4"/> Показать</button>
                            </div>
                        </div>
                    )}

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
                            {location.anomalyEffect && <div className="bg-purple-900/30 border border-purple-600/50 p-2 rounded flex items-start gap-2"><Zap className="w-4 h-4 text-purple-400 shrink-0"/><SmartText content={location.anomalyEffect} className="text-purple-200 font-bold" /></div>}
                            {location.anchor && <div className="bg-blue-900/30 border border-blue-600/50 p-2 rounded flex items-start gap-2"><Anchor className="w-4 h-4 text-blue-400 shrink-0"/><span className="text-blue-200">Якорь: {location.anchor}</span></div>}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mt-3">
                        <button onClick={handleGenAtmosphere} className="bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded border border-gray-600 text-xs flex justify-center items-center gap-2"><Eye className="w-3 h-3" /> Описать</button>
                        <button onClick={handleGenerateGlitch} className="bg-purple-900/50 hover:bg-purple-800 text-purple-200 border border-purple-700 py-2 rounded text-xs flex justify-center items-center gap-2 font-bold">{loading ? <Loader className="w-3 h-3 animate-spin"/> : <Zap className="w-3 h-3"/>} Аномалия</button>
                        <button onClick={generateEncounter} disabled={encounterLoading} className="bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700 py-2 rounded text-xs flex justify-center items-center gap-2 font-bold transition-colors disabled:opacity-50">{encounterLoading ? <Loader className="animate-spin w-3 h-3"/> : <Skull className="w-3 h-3" />} Энкаунтер</button>
                    </div>
                </div>
                
                {/* Sub-locations (Places of Interest) */}
                <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2"><Building className="w-4 h-4"/> 📍 Места в локации</h4>
                        <button 
                            onClick={() => setShowAddSubLocModal(true)}
                            className="text-[10px] bg-gray-800 hover:bg-gray-700 text-gold-500 border border-gray-600 px-2 py-1 rounded flex items-center gap-1 transition-colors"
                        >
                            <Plus className="w-3 h-3"/> Добавить
                        </button>
                    </div>
                    
                    {(!location.subLocations || location.subLocations.length === 0) && (
                         <div className="text-center py-4">
                             <p className="text-xs text-gray-600 italic">Нет интересных мест.</p>
                         </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {location.subLocations?.map((sub, idx) => (
                            <button 
                                key={idx} 
                                onClick={() => onNavigateSubLocation?.(sub)}
                                className="text-left bg-dnd-card hover:bg-gray-800 p-2 rounded border border-gray-700 hover:border-gold-500 transition-colors group flex items-center justify-between"
                            >
                                <div>
                                    <div className="font-bold text-gray-200 text-sm group-hover:text-white">{sub.name}</div>
                                    <div className="text-[10px] text-gray-500 uppercase">{sub.type}</div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-gold-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>

                {genText && (
                    <div className="bg-red-950/40 border-l-4 border-red-600 p-4 rounded-r-lg animate-in fade-in slide-in-from-top-2 shrink-0 max-h-40 overflow-y-auto relative group">
                        <h4 className="text-red-400 text-xs uppercase tracking-widest mb-1 font-bold flex items-center gap-2"><Sparkles className="w-3 h-3"/> Нарратор</h4>
                        <p className="text-gray-200 font-serif leading-relaxed text-sm">{genText}</p>
                        <button onClick={() => onCopyToLog('Info', genText)} className="absolute top-2 right-2 text-gray-500 hover:text-white opacity-0 group-hover:opacity-100"><Feather className="w-4 h-4"/></button>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
                    {/* NPCs */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-700 pb-1 sticky top-0 bg-dnd-dark z-10 pt-2">
                            <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2"><Users className="w-4 h-4"/> Обитатели</h3>
                            <div className="flex gap-1">
                                <button onClick={() => handleGenContent('npc')} disabled={!!genSection} className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50">{genSection === 'npc' ? <Loader className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>} AI</button>
                            </div>
                        </div>
                        {(location.npcs || []).length === 0 && <p className="text-gray-600 text-sm italic">Нет важных NPC.</p>}
                        {(location.npcs || []).map((npc: any, i) => (
                            <div key={i} onClick={() => onOpenDetailModal('npc', npc.name)} className="p-3 rounded border transition-colors group relative cursor-pointer hover:bg-gray-800/80 bg-gray-800/50 border-gray-700">
                                <div className="flex justify-between pr-24">
                                    <span className="font-bold text-gold-500">{npc.name}</span>
                                    <span className="text-xs text-gray-500">{npc.race}</span>
                                </div>
                                <SmartText content={npc.description} className="text-sm text-gray-300 mt-1 block line-clamp-2" />
                                <div className="absolute top-2 right-2 flex gap-1" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => onSaveNpc(npc)} className="p-1.5 bg-indigo-900/50 text-indigo-200 rounded hover:bg-indigo-800 border border-indigo-800" title="В базу"><UserPlus className="w-3 h-3" /></button>
                                    <button onClick={() => onFightNpc(npc)} className="p-1.5 bg-red-900/80 text-red-200 rounded hover:bg-red-800 border border-red-800" title="В бой"><Swords className="w-3 h-3" /></button>
                                    <button onClick={() => onGenerateNpcImage(npc.name, npc.description)} className="p-1.5 bg-purple-900 text-purple-200 rounded hover:bg-purple-800" title="Портрет"><ImageIcon className="w-3 h-3" /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quests, Bestiary, Loot */}
                    <div className="space-y-4">
                        <div>
                             <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2 sticky top-0 bg-dnd-dark z-10 pt-2">
                                <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2"><ScrollText className="w-4 h-4"/> Квесты</h3>
                                <button onClick={() => handleGenContent('quest')} disabled={!!genSection} className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50">{genSection === 'quest' ? <Loader className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>} AI</button>
                            </div>
                            {(location.quests || []).map((q: any, i) => (
                                <div key={i} className="text-sm p-2 rounded border bg-indigo-900/20 border-indigo-900/40 relative group cursor-pointer hover:bg-indigo-900/30" onClick={() => onOpenDetailModal('quest', q.title)}>
                                    <b className="text-indigo-300">{q.title}</b>
                                    <SmartText content={q.description} className="text-gray-400 line-clamp-2" />
                                    <div className="absolute top-2 right-2 flex gap-1" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => onTrackQuest(q)} className="p-1.5 bg-green-900/80 text-green-200 rounded hover:bg-green-800" title="Взять квест"><Plus className="w-3 h-3"/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div>
                             <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2 sticky top-0 bg-dnd-dark z-10 pt-2">
                                <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2"><Skull className="w-4 h-4"/> Бестиарий</h3>
                                <button onClick={openBestiary} className="text-xs bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-700 text-indigo-200 px-2 py-1 rounded flex items-center gap-1"><BookOpen className="w-3 h-3"/> Открыть</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(location.monsters || []).map((m: string, i: number) => (
                                    <div key={i} className="bg-red-900/20 border border-red-900/50 rounded px-2 py-1 text-xs text-red-200 flex items-center gap-2">
                                        <span>{m}</span>
                                        <button onClick={() => onAddMonsterSmart(m)} className="text-red-400 hover:text-white" title="В бой" disabled={generatingMonster === m}>
                                            {generatingMonster === m ? <Loader className="w-3 h-3 animate-spin"/> : <Swords className="w-3 h-3"/>}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2 sticky top-0 bg-dnd-dark z-10">
                                <h3 className="font-serif font-bold text-gray-400 uppercase text-sm flex items-center gap-2"><PackagePlus className="w-4 h-4"/> Ценности</h3>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setShowLootModal(true)}
                                        className="text-xs bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-700 text-indigo-200 px-2 py-1 rounded flex items-center gap-1"
                                    >
                                        <Eye className="w-3 h-3"/> Управление
                                    </button>
                                    <button onClick={() => handleGenContent('loot')} disabled={!!genSection} className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50">{genSection === 'loot' ? <Loader className="w-3 h-3 animate-spin"/> : <Plus className="w-3 h-3"/>} AI</button>
                                </div>
                            </div>
                            
                            {/* Combined view of Simple and Tracked loot */}
                            <div className="flex flex-wrap gap-2">
                                {(location.loot || []).map((l: string, i: number) => (
                                    <div key={`simple-${i}`} className="text-xs bg-gray-800 px-3 py-2 rounded text-gold-400 border border-gray-700 hover:border-gold-500 transition-colors flex items-center gap-2 relative group cursor-help" onClick={() => setShowLootModal(true)}>
                                         <span className="truncate max-w-[150px]">{l}</span>
                                    </div>
                                ))}
                                {locationItems.map(item => (
                                    <div key={item.id} className="text-xs bg-indigo-950 px-3 py-2 rounded text-indigo-200 border border-indigo-800 hover:border-indigo-500 transition-colors flex items-center gap-2 relative group cursor-help" onClick={() => setShowLootModal(true)}>
                                         <PackagePlus className="w-3 h-3"/>
                                         <span className="truncate max-w-[150px]">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationDetailView;
