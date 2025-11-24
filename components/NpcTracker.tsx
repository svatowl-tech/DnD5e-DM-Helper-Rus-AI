
import React, { useState, useEffect, useRef } from 'react';
import { CampaignNpc, NpcTrackerProps, SavedImage } from '../types';
import { 
    Users, UserPlus, Search, MapPin, Skull, Heart, 
    Swords, MessageSquare, Edit2, Trash2, Save, X, 
    Smile, Frown, Meh, Filter, Image as ImageIcon, Loader,
    ScrollText, Sparkles, Wand2, Upload, Download
} from 'lucide-react';
import { generateImage, generateNpc, parseNpcFromText, enhanceNpc } from '../services/polzaService';
import SmartText from './SmartText';

const NpcTracker: React.FC<NpcTrackerProps> = ({ addLog, onImageGenerated }) => {
    const [npcs, setNpcs] = useState<CampaignNpc[]>(() => {
        const saved = localStorage.getItem('dmc_npcs');
        return saved ? JSON.parse(saved) : [];
    });

    const [search, setSearch] = useState('');
    const [filterLoc, setFilterLoc] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    // Edit Form State
    const [formData, setFormData] = useState<Partial<CampaignNpc>>({});
    const [imageLoading, setImageLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Modal State
    const [showAiModal, setShowAiModal] = useState(false);
    const [aiMode, setAiMode] = useState<'generate' | 'parse'>('generate');
    const [aiInput, setAiInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [enhancing, setEnhancing] = useState(false);

    useEffect(() => {
        localStorage.setItem('dmc_npcs', JSON.stringify(npcs));
    }, [npcs]);

    // Listen for external adds (from Generators/Location)
    useEffect(() => {
        const handleUpdate = () => {
            const saved = localStorage.getItem('dmc_npcs');
            if (saved) setNpcs(JSON.parse(saved));
        };
        window.addEventListener('dmc-update-npcs', handleUpdate);
        return () => window.removeEventListener('dmc-update-npcs', handleUpdate);
    }, []);

    const locations = Array.from(new Set(npcs.map(n => n.location).filter(Boolean)));

    const filteredNpcs = npcs.filter(n => {
        const matchesSearch = n.name.toLowerCase().includes(search.toLowerCase()) || 
                              n.race.toLowerCase().includes(search.toLowerCase());
        const matchesLoc = filterLoc ? n.location === filterLoc : true;
        return matchesSearch && matchesLoc;
    });

    const handleAdd = () => {
        setFormData({
            id: Date.now().toString(),
            name: '',
            race: '',
            class: '',
            location: 'Неизвестно',
            status: 'alive',
            attitude: 'neutral',
            description: '',
            personality: '',
            notes: ''
        });
        setEditingId(null);
        setIsEditing(true);
    };

    const handleEdit = (npc: CampaignNpc) => {
        setFormData(npc);
        setEditingId(npc.id);
        setIsEditing(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm("Удалить этого NPC навсегда?")) {
            setNpcs(prev => prev.filter(n => n.id !== id));
            if (editingId === id) setIsEditing(false);
        }
    };

    const handleSave = () => {
        if (!formData.name) return;
        
        const newNpc = {
            ...formData,
            id: formData.id || Date.now().toString(),
            name: formData.name || 'Неизвестный',
            race: formData.race || 'Гуманоид',
            location: formData.location || 'В пути',
            status: formData.status || 'alive',
            attitude: formData.attitude || 'neutral'
        } as CampaignNpc;

        if (editingId) {
            setNpcs(prev => prev.map(n => n.id === editingId ? newNpc : n));
        } else {
            setNpcs(prev => [newNpc, ...prev]);
        }
        
        setIsEditing(false);
        addLog({
            id: Date.now().toString(),
            timestamp: Date.now(),
            text: `[NPC] ${editingId ? 'Обновлен' : 'Создан'}: ${newNpc.name}`,
            type: 'system'
        });
    };

    const sendToCombat = (npc: CampaignNpc) => {
        const event = new CustomEvent('dmc-add-combatant', {
            detail: {
                name: npc.name,
                type: 'MONSTER', // Or NPC type if distinct
                notes: `${npc.race} ${npc.class}. ${npc.attitude}. ${npc.description}`,
                hp: 20, // Generic default
                ac: 10,
                initiative: 10
            }
        });
        window.dispatchEvent(event);
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `${npc.name} добавлен в бой.`, type: 'combat' });
    };

    // --- IMAGE HANDLERS ---

    // Helper to autosave image to avoid data loss on modal close
    const updateNpcImage = (url: string) => {
        setFormData(prev => ({ ...prev, imageUrl: url }));
        if (editingId) {
            // Autosave to persistent list immediately
            setNpcs(prev => prev.map(n => n.id === editingId ? { ...n, imageUrl: url } : n));
        }
    };

    const generatePortrait = async () => {
        if (!formData.name || !formData.description) {
            alert("Заполните имя и описание для генерации.");
            return;
        }
        setImageLoading(true);
        try {
            const prompt = `Fantasy RPG portrait of ${formData.name}, ${formData.race} ${formData.class}. ${formData.description}. ${formData.personality}. Cinematic lighting, detailed digital art, 8k resolution. Head and shoulders shot.`;
            const url = await generateImage(prompt, "1:1");
            
            updateNpcImage(url);
            
            if (onImageGenerated) {
                onImageGenerated({
                    id: Date.now().toString(),
                    url,
                    title: formData.name || 'NPC',
                    type: 'npc',
                    timestamp: Date.now()
                });
            }
        } catch (e: any) {
            alert("Ошибка генерации: " + e.message);
        } finally {
            setImageLoading(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check size (limit to ~2MB for localStorage safety)
        if (file.size > 2 * 1024 * 1024) {
            alert("Файл слишком большой. Пожалуйста, используйте изображение до 2МБ.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            updateNpcImage(result);
            
            // Add to Gallery
            if (onImageGenerated) {
                onImageGenerated({
                    id: Date.now().toString(),
                    url: result,
                    title: formData.name || 'Загруженный NPC',
                    type: 'npc',
                    timestamp: Date.now()
                });
                addLog({ 
                    id: Date.now().toString(), 
                    timestamp: Date.now(), 
                    text: `Изображение для ${formData.name || 'NPC'} добавлено в галерею.`, 
                    type: 'system' 
                });
            }
        };
        reader.readAsDataURL(file);
    };

    const handleDownloadImage = async () => {
        if (!formData.imageUrl) return;
        
        try {
            // If it's a base64 data URL, simple download
            if (formData.imageUrl.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = formData.imageUrl;
                link.download = `${formData.name || 'npc'}-portrait.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                // If it's a remote URL, fetch it as blob to force download
                const response = await fetch(formData.imageUrl);
                const blob = await response.blob();
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `${formData.name || 'npc'}-portrait.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            }
        } catch (e) {
            console.error("Download failed", e);
            // Fallback: open in new tab
            window.open(formData.imageUrl, '_blank');
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    // ----------------------

    // AI Handler for Modal (Generate new / Parse text)
    const handleAiAction = async () => {
        setLoading(true);
        try {
            let result;
            if (aiMode === 'generate') {
                result = await generateNpc(aiInput || 'случайный');
            } else {
                result = await parseNpcFromText(aiInput);
            }

            const newNpc: CampaignNpc = {
                id: Date.now().toString(),
                name: result.name || 'Неизвестный',
                race: result.race || 'Гуманоид',
                class: result.class || 'Обыватель',
                description: result.description || '',
                personality: result.personality || '',
                location: 'Неизвестно',
                status: 'alive',
                attitude: 'neutral',
                secret: result.secret || '',
                hook: result.hook || '',
                notes: ''
            };

            setNpcs([newNpc, ...npcs]);
            setFormData(newNpc);
            setEditingId(newNpc.id);
            setIsEditing(true);
            
            addLog({
                id: Date.now().toString(),
                timestamp: Date.now(),
                text: `[NPC] AI создал персонажа: "${newNpc.name}"`,
                type: 'story'
            });

            setShowAiModal(false);
            setAiInput('');
        } catch (e: any) {
            alert(`Ошибка AI: ${e.message}`);
        } finally {
            setLoading(false);
        }
    };

    // AI Handler for Enhancing Existing NPC
    const handleEnhanceNpc = async () => {
        if (!formData.name) return;
        setEnhancing(true);
        try {
            const currentNpc = { 
                ...formData, 
                id: formData.id || 'temp',
                status: formData.status || 'alive', 
                attitude: formData.attitude || 'neutral' 
            } as CampaignNpc;

            const result = await enhanceNpc(currentNpc);
            setFormData(result);
            
            addLog({
                id: Date.now().toString(),
                timestamp: Date.now(),
                text: `[NPC] AI улучшил детали персонажа: "${result.name}"`,
                type: 'system'
            });
        } catch (e: any) {
            alert(`Ошибка улучшения: ${e.message}`);
        } finally {
            setEnhancing(false);
        }
    };

    const getAttitudeColor = (att?: string) => {
        switch(att) {
            case 'friendly': return 'text-green-400 border-green-500/50';
            case 'hostile': return 'text-red-400 border-red-500/50';
            default: return 'text-yellow-400 border-yellow-500/50';
        }
    };

    const getAttitudeIcon = (att?: string) => {
        switch(att) {
            case 'friendly': return <Smile className="w-4 h-4"/>;
            case 'hostile': return <Frown className="w-4 h-4"/>;
            default: return <Meh className="w-4 h-4"/>;
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
                                <Sparkles className="w-5 h-5"/> AI Мастер NPC
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
                                        <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Ключевые слова</label>
                                        <input 
                                            className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" 
                                            placeholder="Напр. старый гном кузнец, ворчливый..." 
                                            value={aiInput} 
                                            onChange={e => setAiInput(e.target.value)} 
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="h-full flex flex-col">
                                    <label className="text-xs text-gray-500 uppercase font-bold block mb-1">Текст описания</label>
                                    <textarea 
                                        className="w-full flex-1 bg-gray-800 border border-gray-600 rounded p-2 text-white text-sm resize-none focus:border-gold-500 outline-none min-h-[150px]"
                                        placeholder="Вставьте описание из книги или чата..."
                                        value={aiInput}
                                        onChange={e => setAiInput(e.target.value)}
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

            {/* Sidebar List */}
            <div className={`w-full ${isEditing ? 'hidden lg:flex lg:w-1/3' : 'flex'} flex-col bg-dnd-dark border-r border-gray-700`}>
                <div className="p-4 border-b border-gray-700 space-y-3">
                    <div className="flex justify-between items-center">
                        <h2 className="font-serif font-bold text-2xl text-gold-500 flex items-center gap-2">
                            <Users className="w-6 h-6"/> NPC
                        </h2>
                        <div className="flex gap-2">
                            <button onClick={() => setShowAiModal(true)} className="text-indigo-400 hover:text-indigo-300 p-2 bg-indigo-900/30 rounded border border-indigo-800/50 transition-colors" title="AI Мастер">
                                <Sparkles className="w-5 h-5"/>
                            </button>
                            <button onClick={handleAdd} className="bg-gold-600 hover:bg-gold-500 text-black p-2 rounded font-bold shadow-lg">
                                <UserPlus className="w-5 h-5"/>
                            </button>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-2 top-2 w-4 h-4 text-gray-500"/>
                            <input 
                                className="w-full bg-gray-800 border border-gray-600 rounded pl-8 pr-2 py-1.5 text-sm text-white focus:border-gold-500 outline-none"
                                placeholder="Имя, раса..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                        <div className="relative w-1/3">
                            <select 
                                className="w-full bg-gray-800 border border-gray-600 rounded pl-2 pr-6 py-1.5 text-sm text-white appearance-none focus:border-gold-500 outline-none"
                                value={filterLoc}
                                onChange={e => setFilterLoc(e.target.value)}
                            >
                                <option value="">Все места</option>
                                {locations.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                            <Filter className="absolute right-2 top-2 w-3 h-3 text-gray-500 pointer-events-none"/>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                    {filteredNpcs.map(npc => (
                        <div 
                            key={npc.id}
                            onClick={() => handleEdit(npc)}
                            className={`p-3 rounded border cursor-pointer transition-all flex gap-3 hover:bg-gray-800 ${editingId === npc.id ? 'bg-gray-800 border-gold-500 shadow-md' : 'bg-dnd-card border-gray-700'} ${npc.status === 'dead' ? 'opacity-50 grayscale' : ''}`}
                        >
                            {npc.imageUrl ? (
                                <img src={npc.imageUrl} className="w-12 h-12 rounded object-cover border border-gray-600" alt={npc.name}/>
                            ) : (
                                <div className="w-12 h-12 rounded bg-gray-700 flex items-center justify-center text-gold-500 font-serif font-bold text-xl border border-gray-600">
                                    {npc.name.charAt(0)}
                                </div>
                            )}
                            
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h4 className={`font-bold truncate ${npc.status === 'dead' ? 'line-through decoration-red-500' : 'text-gray-200'}`}>{npc.name}</h4>
                                    <div className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border ${getAttitudeColor(npc.attitude)}`}>
                                        {getAttitudeIcon(npc.attitude)}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                    <span className="truncate">{npc.race} {npc.class}</span>
                                    <span className="flex items-center gap-0.5 text-gray-600"><MapPin className="w-3 h-3"/> {npc.location}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredNpcs.length === 0 && <div className="text-center text-gray-500 mt-10 text-sm">Список пуст.</div>}
                </div>
            </div>

            {/* Edit/Detail View */}
            {(isEditing || editingId) && (
                <div className="flex-1 flex flex-col bg-dnd-darker border-l border-gray-700 overflow-hidden absolute inset-0 lg:static z-20">
                    <div className="p-4 border-b border-gray-700 bg-dnd-card flex justify-between items-center shrink-0">
                        <h3 className="font-serif font-bold text-xl text-white">{formData.id ? 'Редактирование NPC' : 'Новый NPC'}</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleEnhanceNpc}
                                disabled={enhancing || !formData.name}
                                className="p-2 bg-indigo-900/50 text-indigo-200 hover:bg-indigo-800 rounded border border-indigo-800 transition-colors disabled:opacity-50"
                                title="Улучшить с помощью AI"
                            >
                                {enhancing ? <Loader className="w-5 h-5 animate-spin"/> : <Wand2 className="w-5 h-5"/>}
                            </button>
                            {editingId && (
                                <button onClick={() => handleDelete(editingId)} className="text-gray-500 hover:text-red-500 p-2 rounded hover:bg-gray-800">
                                    <Trash2 className="w-5 h-5"/>
                                </button>
                            )}
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white lg:hidden p-2">
                                <X className="w-6 h-6"/>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
                        
                        <div className="flex flex-col md:flex-row gap-4 items-start">
                            {/* Image Section */}
                            <div className="w-full md:w-40 flex flex-col gap-2 shrink-0">
                                <div className="aspect-square bg-gray-900 rounded-lg border border-gray-700 flex items-center justify-center overflow-hidden relative group shadow-lg">
                                    {formData.imageUrl ? (
                                        <img src={formData.imageUrl} className="w-full h-full object-cover" />
                                    ) : (
                                        <Users className="w-16 h-16 text-gray-600"/>
                                    )}
                                    
                                    {imageLoading && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20"><Loader className="w-8 h-8 animate-spin text-gold-500"/></div>
                                    )}

                                    {/* Image Overlay Controls */}
                                    <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 z-10">
                                        <button 
                                            onClick={generatePortrait}
                                            disabled={imageLoading || !formData.name}
                                            className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-500 w-28 flex items-center justify-center gap-1"
                                        >
                                            <Sparkles className="w-3 h-3"/> AI Портрет
                                        </button>
                                        
                                        <button 
                                            onClick={triggerFileInput}
                                            className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500 w-28 flex items-center justify-center gap-1"
                                        >
                                            <Upload className="w-3 h-3"/> Загрузить
                                        </button>
                                        
                                        {formData.imageUrl && (
                                            <button 
                                                onClick={handleDownloadImage}
                                                className="text-xs bg-gray-600 text-white px-3 py-1 rounded hover:bg-gray-500 w-28 flex items-center justify-center gap-1"
                                            >
                                                <Download className="w-3 h-3"/> Скачать
                                            </button>
                                        )}
                                    </div>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*" 
                                        onChange={handleFileUpload} 
                                    />
                                </div>
                            </div>

                            {/* Main Stats */}
                            <div className="flex-1 w-full space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase font-bold">Имя</label>
                                        <input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" 
                                            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Имя персонажа" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs text-gray-500 uppercase font-bold">Локация</label>
                                        <input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white focus:border-gold-500 outline-none" 
                                            value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="Где находится?" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Раса</label>
                                        <input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-xs text-white" 
                                            value={formData.race} onChange={e => setFormData({...formData, race: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Класс/Роль</label>
                                        <input className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-xs text-white" 
                                            value={formData.class} onChange={e => setFormData({...formData, class: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Статус</label>
                                        <select className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-xs text-white outline-none" 
                                            value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                                            <option value="alive">Жив</option>
                                            <option value="dead">Мертв</option>
                                            <option value="missing">Пропал</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 uppercase font-bold">Отношение</label>
                                        <select className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-xs text-white outline-none" 
                                            value={formData.attitude} onChange={e => setFormData({...formData, attitude: e.target.value as any})}>
                                            <option value="friendly">Друг</option>
                                            <option value="neutral">Нейтрал</option>
                                            <option value="hostile">Враг</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                                    <MessageSquare className="w-3 h-3"/> Описание и Внешность
                                </label>
                                <textarea className="w-full bg-gray-900/50 border border-gray-700 rounded p-3 text-sm text-gray-300 h-32 resize-none outline-none focus:border-gold-500"
                                    value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Как выглядит, во что одет..." />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                                    <Heart className="w-3 h-3"/> Характер и Голос
                                </label>
                                <textarea className="w-full bg-gray-900/50 border border-gray-700 rounded p-3 text-sm text-gray-300 h-32 resize-none outline-none focus:border-gold-500"
                                    value={formData.personality} onChange={e => setFormData({...formData, personality: e.target.value})} placeholder="Черты характера, манера речи..." />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-gray-500 uppercase font-bold flex items-center gap-2">
                                <ScrollText className="w-3 h-3"/> Заметки Мастера (Секреты, Квесты)
                            </label>
                            <textarea className="w-full bg-gray-900/50 border border-gray-700 rounded p-3 text-sm text-gray-300 h-40 resize-y outline-none focus:border-gold-500 font-mono"
                                value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Скрытая информация..." />
                        </div>

                        {formData.hook && (
                            <div className="bg-indigo-900/20 border border-indigo-500/30 p-3 rounded">
                                <span className="text-xs text-indigo-400 font-bold uppercase block mb-1">Сюжетный Крючок</span>
                                <p className="text-sm text-indigo-200">{formData.hook}</p>
                            </div>
                        )}

                    </div>

                    <div className="p-4 bg-dnd-card border-t border-gray-700 flex justify-between items-center shrink-0">
                        <div className="flex gap-2">
                            {editingId && (
                                <button 
                                    onClick={() => sendToCombat(formData as CampaignNpc)}
                                    className="px-4 py-2 bg-red-900/50 hover:bg-red-900 border border-red-700 rounded text-red-200 font-bold text-sm flex items-center gap-2"
                                >
                                    <Swords className="w-4 h-4"/> В бой
                                </button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-400 hover:text-white font-bold text-sm">Отмена</button>
                            <button onClick={handleSave} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black rounded font-bold text-sm flex items-center gap-2 shadow-lg">
                                <Save className="w-4 h-4"/> Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NpcTracker;
