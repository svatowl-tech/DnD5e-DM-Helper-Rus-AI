
import React, { useState } from 'react';
import { SavedImage } from '../types';
import { Trash2, Eye, Image as ImageIcon, Map, User, Sword, Ghost } from 'lucide-react';

interface GalleryProps {
    images: SavedImage[];
    onShow: (image: SavedImage) => void;
    onDelete: (id: string) => void;
}

const Gallery: React.FC<GalleryProps> = ({ images, onShow, onDelete }) => {
    const [filter, setFilter] = useState<'all' | 'npc' | 'location' | 'item' | 'monster'>('all');

    const filteredImages = filter === 'all' ? images : images.filter(img => img.type === filter);

    const getIcon = (type: string) => {
        switch(type) {
            case 'npc': return <User className="w-4 h-4"/>;
            case 'location': return <Map className="w-4 h-4"/>;
            case 'item': return <Sword className="w-4 h-4"/>;
            case 'monster': return <Ghost className="w-4 h-4"/>;
            default: return <ImageIcon className="w-4 h-4"/>;
        }
    };

    return (
        <div className="h-full flex flex-col p-4 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-serif font-bold text-gold-500 flex items-center gap-2">
                        <ImageIcon className="w-6 h-6"/> Галерея Артов
                    </h2>
                    <p className="text-sm text-gray-400">Сгенерированные изображения сохраняются здесь.</p>
                </div>
                
                <div className="flex bg-gray-800 rounded-lg p-1">
                    {(['all', 'npc', 'location', 'item', 'monster'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-colors ${
                                filter === f 
                                ? 'bg-gold-600 text-black shadow-lg' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            {f === 'all' ? 'Все' : f}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {filteredImages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                        <ImageIcon className="w-16 h-16 mb-4"/>
                        <p>В галерее пусто.</p>
                        <p className="text-xs">Генерируйте изображения в других вкладках.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {filteredImages.map((img) => (
                            <div key={img.id} className="group relative aspect-square bg-gray-900 rounded-lg border border-gray-700 overflow-hidden hover:border-gold-500 transition-all shadow-lg">
                                <img 
                                    src={img.url} 
                                    alt={img.title}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    loading="lazy"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3">
                                    <div className="flex justify-between items-end">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1 text-gold-500 text-xs uppercase font-bold mb-1">
                                                {getIcon(img.type)} {img.type}
                                            </div>
                                            <h3 className="text-white font-bold text-sm truncate">{img.title}</h3>
                                            <span className="text-[10px] text-gray-400">{new Date(img.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button 
                                            onClick={() => onShow(img)}
                                            className="flex-1 bg-gold-600 hover:bg-gold-500 text-black text-xs font-bold py-2 rounded flex items-center justify-center gap-2"
                                        >
                                            <Eye className="w-3 h-3"/> Показать
                                        </button>
                                        <button 
                                            onClick={() => onDelete(img.id)}
                                            className="bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-white p-2 rounded"
                                        >
                                            <Trash2 className="w-3 h-3"/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Gallery;
