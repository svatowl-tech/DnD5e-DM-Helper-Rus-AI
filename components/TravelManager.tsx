
import React, { useState, useEffect } from 'react';
import { TravelResult, TravelEvent, LoreEntry, LocationData } from '../types';
import { generateTravelScenario, generateFullLocation } from '../services/polzaService';
import { 
    Map, Footprints, Ship, Zap, 
    Cloud, Sword, Search, MessageSquare, Skull, 
    CheckCircle, X, Loader, ArrowRight, Compass,
    Target, Coins, Tent, MapPin, Sparkles, Play
} from 'lucide-react';

interface TravelState {
    result: TravelResult;
    completed: number[];
    destination?: {
        name: string;
        regionId?: string;
    };
}

interface TravelManagerProps {
    isOpen: boolean;
    onClose: () => void;
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
    { id: 'fast', label: 'Быстрый (Скрытность -5)', icon: <Zap className="w-4 h-4"/> },
    { id: 'normal', label: 'Нормальный', icon: <Footprints className="w-4 h-4"/> },
    { id: 'slow', label: 'Скрытный (Медленно)', icon: <Search className="w-4 h-4"/> },
];

const METHOD_OPTIONS = [
    { id: 'foot', label: 'Пешком', icon: <Footprints className="w-4 h-4"/> },
    { id: 'horse', label: 'Верхом', icon: <Compass className="w-4 h-4"/> },
    { id: 'ship', label: 'Корабль', icon: <Ship className="w-4 h-4"/> },
];

