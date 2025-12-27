
import React, { useState, useEffect } from 'react';
import { PartyMember, InventoryItem, PartyManagerProps, PartyStash, Wallet } from '../types';
import { Users, Shield, Heart, Eye, Trash2, Edit2, Plus, Save, X, CheckCircle, Circle, Backpack, Info, Archive, ArrowRightCircle, Gift } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { generateExtendedDetails } from '../services/polzaService';
import SmartText from './SmartText';
import PartyStashPanel from './party/PartyStashPanel';

const PartyManager: React.FC<PartyManagerProps> = ({ addLog }) => {
  const { showToast } = useToast();
  const [party, setParty] = useState<PartyMember[]>(() => {
    const saved = localStorage.getItem('dmc_party');
    return saved ? JSON.parse(saved) : [];
  });

  const [partyStash, setPartyStash] = useState<PartyStash>(() => {
      const saved = localStorage.getItem('dmc_party_stash');
      return saved ? JSON.parse(saved) : { items: [], wallet: { gp: 0, sp: 0, cp: 0 } };
  });

  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PartyMember>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showInventoryId, setShowInventoryId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState('');
  const [showStash, setShowStash] = useState(false);
  
  // Item Inspection State
  const [inspectingItem, setInspectingItem] = useState<{ item: InventoryItem, sourceId: string, sourceName: string } | null>(null);
  const [enhancing, setEnhancing] = useState(false);

  // Auto-save to local storage
  useEffect(() => {
    localStorage.setItem('dmc_party', JSON.stringify(party));
  }, [party]);

  useEffect(() => {
      localStorage.setItem('dmc_party_stash', JSON.stringify(partyStash));
  }, [partyStash]);

  // Listen for external party updates (e.g. XP from global handler)
  useEffect(() => {
      const handleUpdateParty = () => {
          const saved = localStorage.getItem('dmc_party');
          if (saved) {
              setParty(JSON.parse(saved));
          }
      };
      
      const handleUpdateStash = () => {
           const saved = localStorage.getItem('dmc_party_stash');
           if (saved) setPartyStash(JSON.parse(saved));
      };

      window.addEventListener('dmc-update-party', handleUpdateParty);
      window.addEventListener('dmc-update-stash', handleUpdateStash);
      return () => {
          window.removeEventListener('dmc-update-party', handleUpdateParty);
          window.removeEventListener('dmc-update-stash', handleUpdateStash);
      };
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
    setShowStash(false);
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
      inventory: editForm.inventory || [],
      wallet: editForm.wallet || { gp: 0, sp: 0, cp: 0 }
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
  
  const moveItemToStash = (memberId: string, item: InventoryItem) => {
      setParty(prev => prev.map(p => {
          if (p.id === memberId) {
              return { ...p, inventory: p.inventory.filter(i => i.id !== item.id) };
          }
          return p;
      }));
      setPartyStash(prev => ({ ...prev, items: [...prev.items, item] }));
      showToast(`"${item.name}" перемещен в общий мешок`);
  };

  const moveItemFromStash = (item: InventoryItem, memberId: string) => {
      setPartyStash(prev => ({ ...prev, items: prev.items.filter(i => i.id !== item.id) }));
      setParty(prev => prev.map(p => {
          if (p.id === memberId) {
              return { ...p, inventory: [...(p.inventory || []), item] };
          }
          return p;
      }));
      const memberName = party.find(p => p.id === memberId)?.name;
      showToast(`"${item.name}" передан ${memberName}`);
  };

  const transferItemBetweenMembers = (item: InventoryItem, fromId: string, toId: string) => {
      setParty(prev => {
          const senderIndex = prev.findIndex(p => p.id === fromId);
          const receiverIndex = prev.findIndex(p => p.id === toId);
          if (senderIndex === -1 || receiverIndex === -1) return prev;

          const newParty = [...prev];
          
          newParty[senderIndex] = {
              ...newParty[senderIndex],
              inventory: newParty[senderIndex].inventory.filter(i => i.id !== item.id)
          };

          newParty[receiverIndex] = {
              ...newParty[receiverIndex],
              inventory: [...newParty[receiverIndex].inventory, item]
          };

          return newParty;
      });
      
      const receiverName = party.find(p => p.id === toId)?.name;
      showToast(`"${item.name}" передан ${receiverName}`, 'success');
  };

  const addStashItem = (item: InventoryItem) => {
      setPartyStash(prev => ({ ...prev, items: [...prev.items, item] }));
  };

  const removeStashItem = (id: string) => {
      setPartyStash(prev => ({ ...prev, items: prev.items.filter(i => i.id !== id) }));
  };

  const updateWallet = (memberId: string, type: keyof Wallet, value: number) => {
      setParty(prev => prev.map(p => {
          if (p.id === memberId) {
              const newWallet = { ...p.wallet, [type]: Math.max(0, value) };
              if (!p.wallet) newWallet.gp = value; 
              return { ...p, wallet: newWallet };
          }
          return p;
      }));
  };
  
  const updateStashWallet = (type: keyof Wallet, value: number) => {
      setPartyStash(prev => ({ ...prev, wallet: { ...prev.wallet, [type]: Math.max(0, value) } }));
  };

  const splitStashGold = () => {
      const activeMembers = party.filter(p => p.active);
      if (activeMembers.length === 0) return;
      
      const { gp, sp, cp } = partyStash.wallet;
      if (gp === 0 && sp === 0 && cp === 0) return;

      const gpSplit = Math.floor(gp / activeMembers.length);
      const spSplit = Math.floor(sp / activeMembers.length);
      const cpSplit = Math.floor(cp / activeMembers.length);

      setParty(prev => prev.map(p => {
          if (p.active) {
              return {
                  ...p,
                  wallet: {
                      gp: (p.wallet?.gp || 0) + gpSplit,
                      sp: (p.wallet?.sp || 0) + spSplit,
                      cp: (p.wallet?.cp || 0) + cpSplit
                  }
              };
          }
          return p;
      }));

      setPartyStash(prev => ({
          ...prev,
          wallet: {
              gp: prev.wallet.gp % activeMembers.length,
              sp: prev.wallet.sp % activeMembers.length,
              cp: prev.wallet.cp % activeMembers.length
          }
      }));
      
      showToast("Казна разделена", "success");
  };

  // --- Item Enhancement Logic ---

  const handleInspectItem = (item: InventoryItem, sourceId: string, sourceName: string) => {
      setInspectingItem({ item: { ...item }, sourceId, sourceName }); 
  };

  const handleEnhanceItem = async () => {
      if (!inspectingItem) return;
      setEnhancing(true);
      try {
          const newDescription = await generateExtendedDetails('loot', inspectingItem.item.name, "Предмет из инвентаря");
          setInspectingItem(prev => prev ? ({ ...prev, item: { ...prev.item, description: newDescription } }) : null);
          showToast("Описание предмета улучшено!", "success");
      } catch (e: any) {
          showToast("Ошибка AI: " + e.message, "error");
      } finally {
          setEnhancing(false);
      }
  };

  const handleSaveItemChanges = () => {
      if (!inspectingItem) return;

      const { item, sourceId } = inspectingItem;

      if (sourceId === 'stash') {
          setPartyStash(prev => ({
              ...prev,
              items: prev.items.map(i => i.id === item.id ? item : i)
          }));
      } else {
          setParty(prev => prev.map(p => {
              if (p.id === sourceId) {
                  return { ...p, inventory: p.inventory.map(i => i.id === item.id ? item : i) };
              }
              return p;
          }));
      }
      setInspectingItem(null);
      showToast("Предмет сохранен", "success");
  };
  
  const handleDirectTransfer = (targetId: string) => {
      if (!inspectingItem) return;
      
      if (targetId === 'stash') {
          moveItemToStash(inspectingItem.sourceId, inspectingItem.item);
          setInspectingItem(null);
          return;
      }
      
      if (inspectingItem.sourceId === 'stash') {
          moveItemFromStash(inspectingItem.item, targetId);
      } else {
          transferItemBetweenMembers(inspectingItem.item, inspectingItem.sourceId, targetId);
      }
      setInspectingItem(null);
  };
  
  const handleDirectDelete = () => {
      if (!inspectingItem) return;
      if (window.confirm(`Удалить "${inspectingItem.item.name}" безвозвратно?`)) {
          if (inspectingItem.sourceId === 'stash') {
              removeStashItem(inspectingItem.item.id);
          } else {
              removeItem(inspectingItem.sourceId, inspectingItem.item.id);
          }
          setInspectingItem(null);
          showToast("Предмет удален");
      }
  };

  const XP_TABLE: Record<number, number> = {
    1: 0, 2: 300, 3: 900, 4: 2700, 5: 6500, 6: 14000, 7: 23000, 8: 34000, 9: 48000, 10: 64000,
    11: 85000, 12: 100000, 13: 120000, 14: 140000, 15: 165000, 16: 195000, 17: 225000, 18: 265000, 19: 305000, 20: 355000
  };

  const getNextLevelXp = (level: number) => {
      if (level >= 20) return 355000;
      return XP_TABLE[level + 1] || 0;
  };

  return (
    <div className="h-full flex flex-col space-y-4 relative">
      
      {inspectingItem && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-md rounded-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
                  {/* ... Inspect Modal Content ... */}
                  {/* Keeping this inline for now as it uses heavy closure context (party, transfer logic) */}
                  <div className="p-4 bg-gray-900 border-b border-gold-600/50 flex justify-between items-center shrink-0">
                      <h3 className="font-serif font-bold text-xl text-white truncate flex-1">{inspectingItem.item.name}</h3>
                      <button onClick={() => setInspectingItem(null)} className="text-gray-400 hover:text-white ml-2"><X/></button>
                  </div>
                  
                  <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                      <div className="flex gap-2 text-xs text-gray-500 uppercase font-bold">
                          <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700">Владелец: {inspectingItem.sourceName}</span>
                          <span className="bg-gray-800 px-2 py-1 rounded border border-gray-700">Кол-во: {inspectingItem.item.quantity}</span>
                      </div>

                      <div className="space-y-2">
                          {/* Description Editor ... */}
                          <textarea 
                                  className="w-full bg-gray-800 border border-gray-600 rounded p-2 text-sm text-white h-24 focus:border-gold-500 outline-none resize-none"
                                  placeholder="Добавьте описание или используйте AI..."
                                  value={inspectingItem.item.description || ''}
                                  onChange={e => setInspectingItem({ ...inspectingItem, item: { ...inspectingItem.item, description: e.target.value } })}
                              />
                      </div>
                      
                      {/* Transfer Section */}
                      <div className="pt-2 border-t border-gray-800">
                          <label className="text-xs text-blue-400 font-bold uppercase flex items-center gap-2 mb-2">
                              <Gift className="w-3 h-3"/> Передать кому:
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                              {/* Party Members */}
                              {party.filter(p => p.id !== inspectingItem.sourceId && p.active).map(p => (
                                  <button 
                                    key={p.id}
                                    onClick={() => handleDirectTransfer(p.id)}
                                    className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-blue-900/30 border border-gray-700 hover:border-blue-500 rounded text-left transition-colors active:scale-95"
                                  >
                                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center text-[10px] font-bold text-gray-300">
                                          {p.name.charAt(0)}
                                      </div>
                                      <span className="text-xs font-bold truncate flex-1">{p.name}</span>
                                      <ArrowRightCircle className="w-4 h-4 text-gray-500"/>
                                  </button>
                              ))}
                              
                              {/* Stash Option */}
                              {inspectingItem.sourceId !== 'stash' && (
                                  <button 
                                    onClick={() => handleDirectTransfer('stash')}
                                    className="flex items-center gap-2 p-2 bg-gray-800 hover:bg-yellow-900/30 border border-gray-700 hover:border-yellow-500 rounded text-left transition-colors active:scale-95"
                                  >
                                      <div className="w-6 h-6 rounded-full bg-yellow-900/50 flex items-center justify-center text-yellow-500">
                                          <Archive className="w-3 h-3"/>
                                      </div>
                                      <span className="text-xs font-bold truncate flex-1 text-yellow-500">В Общий Мешок</span>
                                  </button>
                              )}
                          </div>
                      </div>
                      
                      <div className="pt-2">
                           <button 
                                onClick={handleDirectDelete}
                                className="w-full py-2 bg-red-900/20 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded text-xs font-bold flex items-center justify-center gap-2"
                           >
                               <Trash2 className="w-3 h-3"/> Удалить предмет
                           </button>
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-700 bg-gray-900 flex justify-end gap-2 shrink-0">
                      <button onClick={() => setInspectingItem(null)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">Отмена</button>
                      <button onClick={handleSaveItemChanges} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold text-sm shadow-lg flex items-center gap-2">
                          <Save className="w-4 h-4"/> Сохранить
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex justify-between items-center border-b border-gray-700 pb-4 shrink-0">
        <div>
            <h2 className="text-2xl font-serif font-bold text-gold-500 flex items-center gap-2">
            <Users className="w-6 h-6" /> Герои Кампании
            </h2>
            <p className="text-sm text-gray-400">Управляйте группой и общими сокровищами.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowStash(!showStash)}
                className={`font-bold py-2 px-4 rounded flex items-center gap-2 transition-colors ${showStash ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-indigo-400 hover:bg-gray-700'}`}
            >
                <Archive className="w-4 h-4" /> Общий мешок
            </button>
            <button 
                onClick={() => { setShowAddForm(true); setEditForm({}); setIsEditing(null); setShowStash(false); }}
                className="bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 px-4 rounded flex items-center gap-2"
            >
                <Plus className="w-4 h-4" /> Герой
            </button>
        </div>
      </div>

      {/* Party Stash Panel */}
      {showStash && (
          <PartyStashPanel 
            stash={partyStash} 
            onClose={() => setShowStash(false)}
            onUpdateWallet={updateStashWallet}
            onAddItem={addStashItem}
            onRemoveItem={removeStashItem}
            onInspectItem={(item) => handleInspectItem(item, 'stash', 'Общий Мешок')}
            onSplitGold={splitStashGold}
          />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4 flex-1 custom-scrollbar">
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
            <div key={p.id} className={`bg-dnd-card rounded-lg border transition-all relative group flex flex-col ${p.active ? 'border-gold-600 shadow-md shadow-gold-900/20' : 'border-gray-700 opacity-75 grayscale-[50%]'}`}>
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

                <div className="p-4 flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center border border-gray-600 font-serif font-bold text-xl text-gold-500 shrink-0">
                            {p.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                            <h3 className="font-bold text-white text-lg leading-none truncate">{p.name}</h3>
                            <p className="text-xs text-gray-400 truncate">{p.race} {p.class} • Ур. {p.level}</p>
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

                    {/* Wallet Section */}
                    <div className="bg-gray-800 p-2 rounded mb-3 flex justify-between items-center gap-1">
                         <div className="flex items-center gap-1" title="Золото">
                             <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                             <input type="number" className="w-10 bg-transparent text-xs font-bold text-white text-right outline-none" value={p.wallet?.gp || 0} onChange={e => updateWallet(p.id, 'gp', Number(e.target.value))} />
                         </div>
                         <div className="flex items-center gap-1" title="Серебро">
                             <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                             <input type="number" className="w-10 bg-transparent text-xs font-bold text-white text-right outline-none" value={p.wallet?.sp || 0} onChange={e => updateWallet(p.id, 'sp', Number(e.target.value))} />
                         </div>
                         <div className="flex items-center gap-1" title="Медь">
                             <div className="w-2 h-2 rounded-full bg-orange-600"></div>
                             <input type="number" className="w-10 bg-transparent text-xs font-bold text-white text-right outline-none" value={p.wallet?.cp || 0} onChange={e => updateWallet(p.id, 'cp', Number(e.target.value))} />
                         </div>
                    </div>

                    <div className="mb-2">
                         <button 
                            onClick={() => setShowInventoryId(showInventoryId === p.id ? null : p.id)}
                            className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-white bg-gray-800/50 px-2 py-1 rounded transition-colors"
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
                                    <button onClick={() => addItem(p.id)} className="text-green-500 hover:text-green-400"><Plus className="w-4 h-4"/></button>
                                </div>
                                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                    {p.inventory?.map(item => (
                                        <div 
                                            key={item.id} 
                                            className="flex justify-between items-center group/item bg-black/20 px-2 py-2 rounded cursor-pointer hover:bg-black/40 active:bg-indigo-900/30"
                                            onClick={() => handleInspectItem(item, p.id, p.name)}
                                        >
                                            <div className="flex items-center gap-2 flex-1 overflow-hidden">
                                                <span className="text-gray-300 truncate text-xs">{item.name}</span>
                                                {item.description && <Info className="w-3 h-3 text-gray-500 shrink-0"/>}
                                            </div>
                                            {item.quantity > 1 && <span className="text-xs text-gray-500 ml-1">x{item.quantity}</span>}
                                        </div>
                                    ))}
                                    {(!p.inventory || p.inventory.length === 0) && <span className="text-gray-600 italic text-xs">Пусто</span>}
                                </div>
                            </div>
                         )}
                    </div>

                    {p.notes && <p className="text-xs text-gray-500 italic truncate mb-2 border-t border-gray-800 pt-2">{p.notes}</p>}
                </div>

                <div className="flex gap-2 p-3 bg-gray-800/50 border-t border-gray-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(p)} className="flex-1 py-1 bg-gray-700 hover:bg-blue-600 rounded text-xs text-white flex justify-center items-center gap-1">
                        <Edit2 className="w-3 h-3" /> Изм.
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="flex-1 py-1 bg-gray-700 hover:bg-red-600 rounded text-xs text-white flex justify-center items-center gap-1">
                        <Trash2 className="w-3 h-3" /> Удал.
                    </button>
                </div>
            </div>
            );
        })}
      </div>
    </div>
  );
};

export default PartyManager;
