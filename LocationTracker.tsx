import React, { useState, useEffect, useRef } from 'react';
import { LocationData, LoreEntry, LocationTrackerProps, Note, SavedImage, TravelState, CampaignNpc, FullQuest, BestiaryEntry } from './types';
import { parseLoreFromText, generateFullLocation, generateLocationContent, generateExtendedDetails, generateMultiverseBreach, generateRealityGlitch, generateImage, generateNpc, generateQuest, generateMonster, enhanceEntityDraft } from './services/polzaService';
import { getMonstersByCr, getMonsterDetails } from './services/dndApiService';
// Added MapPin to the lucide-react imports
import { Route, Signpost, DoorOpen, Home, Landmark, Castle, Trees, Beer, Mountain, Tent, Zap, Church, Skull, Ghost, Anchor, LandPlot, ShieldAlert, Pickaxe, Wheat, Ship, ShoppingBag, Gavel, Globe, PackagePlus, Gem, BookOpen, Swords, MapPinned, MapPin } from 'lucide-react';
import { FAERUN_LORE } from './data/faerunLore';
import { useAudio } from './contexts/AudioContext';
import { useToast } from './contexts/ToastContext';

import HandbookSidebar from './components/location/HandbookSidebar';
import RegionView from './components/location/RegionView';
import LocationDetailView from './components/location/LocationDetailView';
import TravelManager from './components/TravelManager';
import BestiaryBrowser from './components/BestiaryBrowser';

const GENERIC_LOCATIONS = [
    { label: 'Дорога', icon: <Route className="w-6 h-6 text-amber-700"/>, type: 'Старая дорога' },
    { label: 'Улица', icon: <Signpost className="w-6 h-6 text-slate-400"/>, type: 'Городская улица' },
    { label: 'Дом', icon: <DoorOpen className="w-6 h-6 text-orange-400"/>, type: 'Обычный дом' },
    { label: 'Деревня', icon: <Home className="w-6 h-6 text-green-500"/>, type: 'Деревня' },
    { label: 'Город', icon: <Landmark className="w-6 h-6 text-blue-400"/>, type: 'Торговый город' },
    { label: 'Руины', icon: <Castle className="w-6 h-6 text-gray-400"/>, type: 'Древние руины' },
    { label: 'Лес', icon: <Trees className="w-6 h-6 text-emerald-500"/>, type: 'Лесная чаща' },
    { label: 'Таверна', icon: <Beer className="w-6 h-6 text-yellow-500"/>, type: 'Таверна' },
    { label: 'Пещера', icon: <Mountain className="w-6 h-6 text-stone-500"/>, type: 'Пещера' },
    { label: 'Лагерь', icon: <Tent className="w-6 h-6 text-orange-400"/>, type: 'Лагерь' },
    { label: 'Башня', icon: <Zap className="w-6 h-6 text-purple-500"/>, type: 'Башня мага' },
    { label: 'Храм', icon: <Church className="w-6 h-6 text-gold-500"/>, type: 'Храм' },
    { label: 'Подземелье', icon: <Skull className="w-6 h-6 text-red-500"/>, type: 'Подземелье' },
    { label: 'Кладбище', icon: <Ghost className="w-6 h-6 text-gray-300"/>, type: 'Кладбище' },
];

const LOCATION_STATUSES = [
    { id: 'peaceful', label: 'Спокойно', color: 'text-green-400 border-green-500/50 bg-green-900/20' },
    { id: 'tension', label: 'Напряжение', color: 'text-yellow-400 border-yellow-500/50 bg-yellow-900/20' },
    { id: 'under_attack', label: 'В бою', color: 'text-orange-500 border-orange-500/50 bg-orange-900/20' },
    { id: 'cursed', label: 'Проклято', color: 'text-purple-400 border-purple-500/50 bg-purple-900/20' },
];

