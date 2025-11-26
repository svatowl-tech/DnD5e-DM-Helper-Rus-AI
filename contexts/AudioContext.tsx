
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AudioContextType, Playlist, Track } from '../types';

// --- HELPER FOR STABLE URLS ---
const getTrackUrl = (filename: string) => {
    return `https://incompetech.com/music/royalty-free/mp3-royaltyfree/${encodeURIComponent(filename)}.mp3`;
};

// Massive Library Expansion
const INITIAL_PRESETS: Playlist[] = [
    // ==========================================
    // COMBAT
    // ==========================================
    { 
        id: 'combat_epic', 
        name: 'Бой: Эпический', 
        category: 'combat', 
        tracks: [
            { id: 'c_heroic', title: 'Heroic Age', artist: 'Kevin MacLeod', url: getTrackUrl('Heroic Age') },
            { id: 'c_crusade', title: 'Crusade', artist: 'Kevin MacLeod', url: getTrackUrl('Crusade - Heavy Industry') },
            { id: 'c_five', title: 'Five Armies', artist: 'Kevin MacLeod', url: getTrackUrl('Five Armies') },
            { id: 'c_black', title: 'Black Vortex', artist: 'Kevin MacLeod', url: getTrackUrl('Black Vortex') },
            { id: 'c_move', title: 'Move Forward', artist: 'Kevin MacLeod', url: getTrackUrl('Move Forward') },
            { id: 'c_exhil', title: 'Exhilarate', artist: 'Kevin MacLeod', url: getTrackUrl('Exhilarate') },
            { id: 'c_rites', title: 'Rites', artist: 'Kevin MacLeod', url: getTrackUrl('Rites') },
            { id: 'c_storm', title: 'Stormfront', artist: 'Kevin MacLeod', url: getTrackUrl('Stormfront') },
            { id: 'c_titans', title: 'Strength of the Titans', artist: 'Kevin MacLeod', url: getTrackUrl('Strength of the Titans') },
            { id: 'c_chance', title: 'Take a Chance', artist: 'Kevin MacLeod', url: getTrackUrl('Take a Chance') },
            { id: 'c_clash', title: 'Clash Defiant', artist: 'Kevin MacLeod', url: getTrackUrl('Clash Defiant') },
            { id: 'c_kings', title: 'Death of Kings', artist: 'Kevin MacLeod', url: getTrackUrl('Death of Kings 2') },
            { id: 'c_moor', title: 'Moorland', artist: 'Kevin MacLeod', url: getTrackUrl('Moorland') },
            { id: 'c_heavy', title: 'Heavy Interlude', artist: 'Kevin MacLeod', url: getTrackUrl('Heavy Interlude') },
            { id: 'c_vol', title: 'Volatile Reaction', artist: 'Kevin MacLeod', url: getTrackUrl('Volatile Reaction') },
            { id: 'c_hitman', title: 'Hitman', artist: 'Kevin MacLeod', url: getTrackUrl('Hitman') },
            { id: 'c_allthis', title: 'All This', artist: 'Kevin MacLeod', url: getTrackUrl('All This') },
            { id: 'c_achilles', title: 'Achilles', artist: 'Kevin MacLeod', url: getTrackUrl('Achilles') },
            { id: 'c_action', title: 'Action', artist: 'Kevin MacLeod', url: getTrackUrl('Action') },
            { id: 'c_aggr', title: 'Aggressor', artist: 'Kevin MacLeod', url: getTrackUrl('Aggressor') },
            { id: 'c_ajax', title: 'Ajax', artist: 'Kevin MacLeod', url: getTrackUrl('Ajax') },
            { id: 'c_ammo', title: 'Ammunition', artist: 'Kevin MacLeod', url: getTrackUrl('Ammunition') },
        ] 
    },
    { 
        id: 'combat_boss', 
        name: 'Бой: Босс', 
        category: 'combat', 
        tracks: [
            { id: 'cb_mech', title: 'Mechanolith', artist: 'Kevin MacLeod', url: getTrackUrl('Mechanolith') },
            { id: 'cb_power', title: 'Power of the Meat', artist: 'Kevin MacLeod', url: getTrackUrl('Power of the Meat') },
            { id: 'cb_final', title: 'Final Count', artist: 'Kevin MacLeod', url: getTrackUrl('Final Count') },
            { id: 'cb_chaos', title: 'Chaos Gun', artist: 'Kevin MacLeod', url: getTrackUrl('Chaos Gun') },
            { id: 'cb_kill', title: 'Killers', artist: 'Kevin MacLeod', url: getTrackUrl('Killers') },
            { id: 'cb_desc', title: 'The Descent', artist: 'Kevin MacLeod', url: getTrackUrl('The Descent') },
            { id: 'cb_ibid', title: 'Ibid', artist: 'Kevin MacLeod', url: getTrackUrl('Ibid') },
            { id: 'cb_shoot', title: 'Shooting Star', artist: 'Kevin MacLeod', url: getTrackUrl('Shooting Star') },
            { id: 'cb_unseen', title: 'Unseen Horrors', artist: 'Kevin MacLeod', url: getTrackUrl('Unseen Horrors') },
            { id: 'cb_gritty', title: 'Gritty In The Itty', artist: 'Kevin MacLeod', url: getTrackUrl('Gritty In The Itty') },
            { id: 'cb_conflict', title: 'Confliction', artist: 'Kevin MacLeod', url: getTrackUrl('Confliction') },
            { id: 'cb_digit', title: 'Digital Bark', artist: 'Kevin MacLeod', url: getTrackUrl('Digital Bark') },
            { id: 'cb_face', title: 'Faceoff', artist: 'Kevin MacLeod', url: getTrackUrl('Faceoff') },
            { id: 'cb_term', title: 'Termination', artist: 'Kevin MacLeod', url: getTrackUrl('Termination') },
            { id: 'cb_wretch', title: 'Wretched Destroyer', artist: 'Kevin MacLeod', url: getTrackUrl('Wretched Destroyer') },
            { id: 'cb_sch', title: 'Albert Schweitzer', artist: 'Kevin MacLeod', url: getTrackUrl('Albert Schweitzer') },
            { id: 'cb_sec', title: 'Second Coming', artist: 'Kevin MacLeod', url: getTrackUrl('Second Coming') },
            { id: 'cb_sev', title: 'Seven March', artist: 'Kevin MacLeod', url: getTrackUrl('Seven March') },
            { id: 'cb_shad', title: 'Shadowlands 3', artist: 'Kevin MacLeod', url: getTrackUrl('Shadowlands 3 - Machine') },
        ] 
    },
    {
        id: 'combat_chase',
        name: 'Бой: Погоня/Ритм',
        category: 'combat',
        tracks: [
            { id: 'ch_jumper', title: 'Jumper', artist: 'Kevin MacLeod', url: getTrackUrl('Jumper') },
            { id: 'ch_movement', title: 'Movement Proposition', artist: 'Kevin MacLeod', url: getTrackUrl('Movement Proposition') },
            { id: 'ch_cepha', title: 'Cephalopod', artist: 'Kevin MacLeod', url: getTrackUrl('Cephalopod') },
            { id: 'ch_failing', title: 'Failing Defense', artist: 'Kevin MacLeod', url: getTrackUrl('Failing Defense') },
            { id: 'ch_hiding', title: 'Hiding Your Reality', artist: 'Kevin MacLeod', url: getTrackUrl('Hiding Your Reality') },
            { id: 'ch_interloper', title: 'Interloper', artist: 'Kevin MacLeod', url: getTrackUrl('Interloper') },
            { id: 'ch_overheat', title: 'Overheat', artist: 'Kevin MacLeod', url: getTrackUrl('Overheat') },
            { id: 'ch_run', title: 'Run Amok', artist: 'Kevin MacLeod', url: getTrackUrl('Run Amok') },
            { id: 'ch_takeoff', title: 'Takeoff', artist: 'Kevin MacLeod', url: getTrackUrl('Takeoff') },
            { id: 'ch_viral', title: 'Viral Hype', artist: 'Kevin MacLeod', url: getTrackUrl('Viral Hype') },
        ]
    },

    // ==========================================
    // ATMOSPHERE
    // ==========================================
    { 
        id: 'atmo_dungeon', 
        name: 'Атмосфера: Подземелье', 
        category: 'atmosphere', 
        tracks: [
            { id: 'd_after', title: 'Aftermath', artist: 'Kevin MacLeod', url: getTrackUrl('Aftermath') },
            { id: 'd_anc', title: 'Ancient Rite', artist: 'Kevin MacLeod', url: getTrackUrl('Ancient Rite') },
            { id: 'd_decay', title: 'Decay', artist: 'Kevin MacLeod', url: getTrackUrl('Decay') },
            { id: 'd_dark', title: 'Darkling', artist: 'Kevin MacLeod', url: getTrackUrl('Darkling') },
            { id: 'd_dread', title: 'The Dread', artist: 'Kevin MacLeod', url: getTrackUrl('The Dread') },
            { id: 'd_shad', title: 'Shadowlands', artist: 'Kevin MacLeod', url: getTrackUrl('Shadowlands 1 - Horizon') },
            { id: 'd_pen', title: 'Penumbra', artist: 'Kevin MacLeod', url: getTrackUrl('Penumbra') },
            { id: 'd_bump', title: 'Bump in the Night', artist: 'Kevin MacLeod', url: getTrackUrl('Bump in the Night') },
            { id: 'd_wyrm', title: 'Giant Wyrm', artist: 'Kevin MacLeod', url: getTrackUrl('Giant Wyrm') },
            { id: 'd_spider', title: 'Spider Eyes', artist: 'Kevin MacLeod', url: getTrackUrl('Spider Eyes') },
            { id: 'd_static', title: 'Static Motion', artist: 'Kevin MacLeod', url: getTrackUrl('Static Motion') },
            { id: 'd_app', title: 'Apprehension', artist: 'Kevin MacLeod', url: getTrackUrl('Apprehension') },
            { id: 'd_clean', title: 'Clean Soul', artist: 'Kevin MacLeod', url: getTrackUrl('Clean Soul') },
            { id: 'd_crypt', title: 'Cryptic Sorrow', artist: 'Kevin MacLeod', url: getTrackUrl('Cryptic Sorrow') },
            { id: 'd_darksp', title: 'Darkness Speaks', artist: 'Kevin MacLeod', url: getTrackUrl('Darkness Speaks') },
            { id: 'd_deep', title: 'Deep Noise', artist: 'Kevin MacLeod', url: getTrackUrl('Deep Noise') },
            { id: 'd_desp', title: 'Despair and Triumph', artist: 'Kevin MacLeod', url: getTrackUrl('Despair and Triumph') },
            { id: 'd_drag', title: 'Dragon and Toast', artist: 'Kevin MacLeod', url: getTrackUrl('Dragon and Toast') },
            { id: 'd_oss', title: 'Ossuary 6 - Air', artist: 'Kevin MacLeod', url: getTrackUrl('Ossuary 6 - Air') },
        ] 
    },
    { 
        id: 'atmo_nature', 
        name: 'Атмосфера: Лес и Природа', 
        category: 'atmosphere', 
        tracks: [
            { id: 'f_fear', title: 'Forest of Fear', artist: 'Kevin MacLeod', url: getTrackUrl('Forest of Fear') },
            { id: 'f_sov', title: 'Sovereign', artist: 'Kevin MacLeod', url: getTrackUrl('Sovereign') },
            { id: 'f_med', title: 'Elf Meditation', artist: 'Kevin MacLeod', url: getTrackUrl('Elf Meditation') },
            { id: 'f_sum', title: 'Summer Day', artist: 'Kevin MacLeod', url: getTrackUrl('Summer Day') },
            { id: 'f_morn', title: 'Morning', artist: 'Kevin MacLeod', url: getTrackUrl('Morning') },
            { id: 'f_riv', title: 'River Valley Breakdown', artist: 'Kevin MacLeod', url: getTrackUrl('River Valley Breakdown') },
            { id: 'f_cat', title: 'Cattails', artist: 'Kevin MacLeod', url: getTrackUrl('Cattails') },
            { id: 'f_flu', title: 'Fluidscape', artist: 'Kevin MacLeod', url: getTrackUrl('Fluidscape') },
            { id: 'f_gar', title: 'Garden Music', artist: 'Kevin MacLeod', url: getTrackUrl('Garden Music') },
            { id: 'f_et', title: 'Eternal Hope', artist: 'Kevin MacLeod', url: getTrackUrl('Eternal Hope') },
            { id: 'f_heal', title: 'Healing', artist: 'Kevin MacLeod', url: getTrackUrl('Healing') },
            { id: 'f_grave', title: 'Grave Matters', artist: 'Kevin MacLeod', url: getTrackUrl('Grave Matters') },
            { id: 'f_air', title: 'Air Prelude', artist: 'Kevin MacLeod', url: getTrackUrl('Air Prelude') },
            { id: 'f_rest', title: 'At Rest', artist: 'Kevin MacLeod', url: getTrackUrl('At Rest') },
            { id: 'f_aut', title: 'Autumn Day', artist: 'Kevin MacLeod', url: getTrackUrl('Autumn Day') },
            { id: 'f_clear', title: 'Clear Waters', artist: 'Kevin MacLeod', url: getTrackUrl('Clear Waters') },
        ] 
    },
    {
        id: 'atmo_travel',
        name: 'Атмосфера: Путешествие',
        category: 'atmosphere',
        tracks: [
            { id: 'tr_call', title: 'Call to Adventure', artist: 'Kevin MacLeod', url: getTrackUrl('Call to Adventure') },
            { id: 'tr_disc', title: 'Discovery Hit', artist: 'Kevin MacLeod', url: getTrackUrl('Discovery Hit') },
            { id: 'tr_fail', title: 'Failing Defense', artist: 'Kevin MacLeod', url: getTrackUrl('Failing Defense') },
            { id: 'tr_thun', title: 'Thunder Dreams', artist: 'Kevin MacLeod', url: getTrackUrl('Thunder Dreams') },
            { id: 'tr_imp', title: 'Impact Prelude', artist: 'Kevin MacLeod', url: getTrackUrl('Impact Prelude') },
            { id: 'tr_folk', title: 'Folk Round', artist: 'Kevin MacLeod', url: getTrackUrl('Folk Round') },
            { id: 'tr_bon', title: 'Bonnie Ends', artist: 'Kevin MacLeod', url: getTrackUrl('Bonnie Ends') },
            { id: 'tr_snow', title: 'Snow Drop', artist: 'Kevin MacLeod', url: getTrackUrl('Snow Drop') },
            { id: 'tr_lost', title: 'Lost Frontier', artist: 'Kevin MacLeod', url: getTrackUrl('Lost Frontier') },
            { id: 'tr_east', title: 'East of Tunesia', artist: 'Kevin MacLeod', url: getTrackUrl('East of Tunesia') },
            { id: 'tr_crossing', title: 'Crossing the Divide', artist: 'Kevin MacLeod', url: getTrackUrl('Crossing the Divide') },
            { id: 'tr_journey', title: 'Journey in the New World', artist: 'Kevin MacLeod', url: getTrackUrl('Journey in the New World') },
        ]
    },

    // ==========================================
    // CITY & TAVERN
    // ==========================================
    { 
        id: 'city_tavern', 
        name: 'Таверна', 
        category: 'city', 
        tracks: [
            { id: 't_thatch', title: 'Thatched Villagers', artist: 'Kevin MacLeod', url: getTrackUrl('Thatched Villagers') },
            { id: 't_ach', title: 'Achaidh Cheide', artist: 'Kevin MacLeod', url: getTrackUrl('Achaidh Cheide') },
            { id: 't_celt', title: 'Celtic Impulse', artist: 'Kevin MacLeod', url: getTrackUrl('Celtic Impulse') },
            { id: 't_bar', title: 'Barroom Ballet', artist: 'Kevin MacLeod', url: getTrackUrl('Barroom Ballet') },
            { id: 't_carr', title: 'Carrigfergus', artist: 'Kevin MacLeod', url: getTrackUrl('Carrigfergus') },
            { id: 't_rum', title: 'Celtic Rumours', artist: 'Kevin MacLeod', url: getTrackUrl('Celtic Rumours') },
            { id: 't_earth', title: 'Earthy Crust', artist: 'Kevin MacLeod', url: getTrackUrl('Earthy Crust') },
            { id: 't_skye', title: 'Skye Cuillin', artist: 'Kevin MacLeod', url: getTrackUrl('Skye Cuillin') },
            { id: 't_fid', title: 'Fiddles McGinty', artist: 'Kevin MacLeod', url: getTrackUrl('Fiddles McGinty') },
            { id: 't_master', title: 'Master of the Feast', artist: 'Kevin MacLeod', url: getTrackUrl('Master of the Feast') },
            { id: 't_folk', title: 'Folk Round', artist: 'Kevin MacLeod', url: getTrackUrl('Folk Round') },
            { id: 't_ren', title: 'Renaissance', artist: 'Kevin MacLeod', url: getTrackUrl('Renaissance') },
        ] 
    },
    {
        id: 'city_court',
        name: 'Город и Двор',
        category: 'city',
        tracks: [
            { id: 'ci_min', title: 'Minstrel Guild', artist: 'Kevin MacLeod', url: getTrackUrl('Minstrel Guild') },
            { id: 'ci_lord', title: 'Lord of the Land', artist: 'Kevin MacLeod', url: getTrackUrl('Lord of the Land') },
            { id: 'ci_lute', title: 'Suonatore di Liuto', artist: 'Kevin MacLeod', url: getTrackUrl('Suonatore di Liuto') },
            { id: 'ci_king', title: 'Procession of the King', artist: 'Kevin MacLeod', url: getTrackUrl('Procession of the King') },
            { id: 'ci_build', title: 'The Builder', artist: 'Kevin MacLeod', url: getTrackUrl('The Builder') },
            { id: 'ci_waltz', title: 'Fairytale Waltz', artist: 'Kevin MacLeod', url: getTrackUrl('Fairytale Waltz') },
            { id: 'ci_queen', title: 'Court of the Queen', artist: 'Kevin MacLeod', url: getTrackUrl('Court of the Queen') },
            { id: 'ci_teller', title: 'Teller of the Tales', artist: 'Kevin MacLeod', url: getTrackUrl('Teller of the Tales') },
            { id: 'ci_cons', title: 'Village Consort', artist: 'Kevin MacLeod', url: getTrackUrl('Village Consort') },
            { id: 'ci_pippin', title: 'Pippin the Hunchback', artist: 'Kevin MacLeod', url: getTrackUrl('Pippin the Hunchback') },
            { id: 'ci_busy', title: 'Busybody', artist: 'Kevin MacLeod', url: getTrackUrl('Busybody') },
            { id: 'ci_works', title: 'Works of Mercy', artist: 'Kevin MacLeod', url: getTrackUrl('Works of Mercy') },
        ]
    },
    {
        id: 'city_comedy',
        name: 'Комедия / Гоблины',
        category: 'city',
        tracks: [
            { id: 'co_sch', title: 'Scheming Weasel', artist: 'Kevin MacLeod', url: getTrackUrl('Scheming Weasel faster') },
            { id: 'co_fluf', title: 'Fluffing a Duck', artist: 'Kevin MacLeod', url: getTrackUrl('Fluffing a Duck') },
            { id: 'co_monk', title: 'Monkeys Spinning Monkeys', artist: 'Kevin MacLeod', url: getTrackUrl('Monkeys Spinning Monkeys') },
            { id: 'co_pix', title: 'Pixelland', artist: 'Kevin MacLeod', url: getTrackUrl('Pixelland') },
            { id: 'co_run', title: 'Run Amok', artist: 'Kevin MacLeod', url: getTrackUrl('Run Amok') },
            { id: 'co_build', title: 'Builder', artist: 'Kevin MacLeod', url: getTrackUrl('The Builder') },
            { id: 'co_invest', title: 'Investigations', artist: 'Kevin MacLeod', url: getTrackUrl('Investigations') },
            { id: 'co_sneaky', title: 'Sneaky Snitch', artist: 'Kevin MacLeod', url: getTrackUrl('Sneaky Snitch') },
            { id: 'co_spook', title: 'Spook', artist: 'Kevin MacLeod', url: getTrackUrl('Spook') },
        ]
    },

    // ==========================================
    // HORROR & MYSTIC
    // ==========================================
    { 
        id: 'horror_creepy', 
        name: 'Ужас и Хоррор', 
        category: 'horror', 
        tracks: [
            { id: 'h_nerv', title: 'Nervous', artist: 'Kevin MacLeod', url: getTrackUrl('Nervous') },
            { id: 'h_long', title: 'Long Note One', artist: 'Kevin MacLeod', url: getTrackUrl('Long Note One') },
            { id: 'h_long2', title: 'Long Note Two', artist: 'Kevin MacLeod', url: getTrackUrl('Long Note Two') },
            { id: 'h_sat', title: 'Satiate', artist: 'Kevin MacLeod', url: getTrackUrl('Satiate') },
            { id: 'h_unseen', title: 'Unseen Horrors', artist: 'Kevin MacLeod', url: getTrackUrl('Unseen Horrors') },
            { id: 'h_anx', title: 'Anxiety', artist: 'Kevin MacLeod', url: getTrackUrl('Anxiety') },
            { id: 'h_hush', title: 'Hush', artist: 'Kevin MacLeod', url: getTrackUrl('Hush') },
            { id: 'h_ghost', title: 'Ghost Story', artist: 'Kevin MacLeod', url: getTrackUrl('Ghost Story') },
            { id: 'h_heart', title: 'Heart of Nowhere', artist: 'Kevin MacLeod', url: getTrackUrl('Heart of Nowhere') },
            { id: 'h_gath', title: 'Gathering Darkness', artist: 'Kevin MacLeod', url: getTrackUrl('Gathering Darkness') },
            { id: 'h_decay', title: 'Decay', artist: 'Kevin MacLeod', url: getTrackUrl('Decay') },
            { id: 'h_inter', title: 'Interloper', artist: 'Kevin MacLeod', url: getTrackUrl('Interloper') },
            { id: 'h_house', title: 'House of Leaves', artist: 'Kevin MacLeod', url: getTrackUrl('House of Leaves') },
            { id: 'h_kool', title: 'Kool Kats', artist: 'Kevin MacLeod', url: getTrackUrl('Kool Kats') }, 
            { id: 'h_martian', title: 'Martian Cowboy', artist: 'Kevin MacLeod', url: getTrackUrl('Martian Cowboy') },
            { id: 'h_blue', title: 'Blue Sizzle', artist: 'Kevin MacLeod', url: getTrackUrl('Blue Sizzle') },
            { id: 'h_bent', title: 'Bent and Broken', artist: 'Kevin MacLeod', url: getTrackUrl('Bent and Broken') },
        ] 
    },
    {
        id: 'mystic_magic',
        name: 'Мистика и Тайна',
        category: 'mystic',
        tracks: [
            { id: 'm_arc', title: 'Arcadia', artist: 'Kevin MacLeod', url: getTrackUrl('Arcadia') },
            { id: 'm_col', title: 'Colorless Aura', artist: 'Kevin MacLeod', url: getTrackUrl('Colorless Aura') },
            { id: 'm_dream', title: 'Dreamy Flashback', artist: 'Kevin MacLeod', url: getTrackUrl('Dreamy Flashback') },
            { id: 'm_ench', title: 'Enchanted Valley', artist: 'Kevin MacLeod', url: getTrackUrl('Enchanted Valley') },
            { id: 'm_mid', title: 'Midsummer Sky', artist: 'Kevin MacLeod', url: getTrackUrl('Midsummer Sky') },
            { id: 'm_priv', title: 'Private Reflection', artist: 'Kevin MacLeod', url: getTrackUrl('Private Reflection') },
            { id: 'm_past', title: 'Past the Edge', artist: 'Kevin MacLeod', url: getTrackUrl('Past the Edge') },
            { id: 'm_mesm', title: 'Mesmerize', artist: 'Kevin MacLeod', url: getTrackUrl('Mesmerize') },
            { id: 'm_angel', title: 'Angel Share', artist: 'Kevin MacLeod', url: getTrackUrl('Angel Share') },
            { id: 'm_divine', title: 'Divine Life', artist: 'Kevin MacLeod', url: getTrackUrl('Divine Life') },
            { id: 'm_peace', title: 'Peace of Mind', artist: 'Kevin MacLeod', url: getTrackUrl('Peace of Mind') },
            { id: 'm_wonders', title: 'Wonders of Other Worlds', artist: 'Kevin MacLeod', url: getTrackUrl('Wonders of Other Worlds') },
            { id: 'm_descent', title: 'The Descent', artist: 'Kevin MacLeod', url: getTrackUrl('The Descent') },
        ]
    },

    // ==========================================
    // DRAMA & SCIFI & SPECIAL
    // ==========================================
    {
        id: 'drama_sad',
        name: 'Печаль и Драма',
        category: 'drama',
        tracks: [
            { id: 'd_wist', title: 'Wistful Harp', artist: 'Kevin MacLeod', url: getTrackUrl('Wistful Harp') },
            { id: 'd_part', title: 'The Parting', artist: 'Kevin MacLeod', url: getTrackUrl('The Parting') },
            { id: 'd_end', title: 'End of the Era', artist: 'Kevin MacLeod', url: getTrackUrl('End of the Era') },
            { id: 'd_longing', title: 'Longing and Concern', artist: 'Kevin MacLeod', url: getTrackUrl('Longing and Concern') },
            { id: 'd_loss', title: 'Loss', artist: 'Kevin MacLeod', url: getTrackUrl('Loss') },
            { id: 'd_wounded', title: 'Wounded', artist: 'Kevin MacLeod', url: getTrackUrl('Wounded') },
            { id: 'd_sad', title: 'Sad Trio', artist: 'Kevin MacLeod', url: getTrackUrl('Sad Trio') },
            { id: 'd_despair', title: 'Despair and Triumph', artist: 'Kevin MacLeod', url: getTrackUrl('Despair and Triumph') },
            { id: 'd_forgot', title: 'Forgotten', artist: 'Kevin MacLeod', url: getTrackUrl('Forgotten') },
            { id: 'd_regret', title: 'Regret', artist: 'Kevin MacLeod', url: getTrackUrl('Regret') },
        ]
    },
    {
        id: 'scifi_space',
        name: 'Сай-Фай и Космос',
        category: 'scifi',
        tracks: [
            { id: 'sf_space', title: 'Space Jazz', artist: 'Kevin MacLeod', url: getTrackUrl('Space Jazz') },
            { id: 'sf_tech', title: 'Techno', artist: 'Kevin MacLeod', url: getTrackUrl('Techno 1') },
            { id: 'sf_deep', title: 'Deep Haze', artist: 'Kevin MacLeod', url: getTrackUrl('Deep Haze') },
            { id: 'sf_dark', title: 'Dark Walk', artist: 'Kevin MacLeod', url: getTrackUrl('Dark Walk') },
            { id: 'sf_echo', title: 'Echoes of Time', artist: 'Kevin MacLeod', url: getTrackUrl('Echoes of Time') },
            { id: 'sf_spac', title: 'Spacial Harvest', artist: 'Kevin MacLeod', url: getTrackUrl('Spacial Harvest') },
            { id: 'sf_mach', title: 'Machine', artist: 'Kevin MacLeod', url: getTrackUrl('Machine') },
            { id: 'sf_metap', title: 'Metaphysik', artist: 'Kevin MacLeod', url: getTrackUrl('Metaphysik') },
            { id: 'sf_neon', title: 'Neon Laser', artist: 'Kevin MacLeod', url: getTrackUrl('Neon Laser') },
            { id: 'sf_strut', title: 'Strut', artist: 'Kevin MacLeod', url: getTrackUrl('Strut') },
        ]
    },
    {
        id: 'special_victory',
        name: 'Победа и Фанфары',
        category: 'special',
        tracks: [
            { id: 'vic1', title: 'Heroic Age (Vic)', artist: 'Kevin MacLeod', url: getTrackUrl('Heroic Age') },
            { id: 'vic2', title: 'Winner Winner', artist: 'Kevin MacLeod', url: getTrackUrl('Winner Winner') },
            { id: 'vic3', title: 'Fanfare for Space', artist: 'Kevin MacLeod', url: getTrackUrl('Fanfare for Space') },
            { id: 'vic4', title: 'The Cannery', artist: 'Kevin MacLeod', url: getTrackUrl('The Cannery') },
            { id: 'vic5', title: 'Victory', artist: 'Kevin MacLeod', url: getTrackUrl('Victory') },
            { id: 'vic6', title: 'Call to Adventure', artist: 'Kevin MacLeod', url: getTrackUrl('Call to Adventure') },
            { id: 'vic7', title: 'Feelin Good', artist: 'Kevin MacLeod', url: getTrackUrl('Feelin Good') },
        ]
    },
    {
        id: 'special_eastern',
        name: 'Восточный Стиль',
        category: 'special',
        tracks: [
            { id: 'e_city', title: 'Desert City', artist: 'Kevin MacLeod', url: getTrackUrl('Desert City') },
            { id: 'e_ish', title: 'Ishikari Lore', artist: 'Kevin MacLeod', url: getTrackUrl('Ishikari Lore') },
            { id: 'e_dhaka', title: 'Dhaka', artist: 'Kevin MacLeod', url: getTrackUrl('Dhaka') },
            { id: 'e_imp', title: 'Impact Intermezzo', artist: 'Kevin MacLeod', url: getTrackUrl('Impact Intermezzo') },
            { id: 'e_kum', title: 'Kumasi Groove', artist: 'Kevin MacLeod', url: getTrackUrl('Kumasi Groove') },
            { id: 'e_mirage', title: 'Mirage', artist: 'Kevin MacLeod', url: getTrackUrl('Mirage') },
            { id: 'e_orient', title: 'Opium', artist: 'Kevin MacLeod', url: getTrackUrl('Opium') },
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
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    // Merge saved playlists with initial if needed, or just use saved.
                    // For this update, we prefer the new INITIAL_PRESETS structure if old one is small.
                    // Simple check: if saved has fewer playlists than new initial, use initial.
                    if (parsed.length < INITIAL_PRESETS.length) return INITIAL_PRESETS;
                    return parsed;
                }
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
                    else if (err.code === 4) errMsg = "Файл не найден.";
                    console.warn(`Audio Error (${err.code}): ${err.message}`);
                }
                // Only set error if we are actively trying to play
                if (isPlaying) {
                    setError(errMsg);
                    setIsLoading(false);
                    setIsPlaying(false);
                }
            });
            audioRef.current.addEventListener('waiting', () => setIsLoading(true));
            audioRef.current.addEventListener('canplay', () => setIsLoading(false));
        }
        
        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.removeAttribute('src');
            }
        };
    }, []);

    // Volume Sync for Music AND SFX
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
        // Also update all active SFX instantly
        activeSfxRef.current.forEach(sfx => {
            sfx.volume = volume;
        });
    }, [volume]);

    // Playback Control
    useEffect(() => {
        const playAudio = async () => {
            if (!audioRef.current) return;
            
            if (currentTrack && currentTrack.url) {
                const currentSrc = audioRef.current.getAttribute('src');
                // Only reload source if it changed
                if (currentSrc !== currentTrack.url) {
                    audioRef.current.src = currentTrack.url;
                    audioRef.current.load();
                }

                if (isPlaying) {
                    try {
                        await audioRef.current.play();
                        setError(null);
                    } catch (e: any) {
                        console.warn("Play attempt failed:", e);
                        if (e.name !== 'AbortError') {
                            setIsPlaying(false);
                        }
                    }
                } else {
                    audioRef.current.pause();
                }
            } else {
                audioRef.current.pause();
                if (audioRef.current.getAttribute('src')) {
                     audioRef.current.removeAttribute('src');
                }
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
        // FIX: Added check for tracks array existence
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

    // Improved SFX Player
    const playSfx = (url: string) => {
        try {
            if (!url) return;
            const audio = new Audio(url);
            audio.volume = volume; // Use current master volume immediately
            
            // Track this SFX instance
            activeSfxRef.current.add(audio);
            
            // Cleanup when done
            audio.addEventListener('ended', () => {
                activeSfxRef.current.delete(audio);
            });
            
            // Cleanup on error
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

    // Stop all active sound effects immediately
    const stopAllSfx = () => {
        activeSfxRef.current.forEach(audio => {
            audio.pause();
            audio.currentTime = 0;
        });
        activeSfxRef.current.clear();
    };

    // --- AUTO-DJ LOGIC ---
    const autoPlayMusic = (type: 'combat' | 'location' | 'travel' | 'victory', contextText: string = '') => {
        const text = contextText.toLowerCase();
        let targetId = 'atmosphere'; // Default fallback

        if (type === 'victory') targetId = 'special_victory';
        else if (type === 'travel') targetId = 'atmo_travel';
        else if (type === 'combat') {
             if (text.includes('boss') || text.includes('ancient') || text.includes('dragon') || text.includes('lich') || text.includes('lord')) targetId = 'combat_boss';
             else if (text.includes('chase') || text.includes('run') || text.includes('escape') || text.includes('hunt')) targetId = 'combat_chase';
             else targetId = 'combat_epic';
        } else {
             // Location logic
             if (text.includes('tavern') || text.includes('inn') || text.includes('bar') || text.includes('pub')) targetId = 'city_tavern';
             else if (text.includes('dungeon') || text.includes('crypt') || text.includes('cave') || text.includes('tomb') || text.includes('underdark') || text.includes('ruin')) targetId = 'atmo_dungeon';
             else if (text.includes('forest') || text.includes('wood') || text.includes('jungle') || text.includes('nature') || text.includes('grove')) targetId = 'atmo_nature';
             else if (text.includes('horror') || text.includes('dark') || text.includes('shadow') || text.includes('fear') || text.includes('blood') || text.includes('haunted')) targetId = 'horror_creepy';
             else if (text.includes('magic') || text.includes('tower') || text.includes('library') || text.includes('arcane') || text.includes('crystal') || text.includes('mystic')) targetId = 'mystic_magic';
             else if (text.includes('desert') || text.includes('sand') || text.includes('sun') || text.includes('waste')) targetId = 'special_eastern';
             else if (text.includes('city') || text.includes('town') || text.includes('village') || text.includes('port') || text.includes('market') || text.includes('capital')) targetId = 'city_court';
             else if (text.includes('space') || text.includes('astral') || text.includes('void') || text.includes('star') || text.includes('alien')) targetId = 'scifi_space';
             else if (text.includes('sad') || text.includes('sorrow') || text.includes('loss') || text.includes('grave') || text.includes('drama')) targetId = 'drama_sad';
        }

        // Only switch if it's a different playlist to avoid restarting the song
        if (currentPlaylistId !== targetId) {
            playPlaylist(targetId, true);
        }
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
            stopAllSfx,
            autoPlayMusic
        }}>
            {children}
        </AudioContext.Provider>
    );
};
