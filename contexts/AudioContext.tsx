
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AudioContextType, Playlist, Track } from '../types';
import { saveAudioToDB, getAudioFromDB, deleteAudioFromDB } from '../services/db';

const INITIAL_PRESETS: Playlist[] = [
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
    { id: 'north', name: 'North', category: 'atmosphere', tracks: [] },
    { id: 'winter', name: 'Winter', category: 'atmosphere', tracks: [] },
    { id: 'forest', name: 'Forest', category: 'atmosphere', tracks: [] },
    { id: 'water', name: 'Water', category: 'atmosphere', tracks: [] },
    { id: 'travel', name: 'Travel', category: 'atmosphere', tracks: [] },
    { id: 'calm', name: 'Calm', category: 'atmosphere', tracks: [] },
    { id: 'dungeon', name: 'Dungeon', category: 'atmosphere', tracks: [] },
    { id: 'city', name: 'City', category: 'city', tracks: [] },
    { id: 'village', name: 'Village', category: 'city', tracks: [] },
    { id: 'tavern', name: 'Tavern', category: 'city', tracks: [] },
    { id: 'market', name: 'Market', category: 'city', tracks: [] },
    { id: 'castle', name: 'Castle', category: 'city', tracks: [] },
    { id: 'ball', name: 'Ball', category: 'city', tracks: [] },
    { id: 'horror', name: 'Horror', category: 'horror', tracks: [] },
    { id: 'ghost', name: 'Ghost', category: 'horror', tracks: [] },
    { id: 'death', name: 'Death', category: 'horror', tracks: [] },
    { id: 'abomination', name: 'Abomination', category: 'horror', tracks: [] },
    { id: 'dungeon_deep', name: 'Dungeon Deep', category: 'horror', tracks: [] },
    { id: 'suspence', name: 'Suspense', category: 'horror', tracks: [] },
    { id: 'mystic', name: 'Mystic', category: 'mystic', tracks: [] },
    { id: 'occultum', name: 'Occultum', category: 'mystic', tracks: [] },
    { id: 'choir', name: 'Choir', category: 'mystic', tracks: [] },
    { id: 'choir_dark', name: 'Choir Dark', category: 'mystic', tracks: [] },
    { id: 'singing', name: 'Singing', category: 'mystic', tracks: [] },
    { id: 'unknown', name: 'Unknown', category: 'mystic', tracks: [] },
    { id: 'sad', name: 'Sad', category: 'drama', tracks: [] },
    { id: 'sad_ambience', name: 'Sad Ambience', category: 'drama', tracks: [] },
    { id: 'love', name: 'Love', category: 'drama', tracks: [] },
    { id: 'lullaby', name: 'Lullaby', category: 'drama', tracks: [] },
    { id: 'cyberpunk', name: 'Cyberpunk', category: 'scifi', tracks: [] },
    { id: 'winning', name: 'Winning', category: 'special', tracks: [] },
    { id: 'funny', name: 'Funny', category: 'special', tracks: [] },
    { id: 'arabic', name: 'Arabic', category: 'special', tracks: [] },
    { id: 'classic', name: 'Classic', category: 'special', tracks: [] },
];

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error('useAudio must be used within an AudioProvider');
    return context;
};

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>(() => {
        const saved = localStorage.getItem('dmc_playlists');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
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
    const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activeSfxRef = useRef<Set<HTMLAudioElement>>(new Set());
    const fileRegistry = useRef<Map<string, File>>(new Map());
    const activeBlobUrl = useRef<string | null>(null);
    const lastTrackId = useRef<string | null>(null);

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.preload = 'auto';
            audioRef.current.setAttribute('playsinline', 'true'); 
            audioRef.current.addEventListener('ended', () => playNext());
            audioRef.current.addEventListener('error', (e: Event) => {
                const err = (e.target as HTMLAudioElement).error;
                if (err && isPlaying) {
                    console.warn(`Audio Error (${err.code}): ${err.message}`);
                    setError("Ошибка загрузки файла. Возможно, память устройства переполнена.");
                    setIsPlaying(false);
                }
            });
            audioRef.current.addEventListener('waiting', () => setIsLoading(true));
            audioRef.current.addEventListener('canplay', () => setIsLoading(false));
        }

        const unlockAudio = () => {
            if (audioRef.current && !isAudioUnlocked) {
                audioRef.current.play().then(() => {
                    if (!isPlaying) audioRef.current?.pause();
                    setIsAudioUnlocked(true);
                    ['click', 'touchstart'].forEach(evt => document.removeEventListener(evt, unlockAudio));
                }).catch(console.debug);
            }
        };

        if (!isAudioUnlocked) {
            ['click', 'touchstart'].forEach(evt => document.addEventListener(evt, unlockAudio));
        }
        
        return () => {
            if (activeBlobUrl.current) URL.revokeObjectURL(activeBlobUrl.current);
        };
    }, [isAudioUnlocked]);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
        activeSfxRef.current.forEach(sfx => { sfx.volume = volume; });
    }, [volume]);

    useEffect(() => {
        const prepareAndPlay = async () => {
            if (!audioRef.current || !currentTrack) return;
            
            if (currentTrack.id !== lastTrackId.current) {
                setIsLoading(true);
                if (activeBlobUrl.current) {
                    URL.revokeObjectURL(activeBlobUrl.current);
                    activeBlobUrl.current = null;
                }

                let srcToPlay = '';
                if (currentTrack.isLocal) {
                    // 1. Try memory
                    let file = fileRegistry.current.get(currentTrack.id);
                    // 2. Try IndexedDB if memory empty (after reload)
                    if (!file) {
                        try {
                            file = await getAudioFromDB(currentTrack.id) || undefined;
                            if (file) fileRegistry.current.set(currentTrack.id, file);
                        } catch (e) { console.error("DB Restoration error", e); }
                    }

                    if (file) {
                        srcToPlay = URL.createObjectURL(file);
                        activeBlobUrl.current = srcToPlay;
                        setError(null);
                    } else {
                        setError("Файл не найден. Пожалуйста, перезагрузите его в плейлист.");
                        setIsPlaying(false);
                        setIsLoading(false);
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
                audioRef.current.play().catch(e => {
                    if (e.name !== 'AbortError') setIsPlaying(false);
                });
            } else {
                audioRef.current.pause();
            }
        };

        prepareAndPlay();
    }, [currentTrack, isPlaying]);

    const playTrack = (track: Track, playlistId: string) => {
        if (currentTrack?.id === track.id && currentPlaylistId === playlistId) {
            setIsPlaying(!isPlaying);
            return;
        }
        setCurrentPlaylistId(playlistId);
        setCurrentTrack(track);
        setIsPlaying(true);
        setError(null);
    };

    const playPlaylist = (playlistId: string, shuffle: boolean = false) => {
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist || !playlist.tracks.length) return;
        setIsShuffle(shuffle);
        setCurrentPlaylistId(playlistId);
        const track = shuffle ? playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)] : playlist.tracks[0];
        setCurrentTrack(track);
        setIsPlaying(true);
    };

    const playNext = () => {
        if (!currentPlaylistId || !currentTrack) return;
        const playlist = playlists.find(p => p.id === currentPlaylistId);
        if (!playlist || !playlist.tracks.length) return;
        const idx = playlist.tracks.findIndex(t => t.id === currentTrack.id);
        const nextIdx = isShuffle ? Math.floor(Math.random() * playlist.tracks.length) : (idx + 1) % playlist.tracks.length;
        setCurrentTrack(playlist.tracks[nextIdx]);
    };

    const playPrev = () => {
        if (!currentPlaylistId || !currentTrack) return;
        const playlist = playlists.find(p => p.id === currentPlaylistId);
        if (!playlist || !playlist.tracks.length) return;
        const idx = playlist.tracks.findIndex(t => t.id === currentTrack.id);
        const prevIdx = (idx - 1 + playlist.tracks.length) % playlist.tracks.length;
        setCurrentTrack(playlist.tracks[prevIdx]);
    };

    const addTrackToPlaylist = (playlistId: string, track: Track) => {
        setPlaylists(prev => {
            const updated = prev.map(p => p.id === playlistId ? { ...p, tracks: [...p.tracks, track] } : p);
            localStorage.setItem('dmc_playlists', JSON.stringify(updated));
            return updated;
        });
    };

    const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
        setPlaylists(prev => {
            const updated = prev.map(p => p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } : p);
            localStorage.setItem('dmc_playlists', JSON.stringify(updated));
            return updated;
        });
        fileRegistry.current.delete(trackId);
        deleteAudioFromDB(trackId).catch(console.warn);
    };

    const importLocalTracks = async (playlistId: string, files: File[]) => {
        const newTracks: Track[] = [];
        for (const file of files) {
            const id = Date.now().toString() + Math.random();
            try {
                await saveAudioToDB(id, file);
                fileRegistry.current.set(id, file);
                newTracks.push({
                    id,
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    url: "",
                    isLocal: true
                });
            } catch (e) {
                console.error("Failed to save audio to DB", e);
            }
        }

        setPlaylists(prev => {
            const updated = prev.map(p => p.id === playlistId ? { ...p, tracks: [...p.tracks, ...newTracks] } : p);
            localStorage.setItem('dmc_playlists', JSON.stringify(updated));
            return updated;
        });
    };

    return (
        <AudioContext.Provider value={{
            playlists, currentTrack, currentPlaylistId, isPlaying, isShuffle, isAutoDJEnabled,
            volume, isLoading, error, playTrack, playPlaylist, togglePlay: () => setIsPlaying(!isPlaying),
            toggleShuffle: () => setIsShuffle(!isShuffle), toggleAutoDJ: () => setIsAutoDJEnabled(!isAutoDJEnabled),
            playNext, playPrev, setVolume, addTrackToPlaylist, removeTrackFromPlaylist, importLocalTracks,
            getFile: (id) => fileRegistry.current.get(id),
            playSfx: (url) => { const a = new Audio(url); a.volume = volume; a.play(); activeSfxRef.current.add(a); },
            stopAllSfx: () => { activeSfxRef.current.forEach(a => a.pause()); activeSfxRef.current.clear(); },
            autoPlayMusic: () => {} // Simplified for core functionality
        }}>
            {children}
        </AudioContext.Provider>
    );
};
