import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AudioContextType, Playlist, Track, AudioCategory } from '../types';

// --- HELPER FOR STABLE URLS ---
const getTrackUrl = (filename: string) => {
    const name = filename.replace(/_/g, '%20');
    return `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${name}.mp3`;
};

const INITIAL_PRESETS: Playlist[] = [
    // --- ATMOSPHERE ---
    { 
        id: 'forest', 
        name: '🌲 Лес', 
        category: 'atmosphere', 
        tracks: [
            { id: 'f1', title: 'Forest of Fear', artist: 'Kevin MacLeod', url: getTrackUrl('Forest_of_Fear') },
            { id: 'f2', title: 'Sovereign', artist: 'Kevin MacLeod', url: getTrackUrl('Sovereign') },
            { id: 'f3', title: 'Apprehension', artist: 'Kevin MacLeod', url: getTrackUrl('Apprehension') },
            { id: 'f4', title: 'Elf Meditation', artist: 'Kevin MacLeod', url: getTrackUrl('Elf_Meditation') },
            { id: 'f5', title: 'Summer Day', artist: 'Kevin MacLeod', url: getTrackUrl('Summer_Day') },
            { id: 'f6', title: 'Reaching Out', artist: 'Kevin MacLeod', url: getTrackUrl('Reaching_Out') },
            { id: 'f7', title: 'Morning', artist: 'Kevin MacLeod', url: getTrackUrl('Morning') },
            { id: 'f8', title: 'River Valley Breakdown', artist: 'Kevin MacLeod', url: getTrackUrl('River_Valley_Breakdown') },
            { id: 'f9', title: 'Eternal Hope', artist: 'Kevin MacLeod', url: getTrackUrl('Eternal_Hope') },
            { id: 'f10', title: 'Cattails', artist: 'Kevin MacLeod', url: getTrackUrl('Cattails') },
            { id: 'f11', title: 'Almost in F', artist: 'Kevin MacLeod', url: getTrackUrl('Almost_in_F') },
            { id: 'f12', title: 'At Rest', artist: 'Kevin MacLeod', url: getTrackUrl('At_Rest') },
            { id: 'f13', title: 'Colorless Aura', artist: 'Kevin MacLeod', url: getTrackUrl('Colorless_Aura') },
            { id: 'f14', title: 'Fluidscape', artist: 'Kevin MacLeod', url: getTrackUrl('Fluidscape') },
            { id: 'f15', title: 'Garden Music', artist: 'Kevin MacLeod', url: getTrackUrl('Garden_Music') }
        ] 
    },
    { 
        id: 'dungeon', 
        name: '🏰 Подземелье', 
        category: 'atmosphere', 
        tracks: [
            { id: 'd1', title: 'Aftermath', artist: 'Kevin MacLeod', url: getTrackUrl('Aftermath') },
            { id: 'd2', title: 'Ancient Rite', artist: 'Kevin MacLeod', url: getTrackUrl('Ancient_Rite') },
            { id: 'd3', title: 'Decay', artist: 'Kevin MacLeod', url: getTrackUrl('Decay') },
            { id: 'd4', title: 'Darkling', artist: 'Kevin MacLeod', url: getTrackUrl('Darkling') },
            { id: 'd5', title: 'The Dread', artist: 'Kevin MacLeod', url: getTrackUrl('The_Dread') },
            { id: 'd6', title: 'Oppressive Gloom', artist: 'Kevin MacLeod', url: getTrackUrl('Oppressive_Gloom') },
            { id: 'd7', title: 'Shadowlands', artist: 'Kevin MacLeod', url: getTrackUrl('Shadowlands_1_-_Horizon') },
            { id: 'd8', title: 'Gloom Horizon', artist: 'Kevin MacLeod', url: getTrackUrl('Gloom_Horizon') },
            { id: 'd9', title: 'Static Motion', artist: 'Kevin MacLeod', url: getTrackUrl('Static_Motion') },
            { id: 'd10', title: 'Penumbra', artist: 'Kevin MacLeod', url: getTrackUrl('Penumbra') },
            { id: 'd11', title: 'Asian Drums', artist: 'Kevin MacLeod', url: getTrackUrl('Asian_Drums') },
            { id: 'd12', title: 'Awkward Meeting', artist: 'Kevin MacLeod', url: getTrackUrl('Awkward_Meeting') },
            { id: 'd13', title: 'Blue Sizzle', artist: 'Kevin MacLeod', url: getTrackUrl('Blue_Sizzle') },
            { id: 'd14', title: 'Bump in the Night', artist: 'Kevin MacLeod', url: getTrackUrl('Bump_in_the_Night') },
            { id: 'd15', title: 'Dark Walk', artist: 'Kevin MacLeod', url: getTrackUrl('Dark_Walk') },
            { id: 'd16', title: 'Deep Haze', artist: 'Kevin MacLeod', url: getTrackUrl('Deep_Haze') },
            { id: 'd17', title: 'Dread', artist: 'Kevin MacLeod', url: getTrackUrl('Dread') },
            { id: 'd18', title: 'Echoes of Time', artist: 'Kevin MacLeod', url: getTrackUrl('Echoes_of_Time') },
            { id: 'd19', title: 'Ghost Story', artist: 'Kevin MacLeod', url: getTrackUrl('Ghost_Story') },
            { id: 'd20', title: 'Giant Wyrm', artist: 'Kevin MacLeod', url: getTrackUrl('Giant_Wyrm') }
        ] 
    },
    { 
        id: 'winter', 
        name: '❄️ Зима / Север', 
        category: 'atmosphere', 
        tracks: [
            { id: 'w1', title: 'Snow Drop', artist: 'Kevin MacLeod', url: getTrackUrl('Snow_Drop') },
            { id: 'w2', title: 'Winter Reflections', artist: 'Kevin MacLeod', url: getTrackUrl('Winter_Reflections') },
            { id: 'w3', title: 'Frost Waltz', artist: 'Kevin MacLeod', url: getTrackUrl('Frost_Waltz') },
            { id: 'w4', title: 'Ice Demon', artist: 'Kevin MacLeod', url: getTrackUrl('Ice_Demon') },
            { id: 'w5', title: 'Frozen Star', artist: 'Kevin MacLeod', url: getTrackUrl('Frozen_Star') },
            { id: 'w6', title: 'White', artist: 'Kevin MacLeod', url: getTrackUrl('White') },
            { id: 'w7', title: 'Angevin B', artist: 'Kevin MacLeod', url: getTrackUrl('Angevin_B') },
            { id: 'w8', title: 'Relaxing Piano', artist: 'Kevin MacLeod', url: getTrackUrl('Relaxing_Piano_Music') },
            { id: 'w9', title: 'Meditation Impromptu 01', artist: 'Kevin MacLeod', url: getTrackUrl('Meditation_Impromptu_01') },
            { id: 'w10', title: 'Despair and Triumph', artist: 'Kevin MacLeod', url: getTrackUrl('Despair_and_Triumph') }
        ] 
    },
    { 
        id: 'sea', 
        name: '🌊 Море / Пираты', 
        category: 'atmosphere', 
        tracks: [
            { id: 's1', title: 'Expeditionary', artist: 'Kevin MacLeod', url: getTrackUrl('Expeditionary') },
            { id: 's2', title: 'Five Armies', artist: 'Kevin MacLeod', url: getTrackUrl('Five_Armies') },
            { id: 's3', title: 'Lord of the Land', artist: 'Kevin MacLeod', url: getTrackUrl('Lord_of_the_Land') },
            { id: 's4', title: 'Impact Prelude', artist: 'Kevin MacLeod', url: getTrackUrl('Impact_Prelude') },
            { id: 's5', title: 'Heroic Age', artist: 'Kevin MacLeod', url: getTrackUrl('Heroic_Age') },
            { id: 's6', title: 'Master of the Feast', artist: 'Kevin MacLeod', url: getTrackUrl('Master_of_the_Feast') },
            { id: 's7', title: 'Teller of the Tales', artist: 'Kevin MacLeod', url: getTrackUrl('Teller_of_the_Tales') },
            { id: 's8', title: 'Fiddles McGinty', artist: 'Kevin MacLeod', url: getTrackUrl('Fiddles_McGinty') },
            { id: 's9', title: 'Minstrel Guild', artist: 'Kevin MacLeod', url: getTrackUrl('Minstrel_Guild') },
            { id: 's10', title: 'Skye Cuillin', artist: 'Kevin MacLeod', url: getTrackUrl('Skye_Cuillin') },
            { id: 's11', title: 'Travelers', artist: 'Kevin MacLeod', url: getTrackUrl('Travelers') },
            { id: 's12', title: 'Village Consort', artist: 'Kevin MacLeod', url: getTrackUrl('Village_Consort') }
        ] 
    },
    { 
        id: 'fey', 
        name: '✨ Фейвайлд / Магия', 
        category: 'atmosphere', 
        tracks: [
            { id: 'fy1', title: 'Angel Share', artist: 'Kevin MacLeod', url: getTrackUrl('Angel_Share') },
            { id: 'fy2', title: 'At Rest', artist: 'Kevin MacLeod', url: getTrackUrl('At_Rest') },
            { id: 'fy3', title: 'Colorless Aura', artist: 'Kevin MacLeod', url: getTrackUrl('Colorless_Aura') },
            { id: 'fy4', title: 'Dreamy Flashback', artist: 'Kevin MacLeod', url: getTrackUrl('Dreamy_Flashback') },
            { id: 'fy5', title: 'Eternal Hope', artist: 'Kevin MacLeod', url: getTrackUrl('Eternal_Hope') },
            { id: 'fy6', title: 'Fairytale Waltz', artist: 'Kevin MacLeod', url: getTrackUrl('Fairytale_Waltz') },
            { id: 'fy7', title: 'Frost Waltz', artist: 'Kevin MacLeod', url: getTrackUrl('Frost_Waltz') },
            { id: 'fy8', title: 'Frozen Star', artist: 'Kevin MacLeod', url: getTrackUrl('Frozen_Star') },
            { id: 'fy9', title: 'Healing', artist: 'Kevin MacLeod', url: getTrackUrl('Healing') },
            { id: 'fy10', title: 'Somewhere Sunny', artist: 'Kevin MacLeod', url: getTrackUrl('Somewhere_Sunny') },
            { id: 'fy11', title: 'Enchanted Valley', artist: 'Kevin MacLeod', url: getTrackUrl('Enchanted_Valley') },
            { id: 'fy12', title: 'Midsummer Sky', artist: 'Kevin MacLeod', url: getTrackUrl('Midsummer_Sky') }
        ] 
    },
    { 
        id: 'tavern', 
        name: '🍺 Таверна', 
        category: 'atmosphere', 
        tracks: [
            { id: 't1', title: 'Thatched Villagers', artist: 'Kevin MacLeod', url: getTrackUrl('Thatched_Villagers') },
            { id: 't2', title: 'Achaidh Cheide', artist: 'Kevin MacLeod', url: getTrackUrl('Achaidh_Cheide') },
            { id: 't3', title: 'Folk Round', artist: 'Kevin MacLeod', url: getTrackUrl('Folk_Round') },
            { id: 't4', title: 'Master of the Feast', artist: 'Kevin MacLeod', url: getTrackUrl('Master_of_the_Feast') },
            { id: 't5', title: 'Skye Cuillin', artist: 'Kevin MacLeod', url: getTrackUrl('Skye_Cuillin') },
            { id: 't6', title: 'Celtic Impulse', artist: 'Kevin MacLeod', url: getTrackUrl('Celtic_Impulse') },
            { id: 't7', title: 'Fiddles McGinty', artist: 'Kevin MacLeod', url: getTrackUrl('Fiddles_McGinty') },
            { id: 't8', title: 'Minstrel Guild', artist: 'Kevin MacLeod', url: getTrackUrl('Minstrel_Guild') },
            { id: 't9', title: 'The Parting', artist: 'Kevin MacLeod', url: getTrackUrl('The_Parting') },
            { id: 't10', title: 'Bonnie Ends', artist: 'Kevin MacLeod', url: getTrackUrl('Bonnie_Ends') },
            { id: 't11', title: 'Barroom Ballet', artist: 'Kevin MacLeod', url: getTrackUrl('Barroom_Ballet') },
            { id: 't12', title: 'Carrigfergus', artist: 'Kevin MacLeod', url: getTrackUrl('Carrigfergus') },
            { id: 't13', title: 'Celtic Rumours', artist: 'Kevin MacLeod', url: getTrackUrl('Celtic_Rumours') },
            { id: 't14', title: 'Doh De Oh', artist: 'Kevin MacLeod', url: getTrackUrl('Doh_De_Oh') },
            { id: 't15', title: 'Earthy Crust', artist: 'Kevin MacLeod', url: getTrackUrl('Earthy_Crust') },
            { id: 't16', title: 'Fiddles McGinty', artist: 'Kevin MacLeod', url: getTrackUrl('Fiddles_McGinty') }
        ] 
    },
    { 
        id: 'city', 
        name: '🏙️ Город', 
        category: 'atmosphere', 
        tracks: [
            { id: 'c1', title: 'Minstrel Guild', artist: 'Kevin MacLeod', url: getTrackUrl('Minstrel_Guild') },
            { id: 'c2', title: 'Lord of the Land', artist: 'Kevin MacLeod', url: getTrackUrl('Lord_of_the_Land') },
            { id: 'c3', title: 'Adventure Meme', artist: 'Kevin MacLeod', url: getTrackUrl('Adventure_Meme') },
            { id: 'c4', title: 'Suonatore di Liuto', artist: 'Kevin MacLeod', url: getTrackUrl('Suonatore_di_Liuto') },
            { id: 'c5', title: 'Procession of the King', artist: 'Kevin MacLeod', url: getTrackUrl('Procession_of_the_King') },
            { id: 'c6', title: 'The Builder', artist: 'Kevin MacLeod', url: getTrackUrl('The_Builder') },
            { id: 'c7', title: 'Fairytale Waltz', artist: 'Kevin MacLeod', url: getTrackUrl('Fairytale_Waltz') },
            { id: 'c8', title: 'Angevin', artist: 'Kevin MacLeod', url: getTrackUrl('Angevin_-_Thatched_Villagers') },
            { id: 'c9', title: 'Court of the Queen', artist: 'Kevin MacLeod', url: getTrackUrl('Court_of_the_Queen') },
            { id: 'c10', title: 'Teller of the Tales', artist: 'Kevin MacLeod', url: getTrackUrl('Teller_of_the_Tales') },
            { id: 'c11', title: 'Village Consort', artist: 'Kevin MacLeod', url: getTrackUrl('Village_Consort') },
            { id: 'c12', title: 'Virtutes Instrumenti', artist: 'Kevin MacLeod', url: getTrackUrl('Virtutes_Instrumenti') },
            { id: 'c13', title: 'Pippin the Hunchback', artist: 'Kevin MacLeod', url: getTrackUrl('Pippin_the_Hunchback') },
            { id: 'c14', title: 'Master of the Feast', artist: 'Kevin MacLeod', url: getTrackUrl('Master_of_the_Feast') },
            { id: 'c15', title: 'Folk Round', artist: 'Kevin MacLeod', url: getTrackUrl('Folk_Round') }
        ] 
    },
    { 
        id: 'eastern', 
        name: '🕌 Восток / Пустыня', 
        category: 'atmosphere', 
        tracks: [
            { id: 'e1', title: 'Desert City', artist: 'Kevin MacLeod', url: getTrackUrl('Desert_City') },
            { id: 'e2', title: 'Ishikari Lore', artist: 'Kevin MacLeod', url: getTrackUrl('Ishikari_Lore') },
            { id: 'e3', title: 'Moorland', artist: 'Kevin MacLeod', url: getTrackUrl('Moorland') },
            { id: 'e4', title: 'Dhaka', artist: 'Kevin MacLeod', url: getTrackUrl('Dhaka') },
            { id: 'e5', title: 'Impact Intermezzo', artist: 'Kevin MacLeod', url: getTrackUrl('Impact_Intermezzo') },
            { id: 'e6', title: 'Raga of the River', artist: 'Kevin MacLeod', url: getTrackUrl('Raga_of_the_River_-_Chahra') },
            { id: 'e7', title: 'Rite of Passage', artist: 'Kevin MacLeod', url: getTrackUrl('Rite_of_Passage') },
            { id: 'e8', title: 'Healing', artist: 'Kevin MacLeod', url: getTrackUrl('Healing') },
            { id: 'e9', title: 'Accralate', artist: 'Kevin MacLeod', url: getTrackUrl('Accralate') },
            { id: 'e10', title: 'Lost Frontier', artist: 'Kevin MacLeod', url: getTrackUrl('Lost_Frontier') },
            { id: 'e11', title: 'Asian Drums', artist: 'Kevin MacLeod', url: getTrackUrl('Asian_Drums') },
            { id: 'e12', title: 'Kumasi Groove', artist: 'Kevin MacLeod', url: getTrackUrl('Kumasi_Groove') },
            { id: 'e13', title: 'Tabuk', artist: 'Kevin MacLeod', url: getTrackUrl('Tabuk') }
        ] 
    },

    // --- COMBAT ---
    { 
        id: 'combat', 
        name: '⚔️ Бой (Обычный)', 
        category: 'combat', 
        tracks: [
            { id: 'cmb1', title: 'Curse of the Scarab', artist: 'Kevin MacLeod', url: getTrackUrl('Curse_of_the_Scarab') },
            { id: 'cmb2', title: 'Clash Defiant', artist: 'Kevin MacLeod', url: getTrackUrl('Clash_Defiant') },
            { id: 'cmb3', title: 'Hitman', artist: 'Kevin MacLeod', url: getTrackUrl('Hitman') },
            { id: 'cmb4', title: 'Volatile Reaction', artist: 'Kevin MacLeod', url: getTrackUrl('Volatile_Reaction') },
            { id: 'cmb5', title: 'Killers', artist: 'Kevin MacLeod', url: getTrackUrl('Killers') },
            { id: 'cmb6', title: 'The Descent', artist: 'Kevin MacLeod', url: getTrackUrl('The_Descent') },
            { id: 'cmb7', title: 'Five Armies', artist: 'Kevin MacLeod', url: getTrackUrl('Five_Armies') },
            { id: 'cmb8', title: 'Prelude and Action', artist: 'Kevin MacLeod', url: getTrackUrl('Prelude_and_Action') },
            { id: 'cmb9', title: 'Rites', artist: 'Kevin MacLeod', url: getTrackUrl('Rites') },
            { id: 'cmb10', title: 'Stormfront', artist: 'Kevin MacLeod', url: getTrackUrl('Stormfront') }
        ] 
    },
    {
        id: 'victory',
        name: '🏆 Победа',
        category: 'special',
        tracks: [
            { id: 'vic1', title: 'Heroic Age', artist: 'Kevin MacLeod', url: getTrackUrl('Heroic_Age') },
            { id: 'vic2', title: 'Winner Winner', artist: 'Kevin MacLeod', url: getTrackUrl('Winner_Winner') }
        ]
    }
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
        return saved ? JSON.parse(saved) : INITIAL_PRESETS;
    });
    
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Save custom playlists
    useEffect(() => {
        localStorage.setItem('dmc_playlists', JSON.stringify(playlists));
    }, [playlists]);

    // Initialize Audio Object
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.addEventListener('ended', handleTrackEnd);
            audioRef.current.addEventListener('error', (e) => {
                console.error("Audio error", e);
                setError("Ошибка воспроизведения");
                setIsLoading(false);
                setIsPlaying(false);
            });
            audioRef.current.addEventListener('waiting', () => setIsLoading(true));
            audioRef.current.addEventListener('canplay', () => setIsLoading(false));
        }
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = "";
            }
        };
    }, []);

    // Volume Sync
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    // Playback Control
    useEffect(() => {
        const playAudio = async () => {
            if (!audioRef.current || !currentTrack) return;
            
            if (audioRef.current.src !== currentTrack.url) {
                audioRef.current.src = currentTrack.url;
                audioRef.current.load();
            }

            if (isPlaying) {
                try {
                    await audioRef.current.play();
                    setError(null);
                } catch (e: any) {
                    console.error("Play error", e);
                    // Don't show error immediately for interaction requirement, retry or show UI hint
                    if (e.name !== 'AbortError') {
                        setError("Не удалось воспроизвести. Нажмите Play.");
                        setIsPlaying(false);
                    }
                }
            } else {
                audioRef.current.pause();
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
        if (!playlist || !playlist.tracks.length) return;

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

    const getNextTrack = (direction: 'next' | 'prev') => {
        if (!currentPlaylistId || !currentTrack) return null;
        const playlist = playlists.find(p => p.id === currentPlaylistId);
        if (!playlist) return null;

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
        setPlaylists(prev => prev.map(p => 
            p.id === playlistId 
            ? { ...p, tracks: [...p.tracks, track] }
            : p
        ));
    };

    const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
        setPlaylists(prev => prev.map(p => 
            p.id === playlistId 
            ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
            : p
        ));
    };

    const importLocalTracks = (playlistId: string, files: File[]) => {
        const newTracks: Track[] = files.map(f => ({
            id: Date.now().toString() + Math.random(),
            title: f.name.replace(/\.[^/.]+$/, ""),
            url: URL.createObjectURL(f),
            isLocal: true
        }));

        setPlaylists(prev => prev.map(p => 
            p.id === playlistId 
            ? { ...p, tracks: [...p.tracks, ...newTracks] }
            : p
        ));
    };

    const setVolumeWrapper = (vol: number) => {
        setVolume(Math.max(0, Math.min(1, vol)));
    }

    return (
        <AudioContext.Provider value={{
            playlists,
            currentTrack,
            currentPlaylistId,
            isPlaying,
            isShuffle,
            volume,
            isLoading,
            error,
            playTrack,
            playPlaylist,
            togglePlay,
            toggleShuffle,
            playNext,
            playPrev,
            setVolume: setVolumeWrapper,
            addTrackToPlaylist,
            removeTrackFromPlaylist,
            importLocalTracks
        }}>
            {children}
        </AudioContext.Provider>
    );
};