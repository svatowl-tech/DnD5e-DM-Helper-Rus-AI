
import React, { useState, useEffect, Suspense } from 'react';
import { Tab, SavedImage, AiProvider, CampaignMode, TrackedItem } from './types';
import { 
  setCustomApiKey, 
  getCustomApiKey, 
  getActiveModel, 
  setActiveModel, 
  getActiveImageModel, 
  setActiveImageModel, 
  getCampaignMode, 
  setCampaignMode, 
  getAiProvider, 
  setAiProvider 
} from './services/polzaService';
import { initDB, getAllImagesFromDB } from './services/db';
import { AudioProvider } from './contexts/AudioContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import Omnibar from './components/Omnibar';
import SettingsModal from './components/layout/SettingsModal';
import { 
  LayoutDashboard, Swords, BookOpen, BrainCircuit, ScrollText, Users,
  MapPin, Save, Music, X, Settings, Image as ImageIcon, Loader, 
  Shield, Map as MapIcon, Search, Package
} from 'lucide-react';

import GlobalPlayer from './components/GlobalPlayer';
import ImageTheater from './components/ImageTheater';
import DmHelperWidget from './components/DmHelperWidget';

// Lazy load components
const CombatTracker = React.lazy(() => import('./components/CombatTracker'));
const Generators = React.lazy(() => import('./components/Generators'));
const DmScreen = React.lazy(() => import('./components/DmScreen'));
const CampaignNotes = React.lazy(() => import('./components/CampaignNotes'));
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const PartyManager = React.lazy(() => import('./components/PartyManager'));
const LocationTracker = React.lazy(() => import('./components/LocationTracker'));
const SoundBoard = React.lazy(() => import('./components/SoundBoard'));
const QuestTracker = React.lazy(() => import('./components/QuestTracker'));
const Gallery = React.lazy(() => import('./components/Gallery'));
const NpcTracker = React.lazy(() => import('./components/NpcTracker'));
const LocationMap = React.lazy(() => import('./components/LocationMap'));
const EquipmentTracker = React.lazy(() => import('./components/EquipmentTracker'));

