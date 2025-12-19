
import React from 'react';
import { BookOpen, FolderPlus, Search, ChevronRight, MapPin, Sparkles, ArrowRight } from 'lucide-react';
import { LoreEntry, LocationData } from '../../types';

interface HandbookSidebarProps {
    showHandbook: boolean;
    setShowHandbook: (s: boolean) => void;
    handbookSearch: string;
    setHandbookSearch: (s: string) => void;
    filteredLore: LoreEntry[];
    selectedRegion: LoreEntry | null;
    selectRegion: (r: LoreEntry) => void;
    expandedRegion: string | null;
    setExpandedRegion: (s: string | null) => void;
    openCreationModal: (type: 'region' | 'location') => void;
    loadFromHandbook: (loc: LocationData) => void;
    setShowLoreInput: (s: boolean) => void;
    getStatusStyle: (s?: string) => string;
}

const HandbookSidebar: React.FC<HandbookSidebarProps> = ({
    showHandbook, setShowHandbook, handbookSearch, setHandbookSearch, filteredLore,
    selectedRegion, selectRegion, expandedRegion, setExpandedRegion,
    openCreationModal, loadFromHandbook, setShowLoreInput, getStatusStyle
}) => {
    return (
        <div className={`fixed xl:static inset-y-0 left-0 z-30 w-80 bg-gray-900 border-r border-gray-700 transform transition-transform duration-300 flex flex-col ${showHandbook ? 'translate-x-0' : '-translate-x-full'} xl:translate-x-0`}>
            <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-dnd-darker shrink-0">
                <h2 className="font-serif font-bold text-gold-500 flex items-center gap-2">
                    <BookOpen className="w-5 h-5"/> Справочник
                </h2>
                <div className="flex items-center gap-2">
                    <button onClick={() => openCreationModal('region')} className="p-1 hover:bg-gray-800 rounded text-green-400" title="Создать регион вручную">
                        <FolderPlus className="w-5 h-5"/>
                    </button>
                    <button onClick={() => setShowHandbook(false)} className="xl:hidden text-gray-400"><ArrowRight /></button>
                </div>
            </div>
            
            <div className="p-2 shrink-0">
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-500"/>
                    <input 
                        className="w-full bg-gray-800 border border-gray-600 rounded pl-8 pr-2 py-2 text-sm text-white focus:border-gold-500 outline-none"
                        placeholder="Поиск региона..."
                        value={handbookSearch}
                        onChange={e => setHandbookSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                {filteredLore.map(region => (
                    <div key={region.id} className={`border rounded overflow-hidden transition-colors ${selectedRegion?.id === region.id ? 'border-gold-600 bg-gray-800' : 'border-gray-700 bg-gray-800/30'}`}>
                        <div className="flex items-center justify-between p-1 pr-2">
                            <button onClick={() => selectRegion(region)} className="flex-1 text-left p-2 font-bold text-gray-200 text-sm hover:text-gold-400">{region.name}</button>
                            <button onClick={() => setExpandedRegion(expandedRegion === region.id ? null : region.id)} className="p-2 text-gray-500 hover:text-white">
                                <ChevronRight className={`w-4 h-4 transition-transform ${expandedRegion === region.id ? 'rotate-90' : ''}`}/>
                            </button>
                        </div>
                        {expandedRegion === region.id && (
                            <div className="bg-gray-900/80 p-2 border-t border-gray-700 space-y-1 animate-in fade-in slide-in-from-top-1">
                                {region.locations.map((loc, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => loadFromHandbook(loc)}
                                        className="w-full text-left text-xs text-blue-300 hover:text-white hover:bg-blue-900/30 px-2 py-1.5 rounded flex items-center justify-between gap-2"
                                    >
                                        <span className="flex items-center gap-2 truncate"><MapPin className="w-3 h-3 shrink-0" /> {loc.name}</span>
                                        {loc.status && <span className={`w-2 h-2 rounded-full shrink-0 ${getStatusStyle(loc.status).split(' ')[0].replace('text-', 'bg-')}`}></span>}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="p-2 border-t border-gray-700 shrink-0">
                <button onClick={() => { setShowLoreInput(true); setShowHandbook(false); }} className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-xs flex justify-center items-center gap-2"><Sparkles className="w-3 h-3" /> AI Импорт текста</button>
            </div>
        </div>
    );
};

export default HandbookSidebar;
