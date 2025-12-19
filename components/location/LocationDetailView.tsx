
import React, { useState } from 'react';
import { MapPin, X, Save, Eye, Map, ImageIcon, Loader, Zap, Skull, ShieldAlert, PackagePlus, Users, Sparkles, Plus, Feather, ScrollText } from 'lucide-react';
import { LocationData, SavedImage, Note, CampaignNpc, FullQuest, Tab } from '../../types';
import SmartText from '../SmartText';
import LootInteraction from '../LootInteraction';
import { generateImage, generateScenarioDescription, generateRealityGlitch, generateLocationContent, generateExtendedDetails } from '../../services/polzaService';

interface LocationDetailViewProps {
    location: LocationData;
    setLocation: (l: any) => void;
    onClose: () => void;
    onImageGenerated?: (i: SavedImage) => void;
    onShowImage?: (i: SavedImage) => void;
    addLog: (e: any) => void;
    onSaveNote: (n: Note) => void;
}

const LocationDetailView: React.FC<LocationDetailViewProps> = ({
    location, setLocation, onClose, onImageGenerated, onShowImage, addLog, onSaveNote
}) => {
    const [imageLoading, setImageLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [genText, setGenText] = useState('');
    const [genSection, setGenSection] = useState<string | null>(null);

    const handleGenImage = async () => {
        setImageLoading(true);
        try {
            const prompt = `Fantasy landscape: ${location.name}, ${location.type}. ${location.atmosphere}. Detailed art.`;
            const url = await generateImage(prompt, "16:9");
            setLocation({...location, imageUrl: url});
            if (onImageGenerated) onImageGenerated({ id: Date.now().toString(), url, title: location.name, type: 'location', timestamp: Date.now() });
        } catch (e: any) { alert(e.message); } finally { setImageLoading(false); }
    };

    const handleGenAtmosphere = async () => {
        setLoading(true);
        try {
            const text = await generateScenarioDescription(location.name + ". " + location.atmosphere);
            setGenText(text);
        } catch (e: any) { alert(e.message); } finally { setLoading(false); }
    };

    const handleGenContent = async (cat: 'npc' | 'secret' | 'loot' | 'quest') => {
        setGenSection(cat);
        try {
            const items = await generateLocationContent(location.name, cat);
            const updated = { ...location };
            if (cat === 'npc') updated.npcs = [...(location.npcs || []), ...items];
            if (cat === 'secret') updated.secrets = [...(location.secrets || []), ...items];
            if (cat === 'loot') updated.loot = [...(location.loot || []), ...items];
            if (cat === 'quest') updated.quests = [...(location.quests || []), ...items];
            setLocation(updated);
        } catch (e: any) { alert(e.message); } finally { setGenSection(null); }
    };

    const openMap = () => {
        window.dispatchEvent(new CustomEvent('dmc-switch-tab', { detail: Tab.MAP }));
    };

    return (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <div className="bg-dnd-card border border-gray-700 p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-center mb-3">
                        <h1 className="text-2xl font-serif font-bold text-gold-500 truncate">{location.name}</h1>
                        <div className="flex gap-2">
                            <button onClick={handleGenImage} disabled={imageLoading} className="p-2 bg-gray-800 rounded-full text-gold-500" title="Генерировать арт">
                                {imageLoading ? <Loader className="animate-spin w-4 h-4"/> : <ImageIcon className="w-4 h-4"/>}
                            </button>
                            <button onClick={onClose} className="p-2 bg-gray-800 rounded-full text-gray-400"><X className="w-4 h-4" /></button>
                        </div>
                    </div>
                    {location.imageUrl && (
                        <div className="w-full h-48 rounded-lg overflow-hidden mb-4 border border-gray-600 shadow-inner group relative">
                            <img src={location.imageUrl} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <button onClick={() => onShowImage?.({id:'t', url: location.imageUrl!, title: location.name, type: 'location', timestamp: 0})} className="bg-gold-600 text-black px-3 py-1 rounded font-bold">Показать</button>
                            </div>
                        </div>
                    )}
                    <SmartText content={`${location.atmosphere} — ${location.description}`} className="text-sm text-gray-300 border-l-2 border-gold-500 pl-3 py-1" />
                    <div className="grid grid-cols-4 gap-2 mt-4">
                        <button onClick={handleGenAtmosphere} className="bg-gray-800 hover:bg-gray-700 py-2 rounded text-xs flex justify-center items-center gap-2"><Eye className="w-3 h-3"/> Описать</button>
                        <button onClick={openMap} className="bg-indigo-900/40 hover:bg-indigo-800 py-2 rounded text-xs flex justify-center items-center gap-2 text-indigo-200 border border-indigo-500/30"><Map className="w-3 h-3"/> Карта</button>
                        <button className="bg-purple-900/40 hover:bg-purple-800 py-2 rounded text-xs flex justify-center items-center gap-2 text-purple-200"><Zap className="w-3 h-3"/> Аномалия</button>
                        <button className="bg-red-900/40 hover:bg-red-800 py-2 rounded text-xs flex justify-center items-center gap-2 text-red-100"><Skull className="w-3 h-3"/> Бой</button>
                    </div>
                </div>

                {genText && <div className="bg-red-950/40 border-l-4 border-red-600 p-3 rounded-r-lg text-sm italic">{genText}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center border-b border-gray-700 pb-1">
                            <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><Users className="w-3 h-3"/> NPC</h3>
                            <button onClick={() => handleGenContent('npc')} disabled={!!genSection} className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gold-500">AI</button>
                        </div>
                        <div className="space-y-2">
                            {(location.npcs || []).map((n: any, i) => (
                                <div key={i} className="p-2 bg-gray-800/50 border border-gray-700 rounded text-sm">
                                    <div className="font-bold text-gold-500">{n.name}</div>
                                    <div className="text-xs text-gray-400">{n.race} — {n.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div>
                             <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2">
                                <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><ScrollText className="w-3 h-3"/> Квесты</h3>
                                <button onClick={() => handleGenContent('quest')} disabled={!!genSection} className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gold-500">AI</button>
                            </div>
                            {(location.quests || []).map((q: any, i) => <div key={i} className="text-xs p-2 bg-indigo-950/20 border border-indigo-900/30 rounded mb-1"><b>{q.title}</b>: {q.description}</div>)}
                        </div>
                        <div>
                             <div className="flex justify-between items-center border-b border-gray-700 pb-1 mb-2">
                                <h3 className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2"><PackagePlus className="w-3 h-3"/> Лут</h3>
                                <button onClick={() => handleGenContent('loot')} disabled={!!genSection} className="text-[10px] bg-gray-800 px-2 py-0.5 rounded text-gold-500">AI</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {(location.loot || []).map((l, i) => <span key={i} className="text-[10px] bg-gray-800 px-2 py-1 rounded border border-gray-700 text-gray-300">{l}</span>)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationDetailView;