const TABS = [
  { id: Tab.DASHBOARD, label: 'Инфо', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: Tab.LOCATION, label: 'Место', icon: <MapPin className="w-5 h-5" /> },
  { id: Tab.MAP, label: 'Карта', icon: <MapIcon className="w-5 h-5" /> },
  { id: Tab.COMBAT, label: 'Бой', icon: <Swords className="w-5 h-5" /> },
  { id: Tab.QUESTS, label: 'Квесты', icon: <ScrollText className="w-5 h-5" /> },
  { id: Tab.NPCS, label: 'NPC', icon: <Users className="w-5 h-5" /> },
  { id: Tab.EQUIPMENT, label: 'Лут', icon: <Package className="w-5 h-5" /> },
  { id: Tab.GENERATORS, label: 'ИИ', icon: <BrainCircuit className="w-5 h-5" /> },
  { id: Tab.SCREEN, label: 'Ширма', icon: <BookOpen className="w-5 h-5" /> },
  { id: Tab.PARTY, label: 'Группа', icon: <Shield className="w-5 h-5" /> },
  { id: Tab.SOUNDS, label: 'Звуки', icon: <Music className="w-5 h-5" /> },
  { id: Tab.NOTES, label: 'Лог', icon: <Save className="w-5 h-5" /> },
  { id: Tab.GALLERY, label: 'Арты', icon: <ImageIcon className="w-5 h-5" /> },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
      const saved = localStorage.getItem('dmc_active_tab');
      return (saved as Tab) || Tab.DASHBOARD;
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [aiProvider, setAiProviderState] = useState<AiProvider>(getAiProvider());
  const [polzaKey, setPolzaKey] = useState(getCustomApiKey('polza') || '');
  const [openrouterKey, setOpenrouterKey] = useState(getCustomApiKey('openrouter') || '');
  const [selectedModel, setSelectedModel] = useState(getActiveModel());
  const [selectedImageModel, setSelectedImageModel] = useState(getActiveImageModel());
  const [campaignMode, setCampaignModeState] = useState<CampaignMode>(getCampaignMode());

  const [theaterImage, setTheaterImage] = useState<SavedImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<SavedImage[]>([]);

  const { showToast } = useToast();

  useEffect(() => {
    initDB().then(() => {
        getAllImagesFromDB().then(imgs => setGalleryImages(imgs));
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('dmc_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
      const handleSwitchTab = (e: any) => setActiveTab(e.detail);
      const handleOpenSettings = () => setShowSettings(true);
      window.addEventListener('dmc-switch-tab', handleSwitchTab as EventListener);
      window.addEventListener('dmc-open-settings', handleOpenSettings);
      return () => {
          window.removeEventListener('dmc-switch-tab', handleSwitchTab as EventListener);
          window.removeEventListener('dmc-open-settings', handleOpenSettings);
      };
  }, []);

  // --- Data Persistence Event Listeners ---
  useEffect(() => {
    const handleAddNpc = (e: any) => {
        const incoming = e.detail;
        const newNpc = {
             id: Date.now().toString(),
             status: 'alive',
             attitude: 'neutral',
             location: 'Неизвестно',
             class: 'Обыватель',
             race: 'Человек',
             ...incoming
        };
        const npcs = JSON.parse(localStorage.getItem('dmc_npcs') || '[]');
        if (!npcs.some((n: any) => n.name === newNpc.name)) {
             localStorage.setItem('dmc_npcs', JSON.stringify([newNpc, ...npcs]));
             window.dispatchEvent(new Event('dmc-update-npcs'));
             showToast(`${newNpc.name} добавлен в базу NPC`, 'success');
        } else {
             showToast(`${newNpc.name} уже есть в базе`, 'info');
        }
    };

    const handleAddQuest = (e: any) => {
        const newQuest = { 
            id: Date.now().toString(), 
            status: 'unreceived', 
            objectives: [],
            threats: [],
            ...e.detail 
        };
        const quests = JSON.parse(localStorage.getItem('dmc_quests') || '[]');
        localStorage.setItem('dmc_quests', JSON.stringify([newQuest, ...quests]));
        window.dispatchEvent(new Event('dmc-update-quests'));
        showToast(`Квест "${newQuest.title}" добавлен`, 'success');
    };

    const handleAddNote = (e: any) => {
        const newNote = { 
            id: Date.now().toString(), 
            date: new Date().toISOString(), 
            tags: [],
            ...e.detail 
        };
        const notes = JSON.parse(localStorage.getItem('dmc_notes') || '[]');
        localStorage.setItem('dmc_notes', JSON.stringify([newNote, ...notes]));
        window.dispatchEvent(new Event('dmc-update-notes'));
        showToast(`Заметка "${newNote.title}" сохранена`, 'success');
    };
    
    const handleAddCombatant = (e: any) => {
        const newC = { 
            id: Date.now().toString() + Math.random(), 
            conditions: [],
            actions: [],
            ...e.detail 
        };
        const combatants = JSON.parse(localStorage.getItem('dmc_combatants') || '[]');
        localStorage.setItem('dmc_combatants', JSON.stringify([...combatants, newC]));
        window.dispatchEvent(new Event('dmc-update-combat'));
    };

    const handleAddXp = (e: any) => {
        const { amount } = e.detail;
        const party = JSON.parse(localStorage.getItem('dmc_party') || '[]');
        const updated = party.map((p: any) => p.active ? { ...p, xp: (p.xp || 0) + amount } : p);
        localStorage.setItem('dmc_party', JSON.stringify(updated));
        window.dispatchEvent(new Event('dmc-update-party'));
        showToast(`Начислено ${amount} XP`, 'success');
    };

    // Centralized Item Handling
    const trackItem = (name: string, description: string, status: TrackedItem['status'], ownerId?: string) => {
         const equipment = JSON.parse(localStorage.getItem('dmc_equipment') || '[]');
         
         // Try to find owner name for display
         let ownerName = '';
         if (status === 'party') {
             const p = JSON.parse(localStorage.getItem('dmc_party') || '[]').find((m: any) => m.id === ownerId);
             if (p) ownerName = p.name;
         } else if (status === 'stash') {
             ownerName = 'Общая Казна';
         }

         const newItem: TrackedItem = {
             id: Date.now().toString() + Math.random(), // Unique ID
             name,
             description,
             quantity: 1,
             status,
             ownerId,
             ownerName,
             category: 'Снаряжение'
         };
         
         localStorage.setItem('dmc_equipment', JSON.stringify([newItem, ...equipment]));
         window.dispatchEvent(new Event('dmc-update-equipment'));
    };

    const handleGiveItem = (e: any) => {
        const { memberId, itemName, itemDescription } = e.detail;
        const party = JSON.parse(localStorage.getItem('dmc_party') || '[]');
        const updated = party.map((p: any) => {
            if (p.id === memberId) {
                return { 
                    ...p, 
                    inventory: [...(p.inventory || []), { id: Date.now().toString(), name: itemName, description: itemDescription, quantity: 1 }] 
                };
            }
            return p;
        });
        localStorage.setItem('dmc_party', JSON.stringify(updated));
        window.dispatchEvent(new Event('dmc-update-party'));
        
        // Also track globally
        trackItem(itemName, itemDescription, 'party', memberId);
        
        showToast(`${itemName} выдан герою`, 'success');
    };
    
    const handleAddToStash = (e: any) => {
         const { itemName, itemDescription, coins } = e.detail;
         const stash = JSON.parse(localStorage.getItem('dmc_party_stash') || '{"items":[], "wallet":{"gp":0,"sp":0,"cp":0}}');
         if (coins) {
             stash.wallet.gp += coins.gp || 0;
             stash.wallet.sp += coins.sp || 0;
             stash.wallet.cp += coins.cp || 0;
             showToast(`Деньги добавлены в казну`, 'success');
         } else {
             stash.items.push({ id: Date.now().toString(), name: itemName, description: itemDescription, quantity: 1 });
             showToast(`${itemName} добавлен в мешок`, 'success');
             
             // Also track globally
             trackItem(itemName, itemDescription, 'stash');
         }
         localStorage.setItem('dmc_party_stash', JSON.stringify(stash));
         window.dispatchEvent(new Event('dmc-update-stash'));
    };
    
    // Catch generic "Loot generated" events (from Generators/Locations) and add to unassigned pool
    const handleTrackLoot = (e: any) => {
        const { itemName, itemDescription } = e.detail;
        trackItem(itemName, itemDescription, 'unassigned');
    };

    const handleDistributeCurrency = () => {
         const party = JSON.parse(localStorage.getItem('dmc_party') || '[]');
         const stash = JSON.parse(localStorage.getItem('dmc_party_stash') || '{"items":[], "wallet":{"gp":0,"sp":0,"cp":0}}');
         const activeCount = party.filter((p: any) => p.active).length;
         if (activeCount === 0) return;

         const { gp, sp, cp } = stash.wallet;
         if (gp === 0 && sp === 0 && cp === 0) return;

         const gpSplit = Math.floor(gp / activeCount);
         const spSplit = Math.floor(sp / activeCount);
         const cpSplit = Math.floor(cp / activeCount);

         const updatedParty = party.map((p: any) => {
             if (p.active) {
                 const w = p.wallet || { gp: 0, sp: 0, cp: 0 };
                 return {
                     ...p,
                     wallet: {
                         gp: w.gp + gpSplit,
                         sp: w.sp + spSplit,
                         cp: w.cp + cpSplit
                     }
                 };
             }
             return p;
         });
         
         stash.wallet = {
             gp: gp % activeCount,
             sp: sp % activeCount,
             cp: cp % activeCount
         };

         localStorage.setItem('dmc_party', JSON.stringify(updatedParty));
         localStorage.setItem('dmc_party_stash', JSON.stringify(stash));
         window.dispatchEvent(new Event('dmc-update-party'));
         window.dispatchEvent(new Event('dmc-update-stash'));
         showToast("Валюта распределена между героями", 'success');
    };

    window.addEventListener('dmc-add-npc', handleAddNpc);
    window.addEventListener('dmc-add-quest', handleAddQuest);
    window.addEventListener('dmc-add-note', handleAddNote);
    window.addEventListener('dmc-add-combatant', handleAddCombatant);
    window.addEventListener('dmc-add-xp', handleAddXp);
    window.addEventListener('dmc-give-item', handleGiveItem);
    window.addEventListener('dmc-add-to-stash', handleAddToStash);
    window.addEventListener('dmc-distribute-currency', handleDistributeCurrency);
    window.addEventListener('dmc-track-loot', handleTrackLoot);

    return () => {
        window.removeEventListener('dmc-add-npc', handleAddNpc);
        window.removeEventListener('dmc-add-quest', handleAddQuest);
        window.removeEventListener('dmc-add-note', handleAddNote);
        window.removeEventListener('dmc-add-combatant', handleAddCombatant);
        window.removeEventListener('dmc-add-xp', handleAddXp);
        window.removeEventListener('dmc-give-item', handleGiveItem);
        window.removeEventListener('dmc-add-to-stash', handleAddToStash);
        window.removeEventListener('dmc-distribute-currency', handleDistributeCurrency);
        window.removeEventListener('dmc-track-loot', handleTrackLoot);
    };
  }, []);

  const handleSaveSettings = () => {
      setAiProvider(aiProvider);
      setCustomApiKey(polzaKey, 'polza');
      setCustomApiKey(openrouterKey, 'openrouter');
      setActiveModel(selectedModel);
      setActiveImageModel(selectedImageModel);
      setCampaignMode(campaignMode);
      setShowSettings(false);
      showToast("Настройки сохранены", "success");
      window.dispatchEvent(new Event('dmc-settings-updated'));
  };

  return (
    <div className="flex flex-col h-[100dvh] bg-dnd-darker text-gray-200 font-sans overflow-hidden">
      <Omnibar />
      <DmHelperWidget />
      <ImageTheater image={theaterImage} onClose={() => setTheaterImage(null)} />

      <SettingsModal 
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        aiProvider={aiProvider}
        setAiProvider={setAiProviderState}
        polzaKey={polzaKey}
        setPolzaKey={setPolzaKey}
        openrouterKey={openrouterKey}
        setOpenrouterKey={setOpenrouterKey}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        selectedImageModel={selectedImageModel}
        setSelectedImageModel={setSelectedImageModel}
        campaignMode={campaignMode}
        setCampaignMode={setCampaignModeState}
        onSave={handleSaveSettings}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar for Desktop */}
        <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-gray-900 border-r border-gray-800 shrink-0 transition-all duration-300">
          <div className="p-4 flex items-center justify-center lg:justify-start gap-3 border-b border-gray-800 h-16">
            <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-yellow-700 rounded-lg flex items-center justify-center shadow-lg shrink-0 font-serif font-bold text-black text-xl">D</div>
            <span className="font-serif font-bold text-gold-500 text-lg hidden lg:block tracking-wide">DM Codex</span>
          </div>
          <nav className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-all relative group ${activeTab === tab.id ? 'text-gold-500 bg-gray-800 border-r-2 border-gold-500' : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'}`}
              >
                <div className="shrink-0">{tab.icon}</div>
                <span className="font-medium text-sm hidden lg:block">{tab.label}</span>
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-gray-800">
             <button onClick={() => setShowSettings(true)} className="w-full flex items-center justify-start gap-3 text-gray-500 hover:text-white p-2 rounded hover:bg-gray-800 transition-colors">
                 <Settings className="w-5 h-5" />
                 <span className="text-sm hidden lg:block">Настройки</span>
             </button>
          </div>
        </aside>

        {/* Main Section */}
        <main className="flex-1 flex flex-col min-w-0 bg-dnd-darker overflow-hidden">
            {/* Top header on Desktop */}
            <div className="hidden md:flex h-16 bg-gray-900 border-b border-gray-800 items-center justify-between px-4 shrink-0 shadow-md z-40">
                <div className="font-serif font-bold text-gold-500 flex items-center gap-2">
                    <span className="text-sm tracking-widest uppercase">Панель управления</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))} className="p-2 text-gray-400 active:text-gold-500"><Search className="w-5 h-5"/></button>
                    <button onClick={() => setShowSettings(true)} className="p-2 text-gray-400 active:text-gold-500"><Settings className="w-5 h-5"/></button>
                </div>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <Suspense fallback={<div className="h-full flex items-center justify-center text-gold-500 gap-3"><Loader className="w-8 h-8 animate-spin" /><span className="font-serif animate-pulse text-sm">Пробуждаем Мастера...</span></div>}>
                    <div className="h-full p-2 sm:p-4 overflow-hidden">
                        {activeTab === Tab.DASHBOARD && <Dashboard onChangeTab={setActiveTab} />}
                        {activeTab === Tab.COMBAT && <CombatTracker addLog={() => {}} />}
                        {activeTab === Tab.LOCATION && <LocationTracker addLog={() => {}} onSaveNote={() => {}} onImageGenerated={() => {}} onShowImage={setTheaterImage} />}
                        {activeTab === Tab.MAP && <LocationMap />}
                        {activeTab === Tab.QUESTS && <QuestTracker addLog={() => {}} />}
                        {activeTab === Tab.NPCS && <NpcTracker addLog={() => {}} onImageGenerated={() => {}} />}
                        {activeTab === Tab.EQUIPMENT && <EquipmentTracker />}
                        {activeTab === Tab.GENERATORS && <Generators onImageGenerated={() => {}} onShowImage={setTheaterImage} addLog={() => {}} />}
                        {activeTab === Tab.SCREEN && <DmScreen onImageGenerated={() => {}} onShowImage={setTheaterImage} />}
                        {activeTab === Tab.PARTY && <PartyManager addLog={() => {}} />}
                        {activeTab === Tab.SOUNDS && <SoundBoard />}
                        {activeTab === Tab.NOTES && <CampaignNotes />}
                        {activeTab === Tab.GALLERY && <Gallery images={galleryImages} onShow={setTheaterImage} onDelete={() => {}} />}
                    </div>
                </Suspense>
            </div>

            {/* Mobile Footer Stack (Player then Nav) */}
            <div className="md:hidden flex flex-col shrink-0 z-40">
                <GlobalPlayer />
                <nav className="h-16 bg-gray-900 border-t border-gray-800 flex items-center overflow-x-auto no-scrollbar px-2 shadow-[0_-4px_12px_rgba(0,0,0,0.5)] pb-safe">
                    <div className="flex items-center h-full min-w-max gap-1">
                      {TABS.map(tab => (
                          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center justify-center min-w-[72px] h-full px-1 transition-all rounded-lg ${activeTab === tab.id ? 'text-gold-500 bg-gold-500/5' : 'text-gray-500'}`}>
                              <div className="mb-0.5">{tab.icon}</div>
                              <span className="text-[9px] font-bold uppercase truncate w-full text-center leading-none">{tab.label}</span>
                          </button>
                      ))}
                    </div>
                </nav>
            </div>
        </main>
      </div>

      {/* Global Desktop Player (Full Width) */}
      <div className="hidden md:block shrink-0 z-40">
         <GlobalPlayer />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AudioProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AudioProvider>
  );
}
