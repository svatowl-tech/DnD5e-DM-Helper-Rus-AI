
import React, { useState, useEffect, useRef } from 'react';
import { MapData, MapBlockType, MapMarker, LocationData, MapLevel, EntityType } from '../types';
import { generateDungeonMap } from '../services/worldService';
import { generateMonster } from '../services/entityService';
import { saveMapToDB, getMapFromDB } from '../services/db';
import { 
    Grid3X3, Layers, User, Coins, Skull, Star, Info, 
    RefreshCw, Loader, Eye, EyeOff, Maximize2, 
    Map as MapIcon, DoorOpen, Waves, Zap, Flame, 
    ChevronRight, Save, Download, Share2, X,
    ArrowUpCircle, ArrowDownCircle, Square, LayoutGrid, Sparkles,
    ZoomIn, ZoomOut, Move, Swords
} from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import SmartText from './SmartText';

const BLOCK_STYLES: Record<MapBlockType, string> = {
    wall: 'bg-slate-800 border-slate-700',
    floor: 'bg-slate-900/50 border-slate-800/30',
    door: 'bg-amber-900/40 border-amber-700',
    water: 'bg-blue-900/40 border-blue-700 animate-pulse',
    hazard: 'bg-red-900/40 border-red-700',
    stairs: 'bg-indigo-900/60 border-indigo-500 shadow-[inset_0_0_8px_rgba(99,102,241,0.5)]',
    secret: 'bg-purple-900/40 border-purple-700',
    window: 'bg-slate-800 border-sky-400/50 border-x-4',
    void: 'bg-black border-transparent opacity-20'
};

const MARKER_ICONS = {
    npc: <User className="w-4 h-4 text-blue-400" />,
    loot: <Coins className="w-4 h-4 text-gold-500" />,
    enemy: <Skull className="w-4 h-4 text-red-500" />,
    landmark: <Star className="w-4 h-4 text-purple-400" />
};

