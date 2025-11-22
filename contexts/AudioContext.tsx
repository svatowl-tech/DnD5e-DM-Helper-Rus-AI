
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
            { id: 'f10', title: 'Cattails', artist: 'Kevin MacLeod', url: getTrackUrl('Cattails') }
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
            { id: 'd10', title: 'Penumbra', artist: 'Kevin MacLeod', url: getTrackUrl('Penumbra') }
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
            { id: 't10', title: 'Bonnie Ends', artist: 'Kevin MacLeod', url: getTrackUrl('Bonnie_Ends') }
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
            { id: 'c10', title: 'Teller of the Tales', artist: 'Kevin MacLeod', url: getTrackUrl('Teller_of_the_Tales') }
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
            { id: 'e10', title: 'Lost Frontier', artist: 'Kevin MacLeod', url: getTrackUrl('Lost_Frontier') }
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
            { id: 'cmb3', title: 'Prelude and Action', artist: 'Kevin MacLeod', url: getTrackUrl('Prelude_and_Action') },
            { id: 'cmb4', title: 'Rites', artist: 'Kevin MacLeod', url: getTrackUrl('Rites') },
            { id: 'cmb5', title: 'Strength of the Titans', artist: 'Kevin MacLeod', url: getTrackUrl('Strength_of_the_Titans') },
            { id: 'cmb6', title: 'Crossing the Chasm', artist: 'Kevin MacLeod', url: getTrackUrl('Crossing_the_Chasm') },
            { id: 'cmb7', title: 'Corruption', artist: 'Kevin MacLeod', url: getTrackUrl('Corruption') },
            { id: 'cmb8', title: 'Mechanolith', artist: 'Kevin MacLeod', url: getTrackUrl('Mechanolith') },
            { id: 'cmb9', title: 'Stormfront', artist: 'Kevin MacLeod', url: getTrackUrl('Stormfront') },
            { id: 'cmb10', title: 'Black Vortex', artist: 'Kevin MacLeod', url: getTrackUrl('Black_Vortex') }
        ] 
    },
    { 
        id: 'boss', 
        name: '👹 Эпичный Босс', 
        category: 'combat', 
        tracks: [
            { id: 'boss1', title: 'Volatile Reaction', artist: 'Kevin MacLeod', url: getTrackUrl('Volatile_Reaction') },
            { id: 'boss2', title: 'Hitman', artist: 'Kevin MacLeod', url: getTrackUrl('Hitman') },
            { id: 'boss3', title: 'Five Armies', artist: 'Kevin MacLeod', url: getTrackUrl('Five_Armies') },
            { id: 'boss4', title: 'Killers', artist: 'Kevin MacLeod', url: getTrackUrl('Killers') },
            { id: 'boss5', title: 'Unseen Horrors', artist: 'Kevin MacLeod', url: getTrackUrl('Unseen_Horrors') },
            { id: 'boss6', title: 'Final Count', artist: 'Kevin MacLeod', url: getTrackUrl('The_Final_Count') },
            { id: 'boss7', title: 'Grim Idol', artist: 'Kevin MacLeod', url: getTrackUrl('Grim_Idol') },
            { id: 'boss8', title: 'Harmful or Fatal', artist: 'Kevin MacLeod', url: getTrackUrl('Harmful_or_Fatal') },
            { id: 'boss9', title: 'Aggressor', artist: 'Kevin MacLeod', url: getTrackUrl('Aggressor') },
            { id: 'boss10', title: 'Chaos Gunn', artist: 'Kevin MacLeod', url: getTrackUrl('Chaos_Gunn') }
        ] 
    },
    { 
        id: 'chase', 
        name: '🐎 Погоня', 
        category: 'combat', 
        tracks: [
            { id: 'ch1', title: 'Movement Proposition', artist: 'Kevin MacLeod', url: getTrackUrl('Movement_Proposition') },
            { id: 'ch2', title: 'Take a Chance', artist: 'Kevin MacLeod', url: getTrackUrl('Take_a_Chance') },
            { id: 'ch3', title: 'Future Gladiator', artist: 'Kevin MacLeod', url: getTrackUrl('Future_Gladiator') },
            { id: 'ch4', title: 'Rocket Power', artist: 'Kevin MacLeod', url: getTrackUrl('Rocket_Power') },
            { id: 'ch5', title: 'Cut and Run', artist: 'Kevin MacLeod', url: getTrackUrl('Cut_and_Run') },
            { id: 'ch6', title: 'Deadly Roulette', artist: 'Kevin MacLeod', url: getTrackUrl('Deadly_Roulette') },
            { id: 'ch7', title: 'Action', artist: 'Kevin MacLeod', url: getTrackUrl('Action') },
            { id: 'ch8', title: 'Epic Unease', artist: 'Kevin MacLeod', url: getTrackUrl('Epic_Unease') },
            { id: 'ch9', title: 'Hustle', artist: 'Kevin MacLeod', url: getTrackUrl('Hustle') },
            { id: 'ch10', title: 'Zap Beat', artist: 'Kevin MacLeod', url: getTrackUrl('Zap_Beat') }
        ] 
    },
    { 
        id: 'victory', 
        name: '🏆 Победа', 
        category: 'combat', 
        tracks: [
            { id: 'v1', title: 'Heroic Age', artist: 'Kevin MacLeod', url: getTrackUrl('Heroic_Age') },
            { id: 'v2', title: 'The Curtain Rises', artist: 'Kevin MacLeod', url: getTrackUrl('The_Curtain_Rises') },
            { id: 'v3', title: 'Call to Adventure', artist: 'Kevin MacLeod', url: getTrackUrl('Call_to_Adventure') },
            { id: 'v4', title: 'Enchanted Valley', artist: 'Kevin MacLeod', url: getTrackUrl('Enchanted_Valley') },
            { id: 'v5', title: 'Somewhere Sunny', artist: 'Kevin MacLeod', url: getTrackUrl('Somewhere_Sunny') },
            { id: 'v6', title: 'Windswept', artist: 'Kevin MacLeod', url: getTrackUrl('Windswept') },
            { id: 'v7', title: 'Reunited', artist: 'Kevin MacLeod', url: getTrackUrl('Reunited') },
            { id: 'v8', title: 'Easy Return', artist: 'Kevin MacLeod', url: getTrackUrl('Easy_Return') },
            { id: 'v9', title: 'Fiddles McGinty', artist: 'Kevin MacLeod', url: getTrackUrl('Fiddles_McGinty') },
            { id: 'v10', title: 'Living Voyage', artist: 'Kevin MacLeod', url: getTrackUrl('Living_Voyage') }
        ] 
    },

    // --- MOOD ---
    { 
        id: 'mysterious', 
        name: '🔮 Загадочное', 
        category: 'mood', 
        tracks: [
            { id: 'm1', title: 'Private Reflection', artist: 'Kevin MacLeod', url: getTrackUrl('Private_Reflection') },
            { id: 'm2', title: 'Mesmerize', artist: 'Kevin MacLeod', url: getTrackUrl('Mesmerize') },
            { id: 'm3', title: 'Virtutes Instrumenti', artist: 'Kevin MacLeod', url: getTrackUrl('Virtutes_Instrumenti') },
            { id: 'm4', title: 'Grave Blow', artist: 'Kevin MacLeod', url: getTrackUrl('Grave_Blow') },
            { id: 'm5', title: 'Dark Walk', artist: 'Kevin MacLeod', url: getTrackUrl('Dark_Walk') },
            { id: 'm6', title: 'Intuit256', artist: 'Kevin MacLeod', url: getTrackUrl('Intuit256') },
            { id: 'm7', title: 'Colorless Aura', artist: 'Kevin MacLeod', url: getTrackUrl('Colorless_Aura') },
            { id: 'm8', title: 'Blue Feather', artist: 'Kevin MacLeod', url: getTrackUrl('Blue_Feather') },
            { id: 'm9', title: 'Almost in F', artist: 'Kevin MacLeod', url: getTrackUrl('Almost_in_F') },
            { id: 'm10', title: 'Despair and Triumph', artist: 'Kevin MacLeod', url: getTrackUrl('Despair_and_Triumph') }
        ] 
    },
    { 
        id: 'tense', 
        name: '😰 Напряжение', 
        category: 'mood', 
        tracks: [
            { id: 'tn1', title: 'Nervous', artist: 'Kevin MacLeod', url: getTrackUrl('Nervous') },
            { id: 'tn2', title: 'Metaphysik', artist: 'Kevin MacLeod', url: getTrackUrl('Metaphysik') },
            { id: 'tn3', title: 'Terminal', artist: 'Kevin MacLeod', url: getTrackUrl('Terminal') },
            { id: 'tn4', title: 'Hiding Your Reality', artist: 'Kevin MacLeod', url: getTrackUrl('Hiding_Your_Reality') },
            { id: 'tn5', title: 'Awkward Meeting', artist: 'Kevin MacLeod', url: getTrackUrl('Awkward_Meeting') },
            { id: 'tn6', title: 'Anxiety', artist: 'Kevin MacLeod', url: getTrackUrl('Anxiety') },
            { id: 'tn7', title: 'Suspense Action', artist: 'Kevin MacLeod', url: getTrackUrl('Suspense_Action') },
            { id: 'tn8', title: 'Interloper', artist: 'Kevin MacLeod', url: getTrackUrl('Interloper') },
            { id: 'tn9', title: 'Satiate', artist: 'Kevin MacLeod', url: getTrackUrl('Satiate') },
            { id: 'tn10', title: 'Echoes of Time', artist: 'Kevin MacLeod', url: getTrackUrl('Echoes_of_Time') }
        ] 
    },
    { 
        id: 'horror', 
        name: '💀 Ужас', 
        category: 'mood', 
        tracks: [
            { id: 'h1', title: 'Giant Wyrm', artist: 'Kevin MacLeod', url: getTrackUrl('Giant_Wyrm') },
            { id: 'h2', title: 'Spider\'s Web', artist: 'Kevin MacLeod', url: getTrackUrl('Spiders_Web') },
            { id: 'h3', title: 'Long Note Two', artist: 'Kevin MacLeod', url: getTrackUrl('Long_Note_Two') },
            { id: 'h4', title: 'Gathering Darkness', artist: 'Kevin MacLeod', url: getTrackUrl('Gathering_Darkness') },
            { id: 'h5', title: 'The Hive', artist: 'Kevin MacLeod', url: getTrackUrl('The_Hive') },
            { id: 'h6', title: 'Decay', artist: 'Kevin MacLeod', url: getTrackUrl('Decay') },
            { id: 'h7', title: 'Hush', artist: 'Kevin MacLeod', url: getTrackUrl('Hush') },
            { id: 'h8', title: 'An Upsetting Theme', artist: 'Kevin MacLeod', url: getTrackUrl('An_Upsetting_Theme') },
            { id: 'h9', title: 'Bump in the Night', artist: 'Kevin MacLeod', url: getTrackUrl('Bump_in_the_Night') },
            { id: 'h10', title: 'Ghost Processional', artist: 'Kevin MacLeod', url: getTrackUrl('Ghost_Processional') }
        ] 
    },
    { 
        id: 'drama', 
        name: '😢 Драма / Покой', 
        category: 'mood', 
        tracks: [
            { id: 'dr1', title: 'Touching Moments One', artist: 'Kevin MacLeod', url: getTrackUrl('Touching_Moments_One') },
            { id: 'dr2', title: 'Sovereign', artist: 'Kevin MacLeod', url: getTrackUrl('Sovereign') },
            { id: 'dr3', title: 'Despair and Triumph', artist: 'Kevin MacLeod', url: getTrackUrl('Despair_and_Triumph') },
            { id: 'dr4', title: 'Frozen Star', artist: 'Kevin MacLeod', url: getTrackUrl('Frozen_Star') },
            { id: 'dr5', title: 'Heartbreaking', artist: 'Kevin MacLeod', url: getTrackUrl('Heartbreaking') },
            { id: 'dr6', title: 'Sad Trio', artist: 'Kevin MacLeod', url: getTrackUrl('Sad_Trio') },
            { id: 'dr7', title: 'Lamentation', artist: 'Kevin MacLeod', url: getTrackUrl('Lamentation') },
            { id: 'dr8', title: 'Wounded', artist: 'Kevin MacLeod', url: getTrackUrl('Wounded') },
            { id: 'dr9', title: 'Lost Time', artist: 'Kevin MacLeod', url: getTrackUrl('Lost_Time') },
            { id: 'dr10', title: 'Relaxing Piano', artist: 'Kevin MacLeod', url: getTrackUrl('Relaxing_Piano_Music') }
        ] 
    },

    // --- NEW CATEGORIES ---
    { 
        id: 'comedy', 
        name: '🤡 Комедия / Таверна', 
        category: 'comedy', 
        tracks: [
            { id: 'com1', title: 'Monkeys Spinning Monkeys', artist: 'Kevin MacLeod', url: getTrackUrl('Monkeys_Spinning_Monkeys') },
            { id: 'com2', title: 'Fluffing a Duck', artist: 'Kevin MacLeod', url: getTrackUrl('Fluffing_a_Duck') },
            { id: 'com3', title: 'Hidden Agenda', artist: 'Kevin MacLeod', url: getTrackUrl('Hidden_Agenda') },
            { id: 'com4', title: 'Sneaky Snitch', artist: 'Kevin MacLeod', url: getTrackUrl('Sneaky_Snitch') },
            { id: 'com5', title: 'Pixel Peeker Polka', artist: 'Kevin MacLeod', url: getTrackUrl('Pixel_Peeker_Polka_-_faster') },
            { id: 'com6', title: 'Merry Go', artist: 'Kevin MacLeod', url: getTrackUrl('Merry_Go') },
            { id: 'com7', title: 'Run Amok', artist: 'Kevin MacLeod', url: getTrackUrl('Run_Amok') },
            { id: 'com8', title: 'The Builder', artist: 'Kevin MacLeod', url: getTrackUrl('The_Builder') },
            { id: 'com9', title: 'Scheming Weasel', artist: 'Kevin MacLeod', url: getTrackUrl('Scheming_Weasel') },
            { id: 'com10', title: 'Hyperfun', artist: 'Kevin MacLeod', url: getTrackUrl('Hyperfun') }
        ] 
    },
    { 
        id: 'scifi', 
        name: '👽 Сай-Фай / Ковчег', 
        category: 'scifi', 
        tracks: [
            { id: 'sci1', title: 'Space 1990', artist: 'Kevin MacLeod', url: getTrackUrl('Space_1990-B') },
            { id: 'sci2', title: 'Tech Live', artist: 'Kevin MacLeod', url: getTrackUrl('Tech_Live') },
            { id: 'sci3', title: 'Local Forecast - Elevator', artist: 'Kevin MacLeod', url: getTrackUrl('Local_Forecast_-_Elevator') },
            { id: 'sci4', title: 'Interloper', artist: 'Kevin MacLeod', url: getTrackUrl('Interloper') },
            { id: 'sci5', title: 'Blue Sizzle', artist: 'Kevin MacLeod', url: getTrackUrl('Blue_Sizzle') },
            { id: 'sci6', title: 'Darkness Speaks', artist: 'Kevin MacLeod', url: getTrackUrl('Darkness_Speaks') },
            { id: 'sci7', title: 'Lightless Dawn', artist: 'Kevin MacLeod', url: getTrackUrl('Lightless_Dawn') },
            { id: 'sci8', title: 'Deep Haze', artist: 'Kevin MacLeod', url: getTrackUrl('Deep_Haze') },
            { id: 'sci9', title: 'Hero Down', artist: 'Kevin MacLeod', url: getTrackUrl('Hero_Down') },
            { id: 'sci10', title: 'Mechanolith', artist: 'Kevin MacLeod', url: getTrackUrl('Mechanolith') }
        ] 
    }
];

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>(() => {
        const saved = localStorage.getItem('dmc_audio_playlists');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return INITIAL_PRESETS.map(p => {
                    const savedP = parsed.find((sp: Playlist) => sp.id === p.id);
                    if (savedP) {
                         const customTracks = savedP.tracks.filter((t: Track) => !p.tracks.some(pt => pt.id === t.id) && t.isLocal);
                         return { ...p, tracks: [...p.tracks, ...customTracks] };
                    }
                    return p;
                });
            } catch(e) { console.error(e); }
        }
        return INITIAL_PRESETS;
    });

    const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isShuffle, setIsShuffle] = useState(false);
    const [volume, setVolume] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const lastLoadedUrlRef = useRef<string | null>(null);

    useEffect(() => {
        const toSave = playlists.map(p => ({
            ...p,
            tracks: p.tracks 
        }));
        localStorage.setItem('dmc_audio_playlists', JSON.stringify(toSave));
    }, [playlists]);

    useEffect(() => {
        audioRef.current = new Audio();
        audioRef.current.preload = "auto";
        
        const audio = audioRef.current;

        const handleEnded = () => playNext();
        
        const handleError = () => {
            const err = audio.error;
            let message = "Ошибка воспроизведения";
            if (err) {
                switch (err.code) {
                    case 1: message = "Загрузка прервана пользователем"; break; 
                    case 2: message = "Ошибка сети"; break; 
                    case 3: message = "Ошибка декодирования"; break; 
                    case 4: message = "Формат не поддерживается"; break; 
                }
                console.error(`Audio Error Code: ${err.code}, Message: ${err.message}, URL: ${audio.src}`);
            }
            setIsLoading(false);
            setError(message);
            setIsPlaying(false);
        };

        const handleCanPlay = () => {
            if (isPlaying) setIsLoading(false);
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);
        audio.addEventListener('canplay', handleCanPlay);

        return () => {
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('error', handleError);
            audio.removeEventListener('canplay', handleCanPlay);
            audio.pause();
            audio.src = "";
        };
    }, []);

    useEffect(() => {
        if (audioRef.current) audioRef.current.volume = volume;
    }, [volume]);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const handlePlayback = async () => {
            if (!currentTrack) {
                audio.pause();
                lastLoadedUrlRef.current = null;
                return;
            }

            try {
                if (lastLoadedUrlRef.current !== currentTrack.url) {
                    setIsLoading(true);
                    setError(null);
                    audio.src = currentTrack.url;
                    lastLoadedUrlRef.current = currentTrack.url;
                    audio.load();
                }

                if (isPlaying) {
                    const playPromise = audio.play();
                    if (playPromise !== undefined) {
                        playPromise.catch(err => {
                            if (err.name === 'AbortError') return; 
                            console.warn("Playback interrupted:", err);
                            if (err.name === 'NotAllowedError') {
                                setError("Нажмите Play (Автоплей заблокирован)");
                                setIsPlaying(false);
                            } else {
                                setIsPlaying(false);
                            }
                        });
                    }
                } else {
                    audio.pause();
                }
            } catch (err: any) {
                console.error("Setup error:", err);
                setIsLoading(false);
            }
        };

        handlePlayback();
    }, [currentTrack, isPlaying]);

    const activePlaylist = playlists.find(p => p.id === currentPlaylistId);

    const playNext = () => {
        if (!activePlaylist || !currentTrack || activePlaylist.tracks.length === 0) return;
        
        let nextIndex: number;
        
        if (isShuffle && activePlaylist.tracks.length > 1) {
             // Pick random index different from current
             const currentIndex = activePlaylist.tracks.findIndex(t => t.id === currentTrack.id);
             do {
                 nextIndex = Math.floor(Math.random() * activePlaylist.tracks.length);
             } while (nextIndex === currentIndex);
        } else {
            const idx = activePlaylist.tracks.findIndex(t => t.id === currentTrack.id);
            nextIndex = (idx + 1) % activePlaylist.tracks.length;
        }

        setCurrentTrack(activePlaylist.tracks[nextIndex]);
        setIsPlaying(true);
    };

    const playPrev = () => {
        if (!activePlaylist || !currentTrack || activePlaylist.tracks.length === 0) return;
        
        // Shuffle logic for Prev also just picking random to keep "shuffle feel" or standard prev?
        // Standard prev logic usually:
        const idx = activePlaylist.tracks.findIndex(t => t.id === currentTrack.id);
        const prevIdx = idx === 0 ? activePlaylist.tracks.length - 1 : idx - 1;
        setCurrentTrack(activePlaylist.tracks[prevIdx]);
        setIsPlaying(true);
    };

    const playTrack = (track: Track, playlistId: string) => {
        if (currentTrack?.id === track.id) {
            togglePlay();
        } else {
            setCurrentPlaylistId(playlistId);
            setCurrentTrack(track);
            setIsPlaying(true);
        }
    };

    const playPlaylist = (playlistId: string, shuffle: boolean = false) => {
        const playlist = playlists.find(p => p.id === playlistId);
        if (playlist && playlist.tracks.length > 0) {
            setCurrentPlaylistId(playlistId);
            setIsShuffle(shuffle);
            const firstTrack = shuffle 
                ? playlist.tracks[Math.floor(Math.random() * playlist.tracks.length)]
                : playlist.tracks[0];
            setCurrentTrack(firstTrack);
            setIsPlaying(true);
        }
    };

    const togglePlay = () => {
        if (currentTrack) setIsPlaying(!isPlaying);
    };

    const toggleShuffle = () => {
        setIsShuffle(!isShuffle);
    };

    const addTrackToPlaylist = (playlistId: string, track: Track) => {
        setPlaylists(prev => prev.map(p => 
            p.id === playlistId ? { ...p, tracks: [...p.tracks, track] } : p
        ));
    };

    const removeTrackFromPlaylist = (playlistId: string, trackId: string) => {
        setPlaylists(prev => prev.map(p => 
            p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } : p
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
            p.id === playlistId ? { ...p, tracks: [...p.tracks, ...newTracks] } : p
        ));
    };

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
            setVolume,
            addTrackToPlaylist,
            removeTrackFromPlaylist,
            importLocalTracks
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (!context) throw new Error("useAudio must be used within an AudioProvider");
    return context;
};
