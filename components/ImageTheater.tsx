
import React, { useState, useEffect } from 'react';
import { X, Maximize2, Minimize2 } from 'lucide-react';
import { SavedImage } from '../types';

interface ImageTheaterProps {
    image: SavedImage | null;
    onClose: () => void;
}

const ImageTheater: React.FC<ImageTheaterProps> = ({ image, onClose }) => {
    const [isControlsVisible, setIsControlsVisible] = useState(true);
    const [isZoomed, setIsZoomed] = useState(false);

    useEffect(() => {
        if (!image) return;
        
        // Auto-hide controls after 3 seconds
        const timer = setTimeout(() => setIsControlsVisible(false), 3000);
        
        const handleMouseMove = () => {
            setIsControlsVisible(true);
            clearTimeout(timer);
            // Re-set timeout
            setTimeout(() => setIsControlsVisible(false), 3000);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timer);
        };
    }, [image]);

    if (!image) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center animate-in fade-in duration-500">
            {/* Background Blur Effect */}
            <div 
                className="absolute inset-0 opacity-30 bg-cover bg-center blur-xl scale-110"
                style={{ backgroundImage: `url(${image.url})` }}
            />

            {/* Main Image */}
            <div className={`relative z-10 transition-all duration-500 ${isZoomed ? 'w-full h-full' : 'max-w-[95vw] max-h-[95vh] p-4'}`}>
                <img 
                    src={image.url} 
                    alt={image.title}
                    className={`w-full h-full object-contain shadow-2xl rounded-lg transition-all duration-300 ${isZoomed ? 'object-cover rounded-none' : ''}`}
                    onClick={() => setIsZoomed(!isZoomed)}
                />
            </div>

            {/* Controls Overlay */}
            <div 
                className={`absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-20 transition-opacity duration-500 bg-gradient-to-b from-black/80 to-transparent ${isControlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <div className="text-white">
                    <h2 className="text-2xl font-serif font-bold text-gold-500 drop-shadow-md">{image.title}</h2>
                    <p className="text-sm text-gray-300 uppercase tracking-widest opacity-80">{image.type}</p>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => setIsZoomed(!isZoomed)}
                        className="p-2 bg-black/50 text-white rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm"
                    >
                        {isZoomed ? <Minimize2 className="w-6 h-6"/> : <Maximize2 className="w-6 h-6"/>}
                    </button>
                    <button 
                        onClick={onClose}
                        className="p-2 bg-red-900/50 text-white rounded-full hover:bg-red-600 transition-colors backdrop-blur-sm"
                    >
                        <X className="w-6 h-6"/>
                    </button>
                </div>
            </div>

            {/* Close on click outside (if not zoomed) */}
            {!isZoomed && (
                <div className="absolute inset-0 z-0" onClick={onClose} />
            )}
        </div>
    );
};

export default ImageTheater;
