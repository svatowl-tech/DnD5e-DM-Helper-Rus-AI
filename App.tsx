
import React, { useState, useEffect } from 'react';
import { Tab, LogEntry, Note, SavedImage } from './types';
import { 
  setCustomApiKey, 
  getCustomApiKey, 
  AVAILABLE_MODELS, 
  AVAILABLE_IMAGE_MODELS,
  getActiveModel, 
  setActiveModel,
  getActiveImageModel,
  setActiveImageModel
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
  Image as ImageIcon
} from 'lucide-react';

import CombatTracker from './components/CombatTracker';
import DiceRoller from './components/DiceRoller';
import Generators from './components/Generators';
import DmScreen from './components/DmScreen';
import CampaignNotes from './components/CampaignNotes';
import Dashboard from './components/Dashboard';
import PartyManager from './components/PartyManager';
import LocationTracker from './components/LocationTracker';
import SoundBoard from './components/SoundBoard';
import QuestTracker from './components/QuestTracker';
import GlobalPlayer from './components/GlobalPlayer';
import Gallery from './components/Gallery';
import ImageTheater from './components/ImageTheater';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  
  // Log Persistence
  const [logs, setLogs] = useState<LogEntry[]>(() => {
      const saved = localStorage.getItem('dmc_session_logs');
      return saved ? JSON.parse(saved) : [];
  });
  
  // Gallery Persistence
  const [gallery, setGallery] = useState<SavedImage[]>(() => {
      const saved = localStorage.getItem('dmc_gallery');
      return saved ? JSON.parse(saved) : [];
  });

  // Theater Mode
  const [theaterImage, setTheaterImage] = useState<SavedImage | null>(null);
  
  const [isDay, setIsDay] = useState(true);

  // Mobile State
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileTools, setShowMobileTools] = useState(false); // For Dice/Logs on mobile

  // PWA / Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  
  // Modals
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpSection, setHelpSection] = useState<'install' | 'deploy'>('install');
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [settingsModel, setSettingsModel] = useState('gemini-2.5-flash');
  const [settingsImageModel, setSettingsImageModel] = useState('seedream-v4');

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

  // Load API Key and Model
  useEffect(() => {
    const key = getCustomApiKey();
    if (key) setApiKeyInput(key);
    setSettingsModel(getActiveModel());
    setSettingsImageModel(getActiveImageModel());
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
        // If no prompt (e.g. iOS), show help modal instead
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
      setShowSettingsModal(false);
      alert("Настройки сохранены.");
  };

  // Save logs whenever they change
  useEffect(() => {
      localStorage.setItem('dmc_session_logs', JSON.stringify(logs));
  }, [logs]);

  // Save gallery whenever it changes
  useEffect(() => {
      localStorage.setItem('dmc_gallery', JSON.stringify(gallery));
  }, [gallery]);

  const addLog = (entry: LogEntry) => {
    setLogs(prev => [entry, ...prev].slice(0, 100));
  };

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
        return <Dashboard onChangeTab={(t) => setActiveTab(t)} />;
      case Tab.LOCATION:
        return <LocationTracker addLog={addLog} onSaveNote={saveNoteToStorage} onImageGenerated={addToGallery} onShowImage={openTheater} />;
      case Tab.QUESTS:
        return <QuestTracker />;
      case Tab.PARTY:
        return <PartyManager />;
      case Tab.COMBAT:
        return <CombatTracker addLog={addLog} />;
      case Tab.NOTES:
        return <CampaignNotes key="notes-tab" />;
      case Tab.GENERATORS:
        return <Generators onImageGenerated={addToGallery} onShowImage={openTheater} />;
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
      
      {/* --- THEATER MODE MODAL --- */}
      <ImageTheater image={theaterImage} onClose={() => setTheaterImage(null)} />

      {/* --- MODALS --- */}

      {/* Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl p-6">
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
                        <p className="text-xs text-gray-500 mb-2">
                            Необходим для работы AI генераторов. Ключ сохраняется только в браузере.
                        </p>
                        <input 
                            type="password" 
                            className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none"
                            placeholder="sk-..."
                            value={apiKeyInput}
                            onChange={e => setApiKeyInput(e.target.value)}
                        />
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
                    
                    <button 
                        onClick={handleSaveKey}
                        className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 rounded shadow-lg transition-all"
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Help / Install Modal */}
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
                    <button 
                        onClick={() => setHelpSection('install')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${helpSection === 'install' ? 'text-gold-500 border-b-2 border-gold-500 bg-gray-800/50' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <Smartphone className="w-4 h-4"/> Установка
                    </button>
                    <button 
                        onClick={() => setHelpSection('deploy')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${helpSection === 'deploy' ? 'text-gold-500 border-b-2 border-gold-500 bg-gray-800/50' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <Globe className="w-4 h-4"/> Деплой
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto text-sm text-gray-300 custom-scrollbar">
                    {helpSection === 'install' ? (
                        <>
                            <p>Приложение работает офлайн. Установите его на устройство для полноэкранного режима.</p>
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-1">🍎 iOS (Safari)</h4>
                                <p className="text-xs">Нажмите "Поделиться" <Share className="w-3 h-3 inline"/> -> "На экран «Домой»".</p>
                            </div>
                            <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-1">🤖 Android (Chrome)</h4>
                                <p className="text-xs">Меню (3 точки) -> "Установить приложение".</p>
                            </div>
                            {showInstallButton && (
                                <div className="text-center pt-2">
                                    <button onClick={handleInstallClick} className="bg-gold-600 text-black font-bold py-2 px-6 rounded-full shadow-lg">Установить</button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <p>Деплой на Vercel/Netlify:</p>
                            <ol className="list-decimal list-inside space-y-2 text-gray-300">
                                <li>Загрузите код на GitHub.</li>
                                <li>Импортируйте проект в Vercel/Netlify.</li>
                                <li>Нажмите Deploy.</li>
                            </ol>
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Key className="w-4 h-4 text-gold-500"/> Важно: Polza API Ключ</h4>
                                <p className="mb-2 text-xs">Для работы AI нужен ключ.</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-300 text-xs">
                                    <li>Добавьте <code>API_KEY</code> в Environment Variables хостинга.</li>
                                    <li>ИЛИ введите ключ в Настройках приложения после запуска.</li>
                                </ul>
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
              <div className="bg-dnd-card border-t border-gold-600 rounded-t-xl p-4 pb-24 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="flex justify-between items-center border-b border-gray-700 pb-2">
                      <h3 className="text-gold-500 font-serif font-bold">Меню</h3>
                      <button onClick={() => setShowMobileMenu(false)} className="text-gray-400"><X className="w-6 h-6"/></button>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.PARTY)} icon={<Users/>} label="Герои" active={activeTab === Tab.PARTY}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.NOTES)} icon={<ScrollText/>} label="Журнал" active={activeTab === Tab.NOTES}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.QUESTS)} icon={<ScrollText/>} label="Квесты" active={activeTab === Tab.QUESTS}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.SOUNDS)} icon={<Music/>} label="Атмосфера" active={activeTab === Tab.SOUNDS}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.SCREEN)} icon={<BookOpen/>} label="Ширма" active={activeTab === Tab.SCREEN}/>
                      <MobileMenuBtn onClick={() => changeTabMobile(Tab.GALLERY)} icon={<ImageIcon/>} label="Галерея" active={activeTab === Tab.GALLERY}/>
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
        <div className="flex-1 p-3 md:p-6 overflow-y-auto pb-32 xl:pb-20 custom-scrollbar">
            {renderContent()}
        </div>

        {/* --- GLOBAL AUDIO PLAYER --- */}
        <GlobalPlayer />

        {/* --- MOBILE BOTTOM NAV --- */}
        <nav className="xl:hidden fixed bottom-0 left-0 right-0 bg-dnd-dark border-t border-gold-600/30 flex justify-around items-center p-2 pb-safe z-40 shadow-[0_-4px_6px_rgba(0,0,0,0.3)]">
             <MobileNavIcon active={activeTab === Tab.COMBAT} onClick={() => changeTabMobile(Tab.COMBAT)} icon={<Swords/>} label="Бой" />
             <MobileNavIcon active={activeTab === Tab.LOCATION} onClick={() => changeTabMobile(Tab.LOCATION)} icon={<MapPin/>} label="Локация" />
             
             {/* Tools Toggle (Dice/Log) */}
             <button 
                onClick={() => setShowMobileTools(!showMobileTools)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${showMobileTools ? 'text-gold-500' : 'text-gray-400'}`}
             >
                 <Dices className={`w-6 h-6 ${showMobileTools ? 'animate-pulse' : ''}`}/>
                 <span className="text-[10px] font-bold">Инструм.</span>
             </button>

             <MobileNavIcon active={activeTab === Tab.GENERATORS} onClick={() => changeTabMobile(Tab.GENERATORS)} icon={<BrainCircuit/>} label="AI" />
             
             <button 
                onClick={() => setShowMobileMenu(true)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg ${showMobileMenu ? 'text-gold-500' : 'text-gray-400'}`}
             >
                 <Menu className="w-6 h-6"/>
                 <span className="text-[10px] font-bold">Меню</span>
             </button>
        </nav>

        {/* --- TOOLS DRAWER (Mobile/Tablet) --- */}
        {showMobileTools && (
            <div className="xl:hidden fixed bottom-[60px] left-0 right-0 bg-dnd-dark border-t border-gold-600 rounded-t-xl shadow-2xl z-50 flex flex-col max-h-[60vh] animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center p-3 border-b border-gray-700 bg-gray-900/90 rounded-t-xl">
                    <span className="text-gold-500 font-bold text-sm flex items-center gap-2"><Dices className="w-4 h-4"/> Дайсы и Лог</span>
                    <button onClick={() => setShowMobileTools(false)}><ChevronDown className="w-5 h-5 text-gray-400"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-dnd-darker">
                    <DiceRoller addLog={addLog} />
                    
                    <div className="bg-dnd-card rounded border border-gray-700 p-2 max-h-40 overflow-y-auto text-xs font-mono">
                        <div className="flex justify-between items-center mb-2 sticky top-0 bg-dnd-card pb-1 border-b border-gray-700">
                            <span className="text-gray-400 font-bold">Лог сессии</span>
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

        {/* --- DESKTOP BOTTOM PANEL (Log & Dice - XL+ only) --- */}
        <div className="hidden xl:flex h-48 border-t border-gray-800 bg-dnd-dark p-4 gap-4 shrink-0 z-20 pb-10">
           {/* Log */}
           <div className="flex-1 overflow-y-auto font-mono text-xs text-gray-400 space-y-1 relative group custom-scrollbar">
              <div className="text-xs font-bold text-gray-600 uppercase mb-2 sticky top-0 bg-dnd-dark py-1 flex justify-between items-center border-b border-gray-800">
                  <span>Лог сессии ({logs.length})</span>
                  <div className="flex items-center gap-2">
                    <button onClick={exportLogToJournal} className="text-gray-500 hover:text-green-400 p-1" title="Сохранить в Журнал"><Save className="w-3 h-3" /></button>
                    <button onClick={clearLogs} className="text-gray-500 hover:text-red-400 p-1" title="Очистить"><Trash2 className="w-3 h-3" /></button>
                  </div>
              </div>
              {logs.map((log) => (
                  <div key={log.id} className="border-l-2 border-gray-700 pl-2 py-1 hover:bg-gray-800/30 rounded-r transition-colors">
                    <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}]</span>
                    <span className={log.type === 'combat' ? 'text-red-400 ml-2' : log.type === 'roll' ? 'text-blue-400 ml-2' : log.type === 'story' ? 'text-gold-500 ml-2' : 'text-gray-300 ml-2'}>
                        {log.text}
                    </span>
                  </div>
              ))}
           </div>
           {/* Dice Roller */}
           <div className="w-72">
              <DiceRoller addLog={addLog} />
           </div>
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
    return (
        <AudioProvider>
            <AppContent />
        </AudioProvider>
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

export default App;
