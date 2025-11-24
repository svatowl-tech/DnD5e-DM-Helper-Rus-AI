import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AudioContextType, Playlist, Track } from '../types';

// --- HELPER FOR STABLE URLS ---
// Kevin MacLeod's site uses specific filenames. 
// We use encodeURIComponent to handle spaces safely.
const getTrackUrl = (filename: string) => {
    return `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${encodeURIComponent(filename)}.mp3`;
};

const INITIAL_PRESETS: Playlist[] = [
    // ==========================================
    // БОЕВЫЕ ПЛЕЙЛИСТЫ (COMBAT) - 25 Tracks
    // ==========================================
    { 
        id: 'combat_epic', 
        name: 'Бой: Эпический', 
        category: 'combat', 
        tracks: [
            { id: 'c_heroic', title: 'Heroic Age', artist: 'Kevin MacLeod', url: getTrackUrl('Heroic Age') },
            { id: 'c_crusade', title: 'Crusade', artist: 'Kevin MacLeod', url: getTrackUrl('Crusade - Heavy Industry') },
            { id: 'c_five_armies', title: 'Five Armies', artist: 'Kevin MacLeod', url: getTrackUrl('Five Armies') },
            { id: 'c_black_vortex', title: 'Black Vortex', artist: 'Kevin MacLeod', url: getTrackUrl('Black Vortex') },
            { id: 'c_move_forward', title: 'Move Forward', artist: 'Kevin MacLeod', url: getTrackUrl('Move Forward') },
            { id: 'c_exhilarate', title: 'Exhilarate', artist: 'Kevin MacLeod', url: getTrackUrl('Exhilarate') },
            { id: 'c_primal', title: 'Rites', artist: 'Kevin MacLeod', url: getTrackUrl('Rites') },
            { id: 'c_stormfront', title: 'Stormfront', artist: 'Kevin MacLeod', url: getTrackUrl('Stormfront') },
            { id: 'c_strength', title: 'Strength of the Titans', artist: 'Kevin MacLeod', url: getTrackUrl('Strength of the Titans') },
            { id: 'c_take_chance', title: 'Take a Chance', artist: 'Kevin MacLeod', url: getTrackUrl('Take a Chance') },
            { id: 'c_curse_scarab', title: 'Curse of the Scarab', artist: 'Kevin MacLeod', url: getTrackUrl('Curse of the Scarab') },
            { id: 'c_clash', title: 'Clash Defiant', artist: 'Kevin MacLeod', url: getTrackUrl('Clash Defiant') },
            { id: 'c_death_kings', title: 'Death of Kings', artist: 'Kevin MacLeod', url: getTrackUrl('Death of Kings 2') },
            { id: 'c_moorland', title: 'Moorland', artist: 'Kevin MacLeod', url: getTrackUrl('Moorland') },
            { id: 'c_heavy_interlude', title: 'Heavy Interlude', artist: 'Kevin MacLeod', url: getTrackUrl('Heavy Interlude') },
            { id: 'c_volitile', title: 'Volatile Reaction', artist: 'Kevin MacLeod', url: getTrackUrl('Volatile Reaction') },
            { id: 'c_hitman', title: 'Hitman', artist: 'Kevin MacLeod', url: getTrackUrl('Hitman') },
            { id: 'c_pina', title: 'Pinball Spring', artist: 'Kevin MacLeod', url: getTrackUrl('Pinball Spring') }, // Fast paced
            { id: 'c_imp', title: 'Impact Prelude', artist: 'Kevin MacLeod', url: getTrackUrl('Impact Prelude') },
            { id: 'c_all_this', title: 'All This', artist: 'Kevin MacLeod', url: getTrackUrl('All This') },
            { id: 'c_achilles', title: 'Achilles', artist: 'Kevin MacLeod', url: getTrackUrl('Achilles') },
            { id: 'c_action', title: 'Action', artist: 'Kevin MacLeod', url: getTrackUrl('Action') },
            { id: 'c_aggressor', title: 'Aggressor', artist: 'Kevin MacLeod', url: getTrackUrl('Aggressor') },
            { id: 'c_ajax', title: 'Ajax', artist: 'Kevin MacLeod', url: getTrackUrl('Ajax') },
            { id: 'c_ammo', title: 'Ammunition', artist: 'Kevin MacLeod', url: getTrackUrl('Ammunition') },
        ] 
    },
    { 
        id: 'combat_boss', 
        name: 'Бой: Босс', 
        category: 'combat', 
        tracks: [
            { id: 'cb_mechanolith', title: 'Mechanolith', artist: 'Kevin MacLeod', url: getTrackUrl('Mechanolith') },
            { id: 'cb_power', title: 'Power of the Meat', artist: 'Kevin MacLeod', url: getTrackUrl('Power of the Meat') },
            { id: 'cb_final_count', title: 'Final Count', artist: 'Kevin MacLeod', url: getTrackUrl('Final Count') },
            { id: 'cb_chaos', title: 'Chaos Gun', artist: 'Kevin MacLeod', url: getTrackUrl('Chaos Gun') },
            { id: 'cb_killers', title: 'Killers', artist: 'Kevin MacLeod', url: getTrackUrl('Killers') },
            { id: 'cb_descent', title: 'The Descent', artist: 'Kevin MacLeod', url: getTrackUrl('The Descent') },
            { id: 'cb_ibid', title: 'Ibid', artist: 'Kevin MacLeod', url: getTrackUrl('Ibid') },
            { id: 'cb_shoot', title: 'Shooting Star', artist: 'Kevin MacLeod', url: getTrackUrl('Shooting Star') },
            { id: 'cb_unseen', title: 'Unseen Horrors', artist: 'Kevin MacLeod', url: getTrackUrl('Unseen Horrors') },
            { id: 'cb_gritty', title: 'Gritty In The Itty', artist: 'Kevin MacLeod', url: getTrackUrl('Gritty In The Itty') },
            { id: 'cb_conflict', title: 'Confliction', artist: 'Kevin MacLeod', url: getTrackUrl('Confliction') },
            { id: 'cb_digit', title: 'Digital Bark', artist: 'Kevin MacLeod', url: getTrackUrl('Digital Bark') },
            { id: 'cb_faceoff', title: 'Faceoff', artist: 'Kevin MacLeod', url: getTrackUrl('Faceoff') },
            { id: 'cb_storm', title: 'Stormfront', artist: 'Kevin MacLeod', url: getTrackUrl('Stormfront') },
            { id: 'cb_terminator', title: 'Termination', artist: 'Kevin MacLeod', url: getTrackUrl('Termination') },
            { id: 'cb_wretched', title: 'Wretched Destroyer', artist: 'Kevin MacLeod', url: getTrackUrl('Wretched Destroyer') },
            { id: 'cb_schweitzer', title: 'Albert Schweitzer', artist: 'Kevin MacLeod', url: getTrackUrl('Albert Schweitzer') },
            { id: 'cb_second', title: 'Second Coming', artist: 'Kevin MacLeod', url: getTrackUrl('Second Coming') },
            { id: 'cb_seven', title: 'Seven March', artist: 'Kevin MacLeod', url: getTrackUrl('Seven March') },
            { id: 'cb_shadow', title: 'Shadowlands 3', artist: 'Kevin MacLeod', url: getTrackUrl('Shadowlands 3 - Machine') },
        ] 
    },

    // ==========================================
    // АТМОСФЕРА (ATMOSPHERE) - 20+ Tracks
    // ==========================================
    { 
        id: 'atmo_dungeon', 
        name: 'Атмосфера: Подземелье', 
        category: 'atmosphere', 
        tracks: [
            { id: 'd_aftermath', title: 'Aftermath', artist: 'Kevin MacLeod', url: getTrackUrl('Aftermath') },
            { id: 'd_ancient', title: 'Ancient Rite', artist: 'Kevin MacLeod', url: getTrackUrl('Ancient Rite') },
            { id: 'd_decay', title: 'Decay', artist: 'Kevin MacLeod', url: getTrackUrl('Decay') },
            { id: 'd_darkling', title: 'Darkling', artist: 'Kevin MacLeod', url: getTrackUrl('Darkling') },
            { id: 'd_dread', title: 'The Dread', artist: 'Kevin MacLeod', url: getTrackUrl('The Dread') },
            { id: 'd_shadow', title: 'Shadowlands', artist: 'Kevin MacLeod', url: getTrackUrl('Shadowlands 1 - Horizon') },
            { id: 'd_penumbra', title: 'Penumbra', artist: 'Kevin MacLeod', url: getTrackUrl('Penumbra') },
            { id: 'd_bump', title: 'Bump in the Night', artist: 'Kevin MacLeod', url: getTrackUrl('Bump in the Night') },
            { id: 'd_wyrm', title: 'Giant Wyrm', artist: 'Kevin MacLeod', url: getTrackUrl('Giant Wyrm') },
            { id: 'd_spider', title: 'Spider Eyes', artist: 'Kevin MacLeod', url: getTrackUrl('Spider Eyes') },
            { id: 'd_kool', title: 'Kool Kats', artist: 'Kevin MacLeod', url: getTrackUrl('Kool Kats') }, 
            { id: 'd_static', title: 'Static Motion', artist: 'Kevin MacLeod', url: getTrackUrl('Static Motion') },
            { id: 'd_martian', title: 'Martian Cowboy', artist: 'Kevin MacLeod', url: getTrackUrl('Martian Cowboy') },
            { id: 'd_apprehension', title: 'Apprehension', artist: 'Kevin MacLeod', url: getTrackUrl('Apprehension') },
            { id: 'd_basement', title: 'Clean Soul', artist: 'Kevin MacLeod', url: getTrackUrl('Clean Soul') },
            { id: 'd_crypt', title: 'Cryptic Sorrow', artist: 'Kevin MacLeod', url: getTrackUrl('Cryptic Sorrow') },
            { id: 'd_darkness', title: 'Darkness Speaks', artist: 'Kevin MacLeod', url: getTrackUrl('Darkness Speaks') },
            { id: 'd_deep', title: 'Deep Noise', artist: 'Kevin MacLeod', url: getTrackUrl('Deep Noise') },
            { id: 'd_despair', title: 'Despair and Triumph', artist: 'Kevin MacLeod', url: getTrackUrl('Despair and Triumph') },
            { id: 'd_dragon', title: 'Dragon and Toast', artist: 'Kevin MacLeod', url: getTrackUrl('Dragon and Toast') },
            { id: 'd_dramatic', title: 'Ossuary 6 - Air', artist: 'Kevin MacLeod', url: getTrackUrl('Ossuary 6 - Air') },
        ] 
    },
    { 
        id: 'atmo_nature', 
        name: 'Атмосфера: Природа/Лес', 
        category: 'atmosphere', 
        tracks: [
            { id: 'f_fear', title: 'Forest of Fear', artist: 'Kevin MacLeod', url: getTrackUrl('Forest of Fear') },
            { id: 'f_sovereign', title: 'Sovereign', artist: 'Kevin MacLeod', url: getTrackUrl('Sovereign') },
            { id: 'f_med', title: 'Elf Meditation', artist: 'Kevin MacLeod', url: getTrackUrl('Elf Meditation') },
            { id: 'f_summer', title: 'Summer Day', artist: 'Kevin MacLeod', url: getTrackUrl('Summer Day') },
            { id: 'f_morning', title: 'Morning', artist: 'Kevin MacLeod', url: getTrackUrl('Morning') },
            { id: 'f_river', title: 'River Valley Breakdown', artist: 'Kevin MacLeod', url: getTrackUrl('River Valley Breakdown') },
            { id: 'f_cattails', title: 'Cattails', artist: 'Kevin MacLeod', url: getTrackUrl('Cattails') },
            { id: 'f_fluid', title: 'Fluidscape', artist: 'Kevin MacLeod', url: getTrackUrl('Fluidscape') },
            { id: 'f_garden', title: 'Garden Music', artist: 'Kevin MacLeod', url: getTrackUrl('Garden Music') },
            { id: 'f_eternal', title: 'Eternal Hope', artist: 'Kevin MacLeod', url: getTrackUrl('Eternal Hope') },
            { id: 'f_healing', title: 'Healing', artist: 'Kevin MacLeod', url: getTrackUrl('Healing') },
            { id: 'f_grave', title: 'Grave Matters', artist: 'Kevin MacLeod', url: getTrackUrl('Grave Matters') },
            { id: 'f_air', title: 'Air Prelude', artist: 'Kevin MacLeod', url: getTrackUrl('Air Prelude') },
            { id: 'f_at_rest', title: 'At Rest', artist: 'Kevin MacLeod', url: getTrackUrl('At Rest') },
            { id: 'f_autumn', title: 'Autumn Day', artist: 'Kevin MacLeod', url: getTrackUrl('Autumn Day') },
            { id: 'f_beach', title: 'Beach Party', artist: 'Kevin MacLeod', url: getTrackUrl('Beach Party') },
            { id: 'f_blue', title: 'Blue Feather', artist: 'Kevin MacLeod', url: getTrackUrl('Blue Feather') },
            { id: 'f_bumba', title: 'Bumbly March', artist: 'Kevin MacLeod', url: getTrackUrl('Bumbly March') },
            { id: 'f_calmant', title: 'Calmant', artist: 'Kevin MacLeod', url: getTrackUrl('Calmant') },
            { id: 'f_clear', title: 'Clear Waters', artist: 'Kevin MacLeod', url: getTrackUrl('Clear Waters') },
        ] 
    },

    // ==========================================
    // ТАВЕРНА / ГОРОД (TAVERN/COMEDY) - 20+ Tracks
    // ==========================================
    { 
        id: 'tavern_mix', 
        name: 'Таверна и Город', 
        category: 'comedy', 
        tracks: [
            { id: 'ci_minstrel', title: 'Minstrel Guild', artist: 'Kevin MacLeod', url: getTrackUrl('Minstrel Guild') },
            { id: 'ci_lord', title: 'Lord of the Land', artist: 'Kevin MacLeod', url: getTrackUrl('Lord of the Land') },
            { id: 'ci_lute', title: 'Suonatore di Liuto', artist: 'Kevin MacLeod', url: getTrackUrl('Suonatore di Liuto') },
            { id: 'ci_king', title: 'Procession of the King', artist: 'Kevin MacLeod', url: getTrackUrl('Procession of the King') },
            { id: 'ci_builder', title: 'The Builder', artist: 'Kevin MacLeod', url: getTrackUrl('The Builder') },
            { id: 'ci_waltz', title: 'Fairytale Waltz', artist: 'Kevin MacLeod', url: getTrackUrl('Fairytale Waltz') },
            { id: 'ci_queen', title: 'Court of the Queen', artist: 'Kevin MacLeod', url: getTrackUrl('Court of the Queen') },
            { id: 'ci_teller', title: 'Teller of the Tales', artist: 'Kevin MacLeod', url: getTrackUrl('Teller of the Tales') },
            { id: 'ci_consort', title: 'Village Consort', artist: 'Kevin MacLeod', url: getTrackUrl('Village Consort') },
            { id: 'ci_pippin', title: 'Pippin the Hunchback', artist: 'Kevin MacLeod', url: getTrackUrl('Pippin the Hunchback') },
            { id: 'ci_master', title: 'Master of the Feast', artist: 'Kevin MacLeod', url: getTrackUrl('Master of the Feast') },
            { id: 'ci_folk', title: 'Folk Round', artist: 'Kevin MacLeod', url: getTrackUrl('Folk Round') },
            { id: 'ci_renaissance', title: 'Renaissance', artist: 'Kevin MacLeod', url: getTrackUrl('Renaissance') },
            { id: 't_thatched', title: 'Thatched Villagers', artist: 'Kevin MacLeod', url: getTrackUrl('Thatched Villagers') },
            { id: 't_achaidh', title: 'Achaidh Cheide', artist: 'Kevin MacLeod', url: getTrackUrl('Achaidh Cheide') },
            { id: 't_celtic', title: 'Celtic Impulse', artist: 'Kevin MacLeod', url: getTrackUrl('Celtic Impulse') },
            { id: 't_barroom', title: 'Barroom Ballet', artist: 'Kevin MacLeod', url: getTrackUrl('Barroom Ballet') },
            { id: 't_carrig', title: 'Carrigfergus', artist: 'Kevin MacLeod', url: getTrackUrl('Carrigfergus') },
            { id: 't_rumours', title: 'Celtic Rumours', artist: 'Kevin MacLeod', url: getTrackUrl('Celtic Rumours') },
            { id: 't_earthy', title: 'Earthy Crust', artist: 'Kevin MacLeod', url: getTrackUrl('Earthy Crust') },
            { id: 't_skye', title: 'Skye Cuillin', artist: 'Kevin MacLeod', url: getTrackUrl('Skye Cuillin') },
            { id: 't_fiddles', title: 'Fiddles McGinty', artist: 'Kevin MacLeod', url: getTrackUrl('Fiddles McGinty') },
            { id: 'co_scheming', title: 'Scheming Weasel', artist: 'Kevin MacLeod', url: getTrackUrl('Scheming Weasel faster') },
            { id: 'co_fluffing', title: 'Fluffing a Duck', artist: 'Kevin MacLeod', url: getTrackUrl('Fluffing a Duck') },
            { id: 'co_monkeys', title: 'Monkeys Spinning Monkeys', artist: 'Kevin MacLeod', url: getTrackUrl('Monkeys Spinning Monkeys') },
            { id: 'co_pixelland', title: 'Pixelland', artist: 'Kevin MacLeod', url: getTrackUrl('Pixelland') },
            { id: 'co_run', title: 'Run Amok', artist: 'Kevin MacLeod', url: getTrackUrl('Run Amok') },
        ] 
    },

    // ==========================================
    // НАСТРОЕНИЕ / ХОРРОР (MOOD) - 20+ Tracks
    // ==========================================
    { 
        id: 'mood_mix', 
        name: 'Тайна и Хоррор', 
        category: 'mood', 
        tracks: [
            { id: 'm_arcadia', title: 'Arcadia', artist: 'Kevin MacLeod', url: getTrackUrl('Arcadia') },
            { id: 'm_colorless', title: 'Colorless Aura', artist: 'Kevin MacLeod', url: getTrackUrl('Colorless Aura') },
            { id: 'm_dreamy', title: 'Dreamy Flashback', artist: 'Kevin MacLeod', url: getTrackUrl('Dreamy Flashback') },
            { id: 'm_enchanted', title: 'Enchanted Valley', artist: 'Kevin MacLeod', url: getTrackUrl('Enchanted Valley') },
            { id: 'm_midsummer', title: 'Midsummer Sky', artist: 'Kevin MacLeod', url: getTrackUrl('Midsummer Sky') },
            { id: 'm_private', title: 'Private Reflection', artist: 'Kevin MacLeod', url: getTrackUrl('Private Reflection') },
            { id: 'm_past', title: 'Past the Edge', artist: 'Kevin MacLeod', url: getTrackUrl('Past the Edge') },
            { id: 'm_mesmerize', title: 'Mesmerize', artist: 'Kevin MacLeod', url: getTrackUrl('Mesmerize') },
            { id: 'm_angel', title: 'Angel Share', artist: 'Kevin MacLeod', url: getTrackUrl('Angel Share') },
            { id: 'h_nervous', title: 'Nervous', artist: 'Kevin MacLeod', url: getTrackUrl('Nervous') },
            { id: 'h_long', title: 'Long Note One', artist: 'Kevin MacLeod', url: getTrackUrl('Long Note One') },
            { id: 'h_long2', title: 'Long Note Two', artist: 'Kevin MacLeod', url: getTrackUrl('Long Note Two') },
            { id: 'h_satiate', title: 'Satiate', artist: 'Kevin MacLeod', url: getTrackUrl('Satiate') },
            { id: 'h_unseen', title: 'Unseen Horrors', artist: 'Kevin MacLeod', url: getTrackUrl('Unseen Horrors') },
            { id: 'h_anxiety', title: 'Anxiety', artist: 'Kevin MacLeod', url: getTrackUrl('Anxiety') },
            { id: 'h_hush', title: 'Hush', artist: 'Kevin MacLeod', url: getTrackUrl('Hush') },
            { id: 'h_ghost', title: 'Ghost Story', artist: 'Kevin MacLeod', url: getTrackUrl('Ghost Story') },
            { id: 'h_heart', title: 'Heart of Nowhere', artist: 'Kevin MacLeod', url: getTrackUrl('Heart of Nowhere') },
            { id: 'h_gathering', title: 'Gathering Darkness', artist: 'Kevin MacLeod', url: getTrackUrl('Gathering Darkness') },
            { id: 'h_decay', title: 'Decay', artist: 'Kevin MacLeod', url: getTrackUrl('Decay') },
            { id: 'h_interloper', title: 'Interloper', artist: 'Kevin MacLeod', url: getTrackUrl('Interloper') },
            { id: 'h_house', title: 'House of Leaves', artist: 'Kevin MacLeod', url: getTrackUrl('House of Leaves') },
            { id: 'sa_wistful', title: 'Wistful Harp', artist: 'Kevin MacLeod', url: getTrackUrl('Wistful Harp') },
            { id: 'sa_parting', title: 'The Parting', artist: 'Kevin MacLeod', url: getTrackUrl('The Parting') },
            { id: 'sa_end', title: 'End of the Era', artist: 'Kevin MacLeod', url: getTrackUrl('End of the Era') },
        ] 
    },

    // ==========================================
    // ПУТЕШЕСТВИЕ / СПЕЦИАЛЬНОЕ - 20+ Tracks
    // ==========================================
    {
        id: 'travel_scifi',
        name: 'Путешествие и Фантастика',
        category: 'travel',
        tracks: [
            { id: 'tr_call', title: 'Call to Adventure', artist: 'Kevin MacLeod', url: getTrackUrl('Call to Adventure') },
            { id: 'tr_discovery', title: 'Discovery Hit', artist: 'Kevin MacLeod', url: getTrackUrl('Discovery Hit') },
            { id: 'tr_failing', title: 'Failing Defense', artist: 'Kevin MacLeod', url: getTrackUrl('Failing Defense') },
            { id: 'tr_thunder', title: 'Thunder Dreams', artist: 'Kevin MacLeod', url: getTrackUrl('Thunder Dreams') },
            { id: 'tr_impact', title: 'Impact Prelude', artist: 'Kevin MacLeod', url: getTrackUrl('Impact Prelude') },
            { id: 'tr_heroic', title: 'Heroic Age', artist: 'Kevin MacLeod', url: getTrackUrl('Heroic Age') },
            { id: 'tr_crusade', title: 'Crusade', artist: 'Kevin MacLeod', url: getTrackUrl('Crusade - Heavy Industry') },
            { id: 'tr_folk', title: 'Folk Round', artist: 'Kevin MacLeod', url: getTrackUrl('Folk Round') },
            { id: 'tr_bonnie', title: 'Bonnie Ends', artist: 'Kevin MacLeod', url: getTrackUrl('Bonnie Ends') },
            { id: 'sf_space', title: 'Space Jazz', artist: 'Kevin MacLeod', url: getTrackUrl('Space Jazz') },
            { id: 'sf_tech', title: 'Techno', artist: 'Kevin MacLeod', url: getTrackUrl('Techno 1') },
            { id: 'sf_deep', title: 'Deep Haze', artist: 'Kevin MacLeod', url: getTrackUrl('Deep Haze') },
            { id: 'sf_dark', title: 'Dark Walk', artist: 'Kevin MacLeod', url: getTrackUrl('Dark Walk') },
            { id: 'sf_echoes', title: 'Echoes of Time', artist: 'Kevin MacLeod', url: getTrackUrl('Echoes of Time') },
            { id: 'sf_spacial', title: 'Spacial Harvest', artist: 'Kevin MacLeod', url: getTrackUrl('Spacial Harvest') },
            { id: 'vic1', title: 'Heroic Age (Vic)', artist: 'Kevin MacLeod', url: getTrackUrl('Heroic Age') },
            { id: 'vic2', title: 'Winner Winner', artist: 'Kevin MacLeod', url: getTrackUrl('Winner Winner') },
            { id: 'vic3', title: 'Fanfare for Space', artist: 'Kevin MacLeod', url: getTrackUrl('Fanfare for Space') },
            { id: 'vic4', title: 'The Cannery', artist: 'Kevin MacLeod', url: getTrackUrl('The Cannery') },
            { id: 'vic5', title: 'Victory', artist: 'Kevin MacLeod', url: getTrackUrl('Victory') },
            { id: 'e_city', title: 'Desert City', artist: 'Kevin MacLeod', url: getTrackUrl('Desert City') },
            { id: 'e_ishikari', title: 'Ishikari Lore', artist: 'Kevin MacLeod', url: getTrackUrl('Ishikari Lore') },
            { id: 'e_dhaka', title: 'Dhaka', artist: 'Kevin MacLeod', url: getTrackUrl('Dhaka') },
            { id: 'e_impact', title: 'Impact Intermezzo', artist: 'Kevin MacLeod', url: getTrackUrl('Impact Intermezzo') },
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
        // Load from local storage or use initial
        const saved = localStorage.getItem('dmc_playlists');
        if (saved) {
            try {
                // Merge saved playlists with initial presets if presets have new tracks?
                // For simplicity, if saved exists, we trust it, but in dev we might want to reset.
                // In a real app, we'd merge. Here, let's just load initial if saved is empty or broken.
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
    const [volume, setVolume] = useState(0.5);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const activeSfxRef = useRef<Set<HTMLAudioElement>>(new Set());

    // Initialize Audio Object for Music
    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
            audioRef.current.addEventListener('ended', handleTrackEnd);
            audioRef.current.addEventListener('error', (e: Event) => {
                const target = e.target as HTMLAudioElement;
                const err = target.error;
                let errMsg = "Ошибка воспроизведения.";
                
                if (err) {
                    if (err.code === 1) errMsg = "Загрузка прервана.";
                    else if (err.code === 2) errMsg = "Ошибка сети.";
                    else if (err.code === 3) errMsg = "Ошибка декодирования.";
                    else if (err.code === 4) errMsg = "Файл не найден или формат не поддерживается.";
                    console.warn(`Audio Error (${err.code}): ${err.message}`);
                } else {
                    console.warn("Unknown Audio Error", e);
                }

                setError(errMsg);
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
            
            // Only reload source if it changed
            if (audioRef.current.src !== currentTrack.url) {
                audioRef.current.src = currentTrack.url;
                audioRef.current.load();
            }

            if (isPlaying) {
                try {
                    await audioRef.current.play();
                    setError(null);
                } catch (e: any) {
                    console.warn("Play attempt failed (often due to autoplay policy):", e);
                    if (e.name !== 'AbortError') {
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
            return updated;
        });
    };

    const importLocalTracks = (playlistId: string, files: File[]) => {
        const newTracks: Track[] = files.map(f => ({
            id: Date.now().toString() + Math.random(),
            title: f.name.replace(/\.[^/.]+$/, ""),
            url: URL.createObjectURL(f),
            isLocal: true
        }));

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

    const setVolumeWrapper = (vol: number) => {
        setVolume(Math.max(0, Math.min(1, vol)));
    }

    // Trackable SFX Player
    const playSfx = (url: string) => {
        try {
            const audio = new Audio(url);
            audio.volume = volume; // Use current master volume
            
            // Track this SFX instance
            activeSfxRef.current.add(audio);
            
            // Cleanup when done
            audio.addEventListener('ended', () => {
                activeSfxRef.current.delete(audio);
            });
            
            // Cleanup on error
            audio.addEventListener('error', () => {
                activeSfxRef.current.delete(audio);
            });

            audio.play().catch(e => console.warn("SFX Play failed:", e));
        } catch (e) {
            console.error("SFX Error:", e);
        }
    };

    // Stop all active sound effects immediately
    const stopAllSfx = () => {
        activeSfxRef.current.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        activeSfxRef.current.clear();
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
            setVolume: setVolumeWrapper,
            addTrackToPlaylist,
            removeTrackFromPlaylist,
            importLocalTracks,
            playSfx,
            stopAllSfx
        }}>
            {children}
        </AudioContext.Provider>
    );
};