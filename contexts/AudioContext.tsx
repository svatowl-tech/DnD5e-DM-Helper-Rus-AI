
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AudioContextType, Playlist, Track } from '../types';

// Empty presets matching the requested folder structure
const INITIAL_PRESETS: Playlist[] = [
    // --- COMBAT ---
    { id: 'fight_boss', name: 'Fight Boss', category: 'combat', tracks: [] },
    { id: 'fight', name: 'Fight', category: 'combat', tracks: [] },
    { id: 'battle', name: 'Battle', category: 'combat', tracks: [] },
    { id: 'fight_low', name: 'Fight Low', category: 'combat', tracks: [] },
    { id: 'fight_tavern', name: 'Fight Tavern', category: 'combat', tracks: [] },
    { id: 'dark_epic', name: 'Dark Epic', category: 'combat', tracks: [] },
    { id: 'epic', name: 'Epic', category: 'combat', tracks: [] },
    { id: 'chase', name: 'Chase', category: 'combat', tracks: [] },
    { id: 'danger', name: 'Danger', category: 'combat', tracks: [] },
    { id: 'time_limit', name: 'Time Limit', category: 'combat', tracks: [] },

    // --- ATMOSPHERE ---
    { id: 'north', name: 'North', category: 'atmosphere', tracks: [] },
    { id: 'winter', name: 'Winter', category: 'atmosphere', tracks: [] },
    { id: 'forest', name: 'Forest', category: 'atmosphere', tracks: [] },
    { id: 'water', name: 'Water', category: 'atmosphere', tracks: [] },
    { id: 'travel', name: 'Travel', category: 'atmosphere', tracks: [] },
    { id: 'calm', name: 'Calm', category: 'atmosphere', tracks: [] },
    { id: 'dungeon', name: 'Dungeon', category: 'atmosphere', tracks: [] },

    // --- CITY ---
    { id: 'city', name: 'City', category: 'city', tracks: [] },
    { id: 'village', name: 'Village', category: 'city', tracks: [] },
    { id: 'tavern', name: 'Tavern', category: 'city', tracks: [] },
    { id: 'market', name: 'Market', category: 'city', tracks: [] },
    { id: 'castle', name: 'Castle', category: 'city', tracks: [] },
    { id: 'ball', name: 'Ball', category: 'city', tracks: [] },

    // --- HORROR ---
    { id: 'horror', name: 'Horror', category: 'horror', tracks: [] },
    { id: 'ghost', name: 'Ghost', category: 'horror', tracks: [] },
    { id: 'death', name: 'Death', category: 'horror', tracks: [] },
    { id: 'abomination', name: 'Abomination', category: 'horror', tracks: [] },
    { id: 'dungeon_deep', name: 'Dungeon Deep', category: 'horror', tracks: [] },
    { id: 'suspence', name: 'Suspense', category: 'horror', tracks: [] },

    // --- MYSTIC ---
    { id: 'mystic', name: 'Mystic', category: 'mystic', tracks: [] },
    { id: 'occultum', name: 'Occultum', category: 'mystic', tracks: [] },
    { id: 'choir', name: 'Choir', category: 'mystic', tracks: [] },
    { id: 'choir_dark', name: 'Choir Dark', category: 'mystic', tracks: [] },
    { id: 'singing', name: 'Singing', category: 'mystic', tracks: [] },
    { id: 'unknown', name: 'Unknown', category: 'mystic', tracks: [] },

    // --- DRAMA ---
    { id: 'sad', name: 'Sad', category: 'drama', tracks: [] },
    { id: 'sad_ambience', name: 'Sad Ambience', category: 'drama', tracks: [] },
    { id: 'love', name: 'Love', category: 'drama', tracks: [] },
    { id: 'lullaby', name: 'Lullaby', category: 'drama', tracks: [] },

    // --- SCIFI ---
    { id: 'cyberpunk', name: 'Cyberpunk', category: 'scifi', tracks: [] },

    // --- SPECIAL ---
    { id: 'winning', name: 'Winning', category: 'special', tracks: [] },
    { id: 'funny', name: 'Funny', category: 'special', tracks: [] },
    { id: 'arabic', name: 'Arabic', category: 'special', tracks: [] },
    { id: 'classic', name: 'Classic', category: 'special', tracks: [] },
];

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>(() => {
        const saved = localStorage.getItem('dmc_playlists');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    const hasNewStructure = parsed.some(p => p.id === 'fight_boss');
                    if (hasNewStructure) return parsed;
                }
            } catch(e) { console.warn('Failed to load playlists', e); }
        }
        return INITIAL_PRESETS; 
    });
    
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [isAutoDJEnabled, setIsAutoDJEnabled] = useState(true);
    const [volume, setVolume] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    // Mobile Unlock State
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activeSfxRef = useRef<Set<HTMLAudioElement>>(new Set());
    
    // File Management for Local Tracks (Memory Only)
    const fileRegistry = useRef<Map<string, File>>(new Map());
    const activeBlobUrl = useRef<string | null>(null);
    const lastTrackId = useRef<string | null>(null);

    // Initialize Audio Object and Unlock Logic
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = 'auto';
            audioRef.current.setAttribute('playsinline', 'true'); 
            
            audioRef.current.addEventListener('ended', handleTrackEnd);
            audioRef.current.addEventListener('error', (e: Event) => {
                const target = e.target as HTMLAudioElement;
                const err = target.error;
                let errMsg = "Ошибка воспроизведения.";
                if (err) {
                    if (err.code === 1) errMsg = "Загрузка прервана.";
                    else if (err.code === 2) errMsg = "Ошибка сети.";
                    else if (err.code === 3) errMsg = "Ошибка декодирования.";
                    else if (err.code === 4) errMsg = "Файл не найден.";
                    console.warn(`Audio Error (${err.code}): ${err.message}`);
                }
                if (isPlaying) {
                     // Try retry once for network errors
                     if (err && (err.code === 2 || err.code === 4)) {
                         setTimeout(() => {
                            // Only retry if still same track
                             if (audioRef.current && currentTrack && audioRef.current.src) {
                                 audioRef.current.load();
                                 audioRef.current.play().catch(console.warn);
                             }
                         }, 1000);
                     } else {
                         setError(errMsg);
                         setIsLoading(false);
                         setIsPlaying(false);
                     }
                }
            });
            audioRef.current.addEventListener('waiting', () => setIsLoading(true));
            audioRef.current.addEventListener('canplay', () => setIsLoading(false));
        }

        const unlockAudio = () => {
            if (audioRef.current && !isAudioUnlocked) {
                const playPromise = audioRef.current.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        if (!isPlaying) audioRef.current?.pause();
                        setIsAudioUnlocked(true);
                        ['click', 'touchstart', 'keydown'].forEach(evt => 
                            document.removeEventListener(evt, unlockAudio)
                        );
                    }).catch((err) => {
                        console.debug("Audio unlock deferred:", err);
                    });
                }
            }
        };

        if (!isAudioUnlocked) {
            ['click', 'touchstart', 'keydown'].forEach(evt => 
                document.addEventListener(evt, unlockAudio)
            );
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute('src');
            }
            if (activeBlobUrl.current) {
                URL.revokeObjectURL(activeBlobUrl.current);
            }
            ['click', 'touchstart', 'keydown'].forEach(evt => 
                document.removeEventListener(evt, unlockAudio)
            );
        };
    }, [isAudioUnlocked]);

    // Volume Sync
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        activeSfxRef.current.forEach(sfx => {
            sfx.volume = volume;
        });
    }, [volume]);

    // Playback Control with Lazy Loading
    useEffect(() => {
        const playAudio = async () => {
            if (!audioRef.current) return;
            
            if (currentTrack) {
                // If track changed, load new source
                if (currentTrack.id !== lastTrackId.current) {
                    // Cleanup previous blob
                    if (activeBlobUrl.current) {
                        URL.revokeObjectURL(activeBlobUrl.current);
                        activeBlobUrl.current = null;
                    }

                    let srcToPlay = '';

                    if (currentTrack.isLocal) {
                        const file = fileRegistry.current.get(currentTrack.id);
                        if (file) {
                            srcToPlay = URL.createObjectURL(file);
                            activeBlobUrl.current = srcToPlay;
                            setError(null);
                        } else {
                            setError("Файл не найден (треки сброшены). Перезагрузите файлы.");
                            setIsPlaying(false);
                            return;
                        }
                    } else {
                        srcToPlay = currentTrack.url;
                    }

                    audioRef.current.src = srcToPlay;
                    audioRef.current.load();
                    lastTrackId.current = currentTrack.id;
                }

                if (isPlaying) {
                    try {
                        await audioRef.current.play();
                        setError(null);
                    } catch (e: any) {
                        console.warn("Play attempt failed:", e);
                        if (e.name === 'NotAllowedError') {
                            setError("Нажмите любую кнопку, чтобы разрешить звук.");
                            setIsPlaying(false);
                        } else if (e.name !== 'AbortError') {
                            // Don't auto-pause on abort (e.g. switching tracks fast)
                            setIsPlaying(false);
                        }
                    }
                } else {
                    audioRef.current.pause();
                }
            } else {
                audioRef.current.pause();
                lastTrackId.current = null;
            }
        };

        playAudio();
    }, [currentTrack, isPlaying]);

    const handleTrackEnd = () => {
        playNext();
    };

    const playTrack = (track: Track, playlistId: string) => {
        if (currentTrack?.id === track.id && currentPlaylistId === playlistId) {
            togglePlay();
            return;
        }
        setCurrentPlaylistId(playlistId);
        setCurrentTrack(track);
        setIsPlaying(true);
        setError(null);
    };

    const playPlaylist = (playlistId: string, shuffle: boolean = false) => {
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist || !playlist.tracks || !playlist.tracks.length) return;

        setIsShuffle(shuffle);
        setCurrentPlaylistId(playlistId);
        
        const track = shuffle 
            ? playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)]
            : playlist.tracks[0];
            
        setCurrentTrack(track);
        setIsPlaying(true);
    };

    const togglePlay = () => {
        if (currentTrack) {
            setIsPlaying(!isPlaying);
        }
    };

    const toggleShuffle = () => {
        setIsShuffle(!isShuffle);
    };
    
    const toggleAutoDJ = () => {
        setIsAutoDJEnabled(!isAutoDJEnabled);
    };

    const getNextTrack = (direction: 'next' | 'prev') => {
        if (!currentPlaylistId || !currentTrack) return null;
        const playlist = playlists.find(p => p.id === currentPlaylistId);
        if (!playlist || !playlist.tracks) return null;

        if (isShuffle) {
             return playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)];
        }

        const currentIndex = playlist.tracks.findIndex(t => t.id === currentTrack.id);
        if (currentIndex === -1) return null;

        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % playlist.tracks.length;
        } else {
            nextIndex = (currentIndex - 1 + playlist.tracks.length) % playlist.tracks.length;
        }
        return playlist.tracks[nextIndex];
    };

    const playNext = () => {
        const next = getNextTrack('next');
        if (next) setCurrentTrack(next);
    };

    const playPrev = () => {
        const prev = getNextTrack('prev');
        if (prev) setCurrentTrack(prev);
    };

    const addTrackToPlaylist = (playlistId: string, track: Track) => {
        setPlaylists(prev => {
            const updated = prev.map(p => 
                p.id === playlistId 
                ? { ...p, tracks: [...p.tracks, track] }
                : p
            );
            localStorage.setItem('dmc_playlists', JSON.stringify(updated));
            return updated;
        });
    };

    const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
        setPlaylists(prev => {
            const updated = prev.map(p => 
                p.id === playlistId 
                ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
                : p
            );
            localStorage.setItem('dmc_playlists', JSON.stringify(updated));
            // Also clean up file registry if it was local
            if (fileRegistry.current.has(trackId)) {
                fileRegistry.current.delete(trackId);
            }
            return updated;
        });
    };

    const importLocalTracks = (playlistId: string, files: File[]) => {
        const newTracks: Track[] = files.map(f => {
            const trackId = Date.now().toString() + Math.random();
            // Store file in registry instead of creating blob URL immediately
            fileRegistry.current.set(trackId, f);
            
            return {
                id: trackId,
                title: f.name.replace(/\.[^/.]+$/, ""),
                url: "", // Lazy loaded
                isLocal: true
            };
        });

        setPlaylists(prev => {
            const updated = prev.map(p => 
                p.id === playlistId 
                ? { ...p, tracks: [...p.tracks, ...newTracks] }
                : p
            );
            localStorage.setItem('dmc_playlists', JSON.stringify(updated));
            return updated;
        });
    };

    const getFile = (trackId: string) => {
        return fileRegistry.current.get(trackId);
    };

    const setVolumeWrapper = (vol: number) => {
        setVolume(Math.max(0, Math.min(1, vol)));
    }

    const playSfx = (url: string) => {
        try {
            if (!url) return;
            const audio = new Audio(url);
            audio.volume = volume;
            audio.preload = 'auto'; 
            
            activeSfxRef.current.add(audio);
            
            audio.addEventListener('ended', () => {
                activeSfxRef.current.delete(audio);
            });
            
            audio.addEventListener('error', (e) => {
                console.warn(`SFX Error for ${url}:`, e);
                activeSfxRef.current.delete(audio);
            });

            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn("SFX Play failed:", error);
                    activeSfxRef.current.delete(audio);
                });
            }
        } catch (e) {
            console.error("SFX System Error:", e);
        }
    };

    const stopAllSfx = () => {
        activeSfxRef.current.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        activeSfxRef.current.clear();
    };

    const autoPlayMusic = (type: 'combat' | 'location' | 'travel' | 'victory', contextText: string = '') => {
        if (!isAutoDJEnabled) return;

        const text = contextText.toLowerCase();
        let targetId = 'travel'; // Default fallback

        if (type === 'victory') {
            targetId = 'winning';
        } else if (type === 'combat') {
             if (text.includes('boss') || text.includes('ancient')) targetId = 'fight_boss';
             else if (text.includes('low') || text.includes('rat') || text.includes('easy')) targetId = 'fight_low';
             else if (text.includes('tavern') || text.includes('brawl') || text.includes('inn')) targetId = 'fight_tavern';
             else if (text.includes('chase') || text.includes('run') || text.includes('flee')) targetId = 'chase';
             else if (text.includes('danger') || text.includes('threat')) targetId = 'danger';
             else if (text.includes('dark') && text.includes('epic')) targetId = 'dark_epic';
             else if (text.includes('epic')) targetId = 'epic';
             else if (text.includes('time') || text.includes('limit')) targetId = 'time_limit';
             else if (text.includes('battle') || text.includes('war')) targetId = 'battle';
             else targetId = 'fight';
        } else {
             // Location / Travel / Mood Automation
             if (text.includes('winter') || text.includes('snow') || text.includes('ice')) targetId = 'winter';
             else if (text.includes('north') || text.includes('cold')) targetId = 'north';
             else if (text.includes('forest') || text.includes('tree') || text.includes('nature')) targetId = 'forest';
             else if (text.includes('water') || text.includes('sea') || text.includes('river') || text.includes('ocean')) targetId = 'water';
             else if (text.includes('market') || text.includes('shop') || text.includes('trade')) targetId = 'market';
             else if (text.includes('tavern') || text.includes('inn') || text.includes('bar')) targetId = 'tavern';
             else if (text.includes('village') || text.includes('hamlet')) targetId = 'village';
             else if (text.includes('city') || text.includes('town')) targetId = 'city';
             else if (text.includes('castle') || text.includes('fort') || text.includes('keep')) targetId = 'castle';
             else if (text.includes('ball') || text.includes('dance') || text.includes('party')) targetId = 'ball';
             else if (text.includes('deep') || text.includes('underdark')) targetId = 'dungeon_deep';
             else if (text.includes('dungeon') || text.includes('cave')) targetId = 'dungeon';
             else if (text.includes('ghost') || text.includes('spirit') || text.includes('haunt')) targetId = 'ghost';
             else if (text.includes('death') || text.includes('dead')) targetId = 'death';
             else if (text.includes('abomination') || text.includes('monster')) targetId = 'abomination';
             else if (text.includes('occult') || text.includes('cult') || text.includes('ritual')) targetId = 'occultum';
             else if (text.includes('dark') && text.includes('choir')) targetId = 'choir_dark';
             else if (text.includes('choir') || text.includes('chant')) targetId = 'choir';
             else if (text.includes('mystic') || text.includes('magic')) targetId = 'mystic';
             else if (text.includes('singing') || text.includes('voice')) targetId = 'singing';
             else if (text.includes('sad') && text.includes('ambience')) targetId = 'sad_ambience';
             else if (text.includes('sad') || text.includes('cry')) targetId = 'sad';
             else if (text.includes('love') || text.includes('romance')) targetId = 'love';
             else if (text.includes('lullaby') || text.includes('sleep')) targetId = 'lullaby';
             else if (text.includes('cyber') || text.includes('tech') || text.includes('future')) targetId = 'cyberpunk';
             else if (text.includes('arabic') || text.includes('desert') || text.includes('sand')) targetId = 'arabic';
             else if (text.includes('funny') || text.includes('comedy') || text.includes('joke')) targetId = 'funny';
             else if (text.includes('classic') || text.includes('old')) targetId = 'classic';
             else if (text.includes('suspence') || text.includes('tension')) targetId = 'suspence';
             else if (text.includes('unknown') || text.includes('mystery')) targetId = 'unknown';
             else if (text.includes('calm') || text.includes('peace')) targetId = 'calm';
             else if (type === 'travel') targetId = 'travel';
             else targetId = 'calm';
        }

        if (currentPlaylistId !== targetId) {
            const playlist = playlists.find(p => p.id === targetId);
            if (playlist) {
                playPlaylist(targetId, true);
            }
        }
    };

    return (
        <AudioContext.Provider value={{
            playlists,
            currentTrack,
            currentPlaylistId,
            isPlaying,
            isShuffle,
            isAutoDJEnabled,
            volume,
            isLoading,
            error,
            playTrack,
            playPlaylist,
            togglePlay,
            toggleShuffle,
            toggleAutoDJ,
            playNext,
            playPrev,
            setVolume: setVolumeWrapper,
            addTrackToPlaylist,
            removeTrackFromPlaylist,
            importLocalTracks,
            getFile,
            playSfx,
            stopAllSfx,
            autoPlayMusic
        }}>
            {children}
        </AudioContext.Provider>
    );
};
