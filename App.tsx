
import React, { useState, useEffect, Suspense } from 'react';
import { Tab, LogEntry, Note, SavedImage, PartyMember, LocationData, FullQuest, Combatant, EntityType, CampaignNpc, InventoryItem, PartyStash, AiProvider, BestiaryEntry, CampaignMode } from './types';
import { 
  setCustomApiKey, 
  getCustomApiKey, 
  AVAILABLE_MODELS, 
  OPENROUTER_MODELS,
  AVAILABLE_IMAGE_MODELS,
  getActiveModel, 
  setActiveModel,
  getActiveImageModel,
  setActiveImageModel,
  getCampaignMode,
  setCampaignMode,
  getAiProvider,
  setAiProvider
} from './services/polzaService';
import { 
    initDB, 
    saveImageToDB, 
    getAllImagesFromDB, 
    deleteImageFromDB 
} from './services/db';
import { AudioProvider } from './contexts/AudioContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import Omnibar from './components/Omnibar';
import { 
  LayoutDashboard, 
  Swords, 
  BookOpen, 
  BrainCircuit, 
  ScrollText, 
  Users,
  MapPin,
  Save,
  Music,
  HelpCircle,
  X,
  Settings,
  Key,
  Image as ImageIcon,
  Loader,
  Info,
  Shield,
  Bot,
  Ghost,
  MoreHorizontal,
  Globe,
  Map as MapIcon
} from 'lucide-react';

import GlobalPlayer from './components/GlobalPlayer';
import ImageTheater from './components/ImageTheater';
import DmHelperWidget from './components/DmHelperWidget';

// Lazy load components for performance
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

const XP_TABLE: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500, 6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
  11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000, 16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000
};