const LocationTracker: React.FC<LocationTrackerProps> = ({ addLog, onSaveNote, onImageGenerated, onShowImage }) => {
    const { autoPlayMusic } = useAudio();
    const { showToast } = useToast();

    const [lore, setLore] = useState<LoreEntry[]>(() => {
        const savedLore = localStorage.getItem('dmc_lore');
        return savedLore ? JSON.parse(savedLore) : FAERUN_LORE;
    });
    
    const [location, setLocation] = useState<LocationData | null>(null);
    const [selectedRegion, setSelectedRegion] = useState<LoreEntry | null>(null);
    const [activeView, setActiveView] = useState<'details' | 'travel'>('details');
    const [loading, setLoading] = useState(false);
    const [breachLoading, setBreachLoading] = useState(false);
    const [showHandbook, setShowHandbook] = useState(true);
    const [handbookSearch, setHandbookSearch] = useState('');
    const [expandedRegion, setExpandedRegion] = useState<string | null>(null);
    const [activeTravelPlan, setActiveTravelPlan] = useState<TravelState | null>(null);

    useEffect(() => {
        localStorage.setItem('dmc_lore', JSON.stringify(lore));
    }, [lore]);

    const updateLocation = (loc: LocationData) => {
        setLocation(loc);
        setShowHandbook(false);
        setActiveView('details');
        autoPlayMusic('location', `${loc.type} ${loc.name}`);
    };

    const handleGenerateLocation = async (type: string) => {
        if (!selectedRegion) return;
        setLoading(true);
        try {
            const newLoc = await generateFullLocation(selectedRegion.name, type);
            newLoc.id = Date.now().toString();
            setLore(prev => prev.map(r => r.id === selectedRegion.id ? { ...r, locations: [newLoc, ...r.locations] } : r));
            updateLocation(newLoc);
        } catch (e: any) {
            showToast("Ошибка генерации: " + e.message, "error");
        } finally { setLoading(false); }
    };

    const handleGenerateBreach = async () => {
        setBreachLoading(true);
        try {
            const breach = await generateMultiverseBreach();
            breach.id = Date.now().toString();
            updateLocation(breach);
        } catch (e: any) {
            showToast("Ошибка разлома: " + e.message, "error");
        } finally { setBreachLoading(false); }
    };

    const filteredLore = lore.filter(r => r.name.toLowerCase().includes(handbookSearch.toLowerCase()));

    return (
        <div className="h-full flex gap-4 relative">
            <HandbookSidebar 
                showHandbook={showHandbook} setShowHandbook={setShowHandbook}
                handbookSearch={handbookSearch} setHandbookSearch={setHandbookSearch}
                filteredLore={filteredLore} selectedRegion={selectedRegion}
                selectRegion={(r) => { setSelectedRegion(r); setLocation(null); setShowHandbook(false); }}
                expandedRegion={expandedRegion} setExpandedRegion={setExpandedRegion}
                openCreationModal={(t) => console.log('Open manual for', t)}
                loadFromHandbook={updateLocation} setShowLoreInput={() => {}}
                getStatusStyle={(s) => LOCATION_STATUSES.find(st => st.id === s)?.color || ''}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden bg-dnd-dark relative">
                {!location && activeView !== 'travel' ? (
                    selectedRegion ? (
                        <RegionView 
                            selectedRegion={selectedRegion}
                            onBackToHandbook={() => { setSelectedRegion(null); setShowHandbook(true); }}
                            onTravelMode={() => setActiveView('travel')}
                            activeTravelPlan={activeTravelPlan}
                            loadFromHandbook={updateLocation}
                            handleGenerateBreach={handleGenerateBreach}
                            openCreationModal={() => {}}
                            handleGenerateLocation={handleGenerateLocation}
                            loading={loading} breachLoading={breachLoading}
                            getStatusStyle={(s) => LOCATION_STATUSES.find(st => st.id === s)?.color || ''}
                            getStatusLabel={(s) => LOCATION_STATUSES.find(st => st.id === s)?.label || ''}
                            genericLocations={GENERIC_LOCATIONS}
                        />
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 text-center">
                            <MapPin className="w-16 h-16 opacity-20 mb-4" />
                            <p className="text-xl font-serif">Выберите регион из справочника.</p>
                        </div>
                    )
                ) : activeView === 'travel' ? (
                    <TravelManager 
                        isOpen={true} onClose={() => setActiveView('details')}
                        currentLocation={location} currentRegion={selectedRegion}
                        allLore={lore} addLog={addLog} travelState={activeTravelPlan}
                        onTravelComplete={(loc, reg) => { updateLocation(loc); setActiveTravelPlan(null); }}
                        onUpdateTravelState={setActiveTravelPlan} onGenerateLocation={updateLocation}
                        onCancelTravel={() => setActiveTravelPlan(null)}
                    />
                ) : (
                    location && <LocationDetailView 
                        location={location} 
                        setLocation={setLocation}
                        onClose={() => setLocation(null)}
                        onImageGenerated={onImageGenerated}
                        onShowImage={onShowImage}
                        addLog={addLog}
                        onSaveNote={onSaveNote}
                    />
                )}
            </div>
        </div>
    );
};

export default LocationTracker;