
import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, 
  Music, Loader, AlertCircle, VolumeX, Shuffle
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';

const GlobalPlayer: React.FC = () => {
    const { 
        currentTrack, isPlaying, isLoading, error, volume, isShuffle,
        togglePlay, playNext, playPrev, setVolume, toggleShuffle 
    } = useAudio();

    const [showVolume, setShowVolume] = useState(false);
    const volumeRef = useRef<HTMLDivElement>(null);

    // Close volume popup when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (volumeRef.current && !volumeRef.current.contains(event.target as Node)) {
                setShowVolume(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <>
            {/* Player Strip 
                Mobile: Bottom 57px (above nav)
                Desktop (XL): Bottom 20 (5rem/80px) - sits exactly above the h-20 Log panel
                Z-Index: 40 (Below Modals which start at 50/60)
            */}
            <div className="fixed bottom-[57px] xl:bottom-20 left-0 xl:left-64 right-0 h-9 bg-gray-900/95 border-t border-gold-600/30 z-40 backdrop-blur-md shadow-[0_-2px_10px_rgba(0,0,0,0.3)] flex items-center px-3 justify-between select-none transition-all duration-300">
                
                {/* Left: Info & State */}
                <div className="flex items-center gap-3 flex-1 overflow-hidden min-w-0">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isLoading ? 'bg-blue-500 animate-pulse' : isPlaying ? 'bg-green-500 animate-pulse' : 'bg-gray-600'}`} />
                    
                    <div className="flex flex-col justify-center overflow-hidden">
                        <div className="flex items-center gap-2 text-xs font-mono text-gray-300 truncate">
                            {currentTrack ? (
                                <>
                                    <span className="font-bold text-gold-500">{currentTrack.title}</span>
                                    <span className="text-gray-600 mx-1">•</span>
                                    <span className="text-gray-500 truncate">{currentTrack.artist || 'Unknown'}</span>
                                </>
                            ) : (
                                <span className="text-gray-600 italic">Нет активного трека</span>
                            )}
                            {error && <AlertCircle className="w-3 h-3 text-red-500" />}
                        </div>
                    </div>
                </div>

                {/* Right: Controls */}
                <div className="flex items-center gap-1 shrink-0">
                    <button 
                        onClick={toggleShuffle}
                        className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${isShuffle ? 'text-gold-500' : 'text-gray-500 hover:text-white'}`}
                        title="Перемешать"
                    >
                        <Shuffle className="w-3 h-3"/>
                    </button>

                    <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>

                    <button 
                        onClick={playPrev} 
                        disabled={!currentTrack}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors disabled:opacity-30"
                    >
                        <SkipBack className="w-3 h-3 fill-current"/>
                    </button>
                    
                    <button 
                        onClick={togglePlay}
                        disabled={!currentTrack} 
                        className={`p-1.5 rounded-md transition-all flex items-center justify-center mx-1 ${isPlaying ? 'bg-gold-600/20 text-gold-500' : 'text-gray-300 hover:bg-gray-800'}`}
                    >
                        {isLoading ? <Loader className="w-3 h-3 animate-spin"/> : isPlaying ? <Pause className="w-3.5 h-3.5 fill-current"/> : <Play className="w-3.5 h-3.5 fill-current ml-0.5"/>}
                    </button>

                    <button 
                        onClick={playNext} 
                        disabled={!currentTrack}
                        className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded transition-colors disabled:opacity-30"
                    >
                        <SkipForward className="w-3 h-3 fill-current"/>
                    </button>

                    <div className="w-[1px] h-4 bg-gray-700 mx-1"></div>

                    <div className="relative" ref={volumeRef}>
                        <button 
                            onClick={() => setShowVolume(!showVolume)}
                            className={`p-1.5 rounded hover:bg-gray-800 transition-colors ${showVolume ? 'text-gold-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            {volume === 0 ? <VolumeX className="w-3.5 h-3.5"/> : <Volume2 className="w-3.5 h-3.5"/>}
                        </button>

                        {/* Volume Popover */}
                        {showVolume && (
                            <div className="absolute bottom-full right-0 mb-2 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl w-8 flex flex-col items-center gap-2 animate-in fade-in zoom-in-95 origin-bottom-right">
                                <div className="h-24 w-1 bg-gray-700 rounded-full relative">
                                    <div 
                                        className="absolute bottom-0 left-0 right-0 bg-gold-500 rounded-full"
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
                                        style={{ transform: 'rotate(180deg)' }} // Correct slide direction for vertical
                                    />
                                </div>
                                <span className="text-[10px] font-mono text-gray-400">{Math.round(volume * 100)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default GlobalPlayer;