const LocationMap: React.FC = () => {
    const { showToast } = useToast();
    const [mapData, setMapData] = useState<MapData | null>(null);
    const [loading, setLoading] = useState(false);
    const [monsterLoading, setMonsterLoading] = useState<string | null>(null);
    const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
    const [zoom, setZoom] = useState(1);
    
    // Fog of war state per level: [level][y][x]
    const [fogOfWarLevels, setFogOfWarLevels] = useState<boolean[][][]>([]);
    const [isFogEnabled, setIsFogEnabled] = useState(false);
    const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);

    const getActiveLocation = (): LocationData | null => {
        const saved = localStorage.getItem('dmc_active_location');
        try {
            return saved ? JSON.parse(saved) : null;
        } catch {
            return null;
        }
    };

    const activeLocation = getActiveLocation();

    // Auto-load map if it exists for this location
    useEffect(() => {
        if (activeLocation?.id) {
            getMapFromDB(activeLocation.id).then(savedMap => {
                if (savedMap) {
                    setMapData(savedMap);
                    // Initialize fog if not already there
                    const fogs = savedMap.levels.map((level) => {
                        const height = level.grid?.length || 0;
                        const width = level.grid?.[0]?.length || 0;
                        return Array(height).fill(null).map(() => Array(width).fill(true));
                    });
                    setFogOfWarLevels(fogs);
                } else {
                    setMapData(null);
                    setFogOfWarLevels([]);
                }
            });
        } else {
            setMapData(null);
        }
    }, [activeLocation?.id]);

    const handleGenerate = async () => {
        if (!activeLocation || !activeLocation.id) {
            showToast("Сначала выберите или создайте локацию в разделе 'Локация'", "warning");
            return;
        }
        
        setLoading(true);
        setSelectedMarker(null);
        setCurrentLevelIdx(0);
        setZoom(1);
        try {
            const data = await generateDungeonMap(activeLocation);
            
            if (!data.levels || data.levels.length === 0) {
                throw new Error("ИИ вернул пустую карту. Попробуйте еще раз.");
            }

            const fogs = data.levels.map((level) => {
                const height = level.grid?.length || 0;
                const width = level.grid?.[0]?.length || 0;
                if (height === 0 || width === 0) return [];
                return Array(height).fill(null).map(() => Array(width).fill(true));
            });
            
            setMapData(data);
            setFogOfWarLevels(fogs);

            // Persist to DB
            await saveMapToDB(activeLocation.id, data);
            
            showToast(`Карта создана и сохранена`, "success");
        } catch (e: any) {
            showToast(`Ошибка: ${e.message}`, "error");
        } finally {
            setLoading(false);
        }
    };

    const toggleFog = (x: number, y: number) => {
        if (!isFogEnabled) return;
        const newFogs = [...fogOfWarLevels];
        if (newFogs[currentLevelIdx] && newFogs[currentLevelIdx][y]) {
            newFogs[currentLevelIdx][y][x] = !newFogs[currentLevelIdx][y][x];
            setFogOfWarLevels(newFogs);
        }
    };

    const revealAllOnLevel = () => {
        if (!currentLevel || !currentLevel.grid) return;
        const newFogs = [...fogOfWarLevels];
        const height = currentLevel.grid.length;
        const width = currentLevel.grid[0]?.length || 0;
        if (width === 0) return;

        newFogs[currentLevelIdx] = Array(height).fill(null).map(() => Array(width).fill(false));
        setFogOfWarLevels(newFogs);
    };

    const getMarkersAt = (x: number, y: number) => {
        if (!mapData?.levels[currentLevelIdx]) return [];
        return mapData.levels[currentLevelIdx].markers.filter(m => m.x === x && m.y === y) || [];
    };

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.min(2.5, Math.max(0.3, prev + delta)));
    };

    const handleResetZoom = () => {
        setZoom(1);
    };

    const handleFightEnemy = async (marker: MapMarker) => {
        if (monsterLoading) return;
        setMonsterLoading(marker.id);
        try {
            const stats = await generateMonster(marker.label + ". " + marker.description);
            const event = new CustomEvent('dmc-add-combatant', {
                detail: { 
                    name: stats.name, 
                    type: EntityType.MONSTER, 
                    monsterType: stats.type,
                    hp: stats.hp, 
                    ac: stats.ac, 
                    cr: stats.cr,
                    initiative: 10 + Math.floor(Math.random() * 5), 
                    xp: stats.xp,
                    stats: stats.stats,
                    notes: `Маркер на карте: ${currentLevel?.name || 'Уровень'}. ${marker.description}`,
                    actions: stats.actions?.map((a: any) => `<b>${a.name}:</b> ${a.desc}`) || []
                }
            });
            window.dispatchEvent(event);
            showToast(`${stats.name} добавлен в боевой трекер`, 'success');
        } catch (e: any) {
            showToast(`Ошибка ИИ при создании монстра: ${e.message}`, 'error');
            const event = new CustomEvent('dmc-add-combatant', {
                detail: { name: marker.label, type: EntityType.MONSTER, hp: 20, ac: 12, initiative: 10, notes: marker.description }
            });
            window.dispatchEvent(event);
        } finally {
            setMonsterLoading(null);
        }
    };

    const currentLevel = mapData?.levels?.[currentLevelIdx];
    const gridWidth = currentLevel?.grid?.[0]?.length || 0;
    const gridHeight = currentLevel?.grid?.length || 0;

    return (
        <div className="h-full flex flex-col gap-2 sm:gap-4 overflow-hidden md:overflow-hidden">
            <div className="flex justify-between items-center bg-dnd-card p-3 sm:p-4 rounded-lg border border-gray-700 shrink-0">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="p-2 bg-gray-900 rounded border border-gray-700 shrink-0">
                        <MapIcon className="w-5 h-5 sm:w-6 sm:h-6 text-gold-500"/>
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-base sm:text-xl font-serif font-bold text-white truncate">
                            {mapData?.name || 'Тактический план'}
                        </h2>
                        <p className="text-[10px] sm:text-xs text-gray-400 truncate">
                            {mapData ? `${mapData.scale}` : activeLocation ? `Контекст: ${activeLocation.name}` : 'Выберите локацию'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-1 sm:gap-2 shrink-0">
                    <button 
                        onClick={() => setIsFogEnabled(!isFogEnabled)}
                        className={`p-2 rounded border transition-colors ${isFogEnabled ? 'bg-indigo-900 border-indigo-500 text-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                        title="Туман войны"
                    >
                        {isFogEnabled ? <EyeOff className="w-4 h-4 sm:w-5 sm:h-5"/> : <Eye className="w-4 h-4 sm:w-5 sm:h-5"/>}
                    </button>
                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-gold-600 hover:bg-gold-500 text-black px-3 sm:px-4 py-2 rounded font-bold flex items-center gap-2 disabled:opacity-50 transition-all text-xs sm:text-sm"
                    >
                        {loading ? <Loader className="w-3 h-3 sm:w-4 sm:h-4 animate-spin"/> : <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4"/>}
                        <span className="hidden xs:inline">{mapData ? 'Пересоздать' : 'Генерация'}</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-y-auto lg:overflow-hidden custom-scrollbar">
                {mapData && (
                    <div className="flex lg:flex-col gap-2 shrink-0 bg-gray-900/50 p-2 rounded-lg border border-gray-800 h-fit overflow-x-auto no-scrollbar">
                        {mapData.levels.map((level, idx) => (
                            <button
                                key={level.id}
                                onClick={() => { setCurrentLevelIdx(idx); setSelectedMarker(null); }}
                                className={`
                                    w-10 h-10 sm:w-12 sm:h-12 rounded border flex flex-col items-center justify-center transition-all shrink-0
                                    ${currentLevelIdx === idx 
                                        ? 'bg-gold-600 border-white text-black font-bold shadow-lg scale-105' 
                                        : 'bg-gray-800 border-gray-700 text-gray-500 hover:text-gray-300'}
                                `}
                                title={level.name}
                            >
                                <span className="text-[8px] sm:text-[10px] uppercase leading-none mb-0.5">Ур</span>
                                <span className="text-base sm:text-lg leading-none">{idx + 1}</span>
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 min-h-[400px] lg:min-h-0 bg-black rounded-lg border border-gray-800 overflow-auto flex items-start justify-start relative custom-scrollbar group scroll-smooth">
                    {!mapData && !loading && (
                        <div className="w-full h-full text-center text-gray-600 flex flex-col items-center justify-center gap-4 p-4">
                            <LayoutGrid className="w-16 h-16 sm:w-20 sm:h-20 opacity-10"/>
                            <div className="max-w-xs">
                                <p className="text-sm font-serif mb-1 text-gray-400">План для "{activeLocation?.name || 'локации'}" еще не создан</p>
                                <p className="text-[10px] sm:text-xs italic opacity-50">Нажмите «Генерация», чтобы AI спроектировал тактическую карту.</p>
                            </div>
                        </div>
                    )}

                    {loading && (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-6 text-gold-500">
                            <div className="relative">
                                <RefreshCw className="w-12 h-12 sm:w-16 sm:h-16 animate-spin opacity-20"/>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse"/>
                                </div>
                            </div>
                            <div className="text-center">
                                <span className="font-serif block text-base sm:text-lg animate-pulse">Архитектор работает...</span>
                                <span className="text-[10px] uppercase tracking-widest text-gray-500"> AI Картография </span>
                            </div>
                        </div>
                    )}

                    {mapData && currentLevel && !loading && gridWidth > 0 && (
                        <div 
                            className="relative m-4 sm:m-12 transition-transform duration-300 origin-top-left"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <div className="relative inline-block border-4 border-slate-800 shadow-2xl rounded-sm p-1 bg-slate-900/20 min-w-max">
                                <div className="absolute -top-6 sm:-top-8 left-0 text-[8px] sm:text-[10px] text-gray-500 font-mono flex items-center gap-2 whitespace-nowrap">
                                    <span className="text-gold-500 font-bold uppercase">{currentLevel.name}</span>
                                    <span>•</span>
                                    <span>Сетка: {gridWidth}x{gridHeight}</span>
                                    <span>•</span>
                                    <span>Зум: {Math.round(zoom * 100)}%</span>
                                </div>

                                <div 
                                    className="grid gap-px bg-slate-700/30 shadow-inner" 
                                    style={{ 
                                        gridTemplateColumns: `repeat(${gridWidth}, 1fr)`,
                                        width: 'fit-content'
                                    }}
                                >
                                    {currentLevel.grid.map((row, y) => 
                                        row.map((block, x) => {
                                            const isFogged = isFogEnabled && fogOfWarLevels[currentLevelIdx]?.[y]?.[x];
                                            const markers = getMarkersAt(x, y);
                                            
                                            return (
                                                <div 
                                                    key={`${x}-${y}`}
                                                    onClick={() => toggleFog(x, y)}
                                                    className={`
                                                        relative w-10 h-10 sm:w-12 sm:h-12 border transition-all duration-300
                                                        ${isFogged ? 'bg-black border-gray-900 cursor-help' : `${BLOCK_STYLES[block] || 'bg-slate-900'} cursor-default`}
                                                        hover:brightness-110
                                                    `}
                                                >
                                                    {!isFogged && markers.map(m => (
                                                        <button
                                                            key={m.id}
                                                            onClick={(e) => { e.stopPropagation(); setSelectedMarker(m); }}
                                                            className="absolute inset-0 flex items-center justify-center hover:scale-125 transition-transform z-10"
                                                        >
                                                            <div className="p-1 bg-black/60 rounded-full border border-white/20 shadow-lg backdrop-blur-sm animate-in zoom-in">
                                                                {MARKER_ICONS[m.type] || <Star className="w-3 h-3 text-white"/>}
                                                            </div>
                                                        </button>
                                                    ))}
                                                    
                                                    {!isFogged && block === 'door' && <DoorOpen className="w-3 h-3 sm:w-4 h-4 absolute inset-0 m-auto text-amber-500/40"/>}
                                                    {!isFogged && block === 'stairs' && <ArrowUpCircle className="w-4 h-4 sm:w-5 h-5 absolute inset-0 m-auto text-white/40"/>}
                                                    {!isFogged && block === 'hazard' && <Flame className="w-3 h-3 sm:w-4 h-4 absolute inset-0 m-auto text-red-500/40 animate-pulse"/>}
                                                    {!isFogged && block === 'water' && <Waves className="w-3 h-3 sm:w-4 h-4 absolute inset-0 m-auto text-blue-400/30"/>}
                                                    {!isFogged && block === 'secret' && <Zap className="w-3 h-3 sm:w-4 h-4 absolute inset-0 m-auto text-purple-400/40"/>}
                                                </div>
                                            );
                                        })
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {mapData && (
                        <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 flex flex-col gap-2 sm:gap-3 z-30">
                            <button 
                                onClick={() => handleZoom(0.2)}
                                className="p-2 sm:p-3 bg-gray-900/90 text-white rounded-full border border-gray-700 hover:bg-gold-600 hover:text-black transition-all shadow-xl active:scale-90"
                            >
                                <ZoomIn className="w-5 h-5 sm:w-6 sm:h-6"/>
                            </button>
                            <button 
                                onClick={handleResetZoom}
                                className="p-2 sm:p-3 bg-gray-900/90 text-gold-500 rounded-full border border-gray-700 hover:bg-gray-800 transition-all shadow-xl text-[10px] font-bold h-10 w-10 sm:h-12 sm:w-12 flex items-center justify-center active:scale-90"
                            >
                                1:1
                            </button>
                            <button 
                                onClick={() => handleZoom(-0.2)}
                                className="p-2 sm:p-3 bg-gray-900/90 text-white rounded-full border border-gray-700 hover:bg-gold-600 hover:text-black transition-all shadow-xl active:scale-90"
                            >
                                <ZoomOut className="w-5 h-5 sm:w-6 sm:h-6"/>
                            </button>
                        </div>
                    )}
                </div>

                <div className="w-full lg:w-80 flex flex-col gap-4 shrink-0 pb-10 lg:pb-0">
                    {selectedMarker && (
                        <div className="bg-dnd-card border-2 border-gold-600 rounded-lg p-4 animate-in slide-in-from-right-5 shadow-2xl">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-900 rounded-lg border border-gray-700 shadow-inner">
                                        {MARKER_ICONS[selectedMarker.type] || <Star className="w-4 h-4 text-white"/>}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm leading-none">{selectedMarker.label}</h4>
                                        <span className="text-[10px] text-gray-500 uppercase tracking-tighter">{selectedMarker.type}</span>
                                    </div>
                                </div>
                                <button onClick={() => setSelectedMarker(null)} className="text-gray-500 hover:text-white p-1 transition-colors">
                                    <X className="w-4 h-4"/>
                                </button>
                            </div>
                            <div className="text-xs text-gray-300 leading-relaxed italic bg-black/20 p-2 rounded border-l border-gold-600">
                                <SmartText content={selectedMarker.description} />
                            </div>
                            <div className="mt-4 flex gap-2">
                                {selectedMarker.type === 'enemy' && (
                                    <button 
                                        disabled={!!monsterLoading}
                                        className="flex-1 bg-red-900/50 hover:bg-red-800 text-red-100 py-2 rounded text-[10px] font-bold border border-red-700 uppercase transition-colors flex items-center justify-center gap-2 shadow-lg"
                                        onClick={() => handleFightEnemy(selectedMarker)}
                                    >
                                        {monsterLoading === selectedMarker.id ? <Loader className="w-3 h-3 animate-spin"/> : <Swords className="w-3 h-3"/>}
                                        {monsterLoading === selectedMarker.id ? 'Генерируем...' : 'В бой'}
                                    </button>
                                )}
                                {selectedMarker.type === 'loot' && (
                                    <button 
                                        className="flex-1 bg-yellow-900/50 hover:bg-yellow-800 text-yellow-100 py-2 rounded text-[10px] font-bold border border-yellow-700 uppercase transition-colors flex items-center justify-center gap-2"
                                        onClick={() => showToast("Лут передан в общий мешок", "success")}
                                    >
                                        <Coins className="w-3 h-3"/> Забрать
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="bg-dnd-card border border-gray-700 rounded-lg flex flex-col overflow-hidden flex-1 shadow-lg min-h-[300px]">
                        <div className="p-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                            <span className="font-bold text-[10px] uppercase tracking-widest text-gray-400">Объекты на плане</span>
                            {currentLevel && (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-gray-800 text-gold-500 font-bold border border-gray-700">{currentLevel.markers?.length || 0}</span>
                            )}
                        </div>
                        <div className="p-3 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                            {currentLevel ? (
                                <div className="space-y-1.5">
                                    {currentLevel.markers?.length > 0 ? (
                                        currentLevel.markers.map(m => (
                                            <button
                                                key={m.id}
                                                onClick={() => setSelectedMarker(m)}
                                                className={`w-full text-left p-2 rounded border transition-all flex items-center gap-3 group ${selectedMarker?.id === m.id ? 'bg-gray-800 border-gold-500' : 'bg-gray-900/30 border-transparent hover:border-gray-700'}`}
                                            >
                                                <div className="group-hover:scale-110 transition-transform">{MARKER_ICONS[m.type] || <Star className="w-3 h-3 text-white"/>}</div>
                                                <span className="text-[11px] font-medium text-gray-300 truncate">{m.label}</span>
                                                <ChevronRight className={`ml-auto w-3 h-3 opacity-0 group-hover:opacity-100 transition-all ${selectedMarker?.id === m.id ? 'opacity-100 text-gold-500' : ''}`}/>
                                            </button>
                                        ))
                                    ) : (
                                        <p className="text-center py-4 text-[10px] text-gray-600 italic">На этом уровне пока ничего нет...</p>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-600 italic text-[11px]">
                                    План не сгенерирован
                                </div>
                            )}

                            <div className="pt-4 border-t border-gray-800">
                                <h5 className="text-[9px] text-gray-500 uppercase font-bold mb-3 tracking-wider">Легенда блоков</h5>
                                <div className="grid grid-cols-2 gap-y-2.5 gap-x-2">
                                    {(Object.keys(BLOCK_STYLES) as MapBlockType[]).map(type => (
                                        <div key={type} className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-sm border shrink-0 ${BLOCK_STYLES[type]}`}></div>
                                            <span className="text-[9px] sm:text-[10px] text-gray-400 capitalize truncate">
                                                {type === 'wall' ? 'Стена' : 
                                                 type === 'floor' ? 'Пол' : 
                                                 type === 'door' ? 'Дверь' : 
                                                 type === 'hazard' ? 'Ловушка' : 
                                                 type === 'water' ? 'Вода' : 
                                                 type === 'secret' ? 'Секрет' : 
                                                 type === 'stairs' ? 'Лестница' : 
                                                 type === 'window' ? 'Окно' : 'Пустота'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        
                        {mapData && isFogEnabled && (
                            <div className="p-3 bg-indigo-950/20 border-t border-gray-800 shrink-0">
                                <button 
                                    onClick={revealAllOnLevel}
                                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-[10px] font-bold flex items-center justify-center gap-2 uppercase tracking-wide transition-colors shadow-lg"
                                >
                                    <Maximize2 className="w-3 h-3"/> Открыть всё
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationMap;
