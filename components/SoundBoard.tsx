
import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, 
  Music, Plus, Upload, Trash2, X, 
  Youtube, FileAudio, ListMusic, AlertCircle, Loader
} from 'lucide-react';
import ReactPlayer from 'react-player';

// --- Types ---

interface Track {
  id: string;
  title: string;
  type: 'youtube' | 'local';
  url: string; // YouTube URL or Blob URL
}

interface Playlist {
  id: string;
  name: string;
  category: 'atmosphere' | 'mood' | 'combat' | 'travel';
  tracks: Track[];
}

// --- Presets ---

const INITIAL_PRESETS: Playlist[] = [
    // Atmosphere
    { 
        id: 'forest', 
        name: '🌲 Лес', 
        category: 'atmosphere', 
        tracks: [
            { id: 'forest1', title: 'Летний лес днем', type: 'youtube', url: 'https://www.youtube.com/watch?v=N6-Qlo8Ff5Y' },
            { id: 'forest2', title: 'Ночной лес (сверчки)', type: 'youtube', url: 'https://www.youtube.com/watch?v=HMnrl0tmd3k' },
            { id: 'forest3', title: 'Дождь в лесу', type: 'youtube', url: 'https://www.youtube.com/watch?v=J4d-a7dV_eE' },
            { id: 'forest4', title: 'Магический лес (Эльфы)', type: 'youtube', url: 'https://www.youtube.com/watch?v=3VLXyUfV-3A' },
            { id: 'forest5', title: 'Зимний ветер и лес', type: 'youtube', url: 'https://www.youtube.com/watch?v=Go52_a853kk' }
        ] 
    },
    { 
        id: 'mountains', 
        name: '⛰️ Горы', 
        category: 'atmosphere', 
        tracks: [
            { id: 'mount1', title: 'Ветреный пик', type: 'youtube', url: 'https://www.youtube.com/watch?v=IoXG2sh1X-M' },
            { id: 'mount2', title: 'Снежная буря', type: 'youtube', url: 'https://www.youtube.com/watch?v=vz91QpgUjFc' },
            { id: 'mount3', title: 'Горный перевал (Эмбиент)', type: 'youtube', url: 'https://www.youtube.com/watch?v=M04fVv4M7v8' },
            { id: 'mount4', title: 'Вход в пещеру', type: 'youtube', url: 'https://www.youtube.com/watch?v=Fw3rbdFlx1w' },
            { id: 'mount5', title: 'Извержение вулкана', type: 'youtube', url: 'https://www.youtube.com/watch?v=2d80d70WwQ4' }
        ] 
    },
    { 
        id: 'dungeon', 
        name: '🏰 Подземелье', 
        category: 'atmosphere', 
        tracks: [
            { id: 'dung1', title: 'Факелы и капли', type: 'youtube', url: 'https://www.youtube.com/watch?v=bYIu95c4rno' },
            { id: 'dung2', title: 'Древняя крипта', type: 'youtube', url: 'https://www.youtube.com/watch?v=49oD8HjC7kM' },
            { id: 'dung3', title: 'Канализация и крысы', type: 'youtube', url: 'https://www.youtube.com/watch?v=ZpC3tFshXf8' },
            { id: 'dung4', title: 'Темный храм (Чанты)', type: 'youtube', url: 'https://www.youtube.com/watch?v=0m73R07CclM' },
            { id: 'dung5', title: 'Логово пауков', type: 'youtube', url: 'https://www.youtube.com/watch?v=oT2xMd-Jp9o' }
        ] 
    },
    { 
        id: 'city', 
        name: '🏙️ Город', 
        category: 'atmosphere', 
        tracks: [
            { id: 'city1', title: 'Средневековый город (День)', type: 'youtube', url: 'https://www.youtube.com/watch?v=j4qL9uD4u0o' },
            { id: 'city2', title: 'Рыночная площадь', type: 'youtube', url: 'https://www.youtube.com/watch?v=E_T-uC1aH3A' },
            { id: 'city3', title: 'Ночной город (Воры)', type: 'youtube', url: 'https://www.youtube.com/watch?v=5FjWe_qvKwo' },
            { id: 'city4', title: 'Дождь в городе', type: 'youtube', url: 'https://www.youtube.com/watch?v=2gq8KkE1g4A' },
            { id: 'city5', title: 'Портовый город', type: 'youtube', url: 'https://www.youtube.com/watch?v=7w93-HwQdJE' }
        ] 
    },
    { 
        id: 'tavern', 
        name: '🍺 Таверна', 
        category: 'atmosphere', 
        tracks: [
            { id: 'tav1', title: 'Шумная таверна', type: 'youtube', url: 'https://www.youtube.com/watch?v=4nzb31a98T8' },
            { id: 'tav2', title: 'Песни Барда (Instrumental)', type: 'youtube', url: 'https://www.youtube.com/watch?v=025M8j0K9qs' },
            { id: 'tav3', title: 'Тихий очаг (Пустая)', type: 'youtube', url: 'https://www.youtube.com/watch?v=c0_eJVbZg6A' },
            { id: 'tav4', title: 'Пиратский паб', type: 'youtube', url: 'https://www.youtube.com/watch?v=2mZ0_p3X_Kw' },
            { id: 'tav5', title: 'Гномий пир', type: 'youtube', url: 'https://www.youtube.com/watch?v=Db8t2ZkG9t8' }
        ] 
    },
    { 
        id: 'swamp', 
        name: '🐸 Болото', 
        category: 'atmosphere', 
        tracks: [
            { id: 'swamp1', title: 'Топи днем (Мухи)', type: 'youtube', url: 'https://www.youtube.com/watch?v=28Gj9-r87KY' },
            { id: 'swamp2', title: 'Болото ночью (Лягушки)', type: 'youtube', url: 'https://www.youtube.com/watch?v=W74p6s-8J4Q' },
            { id: 'swamp3', title: 'Дождь на болоте', type: 'youtube', url: 'https://www.youtube.com/watch?v=DM8aT36WJ_s' },
            { id: 'swamp4', title: 'Мертвые топи', type: 'youtube', url: 'https://www.youtube.com/watch?v=1WjUoG52x08' },
            { id: 'swamp5', title: 'Рой насекомых', type: 'youtube', url: 'https://www.youtube.com/watch?v=I8I9XJ3k2wQ' }
        ] 
    },
    
    // Mood
    { 
        id: 'peaceful', 
        name: '☮️ Мирное', 
        category: 'mood', 
        tracks: [
            { id: 'peace1', title: 'У костра (Campfire)', type: 'youtube', url: 'https://www.youtube.com/watch?v=q76bMs-NwRk' },
            { id: 'peace2', title: 'Родная деревня', type: 'youtube', url: 'https://www.youtube.com/watch?v=6t5h_6y3Qnk' },
            { id: 'peace3', title: 'Спокойная лютня', type: 'youtube', url: 'https://www.youtube.com/watch?v=4yB151jYFQI' },
            { id: 'peace4', title: 'Эфирный сон', type: 'youtube', url: 'https://www.youtube.com/watch?v=O9J-Kk2d0GE' },
            { id: 'peace5', title: 'Утро в лагере', type: 'youtube', url: 'https://www.youtube.com/watch?v=17U60V5o3Cw' }
        ] 
    },
    { 
        id: 'tense', 
        name: '😰 Напряженное', 
        category: 'mood', 
        tracks: [
            { id: 'tense1', title: 'Жуткий эмбиент', type: 'youtube', url: 'https://www.youtube.com/watch?v=Lq2byr-6m6c' },
            { id: 'tense2', title: 'Ожидание атаки', type: 'youtube', url: 'https://www.youtube.com/watch?v=WoC6wF79S8U' },
            { id: 'tense3', title: 'Погоня (Барабаны)', type: 'youtube', url: 'https://www.youtube.com/watch?v=jO5fQf9v0zM' },
            { id: 'tense4', title: 'Лавкрафтианский Хоррор', type: 'youtube', url: 'https://www.youtube.com/watch?v=l0M1F-lXjZg' },
            { id: 'tense5', title: 'Ритуал культистов', type: 'youtube', url: 'https://www.youtube.com/watch?v=b9Cghv4q2_I' }
        ] 
    },
    { 
        id: 'tragic', 
        name: '😢 Трагическое', 
        category: 'mood', 
        tracks: [
            { id: 'tragic1', title: 'Грустное пианино', type: 'youtube', url: 'https://www.youtube.com/watch?v=a_Am4cHMBKM' },
            { id: 'tragic2', title: 'После битвы (Тишина)', type: 'youtube', url: 'https://www.youtube.com/watch?v=Y5M9Wl2sW3k' },
            { id: 'tragic3', title: 'Скорбь (Скрипка)', type: 'youtube', url: 'https://www.youtube.com/watch?v=Ol3t9Q4x8E0' },
            { id: 'tragic4', title: 'Дождливое настроение', type: 'youtube', url: 'https://www.youtube.com/watch?v=1zZw1Qk6Y-Q' },
            { id: 'tragic5', title: 'Прощание героев', type: 'youtube', url: 'https://www.youtube.com/watch?v=C0t9zP_sXyM' }
        ] 
    },
    { 
        id: 'mysterious', 
        name: '🔮 Загадочное', 
        category: 'mood', 
        tracks: [
            { id: 'myst1', title: 'Тайная магия', type: 'youtube', url: 'https://www.youtube.com/watch?v=dJ-d5j5Z1b0' },
            { id: 'myst2', title: 'Комната загадок', type: 'youtube', url: 'https://www.youtube.com/watch?v=7O2b2G2f1yY' },
            { id: 'myst3', title: 'Страна Фей (Feywild)', type: 'youtube', url: 'https://www.youtube.com/watch?v=GjS0y3Gk-iM' },
            { id: 'myst4', title: 'Шепот Бездны', type: 'youtube', url: 'https://www.youtube.com/watch?v=xQ6x6W_tF1g' },
            { id: 'myst5', title: 'Древнее пророчество', type: 'youtube', url: 'https://www.youtube.com/watch?v=K_1C-e-j6gM' }
        ] 
    },
    
    // Combat
    { 
        id: 'light-combat', 
        name: '⚔️ Легкий бой', 
        category: 'combat', 
        tracks: [
            { id: 'cbt1', title: 'Стычка с бандитами (Ведьмак)', type: 'youtube', url: 'https://www.youtube.com/watch?v=3YxaaGgTQYM' },
            { id: 'cbt2', title: 'Сталь для Людей', type: 'youtube', url: 'https://www.youtube.com/watch?v=0Ccpv3mz4HI' },
            { id: 'cbt3', title: 'Гоблины атакуют', type: 'youtube', url: 'https://www.youtube.com/watch?v=F9g4r1W_D1g' },
            { id: 'cbt4', title: 'Дикие племена', type: 'youtube', url: 'https://www.youtube.com/watch?v=7G1Fq8zFqJ0' },
            { id: 'cbt5', title: 'Драка в таверне', type: 'youtube', url: 'https://www.youtube.com/watch?v=Jg4Xj5T4j1g' }
        ] 
    },
    { 
        id: 'epic-combat', 
        name: '🗡️ Эпичный бой', 
        category: 'combat', 
        tracks: [
            { id: 'epic1', title: 'Two Steps From Hell - Victory', type: 'youtube', url: 'https://www.youtube.com/watch?v=hKRUPYrAQoE' },
            { id: 'epic2', title: 'Dragonborn (Skyrim)', type: 'youtube', url: 'https://www.youtube.com/watch?v=y5XhT8k7a1U' },
            { id: 'epic3', title: 'Барабаны войны', type: 'youtube', url: 'https://www.youtube.com/watch?v=1m0LhJ-hGgU' },
            { id: 'epic4', title: 'Набег викингов', type: 'youtube', url: 'https://www.youtube.com/watch?v=5P5jT9x_x8o' },
            { id: 'epic5', title: 'Финальная битва (Оркестр)', type: 'youtube', url: 'https://www.youtube.com/watch?v=k7R9wZwX6-0' }
        ] 
    },
    { 
        id: 'boss', 
        name: '👹 Босс', 
        category: 'combat', 
        tracks: [
            { id: 'boss1', title: 'Vordt of the Boreal Valley', type: 'youtube', url: 'https://www.youtube.com/watch?v=Q3xQ17S1t4s' },
            { id: 'boss2', title: 'Ярость Дракона', type: 'youtube', url: 'https://www.youtube.com/watch?v=w0sM7G8C-kU' },
            { id: 'boss3', title: 'Присутствие Лича', type: 'youtube', url: 'https://www.youtube.com/watch?v=2x3L3v-w9Kk' },
            { id: 'boss4', title: 'Лорд Демонов', type: 'youtube', url: 'https://www.youtube.com/watch?v=K_1C-e-j6gM' },
            { id: 'boss5', title: 'Высший Вампир', type: 'youtube', url: 'https://www.youtube.com/watch?v=C0t9zP_sXyM' }
        ] 
    },
    { 
        id: 'victory', 
        name: '🏆 Победа', 
        category: 'combat', 
        tracks: [
            { id: 'vic1', title: 'Фанфары Победы (FF)', type: 'youtube', url: 'https://www.youtube.com/watch?v=-Yg7X3n4M_Y' },
            { id: 'vic2', title: 'Празднование в зале', type: 'youtube', url: 'https://www.youtube.com/watch?v=lYt3r0ZqKqA' },
            { id: 'vic3', title: 'Тост в таверне', type: 'youtube', url: 'https://www.youtube.com/watch?v=4nzb31a98T8' },
            { id: 'vic4', title: 'Получение уровня', type: 'youtube', url: 'https://www.youtube.com/watch?v=3YxaaGgTQYM' },
            { id: 'vic5', title: 'Безопасная зона', type: 'youtube', url: 'https://www.youtube.com/watch?v=6t5h_6y3Qnk' }
        ] 
    },
    
    // Travel
    { 
        id: 'road', 
        name: '🛤️ Дорога', 
        category: 'travel', 
        tracks: [
            { id: 'road1', title: 'Верховая езда', type: 'youtube', url: 'https://www.youtube.com/watch?v=17U60V5o3Cw' },
            { id: 'road2', title: 'Повозка и колеса', type: 'youtube', url: 'https://www.youtube.com/watch?v=y5XhT8k7a1U' },
            { id: 'road3', title: 'Пеший ход (День)', type: 'youtube', url: 'https://www.youtube.com/watch?v=xNN7iTA57jM' },
            { id: 'road4', title: 'Ночная дорога', type: 'youtube', url: 'https://www.youtube.com/watch?v=hE_O--jwtz4' },
            { id: 'road5', title: 'Дождь в пути', type: 'youtube', url: 'https://www.youtube.com/watch?v=b5X-r9cT2qU' }
        ] 
    },
    { 
        id: 'ocean', 
        name: '🌊 Океан', 
        category: 'travel', 
        tracks: [
            { id: 'ocean1', title: 'Парусник в море', type: 'youtube', url: 'https://www.youtube.com/watch?v=7w93-HwQdJE' },
            { id: 'ocean2', title: 'Шторм на море', type: 'youtube', url: 'https://www.youtube.com/watch?v=iL2l5Q1Wz6k' },
            { id: 'ocean3', title: 'Штиль и волны', type: 'youtube', url: 'https://www.youtube.com/watch?v=n8X9_MgEdCg' },
            { id: 'ocean4', title: 'Пиратский корабль (Команда)', type: 'youtube', url: 'https://www.youtube.com/watch?v=2mZ0_p3X_Kw' },
            { id: 'ocean5', title: 'Под водой', type: 'youtube', url: 'https://www.youtube.com/watch?v=28Gj9-r87KY' }
        ] 
    },
    { 
        id: 'desert', 
        name: '🏜️ Пустыня', 
        category: 'travel', 
        tracks: [
            { id: 'desert1', title: 'Ветра пустыни', type: 'youtube', url: 'https://www.youtube.com/watch?v=2d80d70WwQ4' },
            { id: 'desert2', title: 'Оазис (Вода)', type: 'youtube', url: 'https://www.youtube.com/watch?v=17U60V5o3Cw' },
            { id: 'desert3', title: 'Караван верблюдов', type: 'youtube', url: 'https://www.youtube.com/watch?v=3YxaaGgTQYM' },
            { id: 'desert4', title: 'Древние пески', type: 'youtube', url: 'https://www.youtube.com/watch?v=Fw3rbdFlx1w' },
            { id: 'desert5', title: 'Ночная пустыня', type: 'youtube', url: 'https://www.youtube.com/watch?v=O9J-Kk2d0GE' }
        ] 
    },
    { 
        id: 'flight', 
        name: '🦅 Полёт', 
        category: 'travel', 
        tracks: [
            { id: 'flight1', title: 'Воздушный корабль', type: 'youtube', url: 'https://www.youtube.com/watch?v=IoXG2sh1X-M' },
            { id: 'flight2', title: 'Выше облаков', type: 'youtube', url: 'https://www.youtube.com/watch?v=17U60V5o3Cw' },
            { id: 'flight3', title: 'Полет на драконе', type: 'youtube', url: 'https://www.youtube.com/watch?v=pASW3l_j5QA' },
            { id: 'flight4', title: 'Грозовое небо', type: 'youtube', url: 'https://www.youtube.com/watch?v=iL2l5Q1Wz6k' },
            { id: 'flight5', title: 'Высокогорье', type: 'youtube', url: 'https://www.youtube.com/watch?v=xQ6x6W_tF1g' }
        ] 
    }
];

