
import React, { useState, useEffect } from 'react';
import { X, Save, Trash2, RefreshCw, Plus, FileJson, AlertTriangle, Check, Copy } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface DataManagerProps {
    onClose: () => void;
}

const STORAGE_KEYS = [
    { key: 'dmc_party', label: 'Группа (Party)', type: 'array' },
    { key: 'dmc_npcs', label: 'NPC (Трекер)', type: 'array' },
    { key: 'dmc_quests', label: 'Квесты', type: 'array' },
    { key: 'dmc_notes', label: 'Заметки/Журнал', type: 'array' },
    { key: 'dmc_session_logs', label: 'Логи Сессии', type: 'array' },
    { key: 'dmc_combatants', label: 'Боевой Трекер', type: 'array' },
    { key: 'dmc_local_bestiary', label: 'Локальный Бестиарий', type: 'array' },
    { key: 'dmc_campaign_settings', label: 'Настройки Кампании', type: 'object' },
    { key: 'dmc_active_location', label: 'Активная Локация', type: 'object' },
    { key: 'dmc_active_travel', label: 'Состояние Путешествия', type: 'object' },
    { key: 'dmc_playlists', label: 'Плейлисты', type: 'array' },
    { key: 'dmc_lore', label: 'Справочник (Lore)', type: 'array' }
];

const getTemplate = (key: string) => {
    const id = Date.now().toString();
    switch(key) {
        case 'dmc_party':
            return {
                id: id,
                name: "Новый Герой",
                race: "Человек",
                class: "Воин",
                level: 1,
                xp: 0,
                maxHp: 10,
                ac: 10,
                passivePerception: 10,
                active: true,
                inventory: [],
                wallet: { gp: 0, sp: 0, cp: 0 }
            };
        case 'dmc_npcs':
            return {
                id: id,
                name: "Новый NPC",
                race: "Человек",
                location: "Неизвестно",
                status: "alive",
                attitude: "neutral",
                description: "Описание внешности...",
                personality: "Черты характера...",
                notes: ""
            };
        case 'dmc_quests':
            return {
                id: id,
                title: "Новый Квест",
                status: "active",
                giver: "Заказчик",
                summary: "Краткая суть...",
                description: "Полное описание...",
                objectives: [],
                threats: [],
                reward: ""
            };
        case 'dmc_local_bestiary':
            return {
                id: id,
                name: "Новый Монстр",
                type: "Чудовище",
                ac: 12,
                hp: 20,
                cr: "1",
                xp: 200,
                stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
                actions: [{ name: "Атака", desc: "+4 попадание, 1к6 урон" }],
                source: "local"
            };
        case 'dmc_notes':
            return {
                id: id,
                title: "Новая Заметка",
                content: "Текст заметки...",
                tags: ["общее"],
                type: "other",
                date: new Date().toISOString()
            };
        default: return null;
    }
};

