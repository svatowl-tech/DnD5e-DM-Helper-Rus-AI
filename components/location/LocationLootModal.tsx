
import React, { useState } from 'react';
import { X, Sparkles, Plus, Trash2, Package, Archive, Loader, ArrowRightCircle } from 'lucide-react';
import { LocationData, TrackedItem } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { generateItemStats } from '../../services/entityService';

interface LocationLootModalProps {
    isOpen: boolean;
    onClose: () => void;
    location: LocationData;
    setLocation: (l: LocationData) => void; // To update simple loot strings
    trackedLoot: TrackedItem[];
}

const LocationLootModal: React.FC<LocationLootModalProps> = ({ isOpen, onClose, location, setLocation, trackedLoot }) => {
    const { showToast } = useToast();
    const [newSimpleLoot, setNewSimpleLoot] = useState('');
    const [convertingIndex, setConvertingIndex] = useState<number | null>(null);

    if (!isOpen) return null;

    const handleAddSimple = () => {
        if (!newSimpleLoot.trim()) return;
        const updated = { ...location, loot: [...(location.loot || []), newSimpleLoot] };
        setLocation(updated);
        setNewSimpleLoot('');
    };

    const handleRemoveSimple = (index: number) => {
        const updatedLoot = [...(location.loot || [])];
        updatedLoot.splice(index, 1);
        setLocation({ ...location, loot: updatedLoot });
    };

    const handleConvert = async (itemString: string, index: number) => {
        setConvertingIndex(index);
        try {
            // 1. Generate stats
            const stats = await generateItemStats(itemString, `Лута в локации ${location.name}`);
            
            // 2. Create TrackedItem
            const newItem: TrackedItem = {
                id: Date.now().toString(),
                name: stats.name || itemString,
                description: (stats.description || '') + (stats.mechanics ? `\n\n[Механика]: ${stats.mechanics}` : ''),
                category: stats.category || 'Лут',
                value: stats.cost,
                quantity: 1,
                status: 'location',
                ownerId: location.id,
                ownerName: location.name
            };

            // 3. Dispatch creation event
            // Note: We need to append to global storage, this usually done via event in App.tsx or direct logic.
            // Since we don't have direct setEquipment here, we use the event system which App.tsx listens to,
            // OR we do a direct localStorage write for immediate update if the listener isn't sufficient for specific 'location' status logic.
            // Let's assume standard event is best, but we need a specific one for "add tracked item".
            // Since `dmc-track-loot` adds to 'unassigned', we might need a custom approach or just reuse `dmc-track-loot` and then update it?
            // Actually, let's manually update localStorage to be safe and dispatch update.
            const currentEq = JSON.parse(localStorage.getItem('dmc_equipment') || '[]');
            localStorage.setItem('dmc_equipment', JSON.stringify([newItem, ...currentEq]));
            window.dispatchEvent(new Event('dmc-update-equipment'));

            // 4. Remove from simple strings
            handleRemoveSimple(index);
            showToast("Предмет создан и привязан к локации", "success");

        } catch (e: any) {
            showToast("Ошибка конвертации: " + e.message, "error");
        } finally {
            setConvertingIndex(null);
        }
    };

    const handleAddToStash = (item: TrackedItem) => {
        window.dispatchEvent(new CustomEvent('dmc-add-to-stash', {
             detail: { itemName: item.name, itemDescription: item.description }
        }));
        // Optional: remove from location? usually we keep it or move it.
        // Let's change status to stash
        const currentEq = JSON.parse(localStorage.getItem('dmc_equipment') || '[]');
        const updatedEq = currentEq.map((i: TrackedItem) => i.id === item.id ? { ...i, status: 'stash', ownerId: 'stash', ownerName: 'Казна' } : i);
        localStorage.setItem('dmc_equipment', JSON.stringify(updatedEq));
        window.dispatchEvent(new Event('dmc-update-equipment'));
        showToast("Перемещено в казну", "success");
    };

    return (
        <div className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-2xl rounded-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2">
                        <Package className="w-5 h-5"/> Ценности Локации
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-gray-900/50 custom-scrollbar space-y-6">
                    
                    {/* Section 1: Abstract Loot (Strings) */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 flex items-center justify-between">
                            <span>Заметки о луте</span>
                            <span className="text-[10px] bg-gray-800 px-2 rounded">{location.loot?.length || 0}</span>
                        </h4>
                        <div className="space-y-2">
                            {(location.loot || []).map((l, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-gray-800 p-3 rounded border border-gray-700">
                                    <span className="text-sm text-gray-300 truncate flex-1 mr-4">{l}</span>
                                    <div className="flex gap-2 shrink-0">
                                        <button 
                                            onClick={() => handleConvert(l, idx)} 
                                            disabled={convertingIndex === idx}
                                            className="text-xs bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800 border border-indigo-700 px-2 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                                            title="Превратить в полноценный предмет с механикой"
                                        >
                                            {convertingIndex === idx ? <Loader className="w-3 h-3 animate-spin"/> : <Sparkles className="w-3 h-3"/>}
                                            Создать
                                        </button>
                                        <button onClick={() => handleRemoveSimple(idx)} className="text-gray-500 hover:text-red-500 p-1">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {(location.loot || []).length === 0 && <p className="text-xs text-gray-600 italic">Нет записей.</p>}
                            
                            <div className="flex gap-2 mt-2">
                                <input 
                                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-sm text-white"
                                    placeholder="Добавить заметку..."
                                    value={newSimpleLoot}
                                    onChange={e => setNewSimpleLoot(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleAddSimple()}
                                />
                                <button onClick={handleAddSimple} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded"><Plus className="w-4 h-4"/></button>
                            </div>
                        </div>
                    </div>

                    {/* Section 2: Tracked Items */}
                    <div className="pt-4 border-t border-gray-700">
                         <h4 className="text-xs font-bold text-gold-500 uppercase mb-2 flex items-center justify-between">
                            <span>Найденные предметы (Equipment)</span>
                            <span className="text-[10px] bg-gray-800 px-2 rounded text-gold-500">{trackedLoot.length}</span>
                        </h4>
                        <div className="space-y-2">
                            {trackedLoot.map(item => (
                                <div key={item.id} className="flex items-center justify-between bg-black/30 p-3 rounded border border-gold-900/30 hover:border-gold-600/50 transition-colors">
                                    <div className="flex-1 mr-4">
                                        <div className="font-bold text-gray-200 text-sm">{item.name}</div>
                                        <div className="text-xs text-gray-500">{item.category} • {item.value || '—'}</div>
                                    </div>
                                    <button 
                                        onClick={() => handleAddToStash(item)}
                                        className="text-xs bg-yellow-900/30 text-yellow-200 hover:bg-yellow-800 border border-yellow-700 px-3 py-1.5 rounded flex items-center gap-2"
                                    >
                                        <Archive className="w-3 h-3"/> В Казну
                                    </button>
                                </div>
                            ))}
                            {trackedLoot.length === 0 && <p className="text-xs text-gray-600 italic">Здесь пока нет материальных предметов.</p>}
                        </div>
                    </div>

                </div>
                <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end">
                    <button onClick={onClose} className="bg-gray-800 hover:bg-gray-700 text-white px-6 py-2 rounded font-bold text-sm">Закрыть</button>
                </div>
            </div>
        </div>
    );
};

export default LocationLootModal;
