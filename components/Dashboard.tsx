
import React, { useEffect, useState, useRef } from 'react';
import { Combatant, EntityType, PartyMember, CampaignSettings, FullQuest, LogEntry, Note } from '../types';
import { Sword, BrainCircuit, Users, Settings, Play, StopCircle, AlertTriangle, Eye, Target, Zap, MapPin, ScrollText, Key, Image as ImageIcon, Download, Upload, Database, FileJson } from 'lucide-react';
import SessionWizard from './SessionWizard';
import { getCampaignMode } from '../services/polzaService';
import { getAllImagesFromDB, saveImageToDB } from '../services/db';

interface DashboardProps {
    onChangeTab: (tab: any) => void;
}

// All keys used in localStorage for the app
const STORAGE_KEYS = [
    'dmc_campaign_settings',
    'dmc_session_logs',
    'dmc_party',
    'dmc_combatants',
    'dmc_notes',
    'dmc_quests',
    'dmc_npcs',
    'dmc_gallery',
    'dmc_local_bestiary',
    'dmc_playlists',
    'dmc_active_location',
    'dmc_active_region_id',
    'dmc_focus',
    'dmc_polza_api_key',
    'dmc_ai_model',
    'dmc_ai_image_model',
    'dmc_campaign_mode',
    'dmc_active_travel',
    'dmc_combat_round',
    'dmc_combat_turn',
    'dmc_combat_active_id',
    'dmc_lore',
    'dmc_recent_events'
];

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
    });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // DM Focus (Mental Load)
    const [dmFocus, setDmFocus] = useState(() => localStorage.getItem('dmc_focus') || '');

    // Session Wizard State
    const [wizardType, setWizardType] = useState<'start' | 'end' | null>(null);
    
    // Import ref
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    
    const currentMode = getCampaignMode();

    useEffect(() => {
        // Read all data safely with fallbacks to empty arrays
        const savedCombatants = localStorage.getItem('dmc_combatants');
        if (savedCombatants) {
            try {
                const parsed = JSON.parse(savedCombatants);
                if (Array.isArray(parsed)) setCombatants(parsed);
                else setCombatants([]);
            } catch (e) { console.error("Failed to load combatants", e); setCombatants([]); }
        }

        const savedParty = localStorage.getItem('dmc_party');
        if (savedParty) {
            try {
                const parsed = JSON.parse(savedParty);
                if (Array.isArray(parsed)) setParty(parsed);
                else setParty([]);
            } catch (e) { console.error("Failed to load party", e); setParty([]); }
        }

        const savedNotes = localStorage.getItem('dmc_notes');
        if (savedNotes) {
            try {
                const parsed = JSON.parse(savedNotes);
                if (Array.isArray(parsed)) setNotes(parsed);
                else setNotes([]);
            } catch (e) { console.error("Failed to load notes", e); setNotes([]); }
        }

        const savedQuests = localStorage.getItem('dmc_quests');
        if (savedQuests) {
            try {
                const parsed = JSON.parse(savedQuests);
                if (Array.isArray(parsed)) setQuests(parsed);
                else setQuests([]);
            } catch (e) { console.error("Failed to load quests", e); setQuests([]); }
        }

        const savedLogs = localStorage.getItem('dmc_session_logs');
        if (savedLogs) {
            try {
                const parsed = JSON.parse(savedLogs);
                if (Array.isArray(parsed)) setLogs(parsed);
                else setLogs([]);
            } catch (e) { console.error("Failed to load logs", e); setLogs([]); }
        }

        const savedSettings = localStorage.getItem('dmc_campaign_settings');
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings);
                if (parsed && typeof parsed === 'object') setSettings(parsed);
            } catch (e) { console.error("Failed to load settings", e); }
        }
    }, []);

    // Save DM Focus automatically
    useEffect(() => {
        localStorage.setItem('dmc_focus', dmFocus);
    }, [dmFocus]);

    const saveSettings = () => {
        localStorage.setItem('dmc_campaign_settings', JSON.stringify(settings));
        setIsSettingsOpen(false);
    };

    const openGlobalSettings = () => {
        window.dispatchEvent(new CustomEvent('dmc-open-settings'));
    };

    const addLog = (entry: LogEntry) => {
        const newLogs = [entry, ...(logs || [])];
        setLogs(newLogs);
        localStorage.setItem('dmc_session_logs', JSON.stringify(newLogs));
    };

    const saveNote = (note: Note) => {
        const newNotes = [note, ...(notes || [])];
        setNotes(newNotes);
        localStorage.setItem('dmc_notes', JSON.stringify(newNotes));
    };

    const clearCombat = () => {
        const players = (combatants || []).filter(c => c.type === EntityType.PLAYER);
        setCombatants(players);
        localStorage.setItem('dmc_combatants', JSON.stringify(players));
    };

    const updateParty = (updatedParty: PartyMember[]) => {
        setParty(updatedParty);
        localStorage.setItem('dmc_party', JSON.stringify(updatedParty));
    };

    // --- IMPORT / EXPORT LOGIC ---

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const exportData: Record<string, any> = {
                meta: {
                    version: 2,
                    timestamp: new Date().toISOString(),
                    app: "DM Codex"
                },
                data: {},
                images: []
            };

            // 1. Export LocalStorage Data
            STORAGE_KEYS.forEach(key => {
                const value = localStorage.getItem(key);
                if (value !== null) {
                    exportData.data[key] = value;
                }
            });

            // 2. Export IndexedDB Images
            try {
                const images = await getAllImagesFromDB();
                exportData.images = images;
            } catch (e) {
                console.error("Failed to export images from DB", e);
                // Continue without images rather than failing completely
            }

            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            const dateStr = new Date().toISOString().split('T')[0];
            link.download = `dm-codex-backup-${dateStr}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e: any) {
            alert("Ошибка при экспорте: " + e.message);
        } finally {
            setIsExporting(false);
        }
    };

    const handleImportClick = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const content = event.target?.result as string;
                const parsed = JSON.parse(content);

                if (!parsed.data) {
                    throw new Error("Неверный формат файла");
                }

                if (window.confirm(`Найден бэкап от ${new Date(parsed.meta?.timestamp).toLocaleString()}. \nВ файле также ${parsed.images?.length || 0} изображений.\n\nВНИМАНИЕ: Текущие данные будут полностью заменены! Продолжить?`)) {
                    
                    // 1. Restore LocalStorage
                    Object.keys(parsed.data).forEach(key => {
                        // Only restore known keys to prevent pollution
                        if (STORAGE_KEYS.includes(key)) {
                            localStorage.setItem(key, parsed.data[key]);
                        }
                    });

                    // 2. Restore IndexedDB Images
                    if (parsed.images && Array.isArray(parsed.images)) {
                        try {
                            for (const img of parsed.images) {
                                await saveImageToDB(img);
                            }
                        } catch (dbError) {
                            console.error("Error restoring images", dbError);
                            alert("Данные восстановлены, но произошла ошибка при импорте изображений.");
                        }
                    }

                    alert("Данные успешно импортированы. Приложение будет перезагружено.");
                    window.location.reload();
                }
            } catch (err) {
                alert("Ошибка при чтении файла: " + err);
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    const activeQuests = (quests || []).filter(q => q.status === 'active');
    const monsters = (combatants || []).filter(c => c.type === EntityType.MONSTER);
    const displayParty = (party || []).filter(p => p.active);

    return (
        <div className="space-y-6 h-full flex flex-col">
            {/* Session Wizard Modal */}
            <SessionWizard 
                isOpen={!!wizardType}
                onClose={() => setWizardType(null)}
                type={wizardType || 'start'}
                logs={logs || []}
                party={party || []}
                combatants={combatants || []}
                onAddLog={addLog}
                onSaveNote={saveNote}
                onClearCombat={clearCombat}
                onUpdateParty={updateParty}
                activeQuests={activeQuests}
            />

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-dnd-card to-dnd-dark p-6 rounded-lg border border-gray-700 shadow-lg shrink-0">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-3xl font-serif font-bold text-gold-500">Мастер Подземелий</h1>
                        {currentMode === 'echoes' && (
                            <span className="bg-purple-900/50 text-purple-200 text-[10px] uppercase px-2 py-0.5 rounded border border-purple-500/50 font-bold tracking-wider">
                                Echoes
                            </span>
                        )}
                    </div>
                    <div className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                        <span>{settings.worldName}</span> • 
                        <span>{settings.tone}</span> • 
                        <span>Группа {settings.partyLevel} ур.</span>
                        <button onClick={() => setIsSettingsOpen(!isSettingsOpen)} className="text-gray-500 hover:text-white"><Settings className="w-4 h-4"/></button>
                    </div>
                    
                    {/* Inline Settings Editor */}
                    {isSettingsOpen && (
                        <div className="mt-3 bg-gray-900 p-3 rounded border border-gray-600 animate-in fade-in slide-in-from-top-2">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                                <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white" placeholder="Мир" value={settings.worldName} onChange={e => setSettings({...settings, worldName: e.target.value})} />
                                <input className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white" placeholder="Тон" value={settings.tone} onChange={e => setSettings({...settings, tone: e.target.value})} />
                                <input type="number" className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white" placeholder="Уровень" value={settings.partyLevel} onChange={e => setSettings({...settings, partyLevel: Number(e.target.value)})} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={saveSettings} className="flex-1 bg-gold-600 text-black text-xs font-bold py-1 rounded">Сохранить настройки</button>
                                <button onClick={openGlobalSettings} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-xs font-bold py-1 rounded border border-gray-500">⚙️ Настройки AI / Режим</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-3">
                    <button 
                        onClick={() => setWizardType('start')}
                        className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95"
                    >
                        <Play className="w-5 h-5"/> Старт Сессии
                    </button>
                    <button 
                        onClick={() => setWizardType('end')}
                        className="bg-gray-800 hover:bg-red-900/50 text-gray-300 hover:text-red-200 px-6 py-3 rounded-lg font-bold flex items-center gap-2 border border-gray-700 hover:border-red-500 transition-colors"
                    >
                        <StopCircle className="w-5 h-5"/> Завершить
                    </button>
                </div>
            </div>

            {/* Main Dashboard Grid - Rebalanced */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
                
                {/* Col 1: Live Status */}
                <div className="space-y-4 flex flex-col">
                    {/* Combat Status */}
                    <div className={`p-4 rounded-lg border shadow-md ${monsters.length > 0 ? 'bg-red-950/30 border-red-900' : 'bg-dnd-card border-gray-700'}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-sm">
                                <Sword className="w-4 h-4"/> Угроза
                            </div>
                            {monsters.length > 0 && <button onClick={() => onChangeTab('combat')} className="text-xs text-red-300 hover:underline bg-red-900/20 px-2 py-1 rounded">В бой &rarr;</button>}
                        </div>
                        {monsters.length > 0 ? (
                            <div className="text-sm text-red-200">
                                <p className="font-bold text-2xl">{monsters.length} <span className="text-base font-normal text-red-400">врагов</span></p>
                                <p className="opacity-70 truncate mt-1 text-xs">{monsters.map(m => m.name).join(', ')}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 italic py-2">Горизонт чист. Бой не идет.</p>
                        )}
                    </div>

                    {/* Party Status */}
                    <div className="p-4 rounded-lg border border-gray-700 bg-dnd-card flex-1 shadow-md flex flex-col">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
                            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider text-sm">
                                <Users className="w-4 h-4"/> Группа
                            </div>
                            <button onClick={() => onChangeTab('party')} className="text-xs text-blue-300 hover:underline bg-blue-900/20 px-2 py-1 rounded">Упр. &rarr;</button>
                        </div>
                        <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1">
                            {displayParty.map(p => (
                                <div key={p.id} className="flex justify-between text-sm text-gray-300 bg-gray-800/50 p-2 rounded border border-gray-800">
                                    <span className="font-bold truncate">{p.name}</span>
                                    <div className="flex gap-3 text-xs text-gray-500 font-mono">
                                        <span title="HP"><span className="text-green-500">HP</span> {p.hp}/{p.maxHp}</span>
                                        <span title="AC"><span className="text-blue-400">AC</span> {p.ac}</span>
                                        <span title="Passive Perception"><span className="text-purple-400">PP</span> {p.passivePerception}</span>
                                    </div>
                                </div>
                            ))}
                            {displayParty.length === 0 && <p className="text-gray-500 text-sm italic text-center py-4">Группа не собрана.</p>}
                        </div>
                    </div>
                </div>

                {/* Col 2: Mental Load (Focus) */}
                <div className="flex flex-col h-full gap-4">
                    <div className="bg-indigo-950/20 border border-indigo-500/30 p-4 rounded-lg relative group flex-1 shadow-md flex flex-col">
                        <div className="flex items-center gap-2 mb-3 text-indigo-400 font-bold text-sm uppercase tracking-wider">
                            <Eye className="w-4 h-4"/> Фокус Мастера
                        </div>
                        <textarea 
                            className="w-full bg-transparent text-gray-300 resize-none outline-none flex-1 text-sm leading-relaxed placeholder-gray-600/50 custom-scrollbar"
                            placeholder="• Мотивация злодея?&#10;• Что происходит за кадром?&#10;• Таймер до взрыва?&#10;• Кого игроки забыли?"
                            value={dmFocus}
                            onChange={e => setDmFocus(e.target.value)}
                        />
                        <div className="absolute top-4 right-4 opacity-50 group-hover:opacity-100 transition-opacity">
                            <BrainCircuit className="w-5 h-5 text-indigo-500"/>
                        </div>
                        <p className="text-[10px] text-indigo-500/50 mt-2 text-right">Черновик сохраняется автоматически</p>
                    </div>
                </div>

                {/* Col 3: Quests & Location */}
                <div className="flex flex-col h-full gap-4">
                    {/* Active Quests */}
                    <div className="bg-dnd-card p-4 rounded-lg border border-gray-700 shadow-md flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-3 border-b border-gray-700 pb-2">
                            <h3 className="font-bold text-gold-500 uppercase tracking-wider text-sm flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4"/> Задачи
                            </h3>
                            <button onClick={() => onChangeTab('quests')} className="text-xs text-gold-600 hover:text-gold-400 bg-gold-900/20 px-2 py-1 rounded">Все &rarr;</button>
                        </div>
                        
                        <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar pr-1">
                            {activeQuests.length === 0 && (
                                <div className="text-center text-gray-500 py-8 italic text-sm">
                                    Нет активных квестов.<br/>Игроки отдыхают?
                                </div>
                            )}
                            {activeQuests.map(q => (
                                <div key={q.id} className="bg-gray-800 p-3 rounded border border-gray-700 hover:border-gold-500/50 transition-colors group">
                                    <h4 className="font-bold text-gray-200 text-sm group-hover:text-gold-400 transition-colors">{q.title}</h4>
                                    
                                    {/* Mini Objectives */}
                                    <div className="mt-2 space-y-1">
                                        {(q.objectives || []).filter(o => !o.completed).slice(0, 2).map(obj => (
                                            <div key={obj.id} className="flex items-start gap-2 text-xs text-gray-400">
                                                <div className="w-1.5 h-1.5 rounded-full border border-gray-500 mt-1 shrink-0"></div>
                                                <span>{obj.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Nav to Location */}
                    <button 
                        onClick={() => onChangeTab('location')}
                        className="p-4 bg-gray-800 border border-gray-700 hover:border-emerald-500 hover:bg-gray-750 rounded-lg transition-all group flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-emerald-900/30 p-2 rounded-full text-emerald-500 group-hover:text-emerald-400">
                                <MapPin className="w-5 h-5"/>
                            </div>
                            <div className="text-left">
                                <div className="font-bold text-gray-300 group-hover:text-white">Текущая Локация</div>
                                <div className="text-xs text-gray-500 group-hover:text-emerald-400">Перейти к описанию</div>
                            </div>
                        </div>
                        <Eye className="w-4 h-4 text-gray-600 group-hover:text-white"/>
                    </button>
                </div>
            </div>

            {/* Data Management Footer */}
            <div className="mt-auto pt-4 border-t border-gray-700">
                <div className="bg-gray-900/80 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3 border border-gray-800">
                    <div className="text-xs text-gray-400 flex items-center gap-2">
                        <Database className="w-4 h-4 text-gray-500"/>
                        <span>Управление данными (Full Backup)</span>
                        <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded border border-gray-700">Включает картинки и лор</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button 
                            onClick={handleExport}
                            disabled={isExporting}
                            className="flex-1 sm:flex-none bg-blue-900/30 hover:bg-blue-800 text-blue-200 px-4 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 border border-blue-800 transition-colors disabled:opacity-50"
                        >
                            <Download className="w-4 h-4"/> {isExporting ? 'Экспорт...' : 'Экспорт (Backup)'}
                        </button>
                        <button 
                            onClick={handleImportClick}
                            className="flex-1 sm:flex-none bg-gray-800 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 border border-gray-600 transition-colors"
                        >
                            <Upload className="w-4 h-4"/> Импорт
                        </button>
                        <input 
                            type="file" 
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept=".json"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
