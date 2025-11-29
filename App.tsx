
import React, { useState, useEffect, Suspense } from 'react';
import { Tab, LogEntry, Note, SavedImage, PartyMember, LocationData, FullQuest, Combatant, EntityType, CampaignNpc, InventoryItem } from './types';
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
  Moon, 
  Sun,
  Users,
  MapPin,
  Trash2,
  Save,
  Music,
  HelpCircle,
  Download,
  X,
  Share,
  Menu,
  Globe,
  Rocket,
  Smartphone,
  Settings,
  Key,
  Dices,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  Loader,
  Info,
  Skull,
  Shield,
  UserSquare2,
  Laptop,
  Compass,
  Feather
} from 'lucide-react';
import { CONDITIONS } from './constants';
import { RULES_DATA } from './data/rulesData';
import { searchMonsters, getMonsterDetails } from './services/dndApiService';

import GlobalPlayer from './components/GlobalPlayer';
import ImageTheater from './components/ImageTheater';
import DmHelperWidget from './components/DmHelperWidget';

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

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const { showToast } = useToast();
  
  // Log Persistence
  const [logs, setLogs] = useState<LogEntry[]>(() => {
      const saved = localStorage.getItem('dmc_session_logs');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
  });
  
  // Gallery Persistence (Loaded from DB)
  const [gallery, setGallery] = useState<SavedImage[]>([]);
  const [isGalleryLoading, setIsGalleryLoading] = useState(true);

  // Theater Mode
  const [theaterImage, setTheaterImage] = useState<SavedImage | null>(null);
  
  const [isDay, setIsDay] = useState(true);

  // Mobile State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false); 

  // PWA / Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  
  // Modals
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpSection, setHelpSection] = useState<'install' | 'usage'>('install');
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [settingsModel, setSettingsModel] = useState('gemini-2.5-flash');
  const [settingsImageModel, setSettingsImageModel] = useState('seedream-v4');
  const [campaignMode, setLocalCampaignMode] = useState<CampaignMode>('standard');

  // Global Detail Modal State
  const [detailModal, setDetailModal] = useState<{ open: boolean; title: string; content: any; type: string } | null>(null);

  // --- INIT & MIGRATION ---
  useEffect(() => {
      const initializeData = async () => {
          try {
              await initDB();
              
              // Migration: Check LocalStorage for gallery
              const legacyGallery = localStorage.getItem('dmc_gallery');
              if (legacyGallery) {
                  try {
                      const parsed = JSON.parse(legacyGallery);
                      if (Array.isArray(parsed) && parsed.length > 0) {
                          console.log(`Migrating ${parsed.length} images to IndexedDB...`);
                          showToast(`Перенос ${parsed.length} изображений в базу данных...`, 'info');
                          
                          for (const img of parsed) {
                              await saveImageToDB(img);
                          }
                          // Clear LocalStorage after successful migration to free quota
                          localStorage.removeItem('dmc_gallery');
                          showToast("Миграция галереи завершена.", 'success');
                      }
                  } catch (e) {
                      console.error("Migration failed", e);
                  }
              }

              // Load from DB
              const dbImages = await getAllImagesFromDB();
              setGallery(dbImages);
          } catch (error) {
              console.error("DB Init error:", error);
              showToast("Ошибка инициализации базы данных", 'error');
          } finally {
              setIsGalleryLoading(false);
          }
      };

      initializeData();
  }, []);

  const addLog = (entry: LogEntry) => {
    setLogs(prev => {
        const newLogs = [entry, ...prev].slice(0, 100);
        localStorage.setItem('dmc_session_logs', JSON.stringify(newLogs));
        return newLogs;
    });
  };

  // Update Recent Events for AI Context
  useEffect(() => {
      const storyLogs = logs
          .filter(l => ['story', 'combat', 'system'].includes(l.type))
          .slice(0, 15)
          .map(l => `[${l.type.toUpperCase()}] ${l.text}`)
          .join('\n');
      
      localStorage.setItem('dmc_recent_events', storyLogs);
  }, [logs]);

  // Global Listeners
  useEffect(() => {
      const handleAddQuest = (e: CustomEvent) => {
          const { title, description, giver, location } = e.detail;
          const safeTitle = title || 'Новый квест';
          const safeGiver = giver || 'Неизвестно';
          const safeLocation = location || 'Неизвестно';
          const safeDescription = description || '';
          
          const newQuest: FullQuest = {
              id: Date.now().toString(),
              title: safeTitle,
              status: 'active',
              giver: safeGiver,
              location: safeLocation,
              summary: safeDescription.substring(0, 50) + (safeDescription.length > 50 ? '...' : '') || safeTitle,
              description: safeDescription,
              objectives: [{ id: Date.now().toString() + 'obj', text: 'Основная цель', completed: false }],
              threats: [],
              reward: ''
          };
          
          const existingQuests = JSON.parse(localStorage.getItem('dmc_quests') || '[]');
          const updatedQuests = [newQuest, ...existingQuests];
          localStorage.setItem('dmc_quests', JSON.stringify(updatedQuests));
          window.dispatchEvent(new Event('dmc-update-quests'));
          addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[Квест] Добавлена задача: "${newQuest.title}"`, type: 'story' });
          showToast(`Квест "${safeTitle}" добавлен`, 'success');
      };

      const handleAddCombatant = async (e: CustomEvent) => {
          const details = e.detail;
          let newC: Combatant = {
              id: Date.now().toString() + Math.random(),
              name: details.name,
              type: details.type as EntityType,
              initiative: details.initiative || 10,
              hp: details.hp || 10,
              maxHp: details.hp || 10,
              ac: details.ac || 10,
              conditions: [],
              notes: details.notes || '',
              xp: details.xp || 50,
              actions: [] 
          };

          if (newC.type === EntityType.MONSTER && details.hp === 20) {
             try {
                 const searchResults = await searchMonsters(newC.name);
                 if (searchResults && searchResults.length > 0) {
                     const exact = searchResults.find(r => r.name.toLowerCase() === newC.name.toLowerCase());
                     const target = exact || searchResults[0];
                     const fullStats = await getMonsterDetails(target.index);
                     if (fullStats) {
                         newC.hp = fullStats.hit_points;
                         newC.maxHp = fullStats.hit_points;
                         newC.ac = typeof fullStats.armor_class === 'number' ? fullStats.armor_class : (fullStats.armor_class as any)[0]?.value || 10;
                         newC.xp = fullStats.xp;
                         newC.notes = `CR ${fullStats.challenge_rating} (${fullStats.type}). ${newC.notes}`;
                         if ((fullStats as any).actions) {
                             newC.actions = (fullStats as any).actions.map((a: any) => `<b>${a.name}:</b> ${a.desc}`);
                         }
                     }
                 }
             } catch (err) {
                 console.warn("Failed to enrich monster stats:", err);
             }
          }

          const existingCombatants = JSON.parse(localStorage.getItem('dmc_combatants') || '[]');
          const updatedCombatants = [...existingCombatants, newC];
          localStorage.setItem('dmc_combatants', JSON.stringify(updatedCombatants));
          window.dispatchEvent(new Event('dmc-update-combat'));
          showToast(`${newC.name} добавлен в бой`, 'warning');
      };

      const handleAddNote = (e: CustomEvent) => {
          const { title, content, tags } = e.detail;
          const newNote: Note = {
              id: Date.now().toString(),
              title: title || 'Новая заметка',
              content: content || '',
              tags: tags || [],
              type: 'session',
              date: new Date().toISOString()
          };
          const existingNotes = JSON.parse(localStorage.getItem('dmc_notes') || '[]');
          const updatedNotes = [newNote, ...existingNotes];
          localStorage.setItem('dmc_notes', JSON.stringify(updatedNotes));
          window.dispatchEvent(new Event('dmc-update-notes'));
          showToast('Заметка сохранена', 'success');
      };

      const handleAddXp = (e: CustomEvent) => {
          const { amount, reason } = e.detail;
          if (!amount) return;
          const savedParty = JSON.parse(localStorage.getItem('dmc_party') || '[]');
          let levelUpOccurred = false;
          const updatedParty = savedParty.map((p: PartyMember) => {
              if (!p.active) return p;
              const oldXp = p.xp || 0;
              const newXp = oldXp + amount;
              let newLevel = p.level;
              for (let lvl = 20; lvl > p.level; lvl--) {
                  if (newXp >= XP_TABLE[lvl]) {
                      newLevel = lvl;
                      break;
                  }
              }
              if (newLevel > p.level) levelUpOccurred = true;
              return { ...p, xp: newXp, level: newLevel };
          });
          localStorage.setItem('dmc_party', JSON.stringify(updatedParty));
          window.dispatchEvent(new Event('dmc-update-party'));
          addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Группа получила по ${amount} XP. ${reason || ''}`, type: 'system' });
          if (levelUpOccurred) showToast("🎉 Новый уровень!", 'success');
          else showToast(`Начислено ${amount} XP`, 'success');
      };

      const handleAddNpc = (e: CustomEvent) => {
          const { name, race, description, location, status, attitude, personality, secret, imageUrl, notes } = e.detail;
          const existingNpcs = JSON.parse(localStorage.getItem('dmc_npcs') || '[]');
          if (existingNpcs.some((n: any) => n.name === name)) {
              showToast(`NPC ${name} уже существует`, 'warning');
              return;
          }
          const newNpc: CampaignNpc = {
              id: Date.now().toString(),
              name: name || 'Неизвестный',
              race: race || 'Гуманоид',
              description: description || '',
              location: location || 'Неизвестно',
              status: status || 'alive',
              attitude: attitude || 'neutral',
              personality: personality || '',
              secret: secret || '',
              notes: notes || '',
              imageUrl: imageUrl || undefined
          };
          const updatedNpcs = [newNpc, ...existingNpcs];
          localStorage.setItem('dmc_npcs', JSON.stringify(updatedNpcs));
          window.dispatchEvent(new Event('dmc-update-npcs'));
          addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[NPC] ${newNpc.name} добавлен в трекер.`, type: 'system' });
          showToast(`NPC ${newNpc.name} сохранен`, 'success');
      };

      const handleGiveItem = (e: CustomEvent) => {
        const { memberId, itemName, quantity = 1 } = e.detail;
        const savedParty = JSON.parse(localStorage.getItem('dmc_party') || '[]');
        const updatedParty = savedParty.map((p: PartyMember) => {
            if (p.id === memberId) {
                const newItem: InventoryItem = { id: Date.now().toString() + Math.random(), name: itemName, quantity: quantity };
                return { ...p, inventory: [...(p.inventory || []), newItem] };
            }
            return p;
        });
        localStorage.setItem('dmc_party', JSON.stringify(updatedParty));
        window.dispatchEvent(new Event('dmc-update-party'));
        const memberName = savedParty.find((p: PartyMember) => p.id === memberId)?.name || 'Герой';
        showToast(`"${itemName}" добавлен ${memberName}`, 'success');
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[Лут] ${memberName} получил: ${itemName}`, type: 'system' });
      };

      window.addEventListener('dmc-add-quest' as any, handleAddQuest);
      window.addEventListener('dmc-add-combatant' as any, handleAddCombatant);
      window.addEventListener('dmc-add-note' as any, handleAddNote);
      window.addEventListener('dmc-add-xp' as any, handleAddXp);
      window.addEventListener('dmc-add-npc' as any, handleAddNpc);
      window.addEventListener('dmc-give-item' as any, handleGiveItem);

      return () => {
          window.removeEventListener('dmc-add-quest' as any, handleAddQuest);
          window.removeEventListener('dmc-add-combatant' as any, handleAddCombatant);
          window.removeEventListener('dmc-add-note' as any, handleAddNote);
          window.removeEventListener('dmc-add-xp' as any, handleAddXp);
          window.removeEventListener('dmc-add-npc' as any, handleAddNpc);
          window.removeEventListener('dmc-give-item' as any, handleGiveItem);
      };
  }, []);

  useEffect(() => {
    const handleSwitchTab = (e: CustomEvent) => {
        if (e.detail && Object.values(Tab).includes(e.detail as Tab)) {
            setActiveTab(e.detail as Tab);
        } else if (e.detail === 'combat') {
            setActiveTab(Tab.COMBAT);
        } else if (e.detail === 'location') {
            setActiveTab(Tab.LOCATION);
        }
    };
    const handleOpenSettings = () => setShowSettingsModal(true);

    window.addEventListener('dmc-switch-tab' as any, handleSwitchTab);
    window.addEventListener('dmc-open-settings' as any, handleOpenSettings);
    
    return () => {
        window.removeEventListener('dmc-switch-tab' as any, handleSwitchTab);
        window.removeEventListener('dmc-open-settings' as any, handleOpenSettings);
    };
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const key = getCustomApiKey();
    if (key) setApiKeyInput(key);
    setSettingsModel(getActiveModel());
    setSettingsImageModel(getActiveImageModel());
    setLocalCampaignMode(getCampaignMode());
  }, []);

  useEffect(() => {
      const handleShowDetails = (e: CustomEvent) => {
          const { type, id, title } = e.detail;
          let content: any = null;

          if (type === 'condition') content = CONDITIONS.find(c => c.id === id);
          else if (type === 'rule') content = RULES_DATA.find(r => r.id === id);
          else if (type === 'party') {
              const party: PartyMember[] = JSON.parse(localStorage.getItem('dmc_party') || '[]');
              content = party.find(p => p.id === id);
          } else if (type === 'npc') {
              const campaignNpcs: CampaignNpc[] = JSON.parse(localStorage.getItem('dmc_npcs') || '[]');
              content = campaignNpcs.find(n => n.name === id);
              if (!content) {
                  const loc: LocationData = JSON.parse(localStorage.getItem('dmc_active_location') || 'null');
                  content = loc?.npcs?.find(n => n.name === id);
              }
          }
          if (content) setDetailModal({ open: true, title, content, type });
      };
      window.addEventListener('dmc-show-details' as any, handleShowDetails);
      return () => window.removeEventListener('dmc-show-details' as any, handleShowDetails);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        setHelpSection('install');
        setShowHelpModal(true);
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowInstallButton(false);
    }
  };

  const handleSaveKey = () => {
      setCustomApiKey(apiKeyInput);
      setActiveModel(settingsModel);
      setActiveImageModel(settingsImageModel);
      setCampaignMode(campaignMode);
      setShowSettingsModal(false);
      showToast("Настройки сохранены", 'success');
  };

  useEffect(() => {
      localStorage.setItem('dmc_session_logs', JSON.stringify(logs));
  }, [logs]);

  // Updated Gallery Handler (Async IndexedDB)
  const addToGallery = async (image: SavedImage) => {
      try {
          await saveImageToDB(image);
          setGallery(prev => [image, ...prev]);
          addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Изображение "${image.title}" добавлено в галерею.`, type: 'system' });
          showToast("Изображение сохранено в Галерею", 'success');
      } catch (e) {
          console.error(e);
          showToast("Ошибка сохранения изображения (Quota?)", 'error');
      }
  };

  const removeFromGallery = async (id: string) => {
      if (window.confirm('Удалить изображение из галереи?')) {
          try {
              await deleteImageFromDB(id);
              setGallery(prev => prev.filter(img => img.id !== id));
              showToast("Изображение удалено", 'info');
          } catch (e) {
              console.error(e);
              showToast("Ошибка удаления", 'error');
          }
      }
  };

  const openTheater = (image: SavedImage) => {
      setTheaterImage(image);
  };

  const saveNoteToStorage = (newNote: Note) => {
      const savedNotes = localStorage.getItem('dmc_notes');
      const notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];
      const existingIndex = notes.findIndex(n => n.id === newNote.id);
      let updatedNotes;
      if (existingIndex >= 0) {
          updatedNotes = [...notes];
          updatedNotes[existingIndex] = newNote;
      } else {
          updatedNotes = [newNote, ...notes];
      }
      localStorage.setItem('dmc_notes', JSON.stringify(updatedNotes));
      window.dispatchEvent(new Event('dmc-update-notes'));
      addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Заметка "${newNote.title}" сохранена в журнал.`, type: 'system' });
      showToast("Заметка сохранена", 'success');
  };

  const exportLogToJournal = () => {
      if (logs.length === 0) {
          showToast("Лог пуст", 'warning');
          return;
      }
      const logContent = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] [${l.type.toUpperCase()}] ${l.text}`).join('\n');
      const newNote: Note = {
        id: Date.now().toString(),
        title: `Лог сессии ${new Date().toLocaleDateString()}`,
        content: logContent,
        tags: ['лог', 'сессия', 'архив'],
        type: 'session',
        date: new Date().toISOString()
      };
      saveNoteToStorage(newNote);
      showToast("Лог экспортирован в Журнал", 'success');
  };

  const clearLogs = () => {
      if (window.confirm('Вы уверены, что хотите очистить лог сессии?')) {
          setLogs([]);
          showToast("Лог очищен", 'info');
      }
  };

  const changeTabMobile = (tab: Tab) => {
      setActiveTab(tab);
      setShowMobileMenu(false);
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD: return <Dashboard onChangeTab={(t: any) => setActiveTab(t)} />;
      case Tab.LOCATION: return <LocationTracker addLog={addLog} onSaveNote={saveNoteToStorage} onImageGenerated={addToGallery} onShowImage={openTheater} />;
      case Tab.QUESTS: return <QuestTracker addLog={addLog} />;
      case Tab.NPCS: return <NpcTracker addLog={addLog} onImageGenerated={addToGallery} />;
      case Tab.PARTY: return <PartyManager addLog={addLog} />;
      case Tab.COMBAT: return <CombatTracker addLog={addLog} />;
      case Tab.NOTES: return <CampaignNotes key="notes-tab" />;
      case Tab.GENERATORS: return <Generators addLog={addLog} onImageGenerated={addToGallery} onShowImage={openTheater} />;
      case Tab.SCREEN: return <DmScreen onImageGenerated={addToGallery} onShowImage={openTheater} />;
      case Tab.SOUNDS: return <SoundBoard />;
      case Tab.GALLERY: return <Gallery images={gallery} onShow={openTheater} onDelete={removeFromGallery} />;
      default: return <div className="text-center text-gray-500 mt-20">Модуль в разработке</div>;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dnd-darker text-gray-200 font-sans">
      
      <ImageTheater image={theaterImage} onClose={() => setTheaterImage(null)} />
      <DmHelperWidget />
      <Omnibar />

      {/* Global Detail Modal */}
      {detailModal && detailModal.open && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-md max-h-[80vh] flex flex-col rounded-lg shadow-2xl p-0 overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-start shrink-0">
                      <div>
                          <div className="flex items-center gap-2">
                              {detailModal.type === 'condition' && <Skull className="w-5 h-5 text-red-500"/>}
                              {detailModal.type === 'rule' && <BookOpen className="w-5 h-5 text-blue-400"/>}
                              {detailModal.type === 'party' && <Users className="w-5 h-5 text-green-400"/>}
                              {detailModal.type === 'npc' && <Info className="w-5 h-5 text-gold-500"/>}
                              <h3 className="text-xl font-serif font-bold text-white">{detailModal.title}</h3>
                          </div>
                          <span className="text-[10px] uppercase text-gray-500 bg-gray-800 px-2 py-0.5 rounded mt-1 inline-block">{detailModal.type}</span>
                      </div>
                      <button onClick={() => setDetailModal(null)} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                  </div>
                  <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
                      {detailModal.type === 'condition' && (
                          <>
                              <p className="text-gray-300 mb-2">{detailModal.content.description}</p>
                              {detailModal.content.duration && <p className="text-xs text-gray-500">Длительность: {detailModal.content.duration} раундов</p>}
                          </>
                      )}
                      {detailModal.type === 'rule' && (
                          <>
                              <p className="text-gray-300 mb-3">{detailModal.content.content}</p>
                              {detailModal.content.list && <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 mb-3">{detailModal.content.list.map((l: string, i: number) => <li key={i}>{l}</li>)}</ul>}
                              {detailModal.content.table && <div className="bg-gray-900 rounded p-2 text-xs">{detailModal.content.table.map((row: any, i: number) => <div key={i} className="flex justify-between border-b border-gray-700 py-1 last:border-0"><span className="font-bold text-gray-300">{row.label}</span><span className="text-gray-500">{row.value}</span></div>)}</div>}
                          </>
                      )}
                      {detailModal.type === 'party' && (
                          <div className="space-y-2">
                              <div className="flex justify-between text-sm bg-gray-800 p-2 rounded">
                                  <span><Shield className="w-3 h-3 inline"/> AC: {detailModal.content.ac}</span>
                                  <span><Users className="w-3 h-3 inline"/> HP: {detailModal.content.hp}/{detailModal.content.maxHp}</span>
                                  <span>PP: {detailModal.content.passivePerception}</span>
                              </div>
                              <p className="text-sm text-gray-400">{detailModal.content.race} {detailModal.content.class} (Level {detailModal.content.level})</p>
                              {detailModal.content.notes && <p className="text-sm italic border-l-2 border-blue-500 pl-2">{detailModal.content.notes}</p>}
                          </div>
                      )}
                      {detailModal.type === 'npc' && (
                          <div className="space-y-3">
                              <div className="flex justify-center mb-3">
                                  {detailModal.content.imageUrl ? <img src={detailModal.content.imageUrl} className="w-32 h-32 rounded-full object-cover border-2 border-gold-500 shadow-lg" alt={detailModal.content.name}/> : <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-4xl border border-gray-600">{detailModal.content.name.charAt(0)}</div>}
                              </div>
                              <p className="text-sm text-gray-300">{detailModal.content.description}</p>
                              {detailModal.content.location && <p className="text-xs text-gray-500"><MapPin className="w-3 h-3 inline"/> {detailModal.content.location}</p>}
                              <p className="text-sm text-gray-400 italic">"{detailModal.content.personality}"</p>
                              {detailModal.content.secret && <div className="bg-red-900/20 border border-red-900 p-2 rounded text-xs text-red-200"><span className="font-bold">Секрет:</span> {detailModal.content.secret}</div>}
                          </div>
                      )}
                  </div>
                  <div className="bg-gray-900 p-3 border-t border-gray-700 text-right shrink-0">
                      <button onClick={() => setDetailModal(null)} className="bg-gold-600 hover:bg-gold-500 text-black text-sm font-bold px-4 py-1 rounded">Закрыть</button>
                  </div>
              </div>
          </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl p-6 max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-serif font-bold text-xl text-gold-500 flex items-center gap-2"><Settings className="w-5 h-5"/> Настройки</h3>
                    <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center gap-2"><Key className="w-4 h-4 text-gold-500"/> Polza API Key</label>
                        <input type="password" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" placeholder="sk-..." value={apiKeyInput} onChange={e => setApiKeyInput(e.target.value)} />
                    </div>
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                        <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2"><ScrollText className="w-4 h-4 text-gold-500"/> Тема Кампании</label>
                        <select value={campaignMode} onChange={(e) => setLocalCampaignMode(e.target.value as CampaignMode)} className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none mb-2">
                            <option value="standard">Стандартное Фэнтези (D&D 5e)</option>
                            <option value="echoes">Предатели Реальности (Dark/Weird)</option>
                        </select>
                        {campaignMode === 'echoes' && <p className="text-xs text-purple-300 italic">Режим "Отголосков". AI генерирует контент аномалий и мультивселенной.</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-gold-500"/> AI Текстовая Модель</label>
                        <select value={settingsModel} onChange={(e) => setSettingsModel(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none">
                            {AVAILABLE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-gold-500"/> AI Модель Изображений</label>
                        <select value={settingsImageModel} onChange={(e) => setSettingsImageModel(e.target.value)} className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none">
                            {AVAILABLE_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <button onClick={handleSaveKey} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 rounded shadow-lg">Сохранить</button>
                </div>
            </div>
        </div>
      )}

      {showMobileMenu && (
          <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm xl:hidden flex flex-col justify-end animate-in slide-in-from-bottom-10">
              <div className="bg-dnd-card border-t border-gold-600 rounded-t-xl p-4 pb-24 space-y-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                      <h3 className="text-gold-500 font-serif font-bold">Меню</h3>
                      <button onClick={() => setShowMobileMenu(false)} className="text-gray-400"><X className="w-6 h-6"/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.PARTY)} icon={<Users/>} label="Герои" active={activeTab === Tab.PARTY}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.NPCS)} icon={<UserSquare2/>} label="NPC" active={activeTab === Tab.NPCS}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.NOTES)} icon={<BookOpen/>} label="Журнал" active={activeTab === Tab.NOTES}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.QUESTS)} icon={<ScrollText/>} label="Квесты" active={activeTab === Tab.QUESTS}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.SOUNDS)} icon={<Music/>} label="Атмосфера" active={activeTab === Tab.SOUNDS}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.SCREEN)} icon={<ScrollText/>} label="Ширма" active={activeTab === Tab.SCREEN}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.GALLERY)} icon={<ImageIcon/>} label="Галерея" active={activeTab === Tab.GALLERY}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.GENERATORS)} icon={<BrainCircuit/>} label="AI Генератор" active={activeTab === Tab.GENERATORS}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.DASHBOARD)} icon={<LayoutDashboard/>} label="Главная" active={activeTab === Tab.DASHBOARD}/>
                  </div>
                  <div className="border-t border-gray-700 pt-4 space-y-2">
                      <button onClick={() => setShowSettingsModal(true)} className="w-full bg-gray-800 p-3 rounded flex items-center gap-3 text-gray-300"><Settings className="w-5 h-5"/> Настройки</button>
                      <button onClick={() => { setHelpSection('install'); setShowHelpModal(true); }} className="w-full bg-gray-800 p-3 rounded flex items-center gap-3 text-gray-300"><HelpCircle className="w-5 h-5"/> Справка</button>
                      <button onClick={() => setIsDay(!isDay)} className="w-full bg-gray-800 p-3 rounded flex items-center gap-3 text-gray-300">{isDay ? <Sun className="w-5 h-5 text-yellow-500"/> : <Moon className="w-5 h-5 text-blue-400"/>} {isDay ? 'День' : 'Ночь'}</button>
                  </div>
              </div>
              <div className="flex-1" onClick={() => setShowMobileMenu(false)} />
          </div>
      )}

      <nav className="hidden xl:flex w-64 bg-dnd-dark border-r border-gray-800 flex-col justify-between shrink-0 z-10">
        <div>
          <div className="p-6 flex items-center gap-3 border-b border-gray-800">
            <div className="w-8 h-8 bg-gold-600 rounded-full flex items-center justify-center text-black font-bold font-serif text-xl">D</div>
            <span className="font-serif font-bold text-gold-500 text-lg tracking-wide">DM Codex</span>
          </div>
          <div className="p-2 space-y-1 mt-4 overflow-y-auto max-h-[calc(100vh-240px)] custom-scrollbar">
            <NavButton active={activeTab === Tab.DASHBOARD} onClick={() => setActiveTab(Tab.DASHBOARD)} icon={<LayoutDashboard />} label="Главная" />
            <NavButton active={activeTab === Tab.LOCATION} onClick={() => setActiveTab(Tab.LOCATION)} icon={<MapPin />} label="Локация" />
            <NavButton active={activeTab === Tab.QUESTS} onClick={() => setActiveTab(Tab.QUESTS)} icon={<ScrollText />} label="Квесты" />
            <NavButton active={activeTab === Tab.NPCS} onClick={() => setActiveTab(Tab.NPCS)} icon={<UserSquare2 />} label="NPC" />
            <NavButton active={activeTab === Tab.PARTY} onClick={() => setActiveTab(Tab.PARTY)} icon={<Users />} label="Герои" />
            <NavButton active={activeTab === Tab.COMBAT} onClick={() => setActiveTab(Tab.COMBAT)} icon={<Swords />} label="Бой" />
            <NavButton active={activeTab === Tab.NOTES} onClick={() => setActiveTab(Tab.NOTES)} icon={<BookOpen />} label="Журнал" />
            <NavButton active={activeTab === Tab.GALLERY} onClick={() => setActiveTab(Tab.GALLERY)} icon={<ImageIcon />} label="Галерея" />
            <NavButton active={activeTab === Tab.SOUNDS} onClick={() => setActiveTab(Tab.SOUNDS)} icon={<Music />} label="Атмосфера" />
            <NavButton active={activeTab === Tab.GENERATORS} onClick={() => setActiveTab(Tab.GENERATORS)} icon={<BrainCircuit />} label="AI Генератор" />
            <NavButton active={activeTab === Tab.SCREEN} onClick={() => setActiveTab(Tab.SCREEN)} icon={<ScrollText />} label="Ширма" />
          </div>
        </div>
        <div className="border-t border-gray-800 bg-gray-900/50">
           <div className="p-2 space-y-1">
                <button onClick={() => setShowSettingsModal(true)} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm text-gray-500 hover:text-gold-400 hover:bg-gray-800"><Settings className="w-5 h-5"/> <span className="font-medium">Настройки</span></button>
                <button onClick={() => { setHelpSection('install'); setShowHelpModal(true); }} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm text-gray-500 hover:text-gold-400 hover:bg-gray-800"><HelpCircle className="w-5 h-5"/> <span className="font-medium">Справка</span></button>
           </div>
           <div className="p-4 pt-2">
              <div onClick={() => setIsDay(!isDay)} className="cursor-pointer flex items-center gap-3 p-2 rounded hover:bg-gray-800 transition-colors">
                {isDay ? <Sun className="text-yellow-500 w-6 h-6" /> : <Moon className="text-blue-400 w-6 h-6" />}
                <div><div className="text-xs text-gray-500 uppercase">Время</div><div className="font-bold">{isDay ? 'День' : 'Ночь'}</div></div>
              </div>
           </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-dnd-darker">
        <div className="flex-1 p-3 md:p-6 overflow-y-auto pb-28 xl:pb-12 custom-scrollbar">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-gold-500"><Loader className="w-12 h-12 animate-spin"/></div>}>
                {renderContent()}
            </Suspense>
        </div>
        <GlobalPlayer />
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-dnd-dark border-t border-gold-600/30 flex justify-around items-center p-2 pb-safe z-40 shadow-[0_-4px_6px_rgba(0,0,0,0.3)]">
             <MobileNavIcon active={activeTab === Tab.COMBAT} onClick={() => changeTabMobile(Tab.COMBAT)} icon={<Swords/>} label="Бой" />
             <MobileNavIcon active={activeTab === Tab.LOCATION} onClick={() => changeTabMobile(Tab.LOCATION)} icon={<MapPin/>} label="Локация" />
             <button onClick={() => setShowMobileTools(!showMobileTools)} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${showMobileTools ? 'text-gold-500' : 'text-gray-400'}`}><ScrollText className={`w-6 h-6 ${showMobileTools ? 'animate-pulse' : ''}`}/><span className="text-[10px] font-bold">Лог</span></button>
             <MobileNavIcon active={activeTab === Tab.NPCS} onClick={() => changeTabMobile(Tab.NPCS)} icon={<UserSquare2/>} label="NPC" />
             <button onClick={() => setShowMobileMenu(true)} className={`flex flex-col items-center gap-1 p-2 rounded-lg ${showMobileMenu ? 'text-gold-500' : 'text-gray-400'}`}><Menu className="w-6 h-6"/><span className="text-[10px] font-bold">Меню</span></button>
        </nav>
        {showMobileTools && (
            <div className="xl:hidden fixed bottom-[60px] left-0 right-0 bg-dnd-dark border-t border-gold-600 rounded-t-xl shadow-2xl z-50 flex flex-col max-h-[60vh] animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-900/90 rounded-t-xl">
                    <span className="text-gold-500 font-bold text-sm flex items-center gap-2"><ScrollText className="w-4 h-4"/> Лог сессии</span>
                    <button onClick={() => setShowMobileTools(false)}><ChevronDown className="w-5 h-5 text-gray-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dnd-darker">
                    <div className="bg-dnd-card rounded border border-gray-700 p-2 max-h-60 overflow-y-auto text-xs font-mono">
                        <div className="flex justify-between items-center mb-2 sticky top-0 bg-dnd-card pb-1 border-b border-gray-700">
                            <span className="text-gray-400 font-bold">Записи</span>
                            <div className="flex gap-2">
                                <button onClick={exportLogToJournal}><Save className="w-3 h-3 text-green-400"/></button>
                                <button onClick={clearLogs}><Trash2 className="w-3 h-3 text-red-400"/></button>
                            </div>
                        </div>
                        {logs.map(log => (
                             <div key={log.id} className="border-l-2 border-gray-600 pl-2 py-0.5 mb-1">
                                <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                                <span className="text-gray-300 ml-1">{log.text}</span>
                             </div>
                        ))}
                        {logs.length === 0 && <span className="text-gray-600 italic">Пусто</span>}
                    </div>
                </div>
            </div>
        )}
        <div className="hidden xl:flex h-20 border-t border-gray-800 bg-dnd-dark p-2 gap-4 shrink-0 z-20">
           <div className="flex-1 overflow-y-auto font-mono text-xs text-gray-400 space-y-1 relative group custom-scrollbar">
              <div className="text-xs font-bold text-gray-600 uppercase mb-1 sticky top-0 bg-dnd-dark py-1 flex justify-between items-center border-b border-gray-800">
                  <span>Лог сессии ({logs.length})</span>
                  <div className="flex items-center gap-2">
                    <button onClick={exportLogToJournal} className="text-gray-500 hover:text-green-400 p-1" title="Сохранить в Журнал"><Save className="w-3 h-3" /></button>
                    <button onClick={clearLogs} className="text-gray-500 hover:text-red-400 p-1" title="Очистить"><Trash2 className="w-3 h-3" /></button>
                  </div>
              </div>
              {logs.map((log) => (
                  <div key={log.id} className="border-l-2 border-gray-700 pl-2 py-0.5 hover:bg-gray-800/30 rounded-r transition-colors">
                    <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                    <span className={log.type === 'combat' ? 'text-red-400 ml-2' : log.type === 'roll' ? 'text-blue-400 ml-2' : log.type === 'story' ? 'text-gold-500 ml-2' : 'text-gray-300 ml-2'}>{log.text}</span>
                  </div>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${active ? 'bg-gold-600/10 text-gold-500 border-l-4 border-gold-500' : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'}`}>
    <span className="group-hover:scale-110 transition-transform duration-200">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

const MobileNavIcon: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${active ? 'text-gold-500 bg-gray-800/50' : 'text-gray-400'}`}>
        <div className={active ? 'animate-bounce-subtle' : ''}>{icon}</div>
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

const MobileMenuBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${active ? 'bg-gold-600/20 border-gold-500 text-gold-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
        {icon}
        <span className="text-xs font-bold">{label}</span>
    </button>
);

const App: React.FC = () => (
  <AudioProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
  </AudioProvider>
);

export default App;
