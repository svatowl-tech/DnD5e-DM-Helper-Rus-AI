
import React, { useState, useRef } from 'react';
import { 
  Music, Upload, Trash2, X, 
  Link as LinkIcon, ListMusic, Shuffle, Search, PlayCircle, Download, PlusSquare
} from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { AudioCategory, Track, Playlist } from '../types';

const CATEGORIES: Record<AudioCategory, string> = {
    combat: 'Боевые сцены',
    atmosphere: 'Атмосфера',
    mood: 'Настроение / Хоррор',
    travel: 'Путешествие',
    comedy: 'Таверна / Комедия',
    scifi: 'Сай-Фай / Космос',
    special: 'Специальное'
};

const CATEGORY_ICONS: Record<AudioCategory, string> = {
    combat: '⚔️',
    atmosphere: '🌲',
    mood: '🔮',
    travel: '🐎',
    comedy: '🍺',
    scifi: '👽',
    special: '🏆'
};

const SoundBoard: React.FC = () => {
  const { 
      playlists, currentTrack, currentPlaylistId, isPlaying, isShuffle,
      playTrack, playPlaylist, addTrackToPlaylist, removeTrackFromPlaylist, importLocalTracks, toggleShuffle
  } = useAudio();

  const [viewPlaylistId, setViewPlaylistId] = useState<string | null>(null);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Drag & Drop State
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      // Reset input
      e.target.value = '';
  };

  // Drag & Drop Handlers
  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!viewPlaylistId) return;
      
      const files = Array.from(e.dataTransfer.files) as File[];
      if (files.length > 0) {
          const audioFiles = files.filter(f => f.type.startsWith('audio/'));
          if (audioFiles.length > 0) {
              importLocalTracks(viewPlaylistId, audioFiles);
          }
      }
  };

  const downloadTrack = async (url: string, title: string) => {
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${title}.mp3`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(blobUrl);
      } catch (e) {
          // Fallback for CORS
          window.open(url, '_blank');
      }
  };

  const viewedPlaylist = playlists.find(p => p.id === viewPlaylistId);

  // Filter playlists based on search
  const filteredPlaylists = playlists.filter(p => {
      if (!searchQuery) return true;
      const lowerQ = searchQuery.toLowerCase();
      const nameMatch = p.name.toLowerCase().includes(lowerQ);
      const trackMatch = p.tracks.some(t => t.title.toLowerCase().includes(lowerQ));
      return nameMatch || trackMatch;
  });

  return (
    <div className="h-full flex flex-col relative overflow-hidden bg-dnd-darker">
        
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-800 sticky top-0 bg-dnd-darker z-20 shadow-md">
            <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500"/>
                <input 
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-gold-500 outline-none transition-colors"
                    placeholder="Поиск трека или настроения..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                    <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-2.5 text-gray-500 hover:text-white"
                    >
                        <X className="w-4 h-4"/>
                    </button>
                )}
            </div>
        </div>

        {/* --- Content: Dashboard Grid --- */}
        <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar pb-32">
            {(Object.keys(CATEGORIES) as Array<keyof typeof CATEGORIES>).map(catKey => {
                const catPlaylists = filteredPlaylists.filter(p => p.category === catKey);
                if (catPlaylists.length === 0) return null;

                return (
                    <section key={catKey} className="animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2 mb-3 border-b border-gray-800 pb-1">
                            <span className="text-2xl">{CATEGORY_ICONS[catKey]}</span>
                            <h2 className="text-gold-500 font-serif font-bold text-lg uppercase tracking-wide">
                                {CATEGORIES[catKey]}
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            {catPlaylists.map(pl => {
                                const isActive = pl.id === currentPlaylistId;
                                const isPlayingThis = isActive && isPlaying;
                                
                                return (
                                    <div
                                        key={pl.id}
                                        className={`relative group p-3 rounded-lg border transition-all hover:scale-[1.02] shadow-md flex flex-col gap-2 h-32 justify-between cursor-pointer
                                            ${isActive 
                                                ? 'bg-gray-800 border-gold-600 shadow-gold-900/20' 
                                                : 'bg-dnd-card border-gray-700 hover:border-gray-500 hover:bg-gray-800'
                                            }`}
                                        onClick={() => setViewPlaylistId(pl.id)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="font-bold text-gray-200 text-sm line-clamp-2">{pl.name}</div>
                                            {isActive && isPlayingThis && (
                                                <div className="flex gap-0.5 h-3 items-end shrink-0">
                                                    <div className="w-1 bg-gold-500 animate-[music-bar_0.5s_ease-in-out_infinite]" style={{height: '60%'}}></div>
                                                    <div className="w-1 bg-gold-500 animate-[music-bar_0.7s_ease-in-out_infinite]" style={{height: '100%'}}></div>
                                                    <div className="w-1 bg-gold-500 animate-[music-bar_0.4s_ease-in-out_infinite]" style={{height: '40%'}}></div>
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="mt-auto flex justify-between items-center">
                                            <span className="text-[10px] text-gray-500">{(pl.tracks || []).length} треков</span>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); playPlaylist(pl.id, true); }}
                                                className="p-1.5 rounded-full bg-gold-900/30 text-gold-500 hover:bg-gold-500 hover:text-black transition-colors"
                                                title="Играть (Shuffle)"
                                            >
                                                <PlayCircle className="w-5 h-5"/>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                );
            })}
            
            {filteredPlaylists.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                    <Music className="w-12 h-12 mx-auto mb-2 opacity-50"/>
                    <p>Ничего не найдено</p>
                </div>
            )}
        </div>

        {/* --- Playlist Detail Modal --- */}
        {viewedPlaylist && (
            <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
                <div 
                    className={`bg-dnd-dark border border-gold-600 w-full max-w-2xl h-[85vh] rounded-xl shadow-2xl flex flex-col overflow-hidden transition-colors duration-300 ${isDragging ? 'border-4 border-green-500 bg-green-900/20' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    
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

                    {/* Drag Overlay */}
                    {isDragging && (
                        <div className="absolute inset-0 bg-black/80 z-50 flex flex-col items-center justify-center text-green-400 pointer-events-none">
                            <Upload className="w-16 h-16 mb-4 animate-bounce"/>
                            <h3 className="text-2xl font-bold">Отпустите файлы здесь</h3>
                            <p className="text-sm opacity-80">Добавить в {viewedPlaylist.name}</p>
                        </div>
                    )}

                    {/* Tracks List */}
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-gray-900/50">
                        {(viewedPlaylist.tracks || []).length === 0 && (
                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60">
                                <Music className="w-12 h-12 mb-2"/>
                                <p>Плейлист пуст</p>
                            </div>
                        )}
                        
                        {(viewedPlaylist.tracks || [])
                            .map((track, idx) => {
                                 const isTrackActive = currentTrack?.id === track.id;
                                 const isMatch = searchQuery && track.title.toLowerCase().includes(searchQuery.toLowerCase());
                                 
                                 return (
                                    <div key={track.id} className={`group flex items-center justify-between p-2 rounded-lg border transition-colors ${isTrackActive ? 'bg-indigo-900/30 border-gold-600/50' : isMatch ? 'bg-gray-800 border-gray-600' : 'border-transparent hover:bg-gray-800 hover:border-gray-700'}`}>
                                        <button onClick={() => playTrack(track, viewedPlaylist.id)} className="flex-1 flex items-center gap-3 text-left min-w-0">
                                            <div className={`w-8 h-8 rounded flex items-center justify-center shrink-0 text-xs font-bold ${isTrackActive && isPlaying ? 'text-green-400 bg-green-900/20' : 'text-gray-500 bg-gray-900'}`}>
                                                {isTrackActive && isPlaying ? <div className="flex gap-0.5 items-end h-3"><div className="w-0.5 bg-green-400 h-full animate-pulse"></div><div className="w-0.5 bg-green-400 h-2/3 animate-pulse"></div></div> : idx + 1}
                                            </div>
                                            <div className="min-w-0">
                                                <div className={`font-medium truncate text-sm ${isTrackActive ? 'text-gold-500' : isMatch ? 'text-white' : 'text-gray-300'}`}>{track.title}</div>
                                                {track.artist && <div className="text-xs text-gray-600 truncate">{track.artist}</div>}
                                            </div>
                                        </button>
                                        <div className="flex gap-1">
                                            {!track.isLocal && (
                                                <button onClick={() => downloadTrack(track.url, track.title)} className="p-2 text-gray-600 hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" title="Скачать">
                                                    <Download className="w-4 h-4"/>
                                                </button>
                                            )}
                                            <button onClick={() => removeTrackFromPlaylist(viewedPlaylist.id, track.id)} className="p-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                                        </div>
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

                        <label className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-600 rounded-lg hover:bg-gray-800 cursor-pointer text-gray-400 hover:text-gold-500 transition-colors group bg-gray-900/30">
                            <Upload className="w-6 h-6 group-hover:scale-110 transition-transform" /> 
                            <div className="text-center">
                                <span className="text-sm font-bold block">Загрузить файлы (Пакетно)</span>
                                <span className="text-xs opacity-60">Нажмите или перетащите файлы сюда</span>
                            </div>
                            <input 
                                type="file" 
                                multiple 
                                accept="audio/*" 
                                className="hidden" 
                                ref={fileInputRef}
                                onChange={handleFileUpload}
                            />
                        </label>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default SoundBoard;
