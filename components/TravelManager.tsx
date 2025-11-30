
import React, { useState, useEffect } from 'react';
import { TravelResult, TravelEvent, LoreEntry, LocationData, TravelState, EntityType, BestiaryEntry } from '../types';
import { generateTravelScenario, generateFullLocation, generateMonster, generateMultiverseBreach } from '../services/polzaService';
import { 
    Map, Footprints, Ship, Zap, 
    Cloud, Sword, Search, MessageSquare, Skull, 
    CheckCircle, X, Loader, ArrowRight, Compass,
    Target, Coins, Tent, RotateCcw, Sparkles,
    Settings, ArrowLeft, Clock, Calendar, Feather,
    Hexagon, TreePine, Castle, Landmark
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { useToast } from '../contexts/ToastContext';

interface TravelManagerProps {
    isOpen: boolean; // Kept for API consistency, but represents "Is Active Tab" now
    onClose: () => void; // Functions as "Go back to Location Details"
    currentLocation: LocationData | null;
    currentRegion: LoreEntry | null;
    allLore: LoreEntry[];
    onTravelComplete: (newLocation: LocationData, newRegionId?: string) => void;
    addLog: (entry: any) => void;
    
    // Persistence State
    travelState: TravelState | null;
    onUpdateTravelState: (state: TravelState) => void;
    onGenerateLocation: (location: LocationData) => void;
    onCancelTravel: () => void;
}

const PACE_OPTIONS = [
    { id: 'normal', label: 'Нормальный', icon: <Footprints className="w-4 h-4"/> },
    { id: 'fast', label: 'Быстрый', icon: <Zap className="w-4 h-4"/> },
    { id: 'slow', label: 'Скрытный', icon: <Search className="w-4 h-4"/> },
];

const METHOD_OPTIONS = [
    { id: 'foot', label: 'Пешком', icon: <Footprints className="w-4 h-4"/> },
    { id: 'horse', label: 'Верхом', icon: <Compass className="w-4 h-4"/> },
    { id: 'ship', label: 'Корабль', icon: <Ship className="w-4 h-4"/> },
];

const GENERIC_TYPES = [
    "Руины", "Башня Мага", "Пещера", "Лес", "Деревня", 
    "Лагерь", "Храм", "Подземелье", "Кладбище", "Порт", 
    "Мост", "Оазис", "Крепость", "Шахта", "Ферма", 
    "Корабль", "Рынок", "Тюрьма", "Портал", "Усадьба", 
    "Сокровищница", "Библиотека", "Арена", "Таверна"
];

const TravelManager: React.FC<TravelManagerProps> = ({ 
    isOpen, 
    onClose, 
    currentLocation, 
    currentRegion, 
    allLore, 
    onTravelComplete, 
    addLog, 
    travelState, 
    onUpdateTravelState, 
    onGenerateLocation, 
    onCancelTravel 
}) => {
    const { autoPlayMusic } = useAudio();
    const { showToast } = useToast();
    
    // View Modes: 'plan' (setup), 'loading' (AI working), 'journey' (active trip), 'error' (API failure)
    const [viewMode, setViewMode] = useState<'plan' | 'loading' | 'journey' | 'error'>('plan');
    const [loadingText, setLoadingText] = useState('Прокладываем маршрут...');
    const [errorMessage, setErrorMessage] = useState('');
    const [isAuthError, setIsAuthError] = useState(false);

    // Planning Form State
    const [destMode, setDestMode] = useState<'lore' | 'generic' | 'breach' | 'custom'>('lore');
    
    const [targetRegionId, setTargetRegionId] = useState<string>('');
    const [targetLocationName, setTargetLocationName] = useState<string>('');
    const [customTarget, setCustomTarget] = useState('');
    const [genericType, setGenericType] = useState(GENERIC_TYPES[0]);
    
    const [selectedMethod, setSelectedMethod] = useState('foot');
    const [selectedPace, setSelectedPace] = useState('normal');
    const [duration, setDuration] = useState(3);

    // Transient processing state
    const [processingEventId, setProcessingEventId] = useState<number | null>(null);

    // Effect: Initialize state when opened or props change
    useEffect(() => {
        if (isOpen) {
            // Check if we have a valid active travel state
            const hasActiveJourney = travelState && 
                                     travelState.result && 
                                     Array.isArray(travelState.result.events) && 
                                     travelState.result.events.length > 0;

            if (hasActiveJourney) {
                setViewMode('journey');
            } else {
                setViewMode('plan');
                // Pre-select current region if available
                if (currentRegion) {
                    setTargetRegionId(currentRegion.id);
                }
            }
        }
    }, [isOpen, travelState, currentRegion]);

    // Helper: Get list of locations based on scope
    const getAvailableLocations = () => {
        if (targetRegionId) {
            const region = allLore.find(r => r.id === targetRegionId);
            return region?.locations || [];
        }
        // Fallback to current region if no target selected yet (though logic usually enforces selection)
        return currentRegion?.locations || [];
    };

    // Action: Generate the Travel Scenario
    const handleGenerateScenario = async () => {
        const origin = currentLocation?.name || 'Неизвестная местность';
        
        // Determine Destination String based on mode
        let destination = 'Неизвестная цель';
        let contextAddon = '';

        if (destMode === 'lore') {
            destination = targetLocationName || 'Место в регионе';
        } else if (destMode === 'generic') {
            destination = `${genericType} (Неисследованная)`;
            contextAddon = `Цель — найти локацию типа "${genericType}".`;
        } else if (destMode === 'breach') {
            destination = 'Разлом Мультивселенной';
            contextAddon = `Цель — аномалия, разлом в реальности. Путь искажен магией и странностями.`;
        } else if (destMode === 'custom') {
            destination = customTarget;
        }
        
        let context = currentRegion ? `Регион: ${currentRegion.name}. ${currentRegion.description.substring(0, 150)}...` : 'Фэнтези мир.';
        
        // Add context about target region if explicitly changed
        if (targetRegionId && targetRegionId !== currentRegion?.id) {
            const targetRegion = allLore.find(r => r.id === targetRegionId);
            if (targetRegion) {
                context += ` Путешествие в регион: ${targetRegion.name}.`;
            }
        }
        
        context += " " + contextAddon;

        setLoadingText('Прокладываем маршрут...');
        setViewMode('loading');
        setErrorMessage('');
        setIsAuthError(false);

        try {
            // Pass durationDays to the service
            const scenario = await generateTravelScenario(origin, destination, context, selectedMethod, selectedPace, duration);
            
            // Basic validation of AI response
            if (!scenario || !Array.isArray(scenario.events)) {
                throw new Error("Получены некорректные данные от AI.");
            }

            const newState: TravelState = {
                result: {
                    summary: scenario.summary || "Путь проложен.",
                    duration: scenario.duration || duration,
                    events: scenario.events
                },
                completed: [],
                destination: {
                    name: destination,
                    regionId: targetRegionId || currentRegion?.id
                }
            };

            onUpdateTravelState(newState);
            setViewMode('journey');
            // Start Travel Music
            autoPlayMusic('travel');

        } catch (error: any) {
            console.error("Travel Generation Failed:", error);
            setErrorMessage(error.message || "Неизвестная ошибка.");
            
            if (error.message && error.message.includes('401')) {
                setIsAuthError(true);
                // Auto trigger settings to help user
                window.dispatchEvent(new CustomEvent('dmc-open-settings'));
            }
            
            setViewMode('error');
        }
    };

    const logEvent = (event: TravelEvent) => {
        addLog({ 
            id: Date.now().toString(), 
            timestamp: Date.now(), 
            text: `[Путешествие] День ${event.day}: ${event.title}. ${event.description}`, 
            type: 'story' 
        });
        showToast("Событие записано в летопись", 'success');
    };

    // Action: Handle specific event interactions
    const handleEventAction = async (event: TravelEvent, action: 'combat' | 'loot' | 'explore' | 'skip') => {
        if (!travelState) return;

        // mark as completed helper
        const markCompleted = () => {
            if (!travelState.completed.includes(event.day)) {
                onUpdateTravelState({
                    ...travelState,
                    completed: [...travelState.completed, event.day]
                });
            }
        };

        if (action === 'combat') {
            const threats = event.threats || ['Неизвестный враг'];
            setProcessingEventId(event.day);

            try {
                // Try to generate stats for each threat sequentially to avoid spamming API
                const generatedStats = [];
                const savedBestiary = JSON.parse(localStorage.getItem('dmc_local_bestiary') || '[]');
                
                for (const name of threats) {
                    try {
                        const stats = await generateMonster(name);
                        generatedStats.push(stats);
                        // Save to bestiary if new
                        if (!savedBestiary.some((m: BestiaryEntry) => m.name === stats.name)) {
                            savedBestiary.unshift(stats);
                        }
                    } catch (e) {
                        console.warn(`Failed to generate stats for ${name}, using fallback.`);
                        generatedStats.push({ name, hp: 20, ac: 12, initiative: 10 }); // Fallback
                    }
                }
                
                // Save updated bestiary
                localStorage.setItem('dmc_local_bestiary', JSON.stringify(savedBestiary));

                // Add to combat tracker
                generatedStats.forEach((stats, index) => {
                    const combatEvent = new CustomEvent('dmc-add-combatant', {
                        detail: {
                            name: stats.name,
                            type: 'MONSTER',
                            hp: stats.hp,
                            maxHp: stats.hp,
                            ac: stats.ac || 10,
                            xp: stats.xp || 50,
                            initiative: 10 + Math.floor(Math.random() * 5),
                            notes: `Событие: ${event.title}`,
                            actions: stats.actions?.map((a: any) => `<b>${a.name}:</b> ${a.desc}`) || []
                        }
                    });
                    // Stagger slightly
                    setTimeout(() => window.dispatchEvent(combatEvent), index * 50);
                });
                
                // Switch tab
                window.dispatchEvent(new CustomEvent('dmc-switch-tab', { detail: 'combat' }));
                markCompleted();
                
                // Switch music
                autoPlayMusic('combat', threats.join(' '));

            } catch (e) {
                console.error(e);
                alert("Ошибка подготовки боя.");
            } finally {
                setProcessingEventId(null);
            }
        } 
        else if (action === 'loot') {
            const loot = event.loot?.join(', ') || 'Ничего';
            showToast(`Найдено: ${loot}`, 'success');
            markCompleted();
        }
        else if (action === 'explore') {
            setProcessingEventId(event.day);
            try {
                const regionName = currentRegion?.name || "Дикие Земли";
                const newLoc = await generateFullLocation(regionName, event.locationName || event.title);
                newLoc.id = Date.now().toString();
                
                // Add context from event
                newLoc.description = `(Обнаружено в пути) ${event.description}\n\n${newLoc.description}`;
                
                onGenerateLocation(newLoc);
                markCompleted();
                
                // Auto-switch music to location based
                autoPlayMusic('location', newLoc.name + " " + newLoc.type + " " + newLoc.atmosphere);
                
                onClose(); // Switch back to Location Details tab
            } catch (e: any) {
                if (e.message && e.message.includes('401')) {
                    alert("Ошибка API Key. Пожалуйста, введите ключ в настройках.");
                    window.dispatchEvent(new CustomEvent('dmc-open-settings'));
                } else {
                    alert("Ошибка генерации локации: " + e.message);
                }
            } finally {
                setProcessingEventId(null);
            }
        }
        else if (action === 'skip') {
            markCompleted();
        }
    };

    // Action: Complete Journey
    const handleFinishJourney = async () => {
        if (!travelState) return;
        
        const destName = travelState.destination?.name || "Цель";
        const destRegionId = travelState.destination?.regionId;
        let finalLocation: LocationData | null = null;

        // 1. Try to find existing location in lore
        if (destRegionId) {
            const region = allLore.find(r => r.id === destRegionId);
            const existing = region?.locations.find(l => l.name === destName);
            if (existing) finalLocation = existing;
        }

        // 2. If location doesn't exist (Generated/Custom/Breach), GENERATE IT NOW
        if (!finalLocation) {
            setLoadingText('Генерируем и сохраняем локацию назначения...');
            setViewMode('loading');
            
            try {
                const regionName = destRegionId ? allLore.find(r => r.id === destRegionId)?.name : "Неизвестные земли";
                
                if (destName.includes('Разлом') || destMode === 'breach') {
                    finalLocation = await generateMultiverseBreach();
                    finalLocation.name = destName; // Keep the name if user set custom
                } else {
                    // Determine type for generation
                    let genType = 'Локация';
                    
                    // If it was a generic selection, use that type
                    if (destMode === 'generic') {
                        // If we can assume the generic type from the flow, use it. 
                        // Since we don't store the *exact* generic type in travelState.destination, 
                        // we might need to infer or rely on the destination name format if it wasn't customized.
                        // Simple heuristic: if destName is in GENERIC_TYPES or similar
                        genType = destName.split(' ')[0]; 
                    } else if (destMode === 'custom') {
                        genType = 'Интересное место';
                    }
                    
                    finalLocation = await generateFullLocation(regionName || "Дикие Земли", destName);
                }

                // Ensure essential fields
                finalLocation.id = Date.now().toString();
                // Override description start to link with journey
                finalLocation.description = `Вы прибыли сюда после долгого путешествия. ${finalLocation.description}`;

            } catch (e: any) {
                setErrorMessage("Не удалось сгенерировать финальную локацию: " + e.message);
                setViewMode('error');
                return;
            }
        }

        onTravelComplete(finalLocation, destRegionId);
        
        // Auto switch music to location
        autoPlayMusic('location', finalLocation.name + " " + finalLocation.type + " " + finalLocation.atmosphere);
        
        onClose(); // Switch back to Location Details
    };

    const handleAbort = () => {
        onCancelTravel();
        setViewMode('plan');
    };

    const openSettings = () => {
        window.dispatchEvent(new CustomEvent('dmc-open-settings'));
    };

    // Render Helpers
    const getIconForEventType = (type: string) => {
        switch (type) {
            case 'combat': return <Sword className="w-5 h-5 text-red-500" />;
            case 'social': return <MessageSquare className="w-5 h-5 text-blue-400" />;
            case 'discovery': return <Search className="w-5 h-5 text-gold-500" />;
            case 'weather': return <Cloud className="w-5 h-5 text-gray-400" />;
            default: return <Tent className="w-5 h-5 text-green-500" />;
        }
    };

    return (
        <div className="flex flex-col h-full w-full bg-dnd-darker animate-in fade-in duration-200">
            {/* Header */}
            <div className="p-4 bg-gray-900/50 border-b border-gray-700 flex justify-between items-center shrink-0">
                <h3 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2">
                    <Map className="w-6 h-6" /> 
                    {viewMode === 'plan' ? 'Планирование Маршрута' : 
                     viewMode === 'loading' ? 'Генерация...' : 
                     viewMode === 'error' ? 'Ошибка' : 'В Пути'}
                </h3>
                <button 
                    onClick={onClose} 
                    className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors px-3 py-1 rounded hover:bg-gray-800"
                    title="Вернуться к описанию локации"
                >
                    <span className="text-xs font-bold uppercase hidden sm:inline">Назад</span>
                    <ArrowRight className="w-5 h-5" />
                </button>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
                
                {/* --- ERROR MODE --- */}
                {viewMode === 'error' && (
                    <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                        <div className="p-4 bg-red-900/30 border border-red-600 rounded-lg max-w-md">
                            <h4 className="text-red-400 font-bold mb-2 flex items-center justify-center gap-2">
                                <Skull className="w-5 h-5"/> Ошибка Генерации
                            </h4>
                            <p className="text-sm text-gray-300 mb-4">{errorMessage}</p>
                            
                            {isAuthError && (
                                <div className="flex flex-col gap-2">
                                    <p className="text-xs text-gray-400">Похоже, ваш API ключ недействителен или отсутствует.</p>
                                    <button 
                                        onClick={openSettings}
                                        className="bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2"
                                    >
                                        <Settings className="w-4 h-4"/> Открыть Настройки
                                    </button>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setViewMode('plan')} className="text-gray-400 hover:text-white underline text-sm">Попробовать снова</button>
                    </div>
                )}

                {/* --- PLAN MODE --- */}
                {viewMode === 'plan' && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        <p className="text-sm text-gray-400 italic">
                            Выберите, куда отправится группа. AI сгенерирует события, случайные встречи и описания дороги.
                        </p>

                        {/* Destination Mode Tabs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 bg-gray-900 rounded-lg">
                            <button 
                                onClick={() => setDestMode('lore')} 
                                className={`py-2 px-2 rounded text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${destMode === 'lore' ? 'bg-gold-600 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Landmark className="w-4 h-4"/> Известное
                            </button>
                            <button 
                                onClick={() => setDestMode('generic')} 
                                className={`py-2 px-2 rounded text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${destMode === 'generic' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <TreePine className="w-4 h-4"/> Случайное
                            </button>
                            <button 
                                onClick={() => setDestMode('breach')} 
                                className={`py-2 px-2 rounded text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${destMode === 'breach' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Hexagon className="w-4 h-4"/> Разлом
                            </button>
                            <button 
                                onClick={() => setDestMode('custom')} 
                                className={`py-2 px-2 rounded text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all ${destMode === 'custom' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                            >
                                <Target className="w-4 h-4"/> Своё
                            </button>
                        </div>

                        {/* Destination Selection Content */}
                        <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 space-y-4 min-h-[150px] flex flex-col justify-center">
                            
                            {destMode === 'lore' && (
                                <>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1 uppercase font-bold">Регион (Справочник)</label>
                                        <select 
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white outline-none focus:border-gold-500"
                                            value={targetRegionId}
                                            onChange={(e) => { setTargetRegionId(e.target.value); setTargetLocationName(''); }}
                                        >
                                            <option value="">Выберите регион...</option>
                                            {allLore.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 block mb-1 uppercase font-bold">Локация</label>
                                        <select 
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white outline-none focus:border-gold-500 disabled:opacity-50"
                                            value={targetLocationName}
                                            onChange={(e) => setTargetLocationName(e.target.value)}
                                            disabled={!targetRegionId}
                                        >
                                            <option value="">Выберите место...</option>
                                            {getAvailableLocations().map((loc, idx) => (
                                                <option key={idx} value={loc.name}>{loc.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}

                            {destMode === 'generic' && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1 uppercase font-bold">Тип локации (AI)</label>
                                    <select 
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white outline-none focus:border-indigo-500"
                                        value={genericType}
                                        onChange={(e) => setGenericType(e.target.value)}
                                    >
                                        {GENERIC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                    <p className="text-xs text-gray-500 mt-2">
                                        AI сгенерирует уникальное место выбранного типа по прибытии.
                                    </p>
                                </div>
                            )}

                            {destMode === 'breach' && (
                                <div className="text-center py-2">
                                    <Hexagon className="w-12 h-12 text-purple-500 mx-auto mb-2 animate-pulse"/>
                                    <h4 className="text-lg font-bold text-purple-300">Разлом Мультивселенной</h4>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Путешествие к аномалии, где грани миров истончены. <br/>
                                        Ожидайте странные события и искажения реальности.
                                    </p>
                                </div>
                            )}

                            {destMode === 'custom' && (
                                <div>
                                    <label className="text-xs text-gray-500 block mb-1 uppercase font-bold">Название места</label>
                                    <input 
                                        className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white outline-none focus:border-gold-500 placeholder-gray-600"
                                        placeholder="Напр. Таинственная башня"
                                        value={customTarget}
                                        onChange={(e) => setCustomTarget(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Settings Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                <div className="flex justify-between items-center mb-2">
                                    <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-gold-500"/> Длительность (Дни)
                                    </h4>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setDuration(Math.max(1, duration - 1))} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-bold">-</button>
                                    <input 
                                        type="number"
                                        min="1"
                                        max="100"
                                        className="w-full bg-gray-800 border border-gray-600 rounded px-3 py-2 text-center text-white font-bold outline-none"
                                        value={duration}
                                        onChange={(e) => setDuration(Math.max(1, parseInt(e.target.value) || 1))}
                                    />
                                    <button onClick={() => setDuration(duration + 1)} className="bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-bold">+</button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Способ</label>
                                        <select 
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white outline-none"
                                            value={selectedMethod}
                                            onChange={(e) => setSelectedMethod(e.target.value)}
                                        >
                                            {METHOD_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Темп</label>
                                        <select 
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white outline-none"
                                            value={selectedPace}
                                            onChange={(e) => setSelectedPace(e.target.value)}
                                        >
                                            {PACE_OPTIONS.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- LOADING MODE --- */}
                {viewMode === 'loading' && (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-gold-500">
                        <Loader className="w-16 h-16 animate-spin" />
                        <div className="text-center">
                            <h4 className="text-xl font-serif font-bold mb-1">{loadingText}</h4>
                            <p className="text-sm text-gray-400">Мастер оценивает опасности и расстояния.</p>
                        </div>
                    </div>
                )}

                {/* --- JOURNEY MODE --- */}
                {viewMode === 'journey' && travelState && (
                    <div className="space-y-6 max-w-3xl mx-auto">
                        
                        {/* Summary Box */}
                        <div className="bg-gray-800 border-l-4 border-gold-500 p-4 rounded shadow-md">
                            <div className="flex justify-between items-start">
                                <h4 className="font-bold text-white text-lg">Путешествие в {travelState.destination?.name}</h4>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400"/>
                                    <span className="text-xs bg-gray-900 text-gold-500 px-2 py-1 rounded border border-gold-500/50">
                                        {travelState.result.duration} дн.
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-gray-300 mt-2 italic leading-relaxed">
                                {travelState.result.summary}
                            </p>
                        </div>

                        {/* Timeline */}
                        <div className="relative space-y-6 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-700">
                            {travelState.result.events.map((event, idx) => {
                                const isCompleted = travelState.completed.includes(event.day);
                                const isProcessing = processingEventId === event.day;

                                return (
                                    <div key={idx} className={`relative pl-12 transition-all ${isCompleted ? 'opacity-60 grayscale' : 'opacity-100'}`}>
                                        {/* Timeline Node */}
                                        <div className={`absolute left-1.5 top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 ${isCompleted ? 'bg-green-900 border-green-500 text-green-500' : 'bg-dnd-card border-gold-500 text-gold-500'}`}>
                                            {isCompleted ? <CheckCircle className="w-4 h-4"/> : <span className="text-xs font-bold">{event.day}</span>}
                                        </div>

                                        {/* Event Card */}
                                        <div className={`border rounded-lg p-4 bg-gray-900 shadow-sm ${isCompleted ? 'border-gray-800' : 'border-gray-600 hover:border-gold-500/50'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    {getIconForEventType(event.type)}
                                                    <span className="font-bold text-gray-200">{event.title}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => logEvent(event)} className="text-gray-400 hover:text-white p-1" title="Записать в летопись">
                                                        <Feather className="w-4 h-4"/>
                                                    </button>
                                                    <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500 bg-black/30 px-2 py-0.5 rounded">
                                                        {event.type}
                                                    </span>
                                                </div>
                                            </div>

                                            <p className="text-sm text-gray-300 mb-3">{event.description}</p>

                                            {event.mechanic && (
                                                <div className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded border border-blue-900/30 mb-3">
                                                    <span className="font-bold text-blue-400">Механика:</span> {event.mechanic}
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            {!isCompleted && (
                                                <div className="flex flex-wrap gap-2 mt-3">
                                                    {event.type === 'combat' && (
                                                        <button 
                                                            onClick={() => handleEventAction(event, 'combat')}
                                                            disabled={isProcessing}
                                                            className="flex-1 bg-red-900/40 hover:bg-red-900/80 text-red-200 border border-red-800/50 py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                                        >
                                                            {isProcessing ? <Loader className="w-4 h-4 animate-spin"/> : <Skull className="w-4 h-4"/>} 
                                                            Начать Бой
                                                        </button>
                                                    )}
                                                    
                                                    {event.type === 'discovery' && event.loot && (
                                                        <button 
                                                            onClick={() => handleEventAction(event, 'loot')}
                                                            className="flex-1 bg-yellow-900/30 hover:bg-yellow-900/60 text-yellow-200 border border-yellow-800/50 py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                                                        >
                                                            <Coins className="w-4 h-4"/> Забрать Лут
                                                        </button>
                                                    )}

                                                    {/* Option to explore/generate location for any event */}
                                                    <button 
                                                        onClick={() => handleEventAction(event, 'explore')}
                                                        disabled={isProcessing}
                                                        className="flex-1 bg-indigo-900/30 hover:bg-indigo-900/60 text-indigo-200 border border-indigo-800/50 py-2 px-3 rounded text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                                                    >
                                                        {isProcessing ? <Loader className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                                                        Исследовать
                                                    </button>

                                                    <button 
                                                        onClick={() => handleEventAction(event, 'skip')}
                                                        className="px-3 py-2 rounded border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 text-xs font-bold transition-colors"
                                                        title="Отметить как пройденное"
                                                    >
                                                        <ArrowRight className="w-4 h-4"/>
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Controls */}
            <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 shrink-0">
                {viewMode === 'plan' && (
                    <>
                        <button 
                            onClick={handleGenerateScenario}
                            disabled={(destMode === 'lore' && !targetLocationName) || (destMode === 'custom' && !customTarget)}
                            className="bg-gold-600 hover:bg-gold-500 text-black px-6 py-2 rounded font-bold text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Map className="w-4 h-4"/> Проложить путь
                        </button>
                    </>
                )}
                
                {viewMode === 'journey' && (
                    <>
                        <button 
                            onClick={handleAbort}
                            className="px-4 py-2 text-red-400 hover:text-red-300 text-sm font-bold mr-auto"
                        >
                            Прервать
                        </button>
                        
                        <button 
                            onClick={handleFinishJourney}
                            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold text-sm flex items-center gap-2 shadow-lg"
                        >
                            <CheckCircle className="w-4 h-4"/> Прибыть в пункт назначения
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default TravelManager;
