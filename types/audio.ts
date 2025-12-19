
export type AudioCategory = 'combat' | 'atmosphere' | 'city' | 'horror' | 'mystic' | 'drama' | 'scifi' | 'special';

export interface Track {
    id: string;
    title: string;
    artist?: string;
    url: string;
    isLocal?: boolean;
}

export interface Playlist {
    id: string;
    name: string;
    category: AudioCategory;
    tracks: Track[];
}

export interface AudioContextType {
    playlists: Playlist[];
    currentTrack: Track | null;
    currentPlaylistId: string | null;
    isPlaying: boolean;
    isShuffle: boolean;
    isAutoDJEnabled: boolean;
    volume: number;
    isLoading: boolean;
    error: string | null;
    playTrack: (track: Track, playlistId: string) => void;
    playPlaylist: (playlistId: string, shuffle?: boolean) => void;
    togglePlay: () => void;
    toggleShuffle: () => void;
    toggleAutoDJ: () => void;
    playNext: () => void;
    playPrev: () => void;
    setVolume: (vol: number) => void;
    addTrackToPlaylist: (playlistId: string, track: Track) => void;
    removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
    importLocalTracks: (playlistId: string, files: File[]) => Promise<void>;
    getFile: (trackId: string) => File | undefined;
    playSfx: (url: string) => void;
    stopAllSfx: () => void;
    autoPlayMusic: (type: string, contextText?: string) => void;
}
