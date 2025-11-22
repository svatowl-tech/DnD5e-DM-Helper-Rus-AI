
import React, { useState, useEffect } from 'react';
import { PartyMember, InventoryItem, PartyManagerProps } from '../types';
import { Users, Shield, Heart, Eye, Trash2, Edit2, Plus, Save, X, CheckCircle, Circle, Backpack, Star, TrendingUp } from 'lucide-react';

const PartyManager: React.FC<PartyManagerProps> = ({ addLog }) => {
  const [party, setParty] = useState<PartyMember[]>(() => {
    const saved = localStorage.getItem('dmc_party');
    return saved ? JSON.parse(saved) : [];
  });

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PartyMember>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInventoryId, setShowInventoryId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');

  // Auto-save to local storage
  useEffect(() => {
    localStorage.setItem('dmc_party', JSON.stringify(party));
  }, [party]);

  // Listen for external party updates (e.g. XP from global handler)
  useEffect(() => {
      const handleUpdateParty = () => {
          const saved = localStorage.getItem('dmc_party');
          if (saved) {
              setParty(JSON.parse(saved));
          }
      };

      window.addEventListener('dmc-update-party', handleUpdateParty);
      return () => window.removeEventListener('dmc-update-party', handleUpdateParty);
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm('Удалить персонажа из кампании?')) {
      setParty(prev => prev.filter(p => p.id !== id));
    }
  };

  const toggleActive = (id: string) => {
    setParty(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  const startEdit = (member: PartyMember) => {
    setIsEditing(member.id);
    setEditForm(member);
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setIsEditing(null);
    setEditForm({});
    setShowAddForm(false);
  };

  const saveMember = () => {
    if (!editForm.name) return;

    const newMember: PartyMember = {
      id: editForm.id || Date.now().toString(),
      name: editForm.name || 'Безымянный',
      race: editForm.race || '',
      class: editForm.class || '',
      level: Number(editForm.level) || 1,
      xp: Number(editForm.xp) || 0,
      maxHp: Number(editForm.maxHp) || 10,
      ac: Number(editForm.ac) || 10,
      passivePerception: Number(editForm.passivePerception) || 10,
      notes: editForm.notes || '',
      active: editForm.active ?? true,
      inventory: editForm.inventory || []
    };

    if (isEditing) {
      setParty(prev => prev.map(p => p.id === isEditing ? newMember : p));
    } else {
      setParty(prev => [...prev, newMember]);
    }
    cancelEdit();
  };

  const addItem = (memberId: string) => {
    if (!newItem.trim()) return;
    const item: InventoryItem = {
        id: Date.now().toString(),
        name: newItem,
        quantity: 1
    };
    setParty(prev => prev.map(p => {
        if (p.id === memberId) {
            return { ...p, inventory: [...(p.inventory || []), item] };
        }
        return p;
    }));
    setNewItem('');
  };

  const removeItem = (memberId: string, itemId: string) => {
     setParty(prev => prev.map(p => {
        if (p.id === memberId) {
            return { ...p, inventory: p.inventory.filter(i => i.id !== itemId) };
        }
        return p;
    }));
  };

  // Helper for XP bar (visual only)
  const XP_TABLE: Record<number, number> = {
    1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500, 6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
    11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000, 16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000
  };

  const getNextLevelXp = (level: number) => {
      if (level >= 20) return 355000;
      return XP_TABLE[level + 1] || 0;
  };

  return (
    <div className="h-full flex flex-col space-y-4">
      <div className="flex justify-between items-center border-b border-gray-700 pb-4">
        <div>
            <h2 className="text-2xl font-serif font-bold text-gold-500 flex items-center gap-2">
            <Users className="w-6 h-6" /> Герои Кампании
            </h2>
            <p className="text-sm text-gray-400">Управляйте составом группы. Отметьте "Активен", чтобы добавить в бой.</p>
        </div>
        <button 
            onClick={() => { setShowAddForm(true); setEditForm({}); setIsEditing(null); }}
            className="bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 px-4 rounded flex items-center gap-2"
        >
            <Plus className="w-4 h-4" /> Добавить героя
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
        {/* Add/Edit Form Card */}
        {(showAddForm || isEditing) && (
            <div className="bg-dnd-darker border-2 border-gold-500 p-4 rounded-lg shadow-lg relative animate-in fade-in zoom-in duration-200">
                <h3 className="font-bold text-white mb-4">{isEditing ? 'Редактирование' : 'Новый герой'}</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-gray-500">Имя</label>
                        <input className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" 
                            value={editForm.name || ''} onChange={e => setEditForm({...editForm, name: e.target.value})} autoFocus />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-500">Раса</label>
                            <input className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" 
                                value={editForm.race || ''} onChange={e => setEditForm({...editForm, race: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">Класс</label>
                            <input className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" 
                                value={editForm.class || ''} onChange={e => setEditForm({...editForm, class: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs text-gray-500">Уровень</label>
                            <input type="number" className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" 
                                value={editForm.level || ''} onChange={e => setEditForm({...editForm, level: Number(e.target.value)})} />
                        </div>
                        <div className="col-span-2">
                            <label className="text-xs text-gray-500">Опыт (XP)</label>
                            <input type="number" className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" 
                                value={editForm.xp || 0} onChange={e => setEditForm({...editForm, xp: Number(e.target.value)})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="text-xs text-gray-500">Макс ХП</label>
                            <input type="number" className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" 
                                value={editForm.maxHp || ''} onChange={e => setEditForm({...editForm, maxHp: Number(e.target.value)})} />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500">КД</label>
                            <input type="number" className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" 
                                value={editForm.ac || ''} onChange={e => setEditForm({...editForm, ac: Number(e.target.value)})} />
                        </div>
                         <div>
                            <label className="text-xs text-gray-500">Пас. Воспр.</label>
                            <input type="number" className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white" 
                                value={editForm.passivePerception || ''} onChange={e => setEditForm({...editForm, passivePerception: Number(e.target.value)})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500">Заметки</label>
                        <textarea className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white h-16 resize-none" 
                            value={editForm.notes || ''} onChange={e => setEditForm({...editForm, notes: e.target.value})} />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={saveMember} className="flex-1 bg-green-600 hover:bg-green-500 text-white py-2 rounded flex justify-center items-center gap-2"><Save className="w-4 h-4"/> Сохранить</button>
                        <button onClick={cancelEdit} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded flex justify-center items-center gap-2"><X className="w-4 h-4"/> Отмена</button>
                    </div>
                </div>
            </div>
        )}

        {/* Player Cards */}
        {party.map(p => {
            const nextLevelXp = getNextLevelXp(p.level);
            const prevLevelXp = XP_TABLE[p.level];
            const progress = Math.min(100, Math.max(0, ((p.xp || 0) - prevLevelXp) / (nextLevelXp - prevLevelXp) * 100));

            return (
            <div key={p.id} className={`bg-dnd-card rounded-lg border transition-all relative group ${p.active ? 'border-gold-600 shadow-md shadow-gold-900/20' : 'border-gray-700 opacity-75 grayscale-[50%]'}`}>
                {/* Active Toggle */}
                <div className="absolute top-3 right-3 z-10">
                     <button 
                        onClick={() => toggleActive(p.id)}
                        className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full transition-colors ${p.active ? 'bg-green-900/80 text-green-300 hover:bg-green-800' : 'bg-gray-800 text-gray-500 hover:bg-gray-700'}`}
                     >
                        {p.active ? <CheckCircle className="w-3 h-3" /> : <Circle className="w-3 h-3" />}
                        {p.active ? 'Активен' : 'В запасе'}
                     </button>
                </div>

                <div className="p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-600 font-serif font-bold text-xl text-gold-500">
                            {p.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="font-bold text-white text-lg leading-none">{p.name}</h3>
                            <p className="text-xs text-gray-400">{p.race} {p.class} • Ур. {p.level}</p>
                        </div>
                    </div>

                    {/* XP Bar */}
                    <div className="mb-3">
                        <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                            <span>{p.xp || 0} XP</span>
                            <span>{nextLevelXp} XP</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                            <div className="h-full bg-blue-500" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 my-3 bg-gray-900/50 p-2 rounded">
                        <div className="text-center">
                            <div className="text-xs text-gray-500 flex justify-center items-center gap-1"><Heart className="w-3 h-3"/> ХП</div>
                            <div className="font-bold text-white">{p.maxHp}</div>
                        </div>
                        <div className="text-center border-l border-gray-700">
                            <div className="text-xs text-gray-500 flex justify-center items-center gap-1"><Shield className="w-3 h-3"/> КД</div>
                            <div className="font-bold text-white">{p.ac}</div>
                        </div>
                        <div className="text-center border-l border-gray-700">
                            <div className="text-xs text-gray-500 flex justify-center items-center gap-1"><Eye className="w-3 h-3"/> ПП</div>
                            <div className="font-bold text-white">{p.passivePerception}</div>
                        </div>
                    </div>

                    <div className="mb-4">
                         <button 
                            onClick={() => setShowInventoryId(showInventoryId === p.id ? null : p.id)}
                            className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-white bg-gray-800/50 px-2 py-1 rounded"
                         >
                            <span className="flex items-center gap-1"><Backpack className="w-3 h-3" /> Инвентарь ({p.inventory?.length || 0})</span>
                            <span>{showInventoryId === p.id ? '▲' : '▼'}</span>
                         </button>
                         
                         {showInventoryId === p.id && (
                            <div className="mt-2 bg-gray-900 p-2 rounded text-sm animate-in fade-in slide-in-from-top-2">
                                <div className="flex gap-1 mb-2">
                                    <input 
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-0.5 text-xs text-white outline-none"
                                        placeholder="Новый предмет..."
                                        value={newItem}
                                        onChange={e => setNewItem(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && addItem(p.id)}
                                    />
                                    <button onClick={() => addItem(p.id)} className="text-green-500"><Plus className="w-4 h-4"/></button>
                                </div>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                    {p.inventory?.map(item => (
                                        <div key={item.id} className="flex justify-between items-center group/item">
                                            <span className="text-gray-300">{item.name}</span>
                                            <button onClick={() => removeItem(p.id, item.id)} className="text-gray-600 hover:text-red-500 opacity-0 group-hover/item:opacity-100"><X className="w-3 h-3"/></button>
                                        </div>
                                    ))}
                                    {(!p.inventory || p.inventory.length === 0) && <span className="text-gray-600 italic text-xs">Пусто</span>}
                                </div>
                            </div>
                         )}
                    </div>

                    {p.notes && <p className="text-xs text-gray-500 italic truncate mb-4 border-t border-gray-800 pt-2">{p.notes}</p>}

                    <div className="flex gap-2 mt-2 border-t border-gray-700 pt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => startEdit(p)} className="flex-1 py-1 bg-gray-700 hover:bg-blue-600 rounded text-xs text-white flex justify-center items-center gap-1">
                            <Edit2 className="w-3 h-3" /> Изм.
                        </button>
                        <button onClick={() => handleDelete(p.id)} className="flex-1 py-1 bg-gray-700 hover:bg-red-600 rounded text-xs text-white flex justify-center items-center gap-1">
                            <Trash2 className="w-3 h-3" /> Удал.
                        </button>
                    </div>
                </div>
            </div>
            );
        })}
      </div>
    </div>
  );
};

export default PartyManager;
