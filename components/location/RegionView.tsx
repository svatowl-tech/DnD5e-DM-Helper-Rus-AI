
import React from 'react';
import { ArrowLeft, Compass, Map, Hexagon, Globe, Sparkles, MapPinned, Loader } from 'lucide-react';
import { LoreEntry, LocationData } from '../../types';
import SmartText from '../SmartText';

interface RegionViewProps {
    selectedRegion: LoreEntry;
    onBackToHandbook: () => void;
    onTravelMode: () => void;
    activeTravelPlan: any;
    loadFromHandbook: (loc: LocationData) => void;
    handleGenerateBreach: () => void;
    openCreationModal: (type: 'region' | 'location') => void;
    handleGenerateLocation: (type: string) => void;
    loading: boolean;
    breachLoading: boolean;
    getStatusStyle: (s?: string) => string;
    getStatusLabel: (s?: string) => string;
    genericLocations: Array<{label: string, icon: any, type: string}>;
}

const RegionView: React.FC<RegionViewProps> = ({
    selectedRegion, onBackToHandbook, onTravelMode, activeTravelPlan, loadFromHandbook,
    handleGenerateBreach, openCreationModal, handleGenerateLocation, loading, breachLoading,
    getStatusStyle, getStatusLabel, genericLocations
}) => {
    return (
        <div className="flex-1 overflow-y-auto p-6 animate-in fade-in relative custom-scrollbar">
            <button 
                onClick={onBackToHandbook}
                className="absolute top-6 left-6 flex items-center gap-2 text-gray-400 hover:text-white bg-gray-800/50 hover:bg-gray-800 px-3 py-2 rounded-full transition-colors text-sm"
            >
                <ArrowLeft className="w-4 h-4" /> Справочник
            </button>

            <div className="max-w-4xl mx-auto mt-8 pb-20">
                <div className="border-b border-gray-700 pb-4 mb-6">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-end gap-4">
                            <h1 className="text-4xl font-serif font-bold text-gold-500">{selectedRegion.name}</h1>
                            {selectedRegion.capital && <span className="text-gray-400 text-sm pb-2">Столица: {selectedRegion.capital}</span>}
                        </div>
                        <button 
                            onClick={onTravelMode}
                            className={`bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold flex items-center gap-2 border border-gray-600 ${activeTravelPlan ? 'animate-pulse border-gold-500 text-gold-500' : ''}`}
                        >
                            <Compass className="w-5 h-5"/> {activeTravelPlan ? 'Продолжить путь' : 'Путешествие'}
                        </button>
                    </div>
                    <SmartText content={selectedRegion.description} className="text-lg text-gray-300 italic leading-relaxed" />
                </div>

                <div className="grid gap-8">
                    <section>
                        <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2"><Map className="w-5 h-5 text-blue-400"/> Известные места</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedRegion.locations.map((loc, idx) => (
                                <button key={idx} onClick={() => loadFromHandbook(loc)} className="bg-dnd-card border border-gray-700 p-4 rounded-lg text-left hover:border-gold-500 hover:bg-gray-800 transition-all group">
                                    <div className="flex justify-between items-start">
                                        <div className="font-bold text-lg text-gold-500 group-hover:text-white">{loc.name}</div>
                                        {loc.status && <span className={`text-[10px] px-1.5 py-0.5 rounded border uppercase font-bold ${getStatusStyle(loc.status)}`}>{getStatusLabel(loc.status)}</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase mb-2">{loc.type || 'Локация'}</div>
                                    <p className="text-sm text-gray-400 line-clamp-2">{loc.description}</p>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-indigo-900/20 border border-indigo-500/30 p-4 rounded-lg">
                        <h3 className="text-xl font-bold text-indigo-300 mb-4 flex items-center gap-2"><Hexagon className="w-5 h-5 text-indigo-400"/> Проект «Ковчег»</h3>
                        <button disabled={loading || breachLoading} onClick={handleGenerateBreach} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-4 rounded-lg flex flex-col items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/50 group">
                            <Globe className="w-8 h-8 group-hover:scale-110 transition-transform duration-300"/>
                            <div><div className="font-bold text-lg">Вызвать Разлом</div><div className="text-xs opacity-80 font-normal">Слияние Мультивселенных</div></div>
                        </button>
                    </section>

                    <section>
                        <h3 className="text-xl font-bold text-gray-200 mb-4 flex items-center gap-2"><Sparkles className="w-5 h-5 text-purple-400"/> Генераторы локаций</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                            <button onClick={() => openCreationModal('location')} className="bg-green-900/40 border border-green-700/50 p-3 rounded-lg hover:bg-green-800 flex flex-col items-center gap-2 transition-colors group">
                                <MapPinned className="w-6 h-6 text-green-400 group-hover:scale-110 transition-transform"/><span className="font-bold text-center text-green-200">Ручная локация</span>
                            </button>
                            {genericLocations.map((loc, i) => (
                                <button key={i} disabled={loading} onClick={() => handleGenerateLocation(loc.type)} className="bg-gray-800 border border-gray-700 p-3 rounded-lg hover:bg-gray-700 flex flex-col items-center gap-2 transition-colors text-sm group">
                                    <div className="group-hover:scale-110 transition-transform">{loc.icon}</div><span className="font-bold text-center">{loc.label}</span>
                                </button>
                            ))}
                        </div>
                        {loading && <div className="mt-4 text-center text-gold-500 animate-pulse flex items-center justify-center gap-2"><Loader className="animate-spin w-5 h-5"/> Создаем локацию...</div>}
                    </section>
                </div>
            </div>
        </div>
    );
};

export default RegionView;
