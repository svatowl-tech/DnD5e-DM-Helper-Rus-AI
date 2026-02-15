
import React, { useState, useEffect } from 'react';
import { TrackedItem, PartyMember, CampaignNpc, LocationData } from '../types';
import { Package, Search, Filter, Plus, Trash2, User, MapPin, Archive, Shield, Edit2, Save, X, ArrowRight, Sparkles, Loader } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { generateItemStats } from '../services/entityService';

const STATUS_FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'unassigned', label: 'Бесхозное' },
    { id: 'party', label: 'У Группы' },
    { id: 'stash', label: 'В Казне' },
    { id: 'npc', label: 'У NPC' },
    { id: 'location', label: 'В Локации' },
];

const EquipmentTracker: React.FC = () => {
    const { showToast } = useToast();
    const [items, setItems] = useState<TrackedItem[]>(() => {
        const saved = localStorage.getItem('dmc_equipment');
        return saved ? JSON.parse(saved) : [];
    });
    
    // Data sources for assignment
    const [party, setParty] = useState<PartyMember[]>([]);
    const [npcs, setNpcs] = useState<CampaignNpc[]>([]);
    const [locations, setLocations] = useState<LocationData[]>([]);
    
    // UI State
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Partial<TrackedItem>>({});
    const [aiLoading, setAiLoading] = useState(false);
    
    // Assignment Modal
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [assignTargetType, setAssignTargetType] = useState<'party' | 'npc' | 'location' | 'stash' | 'unassigned'>('party');
    const [assignTargetId, setAssignTargetId] = useState('');

    useEffect(() => {
        localStorage.setItem('dmc_equipment', JSON.stringify(items));
    }, [items]);

    useEffect(() => {
        // Load auxiliary data
        const savedParty = localStorage.getItem('dmc_party');
        if (savedParty) setParty(JSON.parse(savedParty));

        const savedNpcs = localStorage.getItem('dmc_npcs');
        if (savedNpcs) setNpcs(JSON.parse(savedNpcs));

        const savedLore = localStorage.getItem('dmc_lore');
        if (savedLore) {
            const lore = JSON.parse(savedLore);
            const flatLocs = lore.flatMap((r: any) => r.locations);
            setLocations(flatLocs);
        }

        const handleUpdate = () => {
             const saved = localStorage.getItem('dmc_equipment');
             if (saved) setItems(JSON.parse(saved));
        };
        window.addEventListener('dmc-update-equipment', handleUpdate);
        return () => window.removeEventListener('dmc-update-equipment', handleUpdate);
    }, []);

    const filteredItems = items.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase()) || 
                              (item.description && item.description.toLowerCase().includes(search.toLowerCase())) ||
                              (item.ownerName && (item.ownerName.toLowerCase().includes(search.toLowerCase())));
        
        const matchesStatus = filterStatus === 'all' ? true : item.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleCreate = () => {
        setEditingItem({
            id: Date.now().toString(),
            name: '',
            description: '',
            quantity: 1,
            status: 'unassigned',
            category: 'Снаряжение'
        });
        setIsEditModalOpen(true);
    };

    const handleAiGenerate = async () => {
        if (!editingItem.name) {
            showToast("Введите хотя бы название для генерации", "warning");
            return;
        }
        setAiLoading(true);
        try {
            const result = await generateItemStats(editingItem.name, editingItem.description);
            setEditingItem(prev => ({
                ...prev,
                name: result.name || prev.name,
                category: result.category || prev.category,
                description: (result.description || '') + (result.mechanics ? `\n\n[Механика]: ${result.mechanics}` : ''),
                value: result.cost
            }));
            showToast("Предмет сгенерирован", "success");
        } catch (e: any) {
            showToast("Ошибка генерации: " + e.message, "error");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSaveItem = () => {
        if (!editingItem.name) return;
        const newItem = {
            id: editingItem.id || Date.now().toString(),
            name: editingItem.name,
            description: editingItem.description || '',
            quantity: editingItem.quantity || 1,
            status: editingItem.status || 'unassigned',
            category: editingItem.category || 'Снаряжение',
            ownerId: editingItem.ownerId,
            ownerName: editingItem.ownerName
        } as TrackedItem;

        setItems(prev => {
            const exists = prev.find(i => i.id === newItem.id);
            if (exists) return prev.map(i => i.id === newItem.id ? newItem : i);
            return [newItem, ...prev];
        });
        setIsEditModalOpen(false);
        window.dispatchEvent(new Event('dmc-update-equipment'));
        showToast("Предмет сохранен", "success");
    };

    const handleDelete = (id: string) => {
        if (confirm("Удалить предмет из базы?")) {
            setItems(prev => prev.filter(i => i.id !== id));
            window.dispatchEvent(new Event('dmc-update-equipment'));
        }
    };

    const openAssignModal = (item: TrackedItem) => {
        setEditingItem(item);
        setAssignTargetType(item.status === 'unassigned' ? 'party' : item.status as any);
        setAssignTargetId(item.ownerId || '');
        setIsAssignModalOpen(true);
    };

    const performAssignment = () => {
        if (!editingItem.id) return;
        
        let ownerName = '';
        if (assignTargetType === 'party') {
            ownerName = party.find(p => p.id === assignTargetId)?.name || 'Неизвестный герой';
        } else if (assignTargetType === 'npc') {
            ownerName = npcs.find(n => n.id === assignTargetId)?.name || 'Неизвестный NPC';
        } else if (assignTargetType === 'location') {
            ownerName = locations.find(l => l.name === assignTargetId)?.name || 'Локация'; 
        } else if (assignTargetType === 'stash') {
            ownerName = 'Общая Казна';
        } else {
            ownerName = '';
        }

        const updatedItem: TrackedItem = {
            ...(editingItem as TrackedItem),
            status: assignTargetType,
            ownerId: assignTargetId,
            ownerName: ownerName
        };

        setItems(prev => prev.map(i => i.id === updatedItem.id ? updatedItem : i));
        window.dispatchEvent(new Event('dmc-update-equipment'));

        // Dispatch specific events for Party/Stash interactions to update their local states
        if (assignTargetType === 'party') {
             window.dispatchEvent(new CustomEvent('dmc-give-item', { 
                 detail: { memberId: assignTargetId, itemName: updatedItem.name, itemDescription: updatedItem.description }
             }));
        } else if (assignTargetType === 'stash') {
             window.dispatchEvent(new CustomEvent('dmc-add-to-stash', {
                 detail: { itemName: updatedItem.name, itemDescription: updatedItem.description }
             }));
        }
        
        setIsAssignModalOpen(false);
        showToast(`Предмет перемещен: ${ownerName}`, "success");
    };

    const getStatusIcon = (status: string) => {
        switch(status) {
            case 'party': return <Shield className="w-3 h-3 text-blue-400"/>;
            case 'npc': return <User className="w-3 h-3 text-purple-400"/>;
            case 'location': return <MapPin className="w-3 h-3 text-green-400"/>;
            case 'stash': return <Archive className="w-3 h-3 text-yellow-400"/>;
            default: return <Package className="w-3 h-3 text-gray-500"/>;
        }
    };

    return (
        <div className="h-full flex flex-col gap-4">
             {/* Header */}
             <div className="flex flex-col md:flex-row justify-between items-center bg-dnd-card p-4 rounded-lg border border-gray-700 gap-4 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-900 rounded border border-gray-700">
                        <Package className="w-6 h-6 text-gold-500"/>
                    </div>
                    <div>
                        <h2 className="text-xl font-serif font-bold text-white">Арсенал и Снаряжение</h2>
                        <p className="text-xs text-gray-400">Централизованный реестр всех предметов кампании.</p>
                    </div>
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500"/>
                        <input 
                            className="w-full bg-gray-900 border border-gray-600 rounded pl-9 pr-3 py-2 text-sm text-white focus:border-gold-500 outline-none"
                            placeholder="Поиск предметов..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <button onClick={handleCreate} className="bg-gold-600 hover:bg-gold-500 text-black px-4 py-2 rounded font-bold flex items-center gap-2">
                        <Plus className="w-4 h-4"/> <span className="hidden sm:inline">Создать</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2 shrink-0 no-scrollbar">
                {STATUS_FILTERS.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setFilterStatus(filter.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${filterStatus === filter.id ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'}`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto bg-gray-900/50 rounded-lg border border-gray-800 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-900 text-gray-500 text-xs uppercase sticky top-0 z-10">
                        <tr>
                            <th className="p-3 font-bold border-b border-gray-800">Предмет</th>
                            <th className="p-3 font-bold border-b border-gray-800 hidden sm:table-cell">Тип</th>
                            <th className="p-3 font-bold border-b border-gray-800">Статус / Владелец</th>
                            <th className="p-3 font-bold border-b border-gray-800 text-right">Действия</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm text-gray-300 divide-y divide-gray-800">
                        {filteredItems.length === 0 && (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-600 italic">Список пуст.</td></tr>
                        )}
                        {filteredItems.map(item => (
                            <tr key={item.id} className="hover:bg-gray-800/50 transition-colors group">
                                <td className="p-3">
                                    <div className="font-bold text-white">{item.name} <span className="text-xs text-gray-500 font-normal">x{item.quantity}</span></div>
                                    {item.description && <div className="text-xs text-gray-500 truncate max-w-[200px]">{item.description}</div>}
                                </td>
                                <td className="p-3 hidden sm:table-cell">
                                    <span className="bg-gray-800 border border-gray-700 px-2 py-0.5 rounded text-[10px] uppercase text-gray-400">{item.category || 'Разное'}</span>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(item.status)}
                                        <span className="truncate max-w-[120px]">{item.ownerName || (item.status === 'unassigned' ? 'Бесхозное' : item.status)}</span>
                                    </div>
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openAssignModal(item)} className="p-1.5 bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 rounded border border-blue-900/50" title="Назначить">
                                            <ArrowRight className="w-4 h-4"/>
                                        </button>
                                        <button onClick={() => { setEditingItem(item); setIsEditModalOpen(true); }} className="p-1.5 bg-gray-800 text-gray-400 hover:text-white rounded border border-gray-700">
                                            <Edit2 className="w-4 h-4"/>
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="p-1.5 bg-red-900/20 text-red-500 hover:bg-red-900/40 rounded border border-red-900/30">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-dnd-card border border-gold-600 w-full max-w-md rounded-lg shadow-2xl p-6">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-serif font-bold text-xl text-white">Предмет</h3>
                             <button onClick={handleAiGenerate} disabled={aiLoading || !editingItem.name} className="text-xs bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 px-3 py-1 rounded flex items-center gap-2 transition-colors disabled:opacity-50">
                                 {aiLoading ? <Loader className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>} AI Генерация
                             </button>
                        </div>
                        
                        <div className="space-y-4">
                             <input className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" placeholder="Название" value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} autoFocus/>
                             <div className="grid grid-cols-2 gap-2">
                                <input className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" placeholder="Тип (Оружие, Лут...)" value={editingItem.category} onChange={e => setEditingItem({...editingItem, category: e.target.value})}/>
                                <input type="number" className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white" placeholder="Кол-во" value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: parseInt(e.target.value) || 1})}/>
                             </div>
                             <textarea className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white h-32 resize-none text-xs" placeholder="Описание и механика..." value={editingItem.description} onChange={e => setEditingItem({...editingItem, description: e.target.value})}/>
                             <div className="flex justify-end gap-2 pt-2">
                                 <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Отмена</button>
                                 <button onClick={handleSaveItem} className="px-6 py-2 bg-gold-600 text-black font-bold rounded">Сохранить</button>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {isAssignModalOpen && (
                <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-dnd-card border border-blue-500 w-full max-w-md rounded-lg shadow-2xl p-6">
                        <h3 className="font-serif font-bold text-xl text-white mb-2">Назначить предмет</h3>
                        <p className="text-gray-400 text-sm mb-4">Кому передать <b>"{editingItem.name}"</b>?</p>
                        
                        <div className="space-y-4">
                            <div className="flex gap-2 bg-gray-900 p-1 rounded overflow-x-auto no-scrollbar">
                                <button onClick={() => setAssignTargetType('party')} className={`px-3 py-1.5 text-xs font-bold rounded whitespace-nowrap ${assignTargetType === 'party' ? 'bg-blue-600 text-white' : 'text-gray-400'}`}>Группа</button>
                                <button onClick={() => setAssignTargetType('stash')} className={`px-3 py-1.5 text-xs font-bold rounded whitespace-nowrap ${assignTargetType === 'stash' ? 'bg-yellow-600 text-black' : 'text-gray-400'}`}>Казна</button>
                                <button onClick={() => setAssignTargetType('npc')} className={`px-3 py-1.5 text-xs font-bold rounded whitespace-nowrap ${assignTargetType === 'npc' ? 'bg-purple-600 text-white' : 'text-gray-400'}`}>NPC</button>
                                <button onClick={() => setAssignTargetType('location')} className={`px-3 py-1.5 text-xs font-bold rounded whitespace-nowrap ${assignTargetType === 'location' ? 'bg-green-600 text-white' : 'text-gray-400'}`}>Локация</button>
                                <button onClick={() => { setAssignTargetType('unassigned'); setAssignTargetId(''); }} className={`px-3 py-1.5 text-xs font-bold rounded whitespace-nowrap ${assignTargetType === 'unassigned' ? 'bg-gray-600 text-white' : 'text-gray-400'}`}>Сброс</button>
                            </div>

                            {assignTargetType === 'party' && (
                                <select className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" value={assignTargetId} onChange={e => setAssignTargetId(e.target.value)}>
                                    <option value="">Выберите героя...</option>
                                    {party.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            )}

                            {assignTargetType === 'npc' && (
                                <select className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" value={assignTargetId} onChange={e => setAssignTargetId(e.target.value)}>
                                    <option value="">Выберите NPC...</option>
                                    {npcs.map(n => <option key={n.id} value={n.id}>{n.name} ({n.race})</option>)}
                                </select>
                            )}

                             {assignTargetType === 'location' && (
                                <select className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-white" value={assignTargetId} onChange={e => setAssignTargetId(e.target.value)}>
                                    <option value="">Выберите локацию...</option>
                                    {locations.map((l, i) => <option key={i} value={l.name}>{l.name}</option>)}
                                </select>
                            )}

                            {assignTargetType === 'stash' && (
                                <div className="p-3 bg-yellow-900/20 border border-yellow-700/50 rounded text-yellow-200 text-sm text-center">
                                    Предмет будет перемещен в Общую Партийную Казну.
                                </div>
                            )}

                             {assignTargetType === 'unassigned' && (
                                <div className="p-3 bg-gray-800 border border-gray-700 rounded text-gray-400 text-sm text-center">
                                    Предмет станет "бесхозным" и вернется в общий пул.
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-2">
                                 <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white">Отмена</button>
                                 <button onClick={performAssignment} className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded">Назначить</button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EquipmentTracker;
