
import React, { useState, useEffect } from 'react';
import { Tab, LogEntry, Note } from './types';
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
  Smartphone
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

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  
  // Log Persistence
  const [logs, setLogs] = useState<LogEntry[]>(() => {
      const saved = localStorage.getItem('dmc_session_logs');
      return saved ? JSON.parse(saved) : [];
  });
  
  const [isDay, setIsDay] = useState(true);

  // PWA / Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpSection, setHelpSection] = useState<'install' | 'deploy'>('install');

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

  // Save logs whenever they change
  useEffect(() => {
      localStorage.setItem('dmc_session_logs', JSON.stringify(logs));
  }, [logs]);

  const addLog = (entry: LogEntry) => {
    setLogs(prev => [entry, ...prev].slice(0, 100)); // Increased limit to 100
  };

  const clearLogs = () => {
      if (window.confirm('Вы уверены, что хотите очистить лог сессии?')) {
          setLogs([]);
      }
  };

  const saveNoteToStorage = (newNote: Note) => {
      const savedNotes = localStorage.getItem('dmc_notes');
      const notes: Note[] = savedNotes ? JSON.parse(savedNotes) : [];
      // Check if note exists to update or add
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
        return <LocationTracker addLog={addLog} onSaveNote={saveNoteToStorage} />;
      case Tab.PARTY:
        return <PartyManager />;
      case Tab.COMBAT:
        return <CombatTracker addLog={addLog} />;
      case Tab.NOTES:
        // Render with a key based on tab to ensure it remounts correctly when tab becomes active
        // This ensures it picks up latest localStorage changes from other tabs (like Export Log)
        return <CampaignNotes key="notes-tab" />;
      case Tab.GENERATORS:
        return <Generators />;
      case Tab.SCREEN:
        return <DmScreen />;
      case Tab.SOUNDS:
        return <SoundBoard />;
      default:
        return <div className="text-center text-gray-500 mt-20">Модуль в разработке</div>;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-dnd-darker text-gray-200 font-sans">
      
      {/* Help / Install Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dnd-card border border-gold-600 w-full max-w-lg rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[80vh]">
                <div className="p-4 bg-gray-900 border-b border-gold-600/50 flex justify-between items-center shrink-0">
                    <h3 className="font-serif font-bold text-xl text-gold-500 flex items-center gap-2">
                        <HelpCircle className="w-5 h-5"/> Справка
                    </h3>
                    <button onClick={() => setShowHelpModal(false)} className="text-gray-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-700 shrink-0">
                    <button 
                        onClick={() => setHelpSection('install')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${helpSection === 'install' ? 'text-gold-500 border-b-2 border-gold-500 bg-gray-800/50' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <Smartphone className="w-4 h-4"/> Установка (PWA)
                    </button>
                    <button 
                        onClick={() => setHelpSection('deploy')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors ${helpSection === 'deploy' ? 'text-gold-500 border-b-2 border-gold-500 bg-gray-800/50' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                    >
                        <Globe className="w-4 h-4"/> Деплой (Хостинг)
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto text-sm text-gray-300 custom-scrollbar">
                    {helpSection === 'install' ? (
                        <>
                            <p>Это приложение можно установить как нативную программу на планшет или телефон. Интернет не обязателен после первой загрузки.</p>
                            
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><span className="text-xl">🍎</span> iOS (iPad / iPhone)</h4>
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Откройте этот сайт в <strong>Safari</strong>.</li>
                                    <li>Нажмите кнопку <strong>"Поделиться"</strong> <Share className="w-4 h-4 inline"/> (квадрат со стрелкой).</li>
                                    <li>Прокрутите вниз и выберите <strong>"На экран «Домой»"</strong>.</li>
                                    <li>Нажмите "Добавить".</li>
                                </ol>
                            </div>

                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><span className="text-xl">🤖</span> Android (Chrome)</h4>
                                <ol className="list-decimal list-inside space-y-2">
                                    <li>Откройте этот сайт в <strong>Chrome</strong>.</li>
                                    <li>Нажмите меню <strong>(три точки)</strong> в углу.</li>
                                    <li>Выберите <strong>"Установить приложение"</strong> или "Добавить на гл. экран".</li>
                                </ol>
                            </div>

                            {showInstallButton && (
                                <div className="text-center pt-2">
                                    <button 
                                        onClick={handleInstallClick}
                                        className="bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 px-6 rounded-full shadow-lg animate-pulse"
                                    >
                                        Установить сейчас
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="space-y-4">
                            <p>Чтобы разместить приложение в интернете бесплатно (например, на Vercel или Netlify):</p>
                            
                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Globe className="w-4 h-4 text-blue-400"/> Инструкция (Vercel/Netlify)</h4>
                                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                                    <li>Скачайте исходный код этого проекта.</li>
                                    <li>Создайте репозиторий на <strong>GitHub</strong> и загрузите туда код.</li>
                                    <li>Зарегистрируйтесь на <a href="https://vercel.com" target="_blank" rel="noreferrer" className="text-gold-500 hover:underline">Vercel</a> или <a href="https://netlify.com" target="_blank" rel="noreferrer" className="text-gold-500 hover:underline">Netlify</a>.</li>
                                    <li>Нажмите <strong>"New Project"</strong> и выберите ваш репозиторий.</li>
                                    <li>Сервис автоматически определит настройки сборки. Нажмите <strong>Deploy</strong>.</li>
                                </ol>
                            </div>

                            <div className="bg-gray-800/50 p-4 rounded border border-gray-700">
                                <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Rocket className="w-4 h-4 text-red-400"/> Важно: API Ключ</h4>
                                <p className="mb-2">Для работы AI функций (Gemini) нужен ключ. Без него генераторы не будут работать.</p>
                                <ul className="list-disc list-inside space-y-1 text-gray-300">
                                    <li>В настройках проекта на Vercel/Netlify найдите раздел <strong>"Environment Variables"</strong>.</li>
                                    <li>Добавьте переменную с именем <code>API_KEY</code>.</li>
                                    <li>Вставьте ваш ключ от Google Gemini API в значение.</li>
                                    <li>Пересоберите проект (Redeploy).</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Sidebar Navigation */}
      <nav className="w-20 md:w-64 bg-dnd-dark border-r border-gray-800 flex flex-col justify-between shrink-0 z-10">
        <div>
          <div className="p-4 md:p-6 flex items-center gap-3 border-b border-gray-800">
            <div className="w-8 h-8 bg-gold-600 rounded-full flex items-center justify-center text-black font-bold font-serif text-xl">
              D
            </div>
            <span className="hidden md:block font-serif font-bold text-gold-500 text-lg tracking-wide">
              DM Codex
            </span>
          </div>

          <div className="p-2 space-y-1 mt-4 overflow-y-auto max-h-[calc(100vh-240px)] custom-scrollbar">
            <NavButton 
              active={activeTab === Tab.DASHBOARD} 
              onClick={() => setActiveTab(Tab.DASHBOARD)} 
              icon={<LayoutDashboard />} 
              label="Главная" 
            />
             <NavButton 
              active={activeTab === Tab.LOCATION} 
              onClick={() => setActiveTab(Tab.LOCATION)} 
              icon={<MapPin />} 
              label="Локация" 
            />
            <NavButton 
              active={activeTab === Tab.PARTY} 
              onClick={() => setActiveTab(Tab.PARTY)} 
              icon={<Users />} 
              label="Герои" 
            />
            <NavButton 
              active={activeTab === Tab.COMBAT} 
              onClick={() => setActiveTab(Tab.COMBAT)} 
              icon={<Swords />} 
              label="Бой" 
            />
            <NavButton 
              active={activeTab === Tab.NOTES} 
              onClick={() => setActiveTab(Tab.NOTES)} 
              icon={<BookOpen />} 
              label="Журнал" 
            />
             <NavButton 
              active={activeTab === Tab.SOUNDS} 
              onClick={() => setActiveTab(Tab.SOUNDS)} 
              icon={<Music />} 
              label="Атмосфера" 
            />
            <NavButton 
              active={activeTab === Tab.GENERATORS} 
              onClick={() => setActiveTab(Tab.GENERATORS)} 
              icon={<BrainCircuit />} 
              label="AI Инструменты" 
            />
            <NavButton 
              active={activeTab === Tab.SCREEN} 
              onClick={() => setActiveTab(Tab.SCREEN)} 
              icon={<ScrollText />} 
              label="Ширма" 
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="border-t border-gray-800 bg-gray-900/50">
           {/* Install / Help Button */}
           <div className="p-2">
                <button 
                    onClick={() => { setHelpSection('install'); setShowHelpModal(true); }}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 text-sm ${showInstallButton ? 'bg-blue-900/30 text-blue-200 border border-blue-800 animate-pulse' : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'}`}
                >
                    <span className="flex items-center justify-center">{showInstallButton ? <Download className="w-5 h-5"/> : <HelpCircle className="w-5 h-5"/>}</span>
                    <span className="hidden md:block font-medium">{showInstallButton ? 'Установить' : 'Справка'}</span>
                </button>
           </div>

           {/* Time Tracker */}
           <div className="p-4 pt-2">
              <div 
                onClick={() => setIsDay(!isDay)}
                className="cursor-pointer flex items-center gap-3 p-2 rounded hover:bg-gray-800 transition-colors"
              >
                {isDay ? <Sun className="text-yellow-500 w-6 h-6" /> : <Moon className="text-blue-400 w-6 h-6" />}
                <div className="hidden md:block">
                    <div className="text-xs text-gray-500 uppercase">Мировое время</div>
                    <div className="font-bold">{isDay ? 'День' : 'Ночь'}</div>
                </div>
              </div>
           </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {renderContent()}
        </div>

        {/* Bottom Log / Dice Tray Area */}
        <div className="h-48 border-t border-gray-800 bg-dnd-dark p-4 flex gap-4 shrink-0">
           {/* Log */}
           <div className="flex-1 overflow-y-auto font-mono text-xs text-gray-400 space-y-1 relative group">
              <div className="text-xs font-bold text-gray-600 uppercase mb-2 sticky top-0 bg-dnd-dark py-1 flex justify-between items-center border-b border-gray-800">
                  <span>Лог сессии ({logs.length})</span>
                  <div className="flex items-center gap-2">
                    <button 
                        onClick={exportLogToJournal}
                        className="text-gray-500 hover:text-green-400 transition-colors p-1 flex items-center gap-1"
                        title="Сохранить лог как заметку в Журнал"
                    >
                        <Save className="w-3 h-3" />
                    </button>
                    <button 
                        onClick={clearLogs}
                        className="text-gray-500 hover:text-red-400 transition-colors p-1"
                        title="Очистить лог"
                    >
                        <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
              </div>
              {logs.length === 0 && (
                  <div className="text-center text-gray-700 italic mt-4">История пуста</div>
              )}
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
           <div className="w-72 hidden md:block">
              <DiceRoller addLog={addLog} />
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
    <span className="hidden md:block font-medium">{label}</span>
  </button>
);

export default App;
