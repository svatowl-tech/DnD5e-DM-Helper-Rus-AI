
import React, { useState } from 'react';
import { PartyStash, InventoryItem, Wallet } from '../../types';
import { Archive, X, Coins, Plus, Info, Divide } from 'lucide-react';

interface PartyStashPanelProps {
    stash: PartyStash;
    onClose: () => void;
    onUpdateWallet: (type: keyof Wallet, value: number) => void;
    onAddItem: (item: InventoryItem) => void;
    onRemoveItem: (id: string) => void;
    onInspectItem: (item: InventoryItem) => void;
    onSplitGold: () => void;
}

const PartyStashPanel: React.FC<PartyStashPanelProps> = ({
    stash, onClose, onUpdateWallet, onAddItem, onRemoveItem, onInspectItem, onSplitGold
}) => {
    const [newItemName, setNewItemName] = useState('');

    const handleAdd = () => {
        if (!newItemName.trim()) return;
        const item: InventoryItem = {
            id: Date.now().toString(),
            name: newItemName,
            quantity: 1
        };
        onAddItem(item);
        setNewItemName('');
    };

    return (
        <div className="bg-gray-900 border-2 border-indigo-500/50 p-4 rounded-lg shadow-lg animate-in slide-in-from-top-2 shrink-0 mb-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-indigo-300 flex items-center gap-2"><Archive className="w-5 h-5"/> Партийная Казна и Мешок</h3>
                <button onClick={onClose} className="text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Wallet */}
                <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs text-gold-500 uppercase font-bold flex items-center gap-2"><Coins className="w-3 h-3"/> Казна</h4>
                        <button onClick={onSplitGold} className="text-xs bg-green-900/50 text-green-300 hover:bg-green-800 px-2 py-1 rounded flex items-center gap-1" title="Разделить поровну между активными">
                            <Divide className="w-3 h-3"/> Разделить
                        </button>
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-yellow-600/30">
                            <input type="number" className="w-16 bg-transparent text-yellow-400 font-mono font-bold text-right outline-none" value={stash.wallet.gp} onChange={e => onUpdateWallet('gp', Number(e.target.value))} />
                            <span className="text-xs text-yellow-600 font-bold">зм</span>
                        </div>
                        <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-gray-400/30">
                            <input type="number" className="w-12 bg-transparent text-gray-300 font-mono font-bold text-right outline-none" value={stash.wallet.sp} onChange={e => onUpdateWallet('sp', Number(e.target.value))} />
                            <span className="text-xs text-gray-500 font-bold">см</span>
                        </div>
                        <div className="flex items-center gap-1 bg-black/30 rounded px-2 py-1 border border-orange-700/30">
                            <input type="number" className="w-12 bg-transparent text-orange-300 font-mono font-bold text-right outline-none" value={stash.wallet.cp} onChange={e => onUpdateWallet('cp', Number(e.target.value))} />
                            <span className="text-xs text-orange-700 font-bold">мм</span>
                        </div>
                    </div>
                </div>
                
                {/* Items */}
                <div className="bg-gray-800/50 p-3 rounded border border-gray-700 flex flex-col">
                    <div className="flex gap-2 mb-2">
                        <input 
                            className="flex-1 bg-black/30 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                            placeholder="Добавить в мешок..."
                            value={newItemName}
                            onChange={e => setNewItemName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        />
                        <button onClick={handleAdd} className="text-indigo-400 hover:text-white"><Plus className="w-4 h-4"/></button>
                    </div>
                    <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar">
                        {stash.items.length === 0 && <span className="text-xs text-gray-600 italic text-center block">Пусто</span>}
                        {stash.items.map(item => (
                            <div 
                                key={item.id} 
                                className="flex justify-between items-center group text-sm bg-black/20 px-2 py-2 rounded cursor-pointer hover:bg-black/40 active:bg-indigo-900/30"
                                onClick={() => onInspectItem(item)}
                            >
                                <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                    <span className="text-indigo-200 truncate">{item.name}</span>
                                    {item.description && <Info className="w-3 h-3 text-gray-500 shrink-0"/>}
                                </div>
                                <span className="text-xs text-gray-500">x{item.quantity}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartyStashPanel;