const CATEGORIES = {
    atmosphere: 'Атмосфера',
    combat: 'Бой',
    mood: 'Настроение',
    travel: 'Путешествие'
};

// --- Component ---

const SoundBoard: React.FC = () => {
  // State
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
      try {
          const saved = localStorage.getItem('dmc_playlists');
          if (saved) {
              const parsed = JSON.parse(saved);
              // If saved playlists are empty/old, merge with new defaults
              return INITIAL_PRESETS.map(p => {
                  const savedP = parsed.find((sp: Playlist) => sp.id === p.id);
                  // Restore user changes but respect new defaults if saved is empty
                  if (savedP && savedP.tracks && savedP.tracks.length > 0) {
                      return { ...p, tracks: savedP.tracks.filter((t: Track) => t.type === 'youtube') };
                  }
                  return p;
              });
          }
      } catch (e) { console.error(e); }
      return INITIAL_PRESETS;
  });

  const [currentPlaylistId, setCurrentPlaylistId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [errorCount, setErrorCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Modal State
  const [viewPlaylistId, setViewPlaylistId] = useState<string | null>(null);
  const [newYtUrl, setNewYtUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Persist
  useEffect(() => {
      const toSave = playlists.map(p => ({
          ...p,
          tracks: p.tracks.filter(t => t.type === 'youtube') // Don't save local blobs
      }));
      localStorage.setItem('dmc_playlists', JSON.stringify(toSave));
  }, [playlists]);

  // Helpers
  const activePlaylist = playlists.find(p => p.id === currentPlaylistId);
  const viewedPlaylist = playlists.find(p => p.id === viewPlaylistId);

  const playTrack = (track: Track, playlistId: string) => {
      setErrorMessage(null);
      setErrorCount(0);
      setCurrentPlaylistId(playlistId);
      setCurrentTrack(track);
      setIsPlaying(true);
      setIsLoading(true); 
  };

  const togglePlay = () => {
      if (currentTrack) setIsPlaying(!isPlaying);
  };

  const playNext = () => {
      if (!activePlaylist || !currentTrack) return;
      
      const idx = activePlaylist.tracks.findIndex(t => t.id === currentTrack.id);
      // If track removed or not found, try first
      const startIdx = idx === -1 ? 0 : idx;
      const nextIdx = (startIdx + 1) % activePlaylist.tracks.length;
      
      // Keep playing the next track in the same playlist
      const nextTrack = activePlaylist.tracks[nextIdx];
      
      // Update state
      setCurrentTrack(nextTrack);
      setIsPlaying(true);
      setIsLoading(true);
  };

  const playPrev = () => {
      setErrorMessage(null);
      setErrorCount(0);
      if (!activePlaylist || !currentTrack) return;
      const idx = activePlaylist.tracks.findIndex(t => t.id === currentTrack.id);
      if (idx === -1) return;
      
      const prevIdx = idx === 0 ? activePlaylist.tracks.length - 1 : idx - 1;
      const prevTrack = activePlaylist.tracks[prevIdx];
      setCurrentTrack(prevTrack);
      setIsPlaying(true);
      setIsLoading(true);
  };

  const handlePlayerError = (e: any) => {
      setIsLoading(false);

      // Extract error code
      let code: number | null = null;
      if (typeof e === 'number') {
          code = e;
      } else if (e && typeof e === 'object' && 'data' in e) {
          code = Number(e.data);
      }

      console.warn(`Audio Player Error: ${code}`);

      // 150, 153, 101: Embedded playback prohibited by video owner
      // 100: Video not found
      const isSkipable = [100, 101, 150, 153].includes(code || 0);

      // If we have a playlist, try to skip
      if (activePlaylist && activePlaylist.tracks.length > 1) {
          // Allow skipping up to 5 restricted tracks in a row before stopping
          if (errorCount < 5) {
              setErrorCount(prev => prev + 1);
              const msg = isSkipable ? "Ограничено автором" : "Ошибка";
              setErrorMessage(`${msg}. Пропуск...`);
              
              // Small delay to prevent tight loops
              setTimeout(() => {
                  playNext();
              }, 500);
              return;
          } else {
              setIsPlaying(false);
              setErrorMessage("Много ошибок подряд. Плеер остановлен.");
              setErrorCount(0);
              return;
          }
      }

      // Single track failed
      setIsPlaying(false);
      setErrorMessage("Видео недоступно (ограничено автором)");
  };

  const handlePlayerReady = () => {
      setIsLoading(false);
      setErrorMessage(null);
  };

  const handleTrackEnd = () => {
      setErrorCount(0); // Reset error count on successful play
      playNext();
  };

  // Management
  const addYoutubeTrack = () => {
      if (!viewPlaylistId || !newYtUrl.trim()) return;
      
      const url = newYtUrl.trim();
      if (!ReactPlayer.canPlay(url)) {
          alert("Некорректная ссылка. Поддерживаются YouTube ссылки.");
          return;
      }

      const name = `YouTube Track ${Date.now().toString().slice(-4)}`;
      const newTrack: Track = {
          id: Date.now().toString(),
          title: name,
          type: 'youtube',
          url: url
      };

      setPlaylists(prev => prev.map(p => 
          p.id === viewPlaylistId ? { ...p, tracks: [...p.tracks, newTrack] } : p
      ));
      setNewYtUrl('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!viewPlaylistId || !e.target.files) return;
      
      const files = Array.from(e.target.files) as File[];
      const newTracks: Track[] = files.map(f => ({
          id: Date.now().toString() + Math.random(),
          title: f.name.replace(/\.[^/.]+$/, ""),
          type: 'local',
          url: URL.createObjectURL(f)
      }));

      setPlaylists(prev => prev.map(p => 
          p.id === viewPlaylistId ? { ...p, tracks: [...p.tracks, ...newTracks] } : p
      ));
  };

  const removeTrack = (playlistId: string, trackId: string) => {
      setPlaylists(prev => prev.map(p => 
          p.id === playlistId ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) } : p
      ));
      if (currentTrack?.id === trackId) {
          setIsPlaying(false);
          setCurrentTrack(null);
      }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
        
        {/* 
            Player Logic 
            Hidden container, but mounted. 
            Key ensures complete remount on track change to fix internal player state issues.
        */}
        <div style={{ position: 'fixed', bottom: 0, right: 0, width: '1px', height: '1px', opacity: 0, pointerEvents: 'none', zIndex: -100 }}>
            <ReactPlayer
                key={currentTrack?.id || 'no-track'} 
                url={currentTrack?.url}
                playing={isPlaying}
                volume={volume}
                width="100%"
                height="100%"
                controls={false}
                onEnded={handleTrackEnd}
                onReady={handlePlayerReady}
                onError={handlePlayerError}
                progressInterval={1000} 
                config={{
                    youtube: { 
                        playerVars: { 
                            showinfo: 0, 
                            controls: 0, 
                            autoplay: 1,
                            playsinline: 1,
                            rel: 0,
                            modestbranding: 1,
                            // origin: window.location.origin // Removed as it sometimes causes issues on localhost
                        } 
                    },
                    file: { 
                        forceAudio: true,
                        attributes: { controlsList: 'nodownload' }
                    }
                }}
            />
        </div>

        {/* --- Top Player Controls --- */}
        <div className="bg-dnd-card border-b border-gray-700 p-4 shrink-0 shadow-md z-10 flex flex-col md:flex-row items-center gap-4">
            {/* Track Info */}
            <div className="flex-1 flex items-center gap-4 min-w-0 w-full">
                <div className={`w-12 h-12 rounded bg-gray-800 flex items-center justify-center border border-gray-600 shrink-0 ${isPlaying ? 'animate-pulse border-gold-500 text-gold-500' : 'text-gray-500'}`}>
                    {isLoading ? <Loader className="w-6 h-6 animate-spin"/> : <Music className="w-6 h-6" />}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-200 truncate">{currentTrack?.title || 'Плеер ожидает'}</h3>
                    <div className="text-xs text-gray-500 truncate flex items-center gap-2">
                        <span>{activePlaylist ? activePlaylist.name : 'Выберите плейлист'}</span>
                        {currentTrack?.type && <span className="text-gray-600">•</span>}
                        <span>{currentTrack?.type === 'youtube' ? 'YouTube' : currentTrack?.type === 'local' ? 'Файл' : ''}</span>
                        {errorMessage && <span className="text-red-400 font-bold flex items-center gap-1 animate-in fade-in"><AlertCircle className="w-3 h-3"/> {errorMessage}</span>}
                    </div>
                </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4 shrink-0">
                 <button onClick={playPrev} disabled={!currentTrack} className="text-gray-400 hover:text-gold-500 disabled:opacity-30 transition-colors"><SkipBack className="w-6 h-6"/></button>
                 <button 
                    onClick={togglePlay} 
                    disabled={!currentTrack}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!currentTrack ? 'bg-gray-800 text-gray-600' : 'bg-gold-600 hover:bg-gold-500 text-black shadow-lg shadow-gold-900/20'}`}
                 >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                 </button>
                 <button onClick={playNext} disabled={!currentTrack} className="text-gray-400 hover:text-gold-500 disabled:opacity-30 transition-colors"><SkipForward className="w-6 h-6"/></button>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-2 w-full md:w-48 shrink-0">
                <Volume2 className="w-4 h-4 text-gray-500" />
                <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.05"
                    value={volume}
                    onChange={e => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
                />
            </div>
        </div>

        {/* --- Playlists Grid --- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
            {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(catKey => {
                const catPlaylists = playlists.filter(p => p.category === catKey);
                if (catPlaylists.length === 0) return null;

                return (
                    <section key={catKey}>
                        <h2 className="text-gold-500 font-serif font-bold text-xl mb-3 border-b border-gray-800 pb-1 flex items-center gap-2">
                            {catKey === 'atmosphere' && '🌲'}
                            {catKey === 'combat' && '⚔️'}
                            {catKey === 'mood' && '🎭'}
                            {catKey === 'travel' && '🐎'}
                            {CATEGORIES[catKey]}
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {catPlaylists.map(pl => {
                                const isActive = pl.id === currentPlaylistId;
                                const isPlayingThis = isActive && isPlaying;
                                
                                return (
                                    <button
                                        key={pl.id}
                                        onClick={() => setViewPlaylistId(pl.id)}
                                        className={`relative group p-4 rounded-lg border text-left transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[100px]
                                            ${isActive 
                                                ? 'bg-gray-800 border-gold-600 shadow-lg shadow-gold-900/10' 
                                                : 'bg-dnd-card border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-gray-200 mb-1">{pl.name}</div>
                                            <div className="text-xs text-gray-500">{pl.tracks.length} треков</div>
                                        </div>
                                        
                                        {/* Quick Play Status */}
                                        {isActive && (
                                            <div className="absolute top-2 right-2">
                                                {isPlayingThis 
                                                    ? <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]" />
                                                    : <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                }
                                            </div>
                                        )}
                                        
                                        <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gold-500 font-bold uppercase tracking-wide">
                                            <span>Настроить</span>
                                            <ListMusic className="w-4 h-4" />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
        </div>

        {/* --- Playlist Modal --- */}
        {viewedPlaylist && (
            <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-dnd-dark border border-gold-600 w-full max-w-2xl h-[80vh] rounded-lg shadow-2xl flex flex-col">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center">
                        <div>
                            <h3 className="font-serif font-bold text-xl text-white">{viewedPlaylist.name}</h3>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">{CATEGORIES[viewedPlaylist.category]}</p>
                        </div>
                        <button onClick={() => setViewPlaylistId(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                    </div>

                    {/* Track List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-gray-900/50">
                        {viewedPlaylist.tracks.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-50">
                                <Music className="w-12 h-12 mb-2" />
                                <p>Плейлист пуст</p>
                            </div>
                        )}
                        {viewedPlaylist.tracks.map(track => {
                             const isTrackActive = currentTrack?.id === track.id;
                             return (
                                <div key={track.id} className={`group flex items-center justify-between p-2 rounded hover:bg-gray-800 border border-transparent ${isTrackActive ? 'bg-gray-800 border-gold-600/50' : ''}`}>
                                    <button 
                                        onClick={() => playTrack(track, viewedPlaylist.id)}
                                        className="flex-1 flex items-center gap-3 text-left min-w-0"
                                    >
                                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 ${isTrackActive && isPlaying ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-900'}`}>
                                            {isTrackActive && isPlaying ? <Pause className="w-4 h-4"/> : <Play className="w-4 h-4"/>}
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`font-medium truncate ${isTrackActive ? 'text-gold-500' : 'text-gray-300'}`}>{track.title}</div>
                                            <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                                {track.type === 'youtube' ? <Youtube className="w-3 h-3"/> : <FileAudio className="w-3 h-3"/>}
                                                {track.type === 'youtube' ? 'YouTube' : 'Файл'}
                                            </div>
                                        </div>
                                    </button>
                                    <button 
                                        onClick={() => removeTrack(viewedPlaylist.id, track.id)}
                                        className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                             );
                        })}
                    </div>

                    {/* Add Controls */}
                    <div className="p-4 bg-dnd-card border-t border-gray-700 shrink-0 space-y-3">
                        {/* YouTube Input */}
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Youtube className="absolute left-2 top-2.5 w-4 h-4 text-red-500" />
                                <input 
                                    className="w-full bg-gray-800 border border-gray-600 rounded pl-8 pr-2 py-2 text-sm text-white focus:border-gold-500 outline-none placeholder-gray-500"
                                    placeholder="Вставьте ссылку на YouTube..."
                                    value={newYtUrl}
                                    onChange={e => setNewYtUrl(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addYoutubeTrack()}
                                />
                            </div>
                            <button 
                                onClick={addYoutubeTrack}
                                disabled={!newYtUrl}
                                className="bg-red-700 hover:bg-red-600 text-white px-4 rounded font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        {/* File Upload */}
                        <label className="flex items-center justify-center gap-2 w-full p-2 border border-dashed border-gray-600 rounded hover:bg-gray-800 cursor-pointer text-gray-400 hover:text-white transition-colors">
                            <Upload className="w-4 h-4" />
                            <span className="text-sm">Загрузить локальные файлы (MP3, WAV)</span>
                            <input 
                                type="file" 
                                multiple 
                                accept="audio/*" 
                                className="hidden" 
                                onChange={handleFileUpload}
                            />
                        </label>
                        <p className="text-[10px] text-center text-gray-600">* Локальные файлы сбрасываются при обновлении страницы. YouTube ссылки сохраняются.</p>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SoundBoard;