const TravelManager: React.FC<TravelManagerProps> = ({ 
    isOpen, onClose, currentLocation, currentRegion, allLore, onTravelComplete, addLog,
    travelState, onUpdateTravelState, onGenerateLocation, onCancelTravel
}) => {
    // Modes: 'plan' -> 'loading' -> 'journey'
    const [mode, setMode] = useState<'plan' | 'loading' | 'journey'>('plan');
    
    // Planning State
    const [travelScope, setTravelScope] = useState<'local' | 'global'>('local');
    const [targetRegionId, setTargetRegionId] = useState<string>('');
    const [targetLocationName, setTargetLocationName] = useState<string>('');
    const [customTarget, setCustomTarget] = useState('');
    const [selectedMethod, setSelectedMethod] = useState('foot');
    const [selectedPace, setSelectedPace] = useState('normal');

    // Generation State
    const [generatingEventId, setGeneratingEventId] = useState<number | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (travelState) {
                setMode('journey');
            } else {
                setMode('plan');
                if (currentRegion) setTargetRegionId(currentRegion.id);
            }
        }
    }, [isOpen, currentRegion, travelState]);

    // Derived Data
    const availableLocations = travelScope === 'local' 
        ? (currentRegion?.locations || [])
        : (allLore.find(r => r.id === targetRegionId)?.locations || []);

    const handleGenerate = async () => {
        const originName = currentLocation?.name || 'Неизвестная местность';
        const destName = customTarget || targetLocationName || 'Неизвестная цель';
        
        // Determine Region Context
        let regionContext = currentRegion?.name || 'Фаэрун';

        if (travelScope === 'global' && targetRegionId && targetRegionId !== currentRegion?.id) {
            const targetRegion = allLore.find(r => r.id === targetRegionId);
            if (targetRegion) {
                regionContext = `Путешествие из региона "${currentRegion?.name}" в регион "${targetRegion.name}".`;
            }
        }

        setMode('loading');
        try {
            const scenario = await generateTravelScenario(
                originName,
                destName,
                regionContext,
                selectedMethod,
                selectedPace
            );
            
            // Persist destination info so we know where we are going when we arrive
            const newState: TravelState = {
                result: scenario,
                completed: [],
                destination: {
                    name: destName,
                    regionId: travelScope === 'global' ? targetRegionId : currentRegion?.id
                }
            };

            onUpdateTravelState(newState); // Save to parent
            setMode('journey');
        } catch (e: any) {
            alert("Ошибка генерации: " + e.message);
            setMode('plan');
        }
    };

    const handleEventAction = (event: TravelEvent, action: 'combat' | 'loot' | 'complete') => {
        if (!travelState) return;

        if (action === 'combat' && event.threats) {
            // Normalize threats: split by comma if AI combined them (e.g. "Wolf, Goblin")
            // Also handles array of strings properly
            let individualThreats: string[] = [];
            if (Array.isArray(event.threats)) {
                event.threats.forEach(t => {
                    if (t.includes(',')) {
                        individualThreats.push(...t.split(',').map(s => s.trim()));
                    } else {
                        individualThreats.push(t.trim());
                    }
                });
            }

            // Loop through threats and dispatch individual events
            individualThreats.forEach((threatName, index) => {
                // Small delay to ensure unique IDs if processed rapidly
                setTimeout(() => {
                    const combatEvent = new CustomEvent('dmc-add-combatant', {
                        detail: {
                            name: threatName,
                            type: 'MONSTER',
                            hp: 20, ac: 12, initiative: 10 + Math.floor(Math.random() * 5),
                            notes: `Событие: ${event.title}`
                        }
                    });
                    window.dispatchEvent(combatEvent);
                }, index * 50);
            });
            
            addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[Путь] Враги добавлены в бой: ${individualThreats.join(', ')}`, type: 'combat' });
            
            // Switch to Combat Tab IMMEDIATELY
            window.dispatchEvent(new CustomEvent('dmc-switch-tab', { detail: 'combat' }));
            onClose(); // Close travel modal to show combat
        } 
        else if (action === 'loot' && event.loot) {
            addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[Путь] Найдено: ${event.loot.join(', ')}`, type: 'story' });
        }

        // Mark completed
        if (!travelState.completed.includes(event.day)) {
            onUpdateTravelState({
                ...travelState,
                completed: [...travelState.completed, event.day]
            });
        }
    };

    const handleExploreLocation = async (event: TravelEvent) => {
        if (!travelState) return;
        setGeneratingEventId(event.day);
        try {
            // Generate full location based on event description
            const regionName = currentRegion?.name || "Дикие Земли";
            const locationType = event.title + " (" + event.type + ")";
            
            const newLocation = await generateFullLocation(regionName, locationType);
            newLocation.id = Date.now().toString();
            newLocation.description = `[Сгенерировано в пути] ${event.description}\n\n${newLocation.description}`;
            
            onGenerateLocation(newLocation);
            
            // Mark event as completed
            onUpdateTravelState({
                ...travelState,
                completed: [...travelState.completed, event.day]
            });

            addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[Путь] Группа остановилась исследовать: ${newLocation.name}`, type: 'system' });
            
            // Close modal to let user play
            onClose();

        } catch (e: any) {
            alert("Ошибка генерации локации: " + e.message);
        } finally {
            setGeneratingEventId(null);
        }
    };

    const handleArrival = () => {
        if (!travelState) return;

        // Use stored destination info
        const destInfo = travelState.destination;
        const newLocName = destInfo?.name || 'Пункт Назначения';
        const regionId = destInfo?.regionId;
        
        let newLocData: LocationData = {
            id: Date.now().toString(),
            name: newLocName,
            type: 'Локация',
            description: 'Вы прибыли сюда после долгого путешествия.',
            atmosphere: 'Следы дороги, новые горизонты.'
        };

        // Try to find full data from Lore if it matches a known location
        if (regionId) {
            const region = allLore.find(r => r.id === regionId);
            if (region) {
                const existing = region.locations.find(l => l.name === newLocName);
                if (existing) newLocData = existing;
            }
        }

        // Log Arrival
        addLog({ 
            id: Date.now().toString(), 
            timestamp: Date.now(), 
            text: `[Путешествие] Группа прибыла в "${newLocName}" (${travelState.result.duration} дн.).`, 
            type: 'system' 
        });

        onTravelComplete(newLocData, regionId);
        onClose();
    };

    const handleCancelJourney = () => {
        if (window.confirm("Прервать путешествие? Прогресс будет потерян.")) {
            onCancelTravel();
            setMode('plan');
            onClose();
        }
    };

    const getEventIcon = (type: string) => {
        switch (type) {
            case 'combat': return <Sword className="w-5 h-5 text-red-500"/>;
            case 'social': return <MessageSquare className="w-5 h-5 text-blue-400"/>;
            case 'discovery': return <Search className="w-5 h-5 text-gold-500"/>;
            case 'weather': return <Cloud className="w-5 h-5 text-gray-400"/>;
            default: return <Tent className="w-5 h-5 text-green-500"/>;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dnd-card border border-gold-600 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                
                {/* Header */}
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2">
                        <Map className="w-6 h-6"/> {mode === 'plan' ? 'Планирование Пути' : 'В Пути'}
                    </h3>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-500 hover:text-white"/></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    
                    {mode === 'plan' && (
                        <div className="space-y-6">
                            {/* Scope Selector */}
                            <div className="flex bg-gray-800 rounded p-1">
                                <button 
                                    onClick={() => setTravelScope('local')}
                                    className={`flex-1 py-2 text-sm font-bold rounded transition-colors ${travelScope === 'local' ? 'bg-gray-700 text-gold-500' : 'text-gray-400 hover:text-white'}`}
                                >
                                    По региону ({currentRegion?.name})
                                </button>
                                <button 
                                    onClick={() => setTravelScope('global')}
                                    className={`flex-1 py-2 text-sm font-bold rounded transition-colors ${travelScope === 'global' ? 'bg-gray-700 text-gold-500' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Между регионами
                                </button>
                            </div>

                            {/* Destination Selection */}
                            <div className="space-y-3 bg-gray-900/50 p-4 rounded border border-gray-700">
                                <h4 className="text-sm font-bold text-gray-300 flex items-center gap-2"><Target className="w-4 h-4"/> Пункт назначения</h4>
                                
                                {travelScope === 'global' && (
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">Целевой Регион</label>
                                        <select 
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white outline-none focus:border-gold-500"
                                            value={targetRegionId}
                                            onChange={e => { setTargetRegionId(e.target.value); setTargetLocationName(''); }}
                                        >
                                            <option value="">Выберите регион...</option>
                                            {allLore.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">Известное место</label>
                                        <select 
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white outline-none focus:border-gold-500"
                                            value={targetLocationName}
                                            onChange={e => { setTargetLocationName(e.target.value); setCustomTarget(''); }}
                                            disabled={!targetRegionId && travelScope === 'global'}
                                        >
                                            <option value="">Выберите локацию...</option>
                                            {availableLocations.map((l, i) => <option key={i} value={l.name}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase block mb-1">Или особое место</label>
                                        <input 
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white outline-none focus:border-gold-500 placeholder-gray-600"
                                            placeholder="Напр. Таинственная башня"
                                            value={customTarget}
                                            onChange={e => { setCustomTarget(e.target.value); setTargetLocationName(''); }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Travel Details */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Способ</label>
                                    <div className="space-y-2">
                                        {METHOD_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelectedMethod(opt.id)}
                                                className={`w-full flex items-center gap-2 p-2 rounded border text-sm text-left transition-colors ${selectedMethod === opt.id ? 'bg-gold-600/20 border-gold-500 text-gold-500' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                            >
                                                {opt.icon} {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Темп</label>
                                    <div className="space-y-2">
                                        {PACE_OPTIONS.map(opt => (
                                            <button
                                                key={opt.id}
                                                onClick={() => setSelectedPace(opt.id)}
                                                className={`w-full flex items-center gap-2 p-2 rounded border text-sm text-left transition-colors ${selectedPace === opt.id ? 'bg-gold-600/20 border-gold-500 text-gold-500' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}
                                            >
                                                {opt.icon} {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {mode === 'loading' && (
                        <div className="h-64 flex flex-col items-center justify-center text-gold-500 gap-4">
                            <Loader className="w-12 h-12 animate-spin"/>
                            <p className="animate-pulse font-serif text-lg">Мастер прокладывает маршрут...</p>
                        </div>
                    )}

                    {mode === 'journey' && travelState && (
                        <div className="space-y-6">
                            <div className="bg-gray-800 p-4 rounded border-l-4 border-gold-500">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-bold text-white mb-1">Маршрут ({travelState.result.duration} дн.)</h4>
                                        <div className="text-xs text-gold-500 mb-1 flex items-center gap-1">
                                            <Target className="w-3 h-3"/> Цель: {travelState.destination?.name || "Неизвестно"}
                                        </div>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-300 italic mt-2">{travelState.result.summary}</p>
                            </div>

                            <div className="space-y-4 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-700">
                                {travelState.result.events.map((event, idx) => {
                                    const isCompleted = travelState.completed.includes(event.day);
                                    const isGenerating = generatingEventId === event.day;

                                    return (
                                        <div key={idx} className={`relative pl-10 transition-opacity duration-500 ${isCompleted ? 'opacity-60 grayscale-[50%]' : 'opacity-100'}`}>
                                            <div className={`absolute left-2 top-0 w-5 h-5 rounded-full border-2 z-10 flex items-center justify-center bg-dnd-card ${isCompleted ? 'border-green-500 text-green-500' : 'border-gold-500 text-gold-500'}`}>
                                                {isCompleted ? <CheckCircle className="w-3 h-3"/> : <span className="text-[10px] font-bold">{event.day}</span>}
                                            </div>
                                            
                                            <div className={`border rounded-lg p-4 transition-colors ${isCompleted ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-900 border-gray-600 hover:border-gold-500'}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex items-center gap-2 font-bold text-gray-200">
                                                        {getEventIcon(event.type)}
                                                        <span>{event.title}</span>
                                                    </div>
                                                    <span className="text-xs uppercase text-gray-500 bg-gray-800 px-2 py-0.5 rounded">{event.type}</span>
                                                </div>
                                                
                                                <p className="text-sm text-gray-300 mb-3 leading-relaxed">{event.description}</p>
                                                
                                                {event.mechanic && (
                                                    <div className="text-xs text-blue-300 bg-blue-900/20 p-2 rounded border border-blue-900/50 mb-3">
                                                        <span className="font-bold">Механика:</span> {event.mechanic}
                                                    </div>
                                                )}

                                                {!isCompleted && (
                                                    <div className="flex flex-col gap-2 mt-2">
                                                        <div className="flex gap-2">
                                                            {event.type === 'combat' && (
                                                                <button 
                                                                    onClick={() => handleEventAction(event, 'combat')}
                                                                    className="flex-1 bg-red-900/50 hover:bg-red-800 text-red-200 text-xs py-2 rounded font-bold flex justify-center items-center gap-2 transition-colors"
                                                                >
                                                                    <Skull className="w-3 h-3"/> К оружию!
                                                                </button>
                                                            )}
                                                            {event.type === 'discovery' && event.loot && (
                                                                <button 
                                                                    onClick={() => handleEventAction(event, 'loot')}
                                                                    className="flex-1 bg-gold-900/30 hover:bg-gold-800/50 text-gold-200 text-xs py-2 rounded font-bold flex justify-center items-center gap-2 transition-colors"
                                                                >
                                                                    <Coins className="w-3 h-3"/> Забрать лут
                                                                </button>
                                                            )}
                                                        </div>
                                                        
                                                        {/* Explore/Generate Location Button */}
                                                        <button 
                                                            onClick={() => handleExploreLocation(event)}
                                                            disabled={isGenerating}
                                                            className="w-full bg-indigo-900/50 hover:bg-indigo-800 border border-indigo-600 text-indigo-100 text-xs py-2 rounded font-bold flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                                                        >
                                                            {isGenerating ? <Loader className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                                            Исследовать локацию (Сгенерировать)
                                                        </button>

                                                        <button 
                                                            onClick={() => handleEventAction(event, 'complete')}
                                                            className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs py-2 rounded font-bold flex justify-center items-center gap-2 transition-colors border border-gray-700"
                                                        >
                                                            <ArrowRight className="w-3 h-3"/> Пропустить / Продолжить путь
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                {isCompleted && (
                                                    <div className="mt-2 pt-2 border-t border-gray-800 flex justify-center">
                                                        <span className="text-xs text-green-500 flex items-center gap-1 font-bold">
                                                            <CheckCircle className="w-3 h-3"/> Пройдено
                                                        </span>
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

                {/* Footer */}
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-3 shrink-0">
                    {mode === 'plan' && (
                        <>
                            <button onClick={onClose} className="text-gray-400 hover:text-white px-4">Отмена</button>
                            <button 
                                onClick={handleGenerate}
                                disabled={!targetLocationName && !customTarget}
                                className="bg-gold-600 hover:bg-gold-500 text-black font-bold px-6 py-2 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Построить маршрут <ArrowRight className="w-4 h-4"/>
                            </button>
                        </>
                    )}
                    {mode === 'journey' && (
                        <>
                            <button onClick={handleCancelJourney} className="text-red-400 hover:text-red-300 px-4 text-sm">Закончить путь</button>
                            <button onClick={onClose} className="bg-gray-700 hover:bg-gray-600 text-white font-bold px-4 py-2 rounded text-sm">Пауза (Свернуть)</button>
                            <button 
                                onClick={handleArrival}
                                className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-3 rounded flex items-center justify-center gap-2 shadow-lg"
                            >
                                <MapPin className="w-5 h-5"/> Прибыть в пункт назначения
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TravelManager;
