
import React, { useState, useEffect, Suspense } from 'react';
import { Tab, LogEntry, Note, SavedImage, PartyMember, LocationData, FullQuest, Combatant, EntityType, CampaignNpc } from './types';
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
import { AudioProvider } from './contexts/AudioContext';
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
// Import API service for enriching monsters
import { searchMonsters, getMonsterDetails } from './services/dndApiService';

// Static imports for critical components
import GlobalPlayer from './components/GlobalPlayer';
import ImageTheater from './components/ImageTheater';
import DmHelperWidget from './components/DmHelperWidget';

// Lazy imports for tabs to split code chunks
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
  
  // Log Persistence
  const [logs, setLogs] = useState<LogEntry[]>(() => {
      const saved = localStorage.getItem('dmc_session_logs');
      // FIX: Ensure array even if parse returns null
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
  });
  
  // Gallery Persistence
  const [gallery, setGallery] = useState<SavedImage[]>(() => {
      const saved = localStorage.getItem('dmc_gallery');
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
  });

  // Theater Mode
  const [theaterImage, setTheaterImage] = useState<SavedImage | null>(null);
  
  const [isDay, setIsDay] = useState(true);

  // Mobile State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false); // For Logs on mobile

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

  const addLog = (entry: LogEntry) => {
    setLogs(prev => {
        const newLogs = [entry, ...prev].slice(0, 100);
        localStorage.setItem('dmc_session_logs', JSON.stringify(newLogs));
        return newLogs;
    });
  };

  // --- GLOBAL EVENT LISTENERS (Data Persistence System) ---
  useEffect(() => {
      // 1. Add Quest
      const handleAddQuest = (e: CustomEvent) => {
          const { title, description, giver, location } = e.detail;
          
          // Ensure we have default values if fields are missing
          const safeTitle = title || 'Новый квест';
          const safeGiver = giver || 'Неизвестно';
          const safeLocation = location || 'Неизвестно';
          const safeDescription = description || '';
          
          const newQuest: FullQuest = {
              id: Date.now().toString(),
              title: safeTitle,
              status: 'active',
              giver: safeGiver,
              location: safeLocation, // Pass location correctly
              summary: safeDescription.substring(0, 50) + (safeDescription.length > 50 ? '...' : '') || safeTitle,
              description: safeDescription,
              objectives: [{ id: Date.now().toString() + 'obj', text: 'Основная цель', completed: false }],
              threats: [],
              reward: ''
          };
          
          const existingQuests = JSON.parse(localStorage.getItem('dmc_quests') || '[]');
          const updatedQuests = [newQuest, ...existingQuests];
          localStorage.setItem('dmc_quests', JSON.stringify(updatedQuests));
          
          // Notify components to reload
          window.dispatchEvent(new Event('dmc-update-quests'));
          
          addLog({
              id: Date.now().toString(),
              timestamp: Date.now(),
              text: `[Квест] Добавлена задача: "${newQuest.title}" в локации ${safeLocation}`,
              type: 'story'
          });
      };

      // 2. Add Combatant (ENHANCED)
      const handleAddCombatant = async (e: CustomEvent) => {
          const details = e.detail;
          
          // Basic default monster
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
              actions: [] // Initialize actions
          };

          // If it's a monster and looks like a generic one (low HP default), try to enrich it via API
          // Check if name exists and it's likely a generic import (20 HP is default in TravelManager)
          if (newC.type === EntityType.MONSTER && details.hp === 20) {
             try {
                 const searchResults = await searchMonsters(newC.name);
                 if (searchResults && searchResults.length > 0) {
                     // Find exact match or first result
                     const exact = searchResults.find(r => r.name.toLowerCase() === newC.name.toLowerCase());
                     const target = exact || searchResults[0];
                     const fullStats = await getMonsterDetails(target.index);
                     
                     if (fullStats) {
                         newC.hp = fullStats.hit_points;
                         newC.maxHp = fullStats.hit_points;
                         newC.ac = typeof fullStats.armor_class === 'number' ? fullStats.armor_class : (fullStats.armor_class as any)[0]?.value || 10;
                         newC.xp = fullStats.xp;
                         newC.notes = `CR ${fullStats.challenge_rating} (${fullStats.type}). ${newC.notes}`;
                         
                         // Parse actions if available in API response (assuming simplified mapping here)
                         // The real API returns an array of action objects. We'd format them to strings.
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
      };

      // 3. Add Note
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
      };

      // 4. Add XP (Global Party Manager)
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

              // Check level up logic
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

          addLog({
              id: Date.now().toString(),
              timestamp: Date.now(),
              text: `Группа получила по ${amount} XP. ${reason || ''}`,
              type: 'system'
          });

          if (levelUpOccurred) {
              alert("🎉 Кто-то в группе получил новый уровень! Проверьте вкладку Героев.");
          }
      };

      // 5. Add NPC (NEW)
      const handleAddNpc = (e: CustomEvent) => {
          const { name, race, description, location, status, attitude, personality, secret, imageUrl, notes } = e.detail;
          
          // Check duplicates
          const existingNpcs = JSON.parse(localStorage.getItem('dmc_npcs') || '[]');
          if (existingNpcs.some((n: any) => n.name === name)) {
              alert(`NPC ${name} уже есть в трекере.`);
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
          
          addLog({
              id: Date.now().toString(),
              timestamp: Date.now(),
              text: `[NPC] ${newNpc.name} добавлен в трекер.`,
              type: 'system'
          });
      };

      window.addEventListener('dmc-add-quest' as any, handleAddQuest);
      window.addEventListener('dmc-add-combatant' as any, handleAddCombatant);
      window.addEventListener('dmc-add-note' as any, handleAddNote);
      window.addEventListener('dmc-add-xp' as any, handleAddXp);
      window.addEventListener('dmc-add-npc' as any, handleAddNpc);

      return () => {
          window.removeEventListener('dmc-add-quest' as any, handleAddQuest);
          window.removeEventListener('dmc-add-combatant' as any, handleAddCombatant);
          window.removeEventListener('dmc-add-note' as any, handleAddNote);
          window.removeEventListener('dmc-add-xp' as any, handleAddXp);
          window.removeEventListener('dmc-add-npc' as any, handleAddNpc);
      };
  }, []);

  // 6. Switch Tab Listener & Open Settings Listener
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

    const handleOpenSettings = () => {
        setShowSettingsModal(true);
    };

    window.addEventListener('dmc-switch-tab' as any, handleSwitchTab);
    window.addEventListener('dmc-open-settings' as any, handleOpenSettings);
    
    return () => {
        window.removeEventListener('dmc-switch-tab' as any, handleSwitchTab);
        window.removeEventListener('dmc-open-settings' as any, handleOpenSettings);
    };
  }, []);

  // Handle PWA Install Prompt
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Load API Key, Models and Campaign Mode
  useEffect(() => {
    const key = getCustomApiKey();
    if (key) setApiKeyInput(key);
    setSettingsModel(getActiveModel());
    setSettingsImageModel(getActiveImageModel());
    setLocalCampaignMode(getCampaignMode());
  }, []);

  // Listen for Smart Links
  useEffect(() => {
      const handleShowDetails = (e: CustomEvent) => {
          const { type, id, title } = e.detail;
          let content: any = null;

          if (type === 'condition') {
              content = CONDITIONS.find(c => c.id === id);
          } else if (type === 'rule') {
              content = RULES_DATA.find(r => r.id === id);
          } else if (type === 'party') {
              const party: PartyMember[] = JSON.parse(localStorage.getItem('dmc_party') || '[]');
              content = party.find(p => p.id === id);
          } else if (type === 'npc') {
              // Check Campaign NPCs first, then Active Location
              const campaignNpcs: CampaignNpc[] = JSON.parse(localStorage.getItem('dmc_npcs') || '[]');
              content = campaignNpcs.find(n => n.name === id);
              
              if (!content) {
                  const loc: LocationData = JSON.parse(localStorage.getItem('dmc_active_location') || 'null');
                  content = loc?.npcs?.find(n => n.name === id);
              }
          }

          if (content) {
              setDetailModal({ open: true, title, content, type });
          }
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
      alert("Настройки сохранены.");
  };

  useEffect(() => {
      localStorage.setItem('dmc_session_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
      localStorage.setItem('dmc_gallery', JSON.stringify(gallery));
  }, [gallery]);

  const clearLogs = () => {
      if (window.confirm('Вы уверены, что хотите очистить лог сессии?')) {
          setLogs([]);
      }
  };

  const addToGallery = (image: SavedImage) => {
      setGallery(prev => [image, ...prev]);
      addLog({
          id: Date.now().toString(),
          timestamp: Date.now(),
          text: `Изображение "${image.title}" добавлено в галерею.`,
          type: 'system'
      });
  };

  const removeFromGallery = (id: string) => {
      if (window.confirm('Удалить изображение из галереи?')) {
          setGallery(prev => prev.filter(img => img.id !== id));
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
      
      // Dispatch update event for other components
      window.dispatchEvent(new Event('dmc-update-notes'));

      addLog({
          id: Date.now().toString(),
          timestamp: Date.now(),
          text: `Заметка "${newNote.title}" сохранена в журнал.`,
          type: 'system'
      });
  };

  const exportLogToJournal = () => {
      if (logs.length === 0) {
          alert("Лог пуст.");
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
      alert("Лог успешно сохранен как новая заметка в Журнале.");
  };

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return <Dashboard onChangeTab={(t: any) => setActiveTab(t)} />;
      case Tab.LOCATION:
        return <LocationTracker addLog={addLog} onSaveNote={saveNoteToStorage} onImageGenerated={addToGallery} onShowImage={openTheater} />;
      case Tab.QUESTS:
        return <QuestTracker addLog={addLog} />;
      case Tab.NPCS:
        return <NpcTracker addLog={addLog} onImageGenerated={addToGallery} />;
      case Tab.PARTY:
        return <PartyManager addLog={addLog} />;
      case Tab.COMBAT:
        return <CombatTracker addLog={addLog} />;
      case Tab.NOTES:
        return <CampaignNotes key="notes-tab" />;
      case Tab.GENERATORS:
        return <Generators addLog={addLog} onImageGenerated={addToGallery} onShowImage={openTheater} />;
      case Tab.SCREEN:
        return <DmScreen onImageGenerated={addToGallery} onShowImage={openTheater} />;
      case Tab.SOUNDS:
        return <SoundBoard />;
      case Tab.GALLERY:
        return <Gallery images={gallery} onShow={openTheater} onDelete={removeFromGallery} />;
      default:
        return <div className="text-center text-gray-500 mt-20">Модуль в разработке</div>;
    }
  };

  const changeTabMobile = (tab: Tab) => {
      setActiveTab(tab);
      setShowMobileMenu(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dnd-darker text-gray-200 font-sans">
      
      <ImageTheater image={theaterImage} onClose={() => setTheaterImage(null)} />
      <DmHelperWidget />

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
                              {detailModal.content.duration && <p className="text-xs text-gray-500">Длительность: {detailModal.content.duration}</p>}
                          </>
                      )}
                      {detailModal.type === 'rule' && (
                          <>
                              <p className="text-gray-300 mb-3">{detailModal.content.content}</p>
                              {detailModal.content.list && (
                                  <ul className="list-disc list-inside text-sm text-gray-400 space-y-1 mb-3">
                                      {detailModal.content.list.map((l: string, i: number) => <li key={i}>{l}</li>)}
                                  </ul>
                              )}
                              {detailModal.content.table && (
                                  <div className="bg-gray-900 rounded p-2 text-xs">
                                      {detailModal.content.table.map((row: any, i: number) => (
                                          <div key={i} className="flex justify-between border-b border-gray-700 py-1 last:border-0">
                                              <span className="font-bold text-gray-300">{row.label}</span>
                                              <span className="text-gray-500">{row.value}</span>
                                          </div>
                                      ))}
                                  </div>
                              )}
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
                                  {detailModal.content.imageUrl ? (
                                      <img src={detailModal.content.imageUrl} className="w-32 h-32 rounded-full object-cover border-2 border-gold-500 shadow-lg" alt={detailModal.content.name}/>
                                  ) : (
                                      <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-4xl border border-gray-600">
                                          {detailModal.content.name.charAt(0)}
                                      </div>
                                  )}
                              </div>
                              <p className="text-sm text-gray-300">{detailModal.content.description}</p>
                              {detailModal.content.location && <p className="text-xs text-gray-500"><MapPin className="w-3 h-3 inline"/> {detailModal.content.location}</p>}
                              <p className="text-sm text-gray-400 italic">"{detailModal.content.personality}"</p>
                              {detailModal.content.secret && (
                                  <div className="bg-red-900/20 border border-red-900 p-2 rounded text-xs text-red-200">
                                      <span className="font-bold">Секрет:</span> {detailModal.content.secret}
                                  </div>
                              )}
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
                    <h3 className="font-serif font-bold text-xl text-gold-500 flex items-center gap-2">
                        <Settings className="w-5 h-5"/> Настройки
                    </h3>
                    <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center gap-2">
                            <Key className="w-4 h-4 text-gold-500"/> Polza API Key
                        </label>
                        <input 
                            type="password" 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none"
                            placeholder="sk-..."
                            value={apiKeyInput}
                            onChange={e => setApiKeyInput(e.target.value)}
                        />
                    </div>
                    
                    {/* Campaign Mode Selector */}
                    <div className="p-3 bg-gray-900/50 rounded border border-gray-700">
                        <label className="block text-sm font-bold text-gray-300 mb-2 flex items-center gap-2">
                            <ScrollText className="w-4 h-4 text-gold-500"/> Режим Кампании
                        </label>
                        <select
                            value={campaignMode}
                            onChange={(e) => setLocalCampaignMode(e.target.value as CampaignMode)}
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none mb-2"
                        >
                            <option value="standard">Стандартный (D&D 5e)</option>
                            <option value="echoes">Предатели Реальности (Echoes)</option>
                        </select>
                        {campaignMode === 'echoes' && (
                            <p className="text-xs text-purple-300 italic">
                                Включен режим "Отголосков". AI будет генерировать контент, связанный с аномалиями, Тэем и мультивселенной.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center gap-2">
                            <BrainCircuit className="w-4 h-4 text-gold-500"/> AI Текстовая Модель
                        </label>
                        <select
                            value={settingsModel}
                            onChange={(e) => setSettingsModel(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none"
                        >
                            {AVAILABLE_MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-gold-500"/> AI Модель Изображений
                        </label>
                        <select
                            value={settingsImageModel}
                            onChange={(e) => setSettingsImageModel(e.target.value)}
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none"
                        >
                            {AVAILABLE_IMAGE_MODELS.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleSaveKey} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 rounded shadow-lg">Сохранить</button>
                </div>
            </div>
        </div>
      )}

      {showHelpModal && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dnd-card border border-gold-600 w-full max-w-lg rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
                <div className="p-4 bg-gray-900 border-b border-gold-600/50 flex justify-between items-center shrink-0">
                    <h3 className="font-serif font-bold text-xl text-gold-500 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5"/> Справка
                    </h3>
                    <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="flex border-b border-gray-700 shrink-0">
                    <button onClick={() => setHelpSection('install')} className={`flex-1 py-3 text-sm font-bold ${helpSection === 'install' ? 'text-gold-500 bg-gray-800/50' : 'text-gray-400 hover:text-gray-200'}`}>Установка</button>
                    <button onClick={() => setHelpSection('usage')} className={`flex-1 py-3 text-sm font-bold ${helpSection === 'usage' ? 'text-gold-500 bg-gray-800/50' : 'text-gray-400 hover:text-gray-200'}`}>Использование</button>
                </div>
                <div className="p-6 space-y-4 overflow-y-auto text-sm text-gray-300 flex-1 custom-scrollbar">
                    {helpSection === 'install' ? (
                        <div className="space-y-4">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2"><Smartphone className="w-5 h-5 text-blue-400"/> Установка PWA</h4>
                            <p>Это приложение можно установить как полноценную программу на телефон или компьютер.</p>
                            
                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                <h5 className="font-bold text-green-400 mb-1">Android (Chrome)</h5>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>Нажмите на три точки (Меню) в углу браузера.</li>
                                    <li>Выберите <strong>"Установить приложение"</strong> или <strong>"Добавить на главный экран"</strong>.</li>
                                    <li>Подтвердите установку.</li>
                                </ol>
                            </div>

                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                <h5 className="font-bold text-gray-200 mb-1">iOS (Safari)</h5>
                                <ol className="list-decimal list-inside space-y-1 text-xs">
                                    <li>Нажмите кнопку <strong>"Поделиться"</strong> (квадрат со стрелкой).</li>
                                    <li>Прокрутите вниз и выберите <strong>"На экран «Домой»"</strong>.</li>
                                    <li>Нажмите "Добавить".</li>
                                </ol>
                            </div>

                            <div className="bg-gray-800 p-3 rounded border border-gray-700">
                                <h5 className="font-bold text-blue-300 mb-1">PC (Chrome/Edge)</h5>
                                <p className="text-xs">В адресной строке справа появится иконка монитора со стрелкой. Нажмите её для установки.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <h4 className="text-lg font-bold text-white flex items-center gap-2"><Laptop className="w-5 h-5 text-gold-500"/> Руководство Мастера</h4>
                            
                            <div className="space-y-2">
                                <h5 className="font-bold text-gold-400 flex items-center gap-2"><BrainCircuit className="w-4 h-4"/> AI Генератор (Ключ API)</h5>
                                <p className="text-xs">
                                    Для работы AI функций (NPC, Квесты, Локации) требуется ключ <strong>Polza API</strong>. 
                                    Получите его на сайте <a href="https://polza.ai" target="_blank" className="text-blue-400 underline">polza.ai</a> и введите в меню <strong>Настройки</strong>.
                                    Ключ хранится только в вашем браузере.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h5 className="font-bold text-gold-400 flex items-center gap-2"><Swords className="w-4 h-4"/> Бой и Инициатива</h5>
                                <p className="text-xs">
                                    Вкладка <strong>"Бой"</strong> позволяет отслеживать HP, КД и состояния.
                                    <br/>• Нажмите <strong>"Инициатива"</strong> для группового броска.
                                    <br/>• Используйте иконку <strong>Бестиария</strong>, чтобы добавить монстров из базы SRD.
                                    <br/>• Нажмите на <strong>"Лут"</strong> после боя, чтобы сгенерировать награду.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h5 className="font-bold text-gold-400 flex items-center gap-2"><Compass className="w-4 h-4"/> Путешествия</h5>
                                <p className="text-xs">
                                    Во вкладке <strong>"Локация"</strong> выберите регион из справочника.
                                    <br/>• Нажмите кнопку с <strong>Компасом</strong>, чтобы открыть менеджер путешествий.
                                    <br/>• AI создаст сценарий пути, события и энкаунтеры.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h5 className="font-bold text-gold-400 flex items-center gap-2"><Music className="w-4 h-4"/> Музыка и Звуки</h5>
                                <p className="text-xs">
                                    Вкладка <strong>"Атмосфера"</strong> содержит плейлисты. 
                                    Кнопка <strong>DM Helper</strong> (справа внизу) открывает панель быстрых звуковых эффектов (гром, меч, крик) и инструменты импровизации.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <h5 className="font-bold text-gold-400 flex items-center gap-2"><Feather className="w-4 h-4"/> Заметки и Лог</h5>
                                <p className="text-xs">
                                    Все важные события автоматически попадают в <strong>Лог сессии</strong> (внизу экрана).
                                    Вы можете сохранить лог как заметку в конце игры через кнопку "Завершить".
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* --- MOBILE MENU DRAWER --- */}
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
                      <button onClick={() => setIsDay(!isDay)} className="w-full bg-gray-800 p-3 rounded flex items-center gap-3 text-gray-300">
                          {isDay ? <Sun className="w-5 h-5 text-yellow-500"/> : <Moon className="w-5 h-5 text-blue-400"/>} 
                          {isDay ? 'День' : 'Ночь'}
                      </button>
                  </div>
              </div>
              <div className="flex-1" onClick={() => setShowMobileMenu(false)} />
          </div>
      )}

      {/* --- DESKTOP SIDEBAR (XL+) --- */}
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
                <button onClick={() => setShowSettingsModal(true)} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm text-gray-500 hover:text-gold-400 hover:bg-gray-800">
                    <Settings className="w-5 h-5"/> <span className="font-medium">Настройки</span>
                </button>
                <button onClick={() => { setHelpSection('install'); setShowHelpModal(true); }} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm text-gray-500 hover:text-gold-400 hover:bg-gray-800">
                    <HelpCircle className="w-5 h-5"/> <span className="font-medium">Справка</span>
                </button>
           </div>
           <div className="p-4 pt-2">
              <div onClick={() => setIsDay(!isDay)} className="cursor-pointer flex items-center gap-3 p-2 rounded hover:bg-gray-800 transition-colors">
                {isDay ? <Sun className="text-yellow-500 w-6 h-6" /> : <Moon className="text-blue-400 w-6 h-6" />}
                <div>
                    <div className="text-xs text-gray-500 uppercase">Время</div>
                    <div className="font-bold">{isDay ? 'День' : 'Ночь'}</div>
                </div>
              </div>
           </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT AREA --- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-dnd-darker">
        {/* 
            Padding Bottom explanation:
            Mobile: pb-28 (Nav + Player + Widget space)
            Desktop: pb-12 (Main Content Space) - Adjusted to be closer to the new compact panel
        */}
        <div className="flex-1 p-3 md:p-6 overflow-y-auto pb-28 xl:pb-12 custom-scrollbar">
            <Suspense fallback={<div className="flex h-full items-center justify-center text-gold-500"><Loader className="w-12 h-12 animate-spin"/></div>}>
                {renderContent()}
            </Suspense>
        </div>

        <GlobalPlayer />

        {/* --- MOBILE BOTTOM NAV --- */}
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-dnd-dark border-t border-gold-600/30 flex justify-around items-center p-2 pb-safe z-40 shadow-[0_-4px_6px_rgba(0,0,0,0.3)]">
             <MobileNavIcon active={activeTab === Tab.COMBAT} onClick={() => changeTabMobile(Tab.COMBAT)} icon={<Swords/>} label="Бой" />
             <MobileNavIcon active={activeTab === Tab.LOCATION} onClick={() => changeTabMobile(Tab.LOCATION)} icon={<MapPin/>} label="Локация" />
             
             <button 
                onClick={() => setShowMobileTools(!showMobileTools)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${showMobileTools ? 'text-gold-500' : 'text-gray-400'}`}
             >
                 <ScrollText className={`w-6 h-6 ${showMobileTools ? 'animate-pulse' : ''}`}/>
                 <span className="text-[10px] font-bold">Лог</span>
             </button>

             <MobileNavIcon active={activeTab === Tab.NPCS} onClick={() => changeTabMobile(Tab.NPCS)} icon={<UserSquare2/>} label="NPC" />
             
             <button 
                onClick={() => setShowMobileMenu(true)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${showMobileMenu ? 'text-gold-500' : 'text-gray-400'}`}
             >
                 <Menu className="w-6 h-6"/>
                 <span className="text-[10px] font-bold">Меню</span>
             </button>
        </nav>

        {/* --- LOG DRAWER (Mobile/Tablet) --- */}
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

        {/* --- DESKTOP BOTTOM PANEL (Log Only - XL+) --- */}
        {/* Reduced height to h-20 (80px) for minimal footprint: header + ~3 lines */}
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
                    <span className={log.type === 'combat' ? 'text-red-400 ml-2' : log.type === 'roll' ? 'text-blue-400 ml-2' : log.type === 'story' ? 'text-gold-500 ml-2' : 'text-gray-300 ml-2'}>
                        {log.text}
                    </span>
                  </div>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
      active 
        ? 'bg-gold-600/10 text-gold-500 border-l-4 border-gold-500' 
        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
    }`}
  >
    <span className="group-hover:scale-110 transition-transform duration-200">{icon}</span>
    <span className="font-medium">{label}</span>
  </button>
);

const MobileNavIcon: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${active ? 'text-gold-500 bg-gray-800/50' : 'text-gray-400'}`}
    >
        <div className={active ? 'animate-bounce-subtle' : ''}>{icon}</div>
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

const MobileMenuBtn: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-xl border transition-all ${active ? 'bg-gold-600/20 border-gold-500 text-gold-500' : 'bg-gray-800 border-gray-700 text-gray-400'}`}
    >
        {icon}
        <span className="text-xs font-bold">{label}</span>
    </button>
);

const App: React.FC = () => (
  <AudioProvider>
    <AppContent />
  </AudioProvider>
);

export default App;