
import React, { useState, useEffect, useRef } from 'react';
import { FullQuest, QuestObjective, Combatant, EntityType, QuestTrackerProps } from '../types';
import { generateFullQuestTracker, parseQuestFromText, enhanceQuest } from '../services/polzaService';
import { searchMonsters, getMonsterDetails } from '../services/dndApiService';
import { 
    ScrollText, Plus, Trash2, CheckCircle, Circle, Save, 
    Swords, Sparkles, Loader, ArrowLeft, Edit2, X, 
    ChevronDown, ChevronUp, Wand2, MapPin
} from 'lucide-react';
import SmartText from './SmartText';

const QuestTracker: React.FC<QuestTrackerProps> = ({ addLog }) => {
    const [quests, setQuests] = useState<FullQuest[]>(() => {
        const saved = localStorage.getItem('dmc_quests');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeQuestId, setActiveQuestId] = useState<string | null>(null);
    const [isMobileList, setIsMobileList] = useState(true); // Mobile master/detail view
    const [loading, setLoading] = useState(false);
    const [enhancing, setEnhancing] = useState(false); // Specific loading state for enhancing
    
    // AI Inputs
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiMode, setAiMode] = useState<'generate' | 'parse'>('generate');
    const [aiLevel, setAiLevel] = useState(3);
    const [aiTheme, setAiTheme] = useState('Поиск артефакта');
    const [aiText, setAiText] = useState('');

    // Derived active quest for editing
    const activeQuest = quests.find(q => q.id === activeQuestId);

    useEffect(() => {
        localStorage.setItem('dmc_quests', JSON.stringify(quests));
    }, [quests]);

    useEffect(() => {
        if (activeQuestId) setIsMobileList(false);
    }, [activeQuestId]);

    // Listen for external updates (App.tsx handles the "Add" logic now)
    useEffect(() => {
        const handleUpdateQuests = () => {
            const saved = localStorage.getItem('dmc_quests');
            if (saved) {
                setQuests(JSON.parse(saved));
            }
        };

        window.addEventListener('dmc-update-quests', handleUpdateQuests);
        return () => window.removeEventListener('dmc-update-quests', handleUpdateQuests);
    }, []);

    const createQuest = () => {
        const newQuest: FullQuest = {
            id: Date.now().toString(),
            title: 'Новый квест',
            status: 'active',
            giver: '',
            summary: '',
            description: '',
            objectives: [],
            threats: [],
            reward: ''
        };
        setQuests([newQuest, ...quests]);
        setActiveQuestId(newQuest.id);
        addLog({
            id: Date.now().toString(),
            timestamp: Date.now(),
            text: `[Квест] Создан новый квест: "${newQuest.title}"`,
            type: 'story'
        });
    };

    const updateQuest = (id: string, updates: Partial<FullQuest>) => {
        const prev = quests.find(q => q.id === id);
        setQuests(prevs => prevs.map(q => q.id === id ? { ...q, ...updates } : q));
        
        // Log status changes
        if (prev && updates.status && updates.status !== prev.status) {
            let statusText = "";
            if (updates.status === 'completed') statusText = "завершен";
            else if (updates.status === 'failed') statusText = "провален";
            else if (updates.status === 'active') statusText = "активирован";
            
            addLog({
                id: Date.now().toString(),
                timestamp: Date.now(),
                text: `[Квест] "${prev.title}" ${statusText}.`,
                type: 'story'
            });
        }
    };

    const deleteQuest = (id: string) => {
        if (window.confirm('Удалить квест?')) {
            setQuests(prev => prev.filter(q => q.id !== id));
            if (activeQuestId === id) {
                setActiveQuestId(null);
                setIsMobileList(true);
            }
        }
    };

    // Objectives Management
    const addObjective = (questId: string) => {
        const newObj: QuestObjective = { id: Date.now().toString(), text: 'Новая цель', completed: false };
        updateQuest(questId, { objectives: [...(activeQuest?.objectives || []), newObj] });
    };

    const toggleObjective = (questId: string, objId: string) => {
        const quest = quests.find(q => q.id === questId);
        if (!quest) return;
        
        const updated = quest.objectives.map(o => {
            if (o.id === objId) {
                const newState = !o.completed;
                // Log objective completion
                if (newState) {
                    addLog({
                        id: Date.now().toString(),
                        timestamp: Date.now(),
                        text: `[Квест] Цель выполнена: ${o.text} (Квест: ${quest.title})`,
                        type: 'story'
                    });
                }
                return { ...o, completed: newState };
            }
            return o;
        });
        updateQuest(questId, { objectives: updated });
    };

    const updateObjectiveText = (questId: string, objId: string, text: string) => {
        const updated = (activeQuest?.objectives || []).map(o => o.id === objId ? { ...o, text } : o);
        updateQuest(questId, { objectives: updated });
    };

    const deleteObjective = (questId: string, objId: string) => {
        const updated = (activeQuest?.objectives || []).filter(o => o.id !== objId);
        updateQuest(questId, { objectives: updated });
    };

    // Threat Management
    const addThreat = (questId: string) => {
        updateQuest(questId, { threats: [...(activeQuest?.threats || []), 'Гоблин'] });
    };

    const updateThreat = (questId: string, index: number, value: string) => {
        const newThreats = [...(activeQuest?.threats || [])];
        newThreats[index] = value;
        updateQuest(questId, { threats: newThreats });
    };

    const removeThreat = (questId: string, index: number) => {
        const newThreats = [...(activeQuest?.threats || [])];
        newThreats.splice(index, 1);
        updateQuest(questId, { threats: newThreats });
    };

    // Combat Integration
    const sendToCombat = async (threats: string[]) => {
        if (threats.length === 0) return;
        
        const confirmed = window.confirm(`Добавить ${threats.length} существ в Боевой Трекер?`);
        if (!confirmed) return;

        setLoading(true);
        try {
            // Read current combatants
            const savedCombatants = localStorage.getItem('dmc_combatants');
            const currentCombatants: Combatant[] = savedCombatants ? JSON.parse(savedCombatants) : [];
            const newCombatants: Combatant[] = [];

            for (const threatName of threats) {
                // Try to find basic stats via API search or generate default
                let hp = 20;
                let ac = 12;
                let init = 10;
                let notes = '';

                try {
                    const searchResults = await searchMonsters(threatName);
                    if (searchResults.length > 0) {
                        // Exact match or first result
                        const exact = searchResults.find(r => r.name.toLowerCase() === threatName.toLowerCase());
                        const target = exact || searchResults[0];
                        const details = await getMonsterDetails(target.index);
                        if (details) {
                            hp = details.hit_points;
                            ac = typeof details.armor_class === 'number' ? details.armor_class : details.armor_class[0]?.value || 10;
                            const dexMod = Math.floor((details.dexterity - 10) / 2);
                            init = Math.floor(Math.random() * 20) + 1 + dexMod;
                            notes = `CR ${details.challenge_rating} (${details.type})`;
                        }
                    }
                } catch (e) {
                    console.warn(`Failed to fetch stats for ${threatName}`, e);
                }

                newCombatants.push({
                    id: Date.now().toString() + Math.random(),
                    name: threatName,
                    type: EntityType.MONSTER,
                    hp, maxHp: hp, ac, initiative: init,
                    conditions: [],
                    notes
                });
            }

            localStorage.setItem('dmc_combatants', JSON.stringify([...currentCombatants, ...newCombatants]));
            
            // Dispatch custom event so CombatTracker can update if mounted
            window.dispatchEvent(new Event('dmc-update-combat'));
            
            addLog({
                id: Date.now().toString(),
                timestamp: Date.now(),
                text: `[Бой] Угрозы из квеста "${activeQuest?.title}" добавлены в трекер.`,
                type: 'system'
            });
            
            alert("Существа добавлены в Боевой Трекер!");

        } catch (e) {
            console.error(e);
            alert("Ошибка при добавлении в бой.");
        } finally {
            setLoading(false);
        }
    };

    // AI Handlers
    const handleAiAction = async () => {
        setLoading(true);
        try {
            let result;
            if (aiMode === 'generate') {
                result = await generateFullQuestTracker(aiLevel, aiTheme);
            } else {
                result = await parseQuestFromText(aiText);
            }

            // SAFE GUARD: Ensure we have an object
            if (!result || typeof result !== 'object') {
                throw new Error("AI вернул некорректные данные.");
            }

            // SAFE GUARD: Handle missing arrays or wrong types for objectives/threats
            const rawObjectives = Array.isArray(result.objectives) ? result.objectives : [];
            const rawThreats = Array.isArray(result.threats) ? result.threats : [];

            // Convert plain strings to Objective objects safely
            const formattedObjectives = rawObjectives.map((txt: any) => ({
                id: Date.now().toString() + Math.random(),
                text: typeof txt === 'string' ? txt : 'Цель',
                completed: false
            }));

            const newQuest: FullQuest = {
                id: Date.now().toString(),
                title: result.title || 'AI Квест',
                status: 'active',
                giver: result.giver || 'Неизвестно',
                summary: result.summary || '',
                description: result.description || '',
                objectives: formattedObjectives,
                threats: rawThreats.map((t: any) => typeof t === 'string' ? t : 'Враг'),
                reward: result.reward || ''
            };

            setQuests([newQuest, ...quests]);
            setActiveQuestId(newQuest.id);
            
            addLog({
                id: Date.now().toString(),
                timestamp: Date.now(),
                text: `[Квест] AI сгенерировал квест: "${newQuest.title}"`,
                type: 'story'
            });

            setShowAiModal(false);
            setAiText('');
        } catch (e: any) {
            console.error(e);
            alert(`Ошибка AI: ${e.message}. Попробуйте еще раз.`);
        } finally {
            setLoading(false);
        }
    };

    const handleEnhanceQuest = async () => {
        if (!activeQuest) return;
        setEnhancing(true);
        try {
            const result = await enhanceQuest(activeQuest);
            
            // Update the quest in the list
            setQuests(prevs => prevs.map(q => q.id === result.id ? result : q));
            
            addLog({
                id: Date.now().toString(),
                timestamp: Date.now(),
                text: `[Квест] AI улучшил детали квеста: "${result.title}"`,
                type: 'system'
            });
        } catch (e: any) {
            alert(`Ошибка улучшения: ${e.message}`);
        } finally {
            setEnhancing(false);
        }
    };

    return (
        <div className="h-full flex gap-4 relative">
            {/* --- AI Modal --- */}
            {showAiModal && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
                    <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                        <div className="p-6 pb-2 shrink-0 border-b border-gray-800">
                            <h3 className="text-xl font-serif font-bold text-gold-500 mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5"/> AI Мастер Квестов
                            </h3>
                            
                            <div className="flex bg-gray-900 rounded p-1">
                                <button 
                                    onClick={() => setAiMode('generate')}
                                    className={`flex-1 py-1 text-sm rounded transition-colors ${aiMode === 'generate' ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                                >
                                    Генерация
                                </button>
                                <button 
                                    onClick={() => setAiMode('parse')}
                                    className={`flex-1 py-1 text-sm rounded transition-colors ${aiMode === 'parse' ? 'bg-gray-700 text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                                >
                                    Импорт текста
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-4 flex-1 overflow-y-auto custom-scrollbar">
                            {aiMode === 'generate' ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Уровень группы</label>
                                        <input type="number" className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" value={aiLevel} onChange={e => setAiLevel(Number(e.target.value))} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Тема / Тип</label>
                                        <input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" placeholder="Напр. Убийство дракона, Интрига" value={aiTheme} onChange={e => setAiTheme(e.target.value)} />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Текст источника</label>
                                    <textarea 
                                        className="w-full flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm resize-none focus:border-gold-500 outline-none min-h-[150px]"
                                        placeholder="Вставьте диалог NPC или текст из модуля..."
                                        value={aiText}
                                        onChange={e => setAiText(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="p-6 pt-4 shrink-0 flex gap-2 border-t border-gray-700/50 bg-dnd-card">
                            <button onClick={() => setShowAiModal(false)} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded transition-colors">Отмена</button>
                            <button 
                                onClick={handleAiAction} 
                                disabled={loading}
                                className="flex-1 bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 rounded flex justify-center items-center gap-2 transition-colors shadow-lg"
                            >
                                {loading ? <Loader className="animate-spin w-4 h-4"/> : <Wand2 className="w-4 h-4"/>} 
                                {aiMode === 'generate' ? 'Создать' : 'Разобрать'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- List Sidebar --- */}
            <div className={`w-full lg:w-1/3 bg-dnd-dark border-r border-gray-700 flex flex-col ${isMobileList ? 'flex' : 'hidden lg:flex'}`}>
                <div className="p-4 border-b border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-serif font-bold text-2xl text-gold-500 flex items-center gap-2">
                            <ScrollText className="w-6 h-6"/> Квесты
                        </h2>
                        <button onClick={() => setShowAiModal(true)} className="text-indigo-400 hover:text-indigo-300 p-2 bg-indigo-900/30 rounded border border-indigo-800/50 transition-colors" title="AI Инструменты">
                            <Sparkles className="w-5 h-5"/>
                        </button>
                    </div>
                    <button 
                        onClick={createQuest}
                        className="w-full bg-gray-800 hover:bg-gray-700 text-white py-2 rounded border border-gray-600 flex items-center justify-center gap-2 font-bold text-sm transition-colors"
                    >
                        <Plus className="w-4 h-4"/> Новый квест
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {quests.map(q => (
                        <div 
                            key={q.id}
                            onClick={() => setActiveQuestId(q.id)}
                            className={`p-3 rounded border cursor-pointer transition-all hover:bg-gray-800 ${activeQuestId === q.id ? 'bg-gray-800 border-gold-500 shadow-md' : 'bg-dnd-card border-gray-700 opacity-80'}`}
                        >
                            <div className="flex justify-between items-start">
                                <h4 className={`font-bold ${q.status === 'completed' ? 'text-green-500 line-through decoration-gray-500' : q.status === 'failed' ? 'text-red-500' : 'text-gray-200'}`}>
                                    {q.title}
                                </h4>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold ${
                                    q.status === 'active' ? 'bg-blue-900 text-blue-200' : 
                                    q.status === 'completed' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
                                }`}>
                                    {q.status === 'active' ? 'Активен' : q.status === 'completed' ? 'Завершен' : 'Провален'}
                                </span>
                            </div>
                            {q.location && <div className="flex items-center gap-1 mt-1 text-xs text-gold-600"><MapPin className="w-3 h-3"/> {q.location}</div>}
                            <p className="text-xs text-gray-500 mt-1 truncate">{q.summary || 'Нет описания'}</p>
                        </div>
                    ))}
                    {quests.length === 0 && <div className="text-center text-gray-500 mt-10 text-sm">Список пуст.<br/>Создайте или сгенерируйте квест.</div>}
                </div>
            </div>

            {/* --- Detail View --- */}
            <div className={`flex-1 flex flex-col bg-dnd-darker overflow-hidden ${!isMobileList ? 'flex' : 'hidden lg:flex'}`}>
                {activeQuest ? (
                    <>
                        {/* Header */}
                        <div className="p-4 bg-dnd-card border-b border-gray-700 flex flex-col gap-2 shrink-0">
                            <div className="flex justify-between items-start gap-4">
                                <button onClick={() => setIsMobileList(true)} className="lg:hidden text-gray-400 mr-2"><ArrowLeft className="w-6 h-6"/></button>
                                <div className="flex-1">
                                    <input 
                                        className="w-full bg-transparent text-2xl font-serif font-bold text-gold-500 outline-none placeholder-gray-600"
                                        value={activeQuest.title}
                                        onChange={e => updateQuest(activeQuest.id, { title: e.target.value })}
                                        placeholder="Название квеста..."
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={handleEnhanceQuest}
                                        disabled={enhancing}
                                        className="p-2 bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800 rounded border border-indigo-800 transition-colors disabled:opacity-50"
                                        title="Улучшить с помощью AI"
                                    >
                                        {enhancing ? <Loader className="w-5 h-5 animate-spin"/> : <Wand2 className="w-5 h-5"/>}
                                    </button>
                                    <button onClick={() => deleteQuest(activeQuest.id)} className="text-gray-500 hover:text-red-500 p-2 transition-colors"><Trash2 className="w-5 h-5"/></button>
                                </div>
                            </div>
                            
                            <div className="flex gap-2">
                                <select 
                                    className="bg-gray-900 border border-gray-700 rounded text-xs text-gray-300 px-2 py-1 outline-none focus:border-gold-500"
                                    value={activeQuest.status}
                                    onChange={e => updateQuest(activeQuest.id, { status: e.target.value as any })}
                                >
                                    <option value="active">Активен</option>
                                    <option value="completed">Завершен</option>
                                    <option value="failed">Провален</option>
                                </select>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                            {/* Summary & Giver */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Заказчик</label>
                                    <input 
                                        className="w-full bg-transparent text-sm text-white outline-none"
                                        placeholder="Кто дал квест?"
                                        value={activeQuest.giver}
                                        onChange={e => updateQuest(activeQuest.id, { giver: e.target.value })}
                                    />
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Локация</label>
                                    <input 
                                        className="w-full bg-transparent text-sm text-white outline-none"
                                        placeholder="Где происходит?"
                                        value={activeQuest.location || ''}
                                        onChange={e => updateQuest(activeQuest.id, { location: e.target.value })}
                                    />
                                </div>
                                <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Суть (Питч)</label>
                                    <textarea 
                                        className="w-full bg-transparent text-sm text-white outline-none resize-none h-10"
                                        placeholder="Кратко о главном..."
                                        value={activeQuest.summary}
                                        onChange={e => updateQuest(activeQuest.id, { summary: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Objectives */}
                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-serif font-bold text-gray-300">Цели</h3>
                                    <button onClick={() => addObjective(activeQuest.id)} className="text-xs bg-gray-800 hover:bg-gray-700 px-2 py-1 rounded text-gold-500">+ Добавить</button>
                                </div>
                                <div className="space-y-2">
                                    {(activeQuest.objectives || []).map(obj => (
                                        <div key={obj.id} className="flex items-start gap-3 p-2 bg-gray-900/30 rounded group">
                                            <button onClick={() => toggleObjective(activeQuest.id, obj.id)} className={`shrink-0 mt-1 ${obj.completed ? 'text-green-500' : 'text-gray-600'}`}>
                                                {obj.completed ? <CheckCircle className="w-5 h-5"/> : <Circle className="w-5 h-5"/>}
                                            </button>
                                            <textarea
                                                ref={el => { 
                                                    if(el) { 
                                                        el.style.height = 'auto'; 
                                                        el.style.height = el.scrollHeight + 'px'; 
                                                    }
                                                }}
                                                className={`flex-1 bg-transparent outline-none text-sm w-full overflow-hidden resize-none py-1 ${obj.completed ? 'text-gray-500 line-through' : 'text-gray-200'}`}
                                                value={obj.text}
                                                onChange={e => {
                                                    updateObjectiveText(activeQuest.id, obj.id, e.target.value);
                                                    e.target.style.height = 'auto';
                                                    e.target.style.height = e.target.scrollHeight + 'px';
                                                }}
                                                rows={1}
                                            />
                                            <button onClick={() => deleteObjective(activeQuest.id, obj.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 mt-0.5"><X className="w-4 h-4"/></button>
                                        </div>
                                    ))}
                                    {(activeQuest.objectives || []).length === 0 && <p className="text-gray-600 text-xs italic">Список целей пуст.</p>}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="bg-gray-900/50 p-4 rounded border border-gray-700">
                                <label className="text-xs text-gray-500 uppercase font-bold block mb-2">Описание и Заметки мастера</label>
                                {/* Replaced plain textarea with SmartText wrapper for rendered HTML, but kept editing via textarea for now to keep simple */}
                                <div className="relative group/edit">
                                    <textarea 
                                        className="w-full bg-transparent text-sm text-gray-300 outline-none h-64 resize-y leading-relaxed font-mono"
                                        placeholder="Подробности, скрытые мотивы, HTML поддерживается..."
                                        value={activeQuest.description}
                                        onChange={e => updateQuest(activeQuest.id, { description: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Threats & Reward */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h3 className="font-serif font-bold text-red-400 flex items-center gap-2"><Swords className="w-4 h-4"/> Угрозы</h3>
                                        <div className="flex gap-2">
                                            <button onClick={() => sendToCombat(activeQuest.threats)} disabled={loading || (activeQuest.threats || []).length === 0} className="text-xs bg-red-900/50 text-red-200 hover:bg-red-900 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50">
                                                {loading ? <Loader className="w-3 h-3 animate-spin"/> : "В бой"}
                                            </button>
                                            <button onClick={() => addThreat(activeQuest.id)} className="text-xs bg-gray-800 text-gray-300 hover:bg-gray-700 px-2 py-1 rounded">+</button>
                                        </div>
                                    </div>
                                    <div className="space-y-2 bg-red-950/10 border border-red-900/30 p-2 rounded">
                                        {(activeQuest.threats || []).map((threat, i) => (
                                            <div key={i} className="flex gap-2">
                                                <input 
                                                    className="flex-1 bg-gray-900/50 border border-red-900/20 rounded px-2 py-1 text-sm text-red-100 outline-none focus:border-red-500"
                                                    value={threat}
                                                    onChange={e => updateThreat(activeQuest.id, i, e.target.value)}
                                                />
                                                <button onClick={() => removeThreat(activeQuest.id, i)} className="text-red-500 hover:text-red-400 px-1"><X className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                        {(activeQuest.threats || []).length === 0 && <p className="text-gray-600 text-xs italic">Нет угроз.</p>}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-serif font-bold text-gold-500 mb-2">Награда</h3>
                                    <textarea 
                                        className="w-full bg-gray-900/50 border border-gold-900/30 rounded p-2 text-sm text-gold-100 outline-none h-24 resize-none placeholder-gold-500/30 focus:border-gold-500"
                                        placeholder="Золото, опыт, предметы..."
                                        value={activeQuest.reward}
                                        onChange={e => updateQuest(activeQuest.id, { reward: e.target.value })}
                                    />
                                    {/* Preview for HTML content in reward */}
                                    {activeQuest.reward && activeQuest.reward.includes('<') && (
                                        <div className="mt-2 p-2 border border-gold-900/30 rounded bg-black/20">
                                            <p className="text-xs text-gray-500 mb-1 uppercase">Предпросмотр:</p>
                                            <SmartText content={activeQuest.reward} className="text-sm text-gold-100" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                        <ScrollText className="w-16 h-16 opacity-20 mb-4" />
                        <p>Выберите квест или создайте новый.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestTracker;
