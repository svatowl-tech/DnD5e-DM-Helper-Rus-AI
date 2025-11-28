
import React, { useState, useEffect } from 'react';
import { LogEntry, Note, PartyMember, FullQuest } from '../types';
import { Check, Save, X, Play, Users, ScrollText, Shield, Skull, Music, Heart, MapPin, Globe, Sparkles, Loader, PenTool } from 'lucide-react';
import { useAudio } from '../contexts/AudioContext';
import { generateStoryFromLog } from '../services/polzaService';

interface SessionWizardProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'start' | 'end';
    logs: LogEntry[];
    party: PartyMember[];
    combatants: any[];
    onAddLog: (entry: LogEntry) => void;
    onSaveNote: (note: Note) => void;
    onClearCombat: () => void;
    onUpdateParty: (updatedParty: PartyMember[]) => void;
    activeQuests: FullQuest[];
}

const SessionWizard: React.FC<SessionWizardProps> = ({ 
    isOpen, onClose, type, logs, party, combatants, onAddLog, onSaveNote, onClearCombat, onUpdateParty, activeQuests 
}) => {
    const [step, setStep] = useState(0);
    const { playPlaylist } = useAudio();
    
    // Start Session State
    const [selectedAtmosphere, setSelectedAtmosphere] = useState<string | null>(null);

    // End Session State
    const [sessionTitle, setSessionTitle] = useState(`Сессия ${new Date().toLocaleDateString()}`);
    const [xpEarned, setXpEarned] = useState(0);
    const [summary, setSummary] = useState('');
    const [worldChanges, setWorldChanges] = useState('');
    const [storyLoading, setStoryLoading] = useState(false);

    // Auto-generate summary when opening "End Session"
    useEffect(() => {
        if (isOpen && type === 'end') {
            generateAutoSummary();
        }
    }, [isOpen, type]);

    const generateAutoSummary = () => {
        // Extract unique events from logs
        const npcs = Array.from(new Set(
            logs.filter(l => l.text.includes('[NPC]')).map(l => l.text.replace('[NPC]', '').trim())
        ));
        
        // Prioritize explicit [Location] tags, fallback to atmosphere changes
        const locationLogs = logs.filter(l => l.text.includes('[Локация]'));
        let locations: string[] = [];
        
        if (locationLogs.length > 0) {
             locations = Array.from(new Set(locationLogs.map(l => l.text.replace('[Локация]', '').trim())));
        } else {
             locations = Array.from(new Set(
                logs.filter(l => l.text.includes('Включена атмосфера'))
                    .map(l => l.text.replace('Включена атмосфера:', '').trim())
            ));
        }

        const quests = Array.from(new Set(
            logs.filter(l => l.text.includes('[Квест]') || l.text.toLowerCase().includes('квест завершен'))
                .map(l => l.text.replace('[Квест]', '').trim())
        ));

        const battles = logs.filter(l => l.text.includes('Бой завершен')).length;

        let autoText = "";
        
        if (locations.length > 0) {
            autoText += "📍 Посещенные места:\n- " + locations.join("\n- ") + "\n\n";
        }
        if (npcs.length > 0) {
            autoText += "🗣️ Встреченные NPC:\n- " + npcs.join("\n- ") + "\n\n";
        }
        if (quests.length > 0) {
            autoText += "📜 Квестовые события:\n- " + quests.join("\n- ") + "\n\n";
        }
        if (battles > 0) {
            autoText += `⚔️ Пройдено боевых сцен: ${battles}\n\n`;
        }

        setWorldChanges(autoText);
    };

    const handleGenerateStory = async () => {
        if (logs.length === 0) return;
        setStoryLoading(true);
        try {
            const rawLogText = logs.map(l => `[${l.type.toUpperCase()}] ${l.text}`).join('\n');
            const story = await generateStoryFromLog(rawLogText);
            setSummary(story);
        } catch (e: any) {
            alert("Ошибка генерации истории: " + e.message);
        } finally {
            setStoryLoading(false);
        }
    };

    const handleLongRest = () => {
        if(window.confirm("Восстановить HP всех активных героев до максимума?")) {
            const updated = party.map(p => ({ ...p, maxHp: p.maxHp, hp: p.maxHp }));
            onUpdateParty(updated);
            onAddLog({ id: Date.now().toString(), timestamp: Date.now(), text: "Группа завершила Длинный Отдых.", type: 'system' });
        }
    };

    const handlePlayAtmosphere = (playlistId: string) => {
        playPlaylist(playlistId, true);
        setSelectedAtmosphere(playlistId);
    };

    if (!isOpen) return null;

    // --- START SESSION FLOW ---
    if (type === 'start') {
        const lastLog = logs.length > 0 ? logs[0].text : "Нет записей.";
        
        const steps = [
            {
                title: "Проверка готовности",
                icon: <Users className="w-6 h-6 text-blue-400"/>,
                content: (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-300">Все ли игроки на месте? Готовы ли листы?</p>
                        <div className="bg-gray-800 p-2 rounded border border-gray-700 max-h-40 overflow-y-auto">
                            {party.map(p => (
                                <div key={p.id} className="flex justify-between items-center text-sm py-1 border-b border-gray-700 last:border-0">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${p.active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        <span className={p.active ? "text-white font-bold" : "text-gray-500"}>{p.name}</span>
                                    </div>
                                    <span className="text-xs text-gray-400">AC: {p.ac} | PP: {p.passivePerception}</span>
                                </div>
                            ))}
                        </div>
                        <button 
                            onClick={handleLongRest}
                            className="w-full py-2 bg-green-900/30 hover:bg-green-900/50 border border-green-700 rounded text-green-300 text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Heart className="w-4 h-4"/> Провести Длинный Отдых
                        </button>
                    </div>
                )
            },
            {
                title: "Ранее в приключении...",
                icon: <ScrollText className="w-6 h-6 text-gold-500"/>,
                content: (
                    <div className="space-y-2">
                        <p className="text-sm text-gray-300">Напомните игрокам, на чем вы остановились.</p>
                        <div className="bg-gray-800 p-3 rounded border border-gray-700 text-xs italic text-gray-400 max-h-32 overflow-y-auto">
                            "{lastLog}"
                        </div>
                        {activeQuests.length > 0 && (
                            <div className="mt-2 bg-dnd-dark p-2 rounded border border-gray-700">
                                <p className="text-xs font-bold text-gold-500 uppercase mb-1 flex items-center gap-1"><Shield className="w-3 h-3"/> Активные цели:</p>
                                <ul className="list-disc list-inside text-xs text-gray-300">
                                    {activeQuests.slice(0,3).map(q => <li key={q.id} className="truncate">{q.title}</li>)}
                                </ul>
                            </div>
                        )}
                    </div>
                )
            },
            {
                title: "Атмосфера",
                icon: <Music className="w-6 h-6 text-purple-400"/>,
                content: (
                    <div className="space-y-3">
                        <p className="text-sm text-gray-300">Задайте тон начала игры.</p>
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { id: 'atmosphere', label: '🌲 Путешествие' },
                                { id: 'dungeon', label: '🏰 Подземелье' },
                                { id: 'tavern', label: '🍺 Таверна' },
                                { id: 'mood', label: '🔮 Тайна' },
                                { id: 'city', label: '🏙️ Город' },
                                { id: 'combat', label: '⚔️ Бой (Сразу)', danger: true },
                            ].map(opt => (
                                <button 
                                    key={opt.id}
                                    onClick={() => handlePlayAtmosphere(opt.id)}
                                    className={`p-2 rounded text-xs text-left flex items-center gap-2 transition-all border ${
                                        selectedAtmosphere === opt.id 
                                        ? 'bg-gold-600 text-black border-white shadow-[0_0_10px_rgba(212,175,55,0.5)] font-bold' 
                                        : opt.danger 
                                            ? 'bg-red-900/30 hover:bg-red-900/50 border-red-800 text-gray-300' 
                                            : 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-gray-300'
                                    }`}
                                >
                                    {opt.label}
                                    {selectedAtmosphere === opt.id && <Check className="w-3 h-3 ml-auto"/>}
                                </button>
                            ))}
                        </div>
                    </div>
                )
            }
        ];

        return (
            <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in">
                <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl flex flex-col overflow-hidden">
                    <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                        <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                            {steps[step].icon} {steps[step].title}
                        </h3>
                        <button onClick={onClose}><X className="w-6 h-6 text-gray-500 hover:text-white"/></button>
                    </div>
                    <div className="p-6 flex-1">
                        {steps[step].content}
                    </div>
                    <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between">
                        <button 
                            onClick={() => setStep(Math.max(0, step - 1))}
                            disabled={step === 0}
                            className="text-gray-400 hover:text-white disabled:opacity-30"
                        >
                            Назад
                        </button>
                        <div className="flex gap-1">
                            {steps.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-gold-500' : 'bg-gray-700'}`} />)}
                        </div>
                        {step < steps.length - 1 ? (
                            <button 
                                onClick={() => setStep(step + 1)}
                                className="bg-gold-600 hover:bg-gold-500 text-black px-4 py-2 rounded font-bold text-sm"
                            >
                                Далее
                            </button>
                        ) : (
                            <button 
                                onClick={() => {
                                    onAddLog({ id: Date.now().toString(), timestamp: Date.now(), text: "Сессия началась.", type: 'system' });
                                    onClose();
                                }}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"
                            >
                                <Play className="w-4 h-4"/> Начать Игру
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- END SESSION FLOW ---
    const handleFinish = () => {
        // 1. Generate Log Text
        const logText = logs.map(l => `[${new Date(l.timestamp).toLocaleTimeString()}] ${l.type.toUpperCase()}: ${l.text}`).join('\n');
        
        const fullContent = `
<div class="session-report">
    <h2>🏁 Итоги сессии</h2>
    <div class="stats">
        <p><strong>🏆 Опыт:</strong> ${xpEarned} XP (каждому)</p>
        <div class="summary-box">
            <strong>📝 Летопись:</strong><br/>
            ${summary ? `<div style="font-style: italic; color: #d4af37;">${summary.replace(/\n/g, '<br/>')}</div>` : 'Без описания'}
        </div>
    </div>
    <hr/>
    <h3>🌍 Состояние Мира:</h3>
    <pre>${worldChanges || 'Без существенных изменений.'}</pre>
    <hr/>
    <h3>📜 Полный лог:</h3>
    <pre class="log-dump">${logText}</pre>
</div>
        `;

        // 2. Save Note
        onSaveNote({
            id: Date.now().toString(),
            title: sessionTitle,
            content: fullContent,
            tags: ['сессия', 'лог', 'архив'],
            type: 'session',
            date: new Date().toISOString()
        });

        // 3. Clear Combat
        onClearCombat();

        onAddLog({ id: Date.now().toString(), timestamp: Date.now(), text: "Сессия завершена. Данные сохранены.", type: 'system' });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dnd-card border border-gold-600 w-full max-w-lg rounded-lg shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                        <Check className="w-6 h-6 text-green-500"/> Завершение Сессии
                    </h3>
                    <button onClick={onClose}><X className="w-6 h-6 text-gray-500 hover:text-white"/></button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                    
                    <div>
                        <label className="text-xs text-gray-500 uppercase font-bold">Название записи в журнале</label>
                        <input 
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                            value={sessionTitle}
                            onChange={e => setSessionTitle(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-bold">Опыт (XP)</label>
                            <input 
                                type="number"
                                className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white"
                                value={xpEarned}
                                onChange={e => setXpEarned(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex items-end">
                            <p className="text-xs text-gray-400">На каждого участника.</p>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gray-500 uppercase font-bold">Краткие итоги / Летопись</label>
                            <button 
                                onClick={handleGenerateStory} 
                                disabled={storyLoading || logs.length === 0}
                                className="text-[10px] bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                            >
                                {storyLoading ? <Loader className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                ✨ Художественный пересказ
                            </button>
                        </div>
                        <textarea 
                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white h-32 resize-none"
                            placeholder="Напишите вручную или нажмите кнопку, чтобы создать историю из логов..."
                            value={summary}
                            onChange={e => setSummary(e.target.value)}
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs text-gold-500 uppercase font-bold flex items-center gap-2">
                                <Globe className="w-3 h-3"/> Изменения Мира (Авто)
                            </label>
                            <button onClick={generateAutoSummary} className="text-[10px] text-blue-400 hover:text-white flex items-center gap-1">
                                <Sparkles className="w-3 h-3"/> Обновить
                            </button>
                        </div>
                        <textarea 
                            className="w-full bg-gray-900 border border-gold-600/30 rounded p-2 text-white h-32 resize-none text-xs font-mono"
                            placeholder="Здесь появится автоматический отчет о NPC и локациях..."
                            value={worldChanges}
                            onChange={e => setWorldChanges(e.target.value)}
                        />
                        <p className="text-[10px] text-gray-500 mt-1">Сюда подтягиваются данные о NPC, Квестах и Локациях из лога.</p>
                    </div>

                    <div className="bg-red-900/20 border border-red-900 p-3 rounded flex items-center gap-3">
                        <Skull className="w-5 h-5 text-red-500"/>
                        <div>
                            <p className="text-sm font-bold text-red-400">Очистка боевого поля</p>
                            <p className="text-xs text-gray-400">Монстры будут удалены. HP героев сохранится.</p>
                        </div>
                    </div>

                </div>

                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-2">
                    <button onClick={onClose} className="text-gray-400 hover:text-white px-4">Отмена</button>
                    <button 
                        onClick={handleFinish}
                        className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold text-sm flex items-center gap-2 shadow-lg"
                    >
                        <Save className="w-4 h-4"/> Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SessionWizard;