const TABS = [
  { id: Tab.DASHBOARD, label: 'Дашборд', icon: <LayoutDashboard className="w-6 h-6" /> },
  { id: Tab.LOCATION, label: 'Локация', icon: <MapPin className="w-6 h-6" /> },
  { id: Tab.MAP, label: 'Тактическая Карта', icon: <MapIcon className="w-6 h-6" /> },
  { id: Tab.COMBAT, label: 'Бой', icon: <Swords className="w-6 h-6" /> },
  { id: Tab.QUESTS, label: 'Квесты', icon: <ScrollText className="w-6 h-6" /> },
  { id: Tab.NPCS, label: 'NPC', icon: <Users className="w-6 h-6" /> },
  { id: Tab.GENERATORS, label: 'Генераторы', icon: <BrainCircuit className="w-6 h-6" /> },
  { id: Tab.SCREEN, label: 'Ширма', icon: <BookOpen className="w-6 h-6" /> },
  { id: Tab.PARTY, label: 'Группа', icon: <Shield className="w-6 h-6" /> },
  { id: Tab.SOUNDS, label: 'Звуки', icon: <Music className="w-6 h-6" /> },
  { id: Tab.NOTES, label: 'Журнал', icon: <Save className="w-6 h-6" /> },
  { id: Tab.GALLERY, label: 'Галерея', icon: <ImageIcon className="w-6 h-6" /> },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>(() => {
      const saved = localStorage.getItem('dmc_active_tab');
      return (saved as Tab) || Tab.DASHBOARD;
  });
  
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  // Settings State
  const [aiProvider, setAiProviderState] = useState<AiProvider>(getAiProvider());
  const [polzaKey, setPolzaKey] = useState(getCustomApiKey('polza') || '');
  const [openrouterKey, setOpenrouterKey] = useState(getCustomApiKey('openrouter') || '');
  const [selectedModel, setSelectedModel] = useState(getActiveModel());
  const [selectedImageModel, setSelectedImageModel] = useState(getActiveImageModel());
  const [campaignMode, setCampaignModeState] = useState<CampaignMode>(getCampaignMode());

  const [logs, setLogs] = useState<LogEntry[]>(() => {
      const saved = localStorage.getItem('dmc_session_logs');
      return saved ? JSON.parse(saved) : [];
  });

  const [theaterImage, setTheaterImage] = useState<SavedImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<SavedImage[]>([]);

  useEffect(() => {
      initDB().then(() => {
          getAllImagesFromDB().then(imgs => setGalleryImages(imgs));
      });
  }, []);

  useEffect(() => {
    localStorage.setItem('dmc_active_tab', activeTab);
  }, [activeTab]);

  const { showToast } = useToast();

  useEffect(() => {
      const handleSwitchTab = (e: CustomEvent) => setActiveTab(e.detail);
      const handleOpenSettings = () => setShowSettings(true);
      const handleImageGenerated = (e: CustomEvent) => {
           saveImageToDB(e.detail).then(() => {
               getAllImagesFromDB().then(imgs => setGalleryImages(imgs));
           });
      };
      
      const handleAddNpc = (e: CustomEvent) => {
          const newNpc = e.detail;
          const saved = JSON.parse(localStorage.getItem('dmc_npcs') || '[]');
          if (!newNpc.id) newNpc.id = Date.now().toString();
          const existingIndex = saved.findIndex((n: any) => n.id === newNpc.id || (n.name === newNpc.name && n.location === newNpc.location));
          let updated;
          if (existingIndex >= 0) {
              updated = [...saved];
              updated[existingIndex] = { ...updated[existingIndex], ...newNpc };
              showToast(`NPC ${newNpc.name} обновлен`, 'success');
          } else {
              updated = [newNpc, ...saved];
              showToast(`NPC ${newNpc.name} добавлен`, 'success');
          }
          localStorage.setItem('dmc_npcs', JSON.stringify(updated));
          window.dispatchEvent(new Event('dmc-update-npcs'));
      };

      const handleAddQuest = (e: CustomEvent) => {
          const newQuest = e.detail;
          const saved = JSON.parse(localStorage.getItem('dmc_quests') || '[]');
          if (!newQuest.id) newQuest.id = Date.now().toString();
          localStorage.setItem('dmc_quests', JSON.stringify([newQuest, ...saved]));
          window.dispatchEvent(new Event('dmc-update-quests'));
          showToast(`Квест "${newQuest.title}" добавлен`, 'success');
      };

      const handleAddCombatant = (e: CustomEvent) => {
          const newCombatantData = e.detail;
          const savedCombatants = JSON.parse(localStorage.getItem('dmc_combatants') || '[]');
          
          const combatant: Combatant = {
              id: newCombatantData.id || Date.now().toString() + Math.random(),
              name: newCombatantData.name || 'Неизвестный',
              type: newCombatantData.type || EntityType.MONSTER,
              initiative: newCombatantData.initiative || 10,
              hp: newCombatantData.hp || 10,
              maxHp: newCombatantData.maxHp || newCombatantData.hp || 10,
              ac: newCombatantData.ac || 10,
              conditions: newCombatantData.conditions || [],
              notes: newCombatantData.notes || '',
              xp: newCombatantData.xp || 0,
              actions: newCombatantData.actions || []
          };
          
          const updatedCombatants = [...savedCombatants, combatant];
          localStorage.setItem('dmc_combatants', JSON.stringify(updatedCombatants));
          window.dispatchEvent(new Event('dmc-update-combat'));
          showToast(`${combatant.name} добавлен в бой`, 'success');

          // --- AUTO-SAVE TO BESTIARY ---
          if (combatant.type === EntityType.MONSTER) {
              const savedBestiary = JSON.parse(localStorage.getItem('dmc_local_bestiary') || '[]');
              // Normalize name for search
              const baseName = combatant.name.replace(/\s\d+$/, '');
              const exists = savedBestiary.some((m: BestiaryEntry) => m.name.toLowerCase() === baseName.toLowerCase());
              
              if (!exists) {
                  // Attempt to parse actions back to objects if they are HTML strings
                  const parsedActions = combatant.actions?.map(a => {
                      if (typeof a === 'string') {
                          const match = a.match(/<b>(.*?):<\/b>(.*)/);
                          if (match) return { name: match[1], desc: match[2].trim() };
                          return { name: 'Действие', desc: a.replace(/<[^>]*>/g, '').trim() };
                      }
                      return a;
                  }) || [];

                  const bestiaryEntry: BestiaryEntry = {
                      id: Date.now().toString() + Math.random(),
                      name: baseName,
                      type: newCombatantData.monsterType || 'Чудовище',
                      ac: combatant.ac,
                      hp: combatant.maxHp,
                      cr: newCombatantData.cr || '?',
                      xp: combatant.xp || 0,
                      stats: newCombatantData.stats || { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                      actions: parsedActions,
                      description: combatant.notes,
                      source: 'local'
                  };
                  
                  localStorage.setItem('dmc_local_bestiary', JSON.stringify([bestiaryEntry, ...savedBestiary]));
                  console.log(`Monster "${bestiaryEntry.name}" auto-saved to bestiary.`);
              }
          }
      };

      window.addEventListener('dmc-switch-tab', handleSwitchTab as EventListener);
      window.addEventListener('dmc-open-settings', handleOpenSettings);
      window.addEventListener('dmc-image-generated', handleImageGenerated as EventListener);
      window.addEventListener('dmc-add-npc', handleAddNpc as EventListener);
      window.addEventListener('dmc-add-quest', handleAddQuest as EventListener);
      window.addEventListener('dmc-add-combatant', handleAddCombatant as EventListener);
      
      return () => {
          window.removeEventListener('dmc-switch-tab', handleSwitchTab as EventListener);
          window.removeEventListener('dmc-open-settings', handleOpenSettings);
          window.removeEventListener('dmc-image-generated', handleImageGenerated as EventListener);
          window.removeEventListener('dmc-add-npc', handleAddNpc as EventListener);
          window.removeEventListener('dmc-add-quest', handleAddQuest as EventListener);
          window.removeEventListener('dmc-add-combatant', handleAddCombatant as EventListener);
      };
  }, [showToast]);

  const saveSettings = () => {
      setAiProvider(aiProvider);
      setCustomApiKey(polzaKey, 'polza');
      setCustomApiKey(openrouterKey, 'openrouter');
      setActiveModel(selectedModel);
      setActiveImageModel(selectedImageModel);
      setCampaignMode(campaignMode);
      setShowSettings(false);
      showToast("Настройки сохранены", "success");
  };

  const currentModels = aiProvider === 'openrouter' ? OPENROUTER_MODELS : AVAILABLE_MODELS;

  return (
    <div className="flex flex-col h-screen bg-dnd-darker text-gray-200 font-sans overflow-hidden">
      <Omnibar />
      <DmHelperWidget />
      <GlobalPlayer />
      <ImageTheater image={theaterImage} onClose={() => setTheaterImage(null)} />

      {showSettings && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-md rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                      <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                          <Settings className="w-5 h-5 text-gold-500"/> Настройки
                      </h3>
                      <button onClick={() => setShowSettings(false)} className="p-2"><X className="w-6 h-6 text-gray-400 hover:text-white"/></button>
                  </div>
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                      
                      {/* Provider Selection */}
                      <div className="p-1 bg-gray-900 rounded-lg flex">
                          <button 
                            onClick={() => {
                                setAiProviderState('polza');
                                // Update models list in state if necessary
                                const models = AVAILABLE_MODELS;
                                if (!models.some(m => m.id === selectedModel)) {
                                    setSelectedModel(models[0].id);
                                }
                            }}
                            className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${aiProvider === 'polza' ? 'bg-gold-600 text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
                          >
                            Polza.ai
                          </button>
                          <button 
                            onClick={() => {
                                setAiProviderState('openrouter');
                                const models = OPENROUTER_MODELS;
                                if (!models.some(m => m.id === selectedModel)) {
                                    setSelectedModel(models[0].id);
                                }
                            }}
                            className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${aiProvider === 'openrouter' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                          >
                            OpenRouter
                          </button>
                      </div>

                      {/* API Keys */}
                      <div className="space-y-4">
                          {aiProvider === 'polza' ? (
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Polza AI API Key</label>
                                <div className="relative">
                                    <Key className="absolute left-2 top-2.5 w-4 h-4 text-gray-500"/>
                                    <input 
                                        type="password"
                                        className="w-full bg-gray-800 border border-gray-600 rounded pl-8 pr-2 py-3 text-sm text-white focus:border-gold-500 outline-none"
                                        value={polzaKey}
                                        onChange={e => setPolzaKey(e.target.value)}
                                        placeholder="Введите ключ Polza..."
                                    />
                                </div>
                            </div>
                          ) : (
                            <div>
                                <label className="text-xs text-gray-400 font-bold uppercase block mb-1">OpenRouter API Key</label>
                                <div className="relative">
                                    <Globe className="absolute left-2 top-2.5 w-4 h-4 text-gray-500"/>
                                    <input 
                                        type="password"
                                        className="w-full bg-gray-800 border border-gray-600 rounded pl-8 pr-2 py-3 text-sm text-white focus:border-indigo-500 outline-none"
                                        value={openrouterKey}
                                        onChange={e => setOpenrouterKey(e.target.value)}
                                        placeholder="Введите ключ OpenRouter..."
                                    />
                                </div>
                            </div>
                          )}
                      </div>

                      {/* Models */}
                      <div>
                          <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Модель Текста</label>
                          <select 
                            className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-sm text-white focus:border-gold-500 outline-none"
                            value={selectedModel}
                            onChange={e => setSelectedModel(e.target.value)}
                          >
                              {currentModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                      </div>

                      {aiProvider === 'polza' && (
                        <div>
                            <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Модель Изображений</label>
                            <select 
                                className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-sm text-white focus:border-gold-500 outline-none"
                                value={selectedImageModel}
                                onChange={e => setSelectedImageModel(e.target.value)}
                            >
                                {AVAILABLE_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                      )}

                      {/* Mode */}
                      <div className="p-3 bg-gray-800/50 rounded border border-gray-700">
                          <label className="text-xs text-gold-500 font-bold uppercase block mb-2">Режим Кампании</label>
                          <div className="flex flex-col gap-2">
                              <button 
                                onClick={() => setCampaignModeState('standard')}
                                className={`py-3 px-4 text-sm rounded border transition-colors ${campaignMode === 'standard' ? 'bg-blue-900/50 border-blue-500 text-white font-bold' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                              >
                                  Стандарт (D&D 5e)
                              </button>
                              <button 
                                onClick={() => setCampaignModeState('echoes')}
                                className={`py-3 px-4 text-sm rounded border transition-colors ${campaignMode === 'echoes' ? 'bg-purple-900/50 border-purple-500 text-white font-bold' : 'bg-gray-800 border-gray-600 text-gray-400'}`}
                              >
                                  Echoes (Мультивселенная)
                              </button>
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end shrink-0">
                      <button onClick={saveSettings} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 px-6 rounded shadow-lg transition-transform active:scale-95 text-lg">Сохранить</button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        <aside className="hidden md:flex flex-col w-20 lg:w-64 bg-gray-900 border-r border-gray-800 shrink-0 transition-all duration-300">
          <div className="p-4 flex items-center justify-center lg:justify-start gap-3 border-b border-gray-800 h-16">
            <div className="w-8 h-8 bg-gradient-to-br from-gold-500 to-yellow-700 rounded-lg flex items-center justify-center shadow-lg shrink-0">
               <span className="font-serif font-bold text-black text-xl">D</span>
            </div>
            <span className="font-serif font-bold text-gold-500 text-lg hidden lg:block tracking-wide">DM Codex</span>
          </div>

          <nav className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 transition-colors relative group
                  ${activeTab === tab.id 
                    ? 'text-gold-500 bg-gray-800 border-r-2 border-gold-500' 
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                  }`}
              >
                <div className={`p-1 rounded ${activeTab === tab.id ? 'bg-gray-900 shadow-sm' : ''}`}>{tab.icon}</div>
                <span className="font-medium text-sm hidden lg:block">{tab.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800 space-y-2">
             <button onClick={() => setShowSettings(true)} className="w-full flex items-center justify-center lg:justify-start gap-3 text-gray-500 hover:text-white transition-colors p-2 rounded hover:bg-gray-800">
                 <Settings className="w-5 h-5" />
                 <span className="text-sm hidden lg:block">Настройки</span>
             </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-dnd-darker relative h-full">
            <div className="md:hidden h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 pt-safe">
                <div className="font-serif font-bold text-gold-500 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-gold-500 to-yellow-700 rounded flex items-center justify-center text-black text-xs">D</div>
                    DM Codex
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowSettings(true)} className="p-1"><Settings className="w-6 h-6 text-gray-400"/></button>
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative p-2 sm:p-4 pb-36 md:pb-16">
                <Suspense fallback={
                    <div className="h-full flex items-center justify-center text-gold-500 gap-3">
                        <Loader className="w-8 h-8 animate-spin" />
                        <span className="font-serif animate-pulse">Загрузка модуля...</span>
                    </div>
                }>
                    {activeTab === Tab.DASHBOARD && <Dashboard onChangeTab={setActiveTab} />}
                    {activeTab === Tab.COMBAT && <CombatTracker addLog={() => {}} />}
                    {activeTab === Tab.GENERATORS && <Generators onImageGenerated={() => {}} onShowImage={setTheaterImage} addLog={() => {}} />}
                    {activeTab === Tab.SCREEN && <DmScreen onImageGenerated={() => {}} onShowImage={setTheaterImage} />}
                    {activeTab === Tab.NOTES && <CampaignNotes />}
                    {activeTab === Tab.PARTY && <PartyManager addLog={() => {}} />}
                    {activeTab === Tab.LOCATION && <LocationTracker addLog={() => {}} onSaveNote={() => {}} onImageGenerated={() => {}} onShowImage={setTheaterImage} />}
                    {activeTab === Tab.SOUNDS && <SoundBoard />}
                    {activeTab === Tab.QUESTS && <QuestTracker addLog={() => {}} />}
                    {activeTab === Tab.GALLERY && <Gallery images={galleryImages} onShow={setTheaterImage} onDelete={() => {}} />}
                    {activeTab === Tab.NPCS && <NpcTracker addLog={() => {}} onImageGenerated={() => {}} />}
                    {activeTab === Tab.MAP && <LocationMap />}
                </Suspense>
            </div>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </ToastProvider>
  );
}
