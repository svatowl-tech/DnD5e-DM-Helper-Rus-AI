
import React, { useEffect, useState, useRef } from 'react';
import { Combatant, EntityType, PartyMember, CampaignSettings, FullQuest, LogEntry, Note } from '../types';
import { Sword, BrainCircuit, Users, Settings, Play, StopCircle, AlertTriangle, Eye, Target, Zap, MapPin, ScrollText, Key, Image as ImageIcon, Download, Upload, Database, FileJson, Edit2, Trash2, Plus, Save, X, Clock } from 'lucide-react';
import SessionWizard from './SessionWizard';
import { getCampaignMode } from '../services/polzaService';
import { getAllImagesFromDB, saveImageToDB } from '../services/db';
import DataManager from './DataManager';

interface DashboardProps {
    onChangeTab: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeTab }) => {
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    const [party, setParty] = useState<PartyMember[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [quests, setQuests] = useState<FullQuest[]>([]);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    
    // Campaign Settings State
    const [settings, setSettings] = useState<CampaignSettings>({
        worldName: 'Фаэрун',
        tone: 'Героическое фэнтези',
        partyLevel: 1,
        activeQuestsSummary: ''
    });

    const [isSessionActive, setIsSessionActive] = useState(false);
    const [showSessionWizard, setShowSessionWizard] = useState(false);
    const [wizardType, setWizardType] = useState<'start' | 'end'>('start');
    const [showDataManager, setShowDataManager] = useState(false);
    
    // Log Editor State
    const [showLogEditor, setShowLogEditor] = useState(false);
    const [newLogText, setNewLogText] = useState('');
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Load initial data
        loadDashboardData();

        // Auto-detect session active by checking for recent logs
        const savedLogs = localStorage.getItem('dmc_session_logs');
        if (savedLogs) {
            const parsed = JSON.parse(savedLogs);
            if (parsed.length > 0 && Date.now() - parsed[0].timestamp < 3600000 * 4) { // 4 hours
                setIsSessionActive(true);
            }
        }

        // Listen for updates
        const handleUpdate = () => loadDashboardData();
        window.addEventListener('dmc-update-combat', handleUpdate);
        window.addEventListener('dmc-update-party', handleUpdate);
        window.addEventListener('dmc-update-quests', handleUpdate);
        window.addEventListener('dmc-update-notes', handleUpdate);
        
        return () => {
            window.removeEventListener('dmc-update-combat', handleUpdate);
            window.removeEventListener('dmc-update-party', handleUpdate);
            window.removeEventListener('dmc-update-quests', handleUpdate);
            window.removeEventListener('dmc-update-notes', handleUpdate);
        };
    }, []);

    const loadDashboardData = () => {
        try {
            setCombatants(JSON.parse(localStorage.getItem('dmc_combatants') || '[]'));
            setParty(JSON.parse(localStorage.getItem('dmc_party') || '[]'));
            setNotes(JSON.parse(localStorage.getItem('dmc_notes') || '[]'));
            setQuests(JSON.parse(localStorage.getItem('dmc_quests') || '[]'));
            setLogs(JSON.parse(localStorage.getItem('dmc_session_logs') || '[]'));
            
            const savedSettings = localStorage.getItem('dmc_campaign_settings');
            if (savedSettings) setSettings(JSON.parse(savedSettings));
        } catch (e) {
            console.error("Error loading dashboard data", e);
        }
    };

    const handleSettingChange = (key: keyof CampaignSettings, value: string | number) => {
        const newSettings = { ...settings, [key]: value };
        setSettings(newSettings);
        localStorage.setItem('dmc_campaign_settings', JSON.stringify(newSettings));
    };

    // Backup & Restore
    const handleBackup = () => {
        const backupData: any = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('dmc_')) {
                backupData[key] = localStorage.getItem(key);
            }
        }
        const blob = new Blob([JSON.stringify(backupData)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dmc-backup-${new Date().toISOString().slice(0,10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                Object.keys(data).forEach(key => {
                    if (key.startsWith('dmc_')) {
                        localStorage.setItem(key, data[key]);
                    }
                });
                alert('Данные восстановлены! Страница будет перезагружена.');
                window.location.reload();
            } catch (err) {
                alert('Ошибка чтения файла бэкапа');
            }
        };
        reader.readAsText(file);
    };

    // Log Management
    const addLog = (entry: LogEntry) => {
        const newLogs = [entry, ...logs];
        setLogs(newLogs);
        localStorage.setItem('dmc_session_logs', JSON.stringify(newLogs));
    };

    const handleAddManualLog = () => {
        if (!newLogText.trim()) return;
        const entry: LogEntry = {
            id: Date.now().toString(),
            timestamp: Date.now(),
            text: newLogText,
            type: 'story' // Manual entries are usually story notes
        };
        addLog(entry);
        setNewLogText('');
    };

    const handleDeleteLog = (id: string) => {
        if (!window.confirm('Удалить эту запись?')) return;
        const newLogs = logs.filter(l => l.id !== id);
        setLogs(newLogs);
        localStorage.setItem('dmc_session_logs', JSON.stringify(newLogs));
    };

    const handleStartEditLog = (log: LogEntry) => {
        setEditingLogId(log.id);
        setEditText(log.text);
    };

    const handleSaveLogEdit = () => {
        if (!editingLogId) return;
        const newLogs = logs.map(l => l.id === editingLogId ? { ...l, text: editText } : l);
        setLogs(newLogs);
        localStorage.setItem('dmc_session_logs', JSON.stringify(newLogs));
        setEditingLogId(null);
        setEditText('');
    };

    const handleClearLogs = () => {
        if (window.confirm('Очистить всю летопись текущей сессии? Это действие необратимо.')) {
            setLogs([]);
            localStorage.setItem('dmc_session_logs', '[]');
        }
    };

    // Quick Stats
    const activePlayers = party.filter(p => p.active);
    const activeQuests = quests.filter(q => q.status === 'active' || q.status === 'received');
    const recentLogs = logs.slice(0, 3);
    const campaignMode = getCampaignMode();

    return (
        <div className="h-full flex flex-col space-y-6 overflow-y-auto custom-scrollbar p-2">
            
            {showSessionWizard && (
                <SessionWizard 
                    isOpen={showSessionWizard}
                    onClose={() => setShowSessionWizard(false)}
                    type={wizardType}
                    logs={logs}
                    party={party}
                    combatants={combatants}
                    onAddLog={addLog}
                    onSaveNote={(note) => {
                         const currentNotes = JSON.parse(localStorage.getItem('dmc_notes') || '[]');
                         localStorage.setItem('dmc_notes', JSON.stringify([note, ...currentNotes]));
                         setNotes([note, ...notes]);
                    }}
                    onClearCombat={() => {
                        // Keep players, remove monsters
                        const onlyPlayers = combatants.filter(c => c.type === EntityType.PLAYER);
                        localStorage.setItem('dmc_combatants', JSON.stringify(onlyPlayers));
                        setCombatants(onlyPlayers);
                        localStorage.removeItem('dmc_combat_active_id');
                    }}
                    onUpdateParty={(updated) => {
                         localStorage.setItem('dmc_party', JSON.stringify(updated));
                         setParty(updated);
                    }}
                    activeQuests={activeQuests}
                />
            )}

            {showDataManager && (
                <DataManager onClose={() => setShowDataManager(false)} />
            )}

            {/* Log Editor Modal */}
            {showLogEditor && (
                <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-dnd-card border-2 border-blue-500/50 w-full max-w-2xl h-[85vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                            <h3 className="text-xl font-serif font-bold text-blue-400 flex items-center gap-2">
                                <ScrollText className="w-5 h-5"/> Редактор Летописи
                            </h3>
                            <div className="flex gap-2">
                                <button onClick={handleClearLogs} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-900/20 rounded" title="Очистить всё">
                                    <Trash2 className="w-5 h-5"/>
                                </button>
                                <button onClick={() => setShowLogEditor(false)} className="text-gray-400 hover:text-white p-2">
                                    <X className="w-6 h-6"/>
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-4 border-b border-gray-700 bg-gray-800/50 shrink-0">
                            <div className="flex gap-2">
                                <input 
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white outline-none focus:border-blue-500"
                                    placeholder="Добавить запись..."
                                    value={newLogText}
                                    onChange={e => setNewLogText(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddManualLog()}
                                />
                                <button onClick={handleAddManualLog} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold">
                                    <Plus className="w-4 h-4"/>
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                            {logs.length === 0 && <p className="text-center text-gray-500 italic py-10">Летопись пуста.</p>}
                            {logs.map(log => (
                                <div key={log.id} className="group flex gap-3 p-3 bg-gray-900/50 border border-gray-800 hover:border-gray-600 rounded-lg transition-colors">
                                    <div className="text-xs text-gray-500 font-mono w-16 pt-1 shrink-0">
                                        {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        {editingLogId === log.id ? (
                                            <div className="flex flex-col gap-2">
                                                <textarea 
                                                    className="w-full bg-black/30 border border-blue-500 rounded p-2 text-sm text-white resize-y min-h-[60px] outline-none"
                                                    value={editText}
                                                    onChange={e => setEditText(e.target.value)}
                                                    autoFocus
                                                />
                                                <div className="flex gap-2 justify-end">
                                                    <button onClick={() => setEditingLogId(null)} className="text-xs text-gray-400 hover:text-white px-2 py-1">Отмена</button>
                                                    <button onClick={handleSaveLogEdit} className="text-xs bg-green-700 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center gap-1">
                                                        <Save className="w-3 h-3"/> Сохранить
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-300 whitespace-pre-wrap" onClick={() => handleStartEditLog(log)}>
                                                {log.text}
                                            </div>
                                        )}
                                        {editingLogId !== log.id && (
                                            <div className="flex gap-2 mt-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                                                <button onClick={() => handleStartEditLog(log)} className="text-blue-400 hover:text-white p-1 rounded hover:bg-gray-700" title="Редактировать">
                                                    <Edit2 className="w-3 h-3"/>
                                                </button>
                                                <button onClick={() => handleDeleteLog(log.id)} className="text-red-400 hover:text-white p-1 rounded hover:bg-gray-700" title="Удалить">
                                                    <Trash2 className="w-3 h-3"/>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Header Status Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Session Control */}
                <div className="md:col-span-2 bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-lg border border-gray-700 shadow-lg flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-white tracking-wide">
                                {isSessionActive ? 'Сессия Идёт' : 'Подготовка'}
                            </h2>
                            <p className="text-xs text-gray-400 uppercase tracking-widest">{new Date().toLocaleDateString()}</p>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-bold ${isSessionActive ? 'bg-green-900 text-green-400 animate-pulse' : 'bg-yellow-900 text-yellow-500'}`}>
                            {isSessionActive ? 'LIVE' : 'PREP'}
                        </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4">
                        {!isSessionActive ? (
                            <button 
                                onClick={() => { setWizardType('start'); setShowSessionWizard(true); setIsSessionActive(true); }}
                                className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                            >
                                <Play className="w-5 h-5"/> Начать Игру
                            </button>
                        ) : (
                            <button 
                                onClick={() => { setWizardType('end'); setShowSessionWizard(true); setIsSessionActive(false); }}
                                className="flex-1 bg-red-900 hover:bg-red-800 text-white font-bold py-2 rounded flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"
                            >
                                <StopCircle className="w-5 h-5"/> Завершить
                            </button>
                        )}
                        <button 
                            onClick={() => window.dispatchEvent(new CustomEvent('dmc-open-settings'))}
                            className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded shadow-lg"
                            title="Настройки"
                        >
                            <Settings className="w-5 h-5"/>
                        </button>
                    </div>
                </div>

                {/* Quick Stats Cards */}
                <div className="bg-dnd-card p-4 rounded-lg border border-gray-700 flex flex-col justify-between">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-gray-400 text-sm uppercase">Герои</h3>
                         <Users className="w-4 h-4 text-blue-400"/>
                     </div>
                     <div className="text-3xl font-bold text-white">{activePlayers.length}</div>
                     <div className="text-xs text-gray-500 mt-1">Средний уровень: {activePlayers.length ? Math.round(activePlayers.reduce((a,b)=>a+b.level,0)/activePlayers.length) : 0}</div>
                </div>

                <div className="bg-dnd-card p-4 rounded-lg border border-gray-700 flex flex-col justify-between">
                     <div className="flex justify-between items-center mb-2">
                         <h3 className="font-bold text-gray-400 text-sm uppercase">Квесты</h3>
                         <ScrollText className="w-4 h-4 text-gold-500"/>
                     </div>
                     <div className="text-3xl font-bold text-white">{activeQuests.length}</div>
                     <div className="text-xs text-gray-500 mt-1">Активных задач</div>
                </div>
            </div>

            {/* Main Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Column 1: Campaign Context */}
                <div className="space-y-4">
                    <div className="bg-dnd-card p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-3 text-gold-500 border-b border-gray-700 pb-2">
                            <MapPin className="w-5 h-5"/>
                            <h3 className="font-bold uppercase text-sm">Контекст Кампании</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Название Мира</label>
                                <input 
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gold-500 outline-none"
                                    value={settings.worldName}
                                    onChange={(e) => handleSettingChange('worldName', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Тон игры</label>
                                <select 
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gold-500 outline-none"
                                    value={settings.tone}
                                    onChange={(e) => handleSettingChange('tone', e.target.value)}
                                >
                                    <option>Героическое фэнтези</option>
                                    <option>Темное фэнтези</option>
                                    <option>Хоррор</option>
                                    <option>Политическая интрига</option>
                                    <option>Комедия</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 uppercase font-bold">Текущая цель (для AI)</label>
                                <textarea 
                                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white h-20 resize-none focus:border-gold-500 outline-none"
                                    placeholder="Краткое описание текущей арки для контекста генераторов..."
                                    value={settings.activeQuestsSummary || ''}
                                    onChange={(e) => handleSettingChange('activeQuestsSummary', e.target.value)}
                                />
                            </div>
                            
                            {campaignMode === 'echoes' && (
                                <div className="p-2 bg-purple-900/20 border border-purple-500/30 rounded text-xs text-purple-200">
                                    <span className="font-bold block mb-1">Режим Echoes:</span>
                                    Включен расширенный контекст мультивселенной. Генераторы будут создавать аномалии и техно-магию.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-dnd-card p-4 rounded-lg border border-gray-700">
                         <div className="flex items-center gap-2 mb-3 text-red-400 border-b border-gray-700 pb-2">
                            <Target className="w-5 h-5"/>
                            <h3 className="font-bold uppercase text-sm">Активные Угрозы</h3>
                        </div>
                        {combatants.filter(c => c.type === EntityType.MONSTER).length > 0 ? (
                            <div className="space-y-2">
                                {combatants.filter(c => c.type === EntityType.MONSTER).slice(0, 3).map(m => (
                                    <div key={m.id} className="flex justify-between items-center bg-gray-900/50 p-2 rounded border border-gray-800">
                                        <span className="text-sm font-bold text-gray-200">{m.name}</span>
                                        <span className="text-xs text-red-500 font-mono">{m.hp} HP</span>
                                    </div>
                                ))}
                                {combatants.filter(c => c.type === EntityType.MONSTER).length > 3 && (
                                    <div className="text-center text-xs text-gray-500 italic">+ еще {combatants.filter(c => c.type === EntityType.MONSTER).length - 3}</div>
                                )}
                                <button 
                                    onClick={() => onChangeTab('combat')}
                                    className="w-full mt-2 bg-red-900/30 hover:bg-red-900/50 text-red-200 py-1.5 rounded text-xs font-bold border border-red-800 transition-colors"
                                >
                                    Перейти к Бою
                                </button>
                            </div>
                        ) : (
                            <div className="text-center text-gray-500 py-4 text-sm">Нет активного боя</div>
                        )}
                    </div>
                </div>

                {/* Column 2: Recent Logs & Tools */}
                <div className="space-y-4">
                    <div className="bg-dnd-card p-4 rounded-lg border border-gray-700 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
                            <div className="flex items-center gap-2 text-blue-400">
                                <BrainCircuit className="w-5 h-5"/>
                                <h3 className="font-bold uppercase text-sm">Летопись</h3>
                            </div>
                            <button onClick={() => setShowLogEditor(true)} className="text-gray-400 hover:text-white p-1 bg-gray-800 rounded hover:bg-gray-700" title="Редактировать">
                                <Edit2 className="w-4 h-4"/>
                            </button>
                        </div>
                        <div className="flex-1 space-y-2 overflow-hidden">
                            {recentLogs.length > 0 ? recentLogs.map(log => (
                                <div key={log.id} className="text-xs text-gray-300 border-l-2 border-gray-600 pl-2 py-1">
                                    <span className="text-gray-500 text-[10px] block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                                    {log.text}
                                </div>
                            )) : <div className="text-gray-500 text-sm text-center py-4">Журнал пуст</div>}
                        </div>
                        <button 
                            onClick={() => onChangeTab('notes')}
                            className="w-full mt-3 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded text-xs font-bold"
                        >
                            Открыть Журнал
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button 
                            onClick={() => onChangeTab('generators')}
                            className="bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-800 p-3 rounded flex flex-col items-center justify-center gap-2 text-indigo-200 transition-colors"
                        >
                            <BrainCircuit className="w-6 h-6"/>
                            <span className="text-xs font-bold">Генераторы</span>
                        </button>
                         <button 
                            onClick={() => onChangeTab('screen')}
                            className="bg-gray-800 hover:bg-gray-700 border border-gray-600 p-3 rounded flex flex-col items-center justify-center gap-2 text-gray-300 transition-colors"
                        >
                            <Eye className="w-6 h-6"/>
                            <span className="text-xs font-bold">Ширма</span>
                        </button>
                    </div>
                </div>

                {/* Column 3: Data Management */}
                <div className="space-y-4">
                     <div className="bg-dnd-card p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-3 text-green-400 border-b border-gray-700 pb-2">
                            <Database className="w-5 h-5"/>
                            <h3 className="font-bold uppercase text-sm">Данные & Бэкап</h3>
                        </div>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => setShowDataManager(true)}
                                className="w-full bg-blue-900/40 hover:bg-blue-900/60 text-blue-200 border border-blue-800 py-3 rounded text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                            >
                                <FileJson className="w-4 h-4"/> Управление Данными (JSON)
                            </button>

                            <div className="grid grid-cols-2 gap-2">
                                <button 
                                    onClick={handleBackup}
                                    className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 border border-gray-600"
                                >
                                    <Download className="w-4 h-4"/> Скачать
                                </button>
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-gray-800 hover:bg-gray-700 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 border border-gray-600"
                                >
                                    <Upload className="w-4 h-4"/> Загрузить
                                </button>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".json" 
                                    onChange={handleRestore}
                                />
                            </div>
                            
                            <p className="text-[10px] text-gray-500 text-center mt-2">
                                Регулярно делайте бэкапы. Данные хранятся в браузере.
                            </p>
                        </div>
                    </div>

                    <div className="bg-dnd-card p-4 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-2 mb-3 text-gold-500 border-b border-gray-700 pb-2">
                            <Zap className="w-5 h-5"/>
                            <h3 className="font-bold uppercase text-sm">Быстрые Действия</h3>
                        </div>
                        <div className="space-y-2">
                             <button 
                                onClick={() => window.dispatchEvent(new CustomEvent('dmc-add-xp', { detail: { amount: 100, reason: 'Бонус' } }))}
                                className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 flex justify-between group"
                             >
                                 <span>Раздать 100 XP</span>
                                 <span className="opacity-0 group-hover:opacity-100 text-gold-500">+</span>
                             </button>
                             <button 
                                onClick={() => {
                                    const event = new CustomEvent('dmc-add-note', { 
                                        detail: { title: 'Быстрая заметка', content: '', tags: ['quick'], type: 'other', date: new Date().toISOString() } 
                                    });
                                    window.dispatchEvent(event);
                                    onChangeTab('notes');
                                }}
                                className="w-full text-left px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded text-xs text-gray-300 flex justify-between group"
                             >
                                 <span>Создать заметку</span>
                                 <span className="opacity-0 group-hover:opacity-100 text-green-500">+</span>
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
