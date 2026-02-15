
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, 
  Music, Loader, VolumeX, Sparkles, ChevronDown, ChevronUp
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

const GlobalPlayer: React.FC = () => {
    const { 
        currentTrack, isPlaying, isLoading, volume, isAutoDJEnabled,
        togglePlay, playNext, playPrev, setVolume, toggleAutoDJ 
    } = useAudio();

    const [isCollapsed, setIsCollapsed] = useState(() => {
        return localStorage.getItem('dmc_player_collapsed') === 'true';
    });
    const [showVolume, setShowVolume] = useState(false);
    const volumeRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        localStorage.setItem('dmc_player_collapsed', isCollapsed.toString());
    }, [isCollapsed]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
                setShowVolume(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Collapsed handle
    if (isCollapsed) {
        return (
            <div className="h-6 md:h-8 bg-gray-900/90 border-t border-gold-600/20 backdrop-blur-md flex items-center px-4 justify-between select-none transition-all cursor-pointer hover:bg-gray-800 shrink-0"
                 onClick={() => setIsCollapsed(false)}>
                <div className="flex-1 flex items-center gap-2 overflow-hidden">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                    <span className="text-[10px] text-gray-400 truncate font-medium">
                        {currentTrack ? `Играет: ${currentTrack.title}` : 'Плеер свернут'}
                    </span>
                </div>
                <ChevronUp className="w-3 h-3 text-gold-500" />
            </div>
        );
    }

    return (
        <div className="relative h-14 md:h-16 bg-gray-900/98 border-t border-gold-600/30 backdrop-blur-lg flex items-center px-4 justify-between select-none shadow-[0_-4px_12px_rgba(0,0,0,0.5)] transition-all shrink-0">
            
            {/* Collapse Toggle */}
            <button 
                onClick={() => setIsCollapsed(true)}
                className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gray-900 border border-gold-600/30 rounded-full p-0.5 text-gray-500 hover:text-gold-500 transition-colors z-50 md:hidden"
            >
                <ChevronDown className="w-4 h-4" />
            </button>

            {/* Left: Track Info */}
            <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0 mr-2">
                <div className={`w-2 h-2 rounded-full shrink-0 ${isLoading ? 'bg-blue-500 animate-pulse' : isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                
                <div className="flex flex-col justify-center overflow-hidden">
                    {currentTrack ? (
                        <>
                            <div className="font-bold text-gold-500 text-xs sm:text-sm truncate leading-tight">{currentTrack.title}</div>
                            <div className="text-[10px] text-gray-500 truncate leading-tight">{currentTrack.artist || 'Неизвестен'}</div>
                        </>
                    ) : (
                        <span className="text-gray-600 italic text-xs">Трек не выбран</span>
                    )}
                </div>
            </div>

            {/* Center/Right: Controls */}
            <div className="flex items-center gap-0.5 sm:gap-2 shrink-0">
                <button 
                    onClick={toggleAutoDJ}
                    className={`p-2 rounded-full hover:bg-gray-800 transition-colors hidden sm:flex ${isAutoDJEnabled ? 'text-gold-500' : 'text-gray-500'}`}
                    title="Auto-DJ"
                >
                    <Sparkles className="w-4 h-4"/>
                </button>

                <button 
                    onClick={playPrev} 
                    disabled={!currentTrack}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-20 transition-opacity"
                >
                    <SkipBack className="w-5 h-5 fill-current"/>
                </button>
                
                <button 
                    onClick={togglePlay}
                    disabled={!currentTrack} 
                    className={`p-2.5 rounded-full transition-all flex items-center justify-center mx-1 shadow-lg active:scale-90 ${isPlaying ? 'bg-gold-600 text-black' : 'bg-gray-800 text-white border border-gray-700'}`}
                >
                    {isLoading ? <Loader className="w-5 h-5 animate-spin"/> : isPlaying ? <Pause className="w-5 h-5 fill-current"/> : <Play className="w-5 h-5 fill-current ml-0.5"/>}
                </button>

                <button 
                    onClick={playNext} 
                    disabled={!currentTrack}
                    className="p-2 text-gray-400 hover:text-white disabled:opacity-20 transition-opacity"
                >
                    <SkipForward className="w-5 h-5 fill-current"/>
                </button>

                {/* Volume Control - Desktop only */}
                <div className="relative ml-1 hidden sm:block" ref={volumeRef}>
                    <button 
                        onClick={() => setShowVolume(!showVolume)}
                        className={`p-2 rounded-full hover:bg-gray-800 transition-colors ${showVolume ? 'text-gold-500' : 'text-gray-400'}`}
                    >
                        {volume === 0 ? <VolumeX className="w-5 h-5"/> : <Volume2 className="w-5 h-5"/>}
                    </button>

                    {showVolume && (
                        <div className="absolute bottom-full right-0 mb-3 p-4 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl w-12 flex flex-col items-center gap-3 animate-in fade-in zoom-in-95 origin-bottom-right">
                            <div className="h-32 w-2 bg-gray-800 rounded-full relative overflow-hidden">
                                <div 
                                    className="absolute bottom-0 left-0 right-0 bg-gold-500 transition-all duration-100"
                                    style={{ height: `${volume * 100}%` }}
                                />
                                <input 
                                    type="range" 
                                    min="0" 
                                    max="1" 
                                    step="0.05"
                                    value={volume}
                                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    style={{ transform: 'rotate(180deg)' }} 
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GlobalPlayer;