const DataManager: React.FC<DataManagerProps> = ({ onClose }) => {
    const { showToast } = useToast();
    const [selectedKeyObj, setSelectedKeyObj] = useState(STORAGE_KEYS[0]);
    const [jsonContent, setJsonContent] = useState('');
    const [isValid, setIsValid] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        loadData(selectedKeyObj.key);
    }, [selectedKeyObj]);

    const loadData = (key: string) => {
        const data = localStorage.getItem(key);
        if (data) {
            try {
                const parsed = JSON.parse(data);
                setJsonContent(JSON.stringify(parsed, null, 4));
                setIsValid(true);
                setErrorMsg('');
            } catch (e) {
                setJsonContent(data);
                setIsValid(false);
                setErrorMsg("Ошибка чтения JSON из памяти");
            }
        } else {
            const defaultVal = selectedKeyObj.type === 'array' ? '[]' : '{}';
            setJsonContent(defaultVal);
            setIsValid(true);
            setErrorMsg('');
        }
    };

    const handleJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setJsonContent(val);
        try {
            JSON.parse(val);
            setIsValid(true);
            setErrorMsg('');
        } catch (e: any) {
            setIsValid(false);
            setErrorMsg(e.message);
        }
    };

    const handleSave = () => {
        if (!isValid) {
            showToast("Невалидный JSON", "error");
            return;
        }
        try {
            const parsed = JSON.parse(jsonContent);
            localStorage.setItem(selectedKeyObj.key, JSON.stringify(parsed));
            showToast('Данные успешно сохранены', 'success');
            
            // Dispatch events to update UI live
            if (selectedKeyObj.key === 'dmc_party') window.dispatchEvent(new Event('dmc-update-party'));
            if (selectedKeyObj.key === 'dmc_npcs') window.dispatchEvent(new Event('dmc-update-npcs'));
            if (selectedKeyObj.key === 'dmc_quests') window.dispatchEvent(new Event('dmc-update-quests'));
            if (selectedKeyObj.key === 'dmc_combatants') window.dispatchEvent(new Event('dmc-update-combat'));
            if (selectedKeyObj.key === 'dmc_notes') window.dispatchEvent(new Event('dmc-update-notes'));
            
        } catch (e) {
            showToast('Ошибка при сохранении', 'error');
        }
    };

    const handleAddTemplate = () => {
        if (!isValid) return;
        const template = getTemplate(selectedKeyObj.key);
        if (!template) {
            showToast("Нет шаблона для этого типа", "info");
            return;
        }

        try {
            const current = JSON.parse(jsonContent);
            if (Array.isArray(current)) {
                const updated = [template, ...current];
                setJsonContent(JSON.stringify(updated, null, 4));
                showToast("Шаблон добавлен в начало списка", "success");
            } else {
                showToast("Этот тип данных не поддерживает списки", "warning");
            }
        } catch (e) {
            showToast("Невозможно добавить в поврежденный JSON", "error");
        }
    };

    const handleClear = () => {
        if (window.confirm(`Вы уверены? Это очистит данные: ${selectedKeyObj.label}`)) {
            const empty = selectedKeyObj.type === 'array' ? '[]' : '{}';
            setJsonContent(empty);
            setIsValid(true);
            setErrorMsg('');
        }
    };

    const handleFormat = () => {
        if (!isValid) return;
        try {
            const parsed = JSON.parse(jsonContent);
            setJsonContent(JSON.stringify(parsed, null, 4));
        } catch(e) {}
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2">
                        <FileJson className="w-6 h-6"/> Редактор Данных
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar */}
                    <div className="w-64 bg-gray-900/50 border-r border-gray-700 flex flex-col overflow-y-auto custom-scrollbar">
                        {STORAGE_KEYS.map(k => (
                            <button
                                key={k.key}
                                onClick={() => setSelectedKeyObj(k)}
                                className={`text-left px-4 py-3 text-sm font-bold border-l-4 transition-all ${selectedKeyObj.key === k.key ? 'bg-gray-800 text-white border-gold-500' : 'text-gray-400 border-transparent hover:bg-gray-800 hover:text-gray-200'}`}
                            >
                                {k.label}
                            </button>
                        ))}
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 flex flex-col bg-gray-950 relative">
                        {/* Toolbar */}
                        <div className="p-2 border-b border-gray-800 bg-gray-900 flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-gray-500 px-2">{selectedKeyObj.key}</span>
                            
                            <div className="h-4 w-[1px] bg-gray-700 mx-1"></div>

                            <button 
                                onClick={handleSave}
                                disabled={!isValid}
                                className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <Save className="w-3 h-3"/> Сохранить
                            </button>

                            {getTemplate(selectedKeyObj.key) && (
                                <button 
                                    onClick={handleAddTemplate}
                                    className="bg-blue-900/50 hover:bg-blue-800 border border-blue-700 text-blue-200 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"
                                    title="Добавить пустой объект в начало списка"
                                >
                                    <Plus className="w-3 h-3"/> Добавить шаблон
                                </button>
                            )}
                            
                            <button 
                                onClick={handleFormat}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"
                                title="Форматировать JSON"
                            >
                                <RefreshCw className="w-3 h-3"/> Формат
                            </button>

                            <button 
                                onClick={() => { navigator.clipboard.writeText(jsonContent); showToast("Скопировано", "info"); }}
                                className="bg-gray-800 hover:bg-gray-700 text-gray-300 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"
                            >
                                <Copy className="w-3 h-3"/> Копировать
                            </button>

                            <div className="flex-1"></div>

                            <button 
                                onClick={handleClear}
                                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2"
                            >
                                <Trash2 className="w-3 h-3"/> Очистить
                            </button>
                        </div>

                        {/* Text Area */}
                        <div className="flex-1 relative">
                            <textarea
                                className={`w-full h-full bg-gray-950 text-gray-300 font-mono text-sm p-4 resize-none outline-none ${!isValid ? 'border-2 border-red-500/50' : ''}`}
                                value={jsonContent}
                                onChange={handleJsonChange}
                                spellCheck={false}
                            />
                            {/* Status Overlay */}
                            <div className={`absolute bottom-0 left-0 right-0 px-4 py-1 text-xs font-bold flex items-center gap-2 ${isValid ? 'bg-green-900/80 text-green-300' : 'bg-red-900/80 text-red-300'}`}>
                                {isValid ? (
                                    <><Check className="w-3 h-3"/> JSON валиден</>
                                ) : (
                                    <><AlertTriangle className="w-3 h-3"/> Ошибка синтаксиса: {errorMsg}</>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataManager;
