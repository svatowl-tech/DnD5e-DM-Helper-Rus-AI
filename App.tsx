import React, { useState, useEffect, Suspense } from 'react';
import { Tab, LogEntry, Note, SavedImage, PartyMember, LocationData, FullQuest, Combatant, EntityType, CampaignNpc, InventoryItem, PartyStash } from './types';
import { 
  setCustomApiKey, 
  getCustomApiKey, 
  AVAILABLE_MODELS, 
  AVAILABLE_IMAGE_MODELS,
  getActiveModel, 
  setActiveModel,
  getActiveImageModel,
  setActiveImageModel,
  getCampaignMode,
  setCampaignMode,
  CampaignMode
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
  MoreHorizontal
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

const XP_TABLE: Record<number, number> = {
  1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500, 6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
  11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000, 16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000
};

const TABS = [
  { id: Tab.DASHBOARD, label: 'Дашборд', icon: <LayoutDashboard className="w-6 h-6" /> },
  { id: Tab.LOCATION, label: 'Локация', icon: <MapPin className="w-6 h-6" /> },
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

// Mobile Tab Order Configuration
const MOBILE_PRIORITY_TABS = [
    Tab.LOCATION,
    Tab.COMBAT,
    Tab.QUESTS,
    Tab.NPCS,
    Tab.GENERATORS
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
  const [apiKey, setApiKey] = useState(getCustomApiKey() || '');
  const [selectedModel, setSelectedModel] = useState(getActiveModel());
  const [selectedImageModel, setSelectedImageModel] = useState(getActiveImageModel());
  const [campaignMode, setCampaignModeState] = useState<CampaignMode>(getCampaignMode());

  // Global Logs
  const [logs, setLogs] = useState<LogEntry[]>(() => {
      const saved = localStorage.getItem('dmc_session_logs');
      return saved ? JSON.parse(saved) : [];
  });

  // Theater Mode
  const [theaterImage, setTheaterImage] = useState<SavedImage | null>(null);
  const [galleryImages, setGalleryImages] = useState<SavedImage[]>([]);

  // Init DB and load images
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
      // Global listeners for cross-component communication
      const handleSwitchTab = (e: CustomEvent) => setActiveTab(e.detail);
      const handleOpenSettings = () => setShowSettings(true);
      const handleImageGenerated = (e: CustomEvent) => {
           // When image generated via event, save to DB and update gallery state
           saveImageToDB(e.detail).then(() => {
               getAllImagesFromDB().then(imgs => setGalleryImages(imgs));
           });
      };
      
      // --- GLOBAL DATA HANDLERS ---
      // These ensure data can be saved to trackers even if those components are not currently mounted (lazy loaded)

      const handleAddNpc = (e: CustomEvent) => {
          const newNpc = e.detail;
          const saved = JSON.parse(localStorage.getItem('dmc_npcs') || '[]');
          if (!newNpc.id) newNpc.id = Date.now().toString();
          
          // Check for duplicates or update existing
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

      const handleAddToStash = (e: CustomEvent) => {
          const { itemName, itemDescription, coins } = e.detail;
          const savedStash = JSON.parse(localStorage.getItem('dmc_party_stash') || '{"items":[], "wallet":{"gp":0,"sp":0,"cp":0}}');
          
          if (coins) {
              savedStash.wallet.gp += (coins.gp || 0);
              savedStash.wallet.sp += (coins.sp || 0);
              savedStash.wallet.cp += (coins.cp || 0);
              showToast(`Монеты добавлены в казну`, 'success');
          } else if (itemName) {
               savedStash.items.push({ 
                   id: Date.now().toString(), 
                   name: itemName, 
                   description: itemDescription || '',
                   quantity: 1 
               });
               showToast(`"${itemName}" в общем мешке`, 'success');
          }
          localStorage.setItem('dmc_party_stash', JSON.stringify(savedStash));
          window.dispatchEvent(new Event('dmc-update-stash'));
      };

      const handleGiveItem = (e: CustomEvent) => {
          const { memberId, itemName, itemDescription } = e.detail;
          const savedParty = JSON.parse(localStorage.getItem('dmc_party') || '[]');
          
          const updatedParty = savedParty.map((p: any) => {
              if (p.id === memberId) {
                  const newItem = { 
                      id: Date.now().toString(), 
                      name: itemName, 
                      description: itemDescription || '', 
                      quantity: 1 
                  };
                  return { ...p, inventory: [...(p.inventory || []), newItem] };
              }
              return p;
          });

          localStorage.setItem('dmc_party', JSON.stringify(updatedParty));
          window.dispatchEvent(new Event('dmc-update-party'));
          
          const memberName = savedParty.find((p: any) => p.id === memberId)?.name || 'Герой';
          showToast(`"${itemName}" передан ${memberName}`, 'success');
      };

      window.addEventListener('dmc-switch-tab', handleSwitchTab as EventListener);
      window.addEventListener('dmc-open-settings', handleOpenSettings);
      window.addEventListener('dmc-image-generated', handleImageGenerated as EventListener);
      
      window.addEventListener('dmc-add-npc', handleAddNpc as EventListener);
      window.addEventListener('dmc-add-quest', handleAddQuest as EventListener);
      window.addEventListener('dmc-add-to-stash', handleAddToStash as EventListener);
      window.addEventListener('dmc-give-item', handleGiveItem as EventListener);
      
      return () => {
          window.removeEventListener('dmc-switch-tab', handleSwitchTab as EventListener);
          window.removeEventListener('dmc-open-settings', handleOpenSettings);
          window.removeEventListener('dmc-image-generated', handleImageGenerated as EventListener);
          
          window.removeEventListener('dmc-add-npc', handleAddNpc as EventListener);
          window.removeEventListener('dmc-add-quest', handleAddQuest as EventListener);
          window.removeEventListener('dmc-add-to-stash', handleAddToStash as EventListener);
          window.removeEventListener('dmc-give-item', handleGiveItem as EventListener);
      };
  }, [showToast]);

  // XP Distribution Logic Listener
  useEffect(() => {
      const handleAddXp = (e: CustomEvent) => {
          const { amount, reason } = e.detail;
          if (!amount) return;
          
          const savedParty = localStorage.getItem('dmc_party');
          if (savedParty) {
              const party: PartyMember[] = JSON.parse(savedParty);
              const updatedParty = party.map(p => {
                  if (!p.active) return p;
                  let newXp = (p.xp || 0) + amount;
                  let newLevel = p.level;
                  
                  // Level up check
                  let leveledUp = false;
                  // Simple check against next level threshold
                  const nextThreshold = XP_TABLE[newLevel + 1] || Infinity;
                  if (newXp >= nextThreshold && newLevel < 20) {
                      newLevel++;
                      leveledUp = true;
                  }
                  
                  if (leveledUp) {
                      showToast(`${p.name} получил уровень ${newLevel}!`, 'success');
                      addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `🎉 ${p.name} достиг уровня ${newLevel}!`, type: 'system' });
                  }
                  
                  return { ...p, xp: newXp, level: newLevel };
              });
              
              localStorage.setItem('dmc_party', JSON.stringify(updatedParty));
              // Trigger update for components listening to party changes
              window.dispatchEvent(new Event('dmc-update-party'));
              showToast(`Начислено ${amount} XP (${reason})`, 'info');
              addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Группа получила ${amount} XP (${reason}).`, type: 'system' });
          }
      };

      window.addEventListener('dmc-add-xp', handleAddXp as EventListener);
      return () => window.removeEventListener('dmc-add-xp', handleAddXp as EventListener);
  }, [showToast]);

  const addLog = (entry: LogEntry) => {
      setLogs(prev => [entry, ...prev]);
      // Persist logs logic is duplicated in Dashboard, we might want to unify or rely on Dashboard to save.
      // For now, let's update localStorage here too to be safe.
      const currentLogs = JSON.parse(localStorage.getItem('dmc_session_logs') || '[]');
      localStorage.setItem('dmc_session_logs', JSON.stringify([entry, ...currentLogs]));
  };

  const handleSaveNote = (note: Note) => {
      const currentNotes = JSON.parse(localStorage.getItem('dmc_notes') || '[]');
      localStorage.setItem('dmc_notes', JSON.stringify([note, ...currentNotes]));
      window.dispatchEvent(new Event('dmc-update-notes'));
  };

  const handleSaveImage = async (image: SavedImage) => {
      await saveImageToDB(image);
      const newImages = await getAllImagesFromDB();
      setGalleryImages(newImages);
  };

  const handleDeleteImage = async (id: string) => {
      if(!confirm('Удалить изображение?')) return;
      await deleteImageFromDB(id);
      const newImages = await getAllImagesFromDB();
      setGalleryImages(newImages);
  };

  const saveSettings = () => {
      setCustomApiKey(apiKey);
      setActiveModel(selectedModel);
      setActiveImageModel(selectedImageModel);
      setCampaignMode(campaignMode);
      setShowSettings(false);
      showToast("Настройки сохранены", "success");
      // Force reload to apply mode changes deeply if needed, or rely on getCampaignMode calls
  };

  return (
    <div className="flex flex-col h-screen bg-dnd-darker text-gray-200 font-sans overflow-hidden">
      
      {/* Global Widgets */}
      <Omnibar />
      <DmHelperWidget />
      {/* Player is fixed at bottom, but above navigation on mobile */}
      <GlobalPlayer />
      <ImageTheater image={theaterImage} onClose={() => setTheaterImage(null)} />

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-md rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                      <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                          <Settings className="w-5 h-5 text-gold-500"/> Настройки
                      </h3>
                      <button onClick={() => setShowSettings(false)} className="p-2"><X className="w-6 h-6 text-gray-400 hover:text-white"/></button>
                  </div>
                  <div className="p-6 space-y-4 flex-1 overflow-y-auto">
                      
                      {/* API Key */}
                      <div>
                          <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Polza AI API Key</label>
                          <div className="flex gap-2">
                              <div className="relative flex-1">
                                  <Key className="absolute left-2 top-2.5 w-4 h-4 text-gray-500"/>
                                  <input 
                                    type="password"
                                    className="w-full bg-gray-800 border border-gray-600 rounded pl-8 pr-2 py-3 text-base text-white focus:border-gold-500 outline-none"
                                    value={apiKey}
                                    onChange={e => setApiKey(e.target.value)}
                                    placeholder="Введите ключ..."
                                  />
                              </div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-1">Ключ сохраняется только в браузере.</p>
                      </div>

                      {/* Models */}
                      <div>
                          <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Модель Текста</label>
                          <select 
                            className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-base text-white focus:border-gold-500"
                            value={selectedModel}
                            onChange={e => setSelectedModel(e.target.value)}
                          >
                              {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                      </div>

                      <div>
                          <label className="text-xs text-gray-400 font-bold uppercase block mb-1">Модель Изображений</label>
                          <select 
                            className="w-full bg-gray-800 border border-gray-600 rounded p-3 text-base text-white focus:border-gold-500"
                            value={selectedImageModel}
                            onChange={e => setSelectedImageModel(e.target.value)}
                          >
                              {AVAILABLE_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                          </select>
                      </div>

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

      {/* Help Modal */}
      {showHelp && (
          <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-dnd-card border-2 border-gray-600 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                  <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                      <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                          <HelpCircle className="w-5 h-5 text-blue-400"/> Справка
                      </h3>
                      <button onClick={() => setShowHelp(false)} className="p-2"><X className="w-6 h-6 text-gray-400 hover:text-white"/></button>
                  </div>
                  <div className="p-6 overflow-y-auto custom-scrollbar text-sm text-gray-300 space-y-6">
                      
                      <section>
                          <h4 className="text-gold-500 font-bold text-lg mb-2">Быстрый старт</h4>
                          <p>Dungeon Master's Codex — это помощник для ведения игр D&D 5e. Он объединяет трекер боя, генераторы контента, справочник и журнал.</p>
                      </section>
                      {/* Help content truncated for brevity, same as before */}
                  </div>
                  <div className="p-4 bg-gray-900 border-t border-gray-700 text-center text-xs text-gray-500">
                      v2.3 • Polza AI Integration • Mobile Ready
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Navigation (Desktop) */}
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
             <button 
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center justify-center lg:justify-start gap-3 text-gray-500 hover:text-white transition-colors p-2 rounded hover:bg-gray-800"
                title="Настройки"
             >
                 <Settings className="w-5 h-5" />
                 <span className="text-sm hidden lg:block">Настройки</span>
             </button>
             <button 
                onClick={() => setShowHelp(true)}
                className="w-full flex items-center justify-center lg:justify-start gap-3 text-gray-500 hover:text-white transition-colors p-2 rounded hover:bg-gray-800"
                title="Справка"
             >
                 <HelpCircle className="w-5 h-5" />
                 <span className="text-sm hidden lg:block">Справка</span>
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col min-w-0 bg-dnd-darker relative h-full">
            
            {/* Mobile Header */}
            <div className="md:hidden h-14 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 shrink-0 pt-safe">
                <div className="font-serif font-bold text-gold-500 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-gold-500 to-yellow-700 rounded flex items-center justify-center text-black text-xs">D</div>
                    DM Codex
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowSettings(true)} className="p-1"><Settings className="w-6 h-6 text-gray-400"/></button>
                </div>
            </div>

            {/* Content Area */}
            {/* Padding bottom added to prevent content being hidden behind the taller mobile nav + player */}
            <div className="flex-1 overflow-hidden relative p-2 sm:p-4 pb-36 md:pb-16">
                <Suspense fallback={
                    <div className="h-full flex items-center justify-center text-gold-500 gap-3">
                        <Loader className="w-8 h-8 animate-spin" />
                        <span className="font-serif animate-pulse">Загрузка модуля...</span>
                    </div>
                }>
                    {activeTab === Tab.DASHBOARD && <Dashboard onChangeTab={setActiveTab} />}
                    {activeTab === Tab.COMBAT && <CombatTracker addLog={addLog} />}
                    {activeTab === Tab.GENERATORS && <Generators onImageGenerated={handleSaveImage} onShowImage={setTheaterImage} addLog={addLog} />}
                    {activeTab === Tab.SCREEN && <DmScreen onImageGenerated={handleSaveImage} onShowImage={setTheaterImage} />}
                    {activeTab === Tab.NOTES && <CampaignNotes />}
                    {activeTab === Tab.PARTY && <PartyManager addLog={addLog} />}
                    {activeTab === Tab.LOCATION && <LocationTracker addLog={addLog} onSaveNote={handleSaveNote} onImageGenerated={handleSaveImage} onShowImage={setTheaterImage} />}
                    {activeTab === Tab.SOUNDS && <SoundBoard />}
                    {activeTab === Tab.QUESTS && <QuestTracker addLog={addLog} />}
                    {activeTab === Tab.GALLERY && <Gallery images={galleryImages} onShow={setTheaterImage} onDelete={handleDeleteImage} />}
                    {activeTab === Tab.NPCS && <NpcTracker addLog={addLog} onImageGenerated={handleSaveImage} />}
                </Suspense>
            </div>

            {/* Mobile "More" Menu Popup */}
            {showMobileMenu && (
                <div 
                    className="md:hidden fixed inset-0 z-[45] bg-black/50 backdrop-blur-sm"
                    onClick={() => setShowMobileMenu(false)}
                >
                    <div className="absolute bottom-24 right-2 left-2 bg-gray-900 border border-gold-600/30 rounded-xl shadow-2xl p-4 animate-in slide-in-from-bottom-5 zoom-in-95">
                         <div className="grid grid-cols-3 gap-3">
                             {TABS.filter(t => !MOBILE_PRIORITY_TABS.includes(t.id)).map(tab => (
                                 <button
                                    key={tab.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveTab(tab.id);
                                        setShowMobileMenu(false);
                                    }}
                                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-colors ${activeTab === tab.id ? 'bg-gold-600 text-black border-gold-500' : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'}`}
                                 >
                                     <div className="mb-1">{tab.icon}</div>
                                     <span className="text-[10px] font-bold text-center leading-tight">{tab.label}</span>
                                 </button>
                             ))}
                         </div>
                    </div>
                </div>
            )}

            {/* Mobile Bottom Nav */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 flex justify-between items-center h-20 shrink-0 pb-safe z-50 shadow-[0_-4px_10px_rgba(0,0,0,0.5)] px-1">
                {MOBILE_PRIORITY_TABS.map(id => {
                    const tab = TABS.find(t => t.id === id);
                    if (!tab) return null;
                    return (
                        <button 
                            key={id} 
                            onClick={() => { setActiveTab(id); setShowMobileMenu(false); }}
                            className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:bg-gray-800 ${activeTab === id ? 'text-gold-500' : 'text-gray-400'}`}
                        >
                            {tab.icon}
                            <span className="text-[9px] font-medium">{tab.label}</span>
                        </button>
                    );
                })}
                {/* More Button */}
                <button 
                    onClick={() => setShowMobileMenu(!showMobileMenu)}
                    className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors active:bg-gray-800 ${showMobileMenu || !MOBILE_PRIORITY_TABS.includes(activeTab) ? 'text-gold-500' : 'text-gray-400'}`}
                >
                    <MoreHorizontal className="w-6 h-6"/>
                    <span className="text-[9px] font-medium">Ещё</span>
                </button>
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