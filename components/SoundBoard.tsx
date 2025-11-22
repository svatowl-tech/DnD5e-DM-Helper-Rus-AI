
import React, { useState } from 'react';
import { 
  Music, Upload, Trash2, X, 
  Link as LinkIcon, ListMusic, Shuffle
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { AudioCategory, Track } from '../types';

const CATEGORIES: Record<AudioCategory, string> = {
    atmosphere: 'Атмосфера',
    combat: 'Боевые сцены',
    mood: 'Настроение',
    travel: 'Путешествие',
    special: 'Специальное',
    comedy: 'Комедия / Таверна',
    scifi: 'Сай-Фай / Ковчег'
};

const SoundBoard: React.FC = () => {
  const { 
      playlists, currentTrack, currentPlaylistId, isPlaying, isShuffle,
      playTrack, addTrackToPlaylist, removeTrackFromPlaylist, importLocalTracks, toggleShuffle
  } = useAudio();

  // Local UI state for the library browser
  const [viewPlaylistId, setViewPlaylistId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');

  const handleAddUrl = () => {
      if (!viewPlaylistId || !newUrl.trim()) return;
      const name = newTitle.trim() || `Track ${Date.now().toString().slice(-4)}`;
      const newTrack: Track = {
          id: Date.now().toString(),
          title: name,
          url: newUrl.trim(),
          isLocal: false
      };
      addTrackToPlaylist(viewPlaylistId, newTrack);
      setNewUrl('');
      setNewTitle('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!viewPlaylistId || !e.target.files) return;
      const files = Array.from(e.target.files) as File[];
      importLocalTracks(viewPlaylistId, files);
  };

  const viewedPlaylist = playlists.find(p => p.id === viewPlaylistId);

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-dnd-darker">
        
        {/* --- Content: Playlists Grid --- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar pb-32">
            {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(catKey => {
                const catPlaylists = playlists.filter(p => p.category === catKey);
                if (catPlaylists.length === 0) return null;

                return (
                    <section key={catKey} className="animate-in fade-in slide-in-from-bottom-2">
                        <h2 className="text-gold-500 font-serif font-bold text-xl mb-3 border-b border-gray-800 pb-1 flex items-center gap-2 sticky top-0 bg-dnd-darker z-10">
                            {catKey === 'atmosphere' && '🌲'}
                            {catKey === 'combat' && '⚔️'}
                            {catKey === 'mood' && '🎭'}
                            {catKey === 'travel' && '🐎'}
                            {catKey === 'comedy' && '🤡'}
                            {catKey === 'scifi' && '👽'}
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
                                        className={`relative group p-4 rounded-lg border text-left transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[100px] shadow-md
                                            ${isActive 
                                                ? 'bg-gray-800 border-gold-600 shadow-gold-900/20' 
                                                : 'bg-dnd-card border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                                            }`}
                                    >
                                        <div>
                                            <div className="font-bold text-gray-200 mb-1 truncate">{pl.name}</div>
                                            <div className="text-xs text-gray-500">{(pl.tracks || []).length} треков</div>
                                        </div>
                                        
                                        {isActive && (
                                            <div className="absolute top-3 right-3">
                                                {isPlayingThis 
                                                    ? <div className="flex gap-1 h-3 items-end">
                                                        <div className="w-1 bg-gold-500 animate-[music-bar_0.5s_ease-in-out_infinite]" style={{height: '60%'}}></div>
                                                        <div className="w-1 bg-gold-500 animate-[music-bar_0.7s_ease-in-out_infinite]" style={{height: '100%'}}></div>
                                                        <div className="w-1 bg-gold-500 animate-[music-bar_0.4s_ease-in-out_infinite]" style={{height: '40%'}}></div>
                                                      </div>
                                                    : <div className="w-2 h-2 rounded-full bg-yellow-600" />
                                                }
                                            </div>
                                        )}
                                        
                                        <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity text-xs text-gold-500 font-bold uppercase tracking-wide">
                                            <span>Открыть</span>
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

        {/* --- Playlist Detail Modal --- */}
        {viewedPlaylist && (
            <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                <div className="bg-dnd-dark border border-gold-600 w-full max-w-2xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden">
                    
                    {/* Header */}
                    <div className="p-4 border-b border-gray-700 bg-gray-900 flex justify-between items-center shrink-0">
                        <div>
                            <h3 className="font-serif font-bold text-xl text-white">{viewedPlaylist.name}</h3>
                            <p className="text-xs text-gold-500 uppercase tracking-widest font-bold">{CATEGORIES[viewedPlaylist.category]}</p>
                        </div>
                        <div className="flex items-center gap-2">
                             {currentPlaylistId === viewedPlaylist.id && (
                                <button 
                                    onClick={toggleShuffle}
                                    className={`p-2 rounded hover:bg-gray-800 ${isShuffle ? 'text-gold-500' : 'text-gray-400'}`}
                                    title="Перемешать"
                                >
                                    <Shuffle className="w-5 h-5"/>
                                </button>
                             )}
                             <button onClick={() => setViewPlaylistId(null)} className="text-gray-400 hover:text-white transition-transform hover:rotate-90"><X className="w-6 h-6"/></button>
                        </div>
                    </div>

                    {/* Tracks List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-gray-900/50">
                        {(viewedPlaylist.tracks || []).length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                                <Music className="w-12 h-12 mb-2"/>
                                <p>Плейлист пуст</p>
                            </div>
                        )}
                        {(viewedPlaylist.tracks || []).map((track, idx) => {
                             const isTrackActive = currentTrack?.id === track.id;
                             return (
                                <div key={track.id} className={`group flex items-center justify-between p-2 rounded-lg border transition-colors ${isTrackActive ? 'bg-indigo-900/30 border-gold-600/50' : 'border-transparent hover:bg-gray-800 hover:border-gray-700'}`}>
                                    <button onClick={() => playTrack(track, viewedPlaylist.id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                                        <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 text-xs font-bold ${isTrackActive && isPlaying ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-900'}`}>
                                            {isTrackActive && isPlaying ? <div className="flex gap-0.5 items-end h-3"><div className="w-0.5 bg-green-400 h-full animate-pulse"></div><div className="w-0.5 bg-green-400 h-2/3 animate-pulse"></div></div> : idx + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <div className={`font-medium truncate text-sm ${isTrackActive ? 'text-gold-500' : 'text-gray-300'}`}>{track.title}</div>
                                            {track.artist && <div className="text-xs text-gray-600 truncate">{track.artist}</div>}
                                        </div>
                                    </button>
                                    <button onClick={() => removeTrackFromPlaylist(viewedPlaylist.id, track.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                </div>
                             );
                        })}
                    </div>

                    {/* Add Track Area */}
                    <div className="p-4 bg-dnd-card border-t border-gray-700 shrink-0 space-y-4 pb-20 xl:pb-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-xs text-gray-500 uppercase font-bold">Добавить по ссылке (MP3)</label>
                            <div className="flex gap-2">
                                <input className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-gold-500" placeholder="Название трека" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                                <input className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm text-white outline-none focus:border-gold-500" placeholder="https://example.com/music.mp3" value={newUrl} onChange={e => setNewUrl(e.target.value)} />
                                <button onClick={handleAddUrl} disabled={!newUrl} className="bg-gray-700 hover:bg-white hover:text-black text-white px-4 rounded font-bold disabled:opacity-50 transition-colors"><LinkIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                        
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-700"></div></div>
                            <div className="relative flex justify-center"><span className="bg-dnd-card px-2 text-xs text-gray-500 uppercase">Или</span></div>
                        </div>

                        <label className="flex items-center justify-center gap-2 w-full p-3 border border-dashed border-gray-600 rounded-lg hover:bg-gray-800 cursor-pointer text-gray-400 hover:text-gold-500 transition-colors group">
                            <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                            <span className="text-sm font-bold">Загрузить файлы с устройства</span>
                            <input type="file" multiple accept="audio/*" className="hidden" onChange={handleFileUpload}/>
                        </label>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SoundBoard;
