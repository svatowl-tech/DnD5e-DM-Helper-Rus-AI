
import React, { useState, useEffect } from 'react';
import { Combatant, EntityType, LogEntry, PartyMember } from '../types';
import { CONDITIONS, SAMPLE_COMBATANTS } from '../constants';
import { Shield, Heart, Sword, Skull, Play, RefreshCw, Plus, X, Trash2, Users, BookOpen, Coins, Loader } from 'lucide-react';
import BestiaryBrowser from './BestiaryBrowser';
import { ApiMonsterDetails } from '../services/dndApiService';
import { generateCombatLoot } from '../services/polzaService';

interface CombatTrackerProps {
  addLog: (entry: LogEntry) => void;
}

const CombatTracker: React.FC<CombatTrackerProps> = ({ addLog }) => {
  // State for Combatants
  const [combatants, setCombatants] = useState<Combatant[]>(() => {
      const saved = localStorage.getItem('dmc_combatants');
      return saved ? JSON.parse(saved) : SAMPLE_COMBATANTS;
  });

  // Combat State Persistence (Round, Turn, ActiveId)
  const [round, setRound] = useState(() => {
      const saved = localStorage.getItem('dmc_combat_round');
      return saved ? Number(saved) : 1;
  });
  
  const [turnIndex, setTurnIndex] = useState(() => {
      const saved = localStorage.getItem('dmc_combat_turn');
      return saved ? Number(saved) : 0;
  });

  const [activeId, setActiveId] = useState<string | null>(() => {
      return localStorage.getItem('dmc_combat_active_id') || null;
  });

  const [showBestiary, setShowBestiary] = useState(false);
  const [lootLoading, setLootLoading] = useState(false);

  // Editing State
  const [newCombatant, setNewCombatant] = useState<Partial<Combatant>>({
    name: '', initiative: 10, hp: 10, maxHp: 10, ac: 10, type: EntityType.MONSTER
  });

  // Save combatants
  useEffect(() => {
    localStorage.setItem('dmc_combatants', JSON.stringify(combatants));
  }, [combatants]);

  // Save combat state
  useEffect(() => {
      localStorage.setItem('dmc_combat_round', round.toString());
      localStorage.setItem('dmc_combat_turn', turnIndex.toString());
      if (activeId) {
          localStorage.setItem('dmc_combat_active_id', activeId);
      } else {
          localStorage.removeItem('dmc_combat_active_id');
      }
  }, [round, turnIndex, activeId]);

  // Sort combatants by initiative
  const sortCombatants = () => {
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
    setCombatants(sorted);
    if (sorted.length > 0) {
        setActiveId(sorted[0].id);
        setTurnIndex(0);
    }
    addLog({ id: Date.now().toString(), timestamp: Date.now(), text: "Инициатива отсортирована.", type: 'system' });
  };

  const nextTurn = () => {
    if (combatants.length === 0) return;
    
    let nextIndex = turnIndex + 1;
    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      setRound(r => r + 1);
      addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Раунд ${round + 1} начался.`, type: 'combat' });
    }
    setTurnIndex(nextIndex);
    setActiveId(combatants[nextIndex].id);
  };

  const updateHp = (id: string, delta: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id === id) {
        const newHp = Math.max(0, c.hp + delta);
        if (newHp === 0 && c.hp > 0) {
             addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `${c.name} теряет сознание!`, type: 'combat' });
        }
        return { ...c, hp: newHp };
      }
      return c;
    }));
  };

  const addCombatant = () => {
    const id = Date.now().toString();
    const combatant: Combatant = {
      id,
      name: newCombatant.name || 'Неизвестный',
      type: newCombatant.type as EntityType,
      initiative: Number(newCombatant.initiative),
      hp: Number(newCombatant.hp),
      maxHp: Number(newCombatant.hp),
      ac: Number(newCombatant.ac),
      conditions: [],
      notes: ''
    };
    setCombatants(prev => [...prev, combatant]);
    setNewCombatant({ name: '', initiative: 10, hp: 10, maxHp: 10, ac: 10, type: EntityType.MONSTER });
  };

  const removeCombatant = (id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id));
  };

  const clearEncounter = () => {
    if (window.confirm("Удалить всех монстров и сбросить раунд?")) {
        setCombatants(prev => prev.filter(c => c.type === EntityType.PLAYER));
        setRound(1);
        setTurnIndex(0);
        setActiveId(null);
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: "Бой сброшен. Монстры удалены.", type: 'system' });
    }
  };

  const generateLootForEncounter = async () => {
      const monsters = combatants.filter(c => c.type === EntityType.MONSTER);
      if (monsters.length === 0) {
          alert("Нет монстров для сбора добычи.");
          return;
      }

      setLootLoading(true);
      try {
          // Estimate level based on active party or default to 3
          const players = combatants.filter(c => c.type === EntityType.PLAYER);
          const avgLevel = players.length > 0 ? 3 : 1; // Rough fallback
          
          const names = monsters.map(m => m.name);
          const result = await generateCombatLoot(names, avgLevel);
          
          addLog({
              id: Date.now().toString(),
              timestamp: Date.now(),
              text: `[ДОБЫЧА]: ${result.replace(/<[^>]*>?/gm, ' ')}`, // Strip HTML for log preview
              type: 'story'
          });
          
          alert("Добыча сгенерирована и добавлена в лог сессии.");

      } catch (e: any) {
          console.error(e);
          alert(`Ошибка генерации лута: ${e.message}`);
      } finally {
          setLootLoading(false);
      }
  };

  const loadParty = () => {
    const savedParty = localStorage.getItem('dmc_party');
    if (!savedParty) {
        alert("В менеджере персонажей нет данных.");
        return;
    }
    
    const partyMembers: PartyMember[] = JSON.parse(savedParty);
    const activeMembers = partyMembers.filter(p => p.active);

    if (activeMembers.length === 0) {
        alert("Нет активных персонажей. Отметьте их в меню 'Герои'.");
        return;
    }

    const existingIds = new Set(combatants.map(c => c.id));
    const newCombatants: Combatant[] = activeMembers
        .filter(p => !existingIds.has(p.id))
        .map(p => ({
            id: p.id,
            name: p.name,
            type: EntityType.PLAYER,
            initiative: 0, 
            hp: p.maxHp,
            maxHp: p.maxHp,
            ac: p.ac,
            conditions: [],
            notes: `Пасс. воспр: ${p.passivePerception}`
        }));
    
    if (newCombatants.length > 0) {
        setCombatants(prev => [...prev, ...newCombatants]);
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Добавлено ${newCombatants.length} героев в бой.`, type: 'system' });
    } else {
        alert("Все активные герои уже в бою.");
    }
  };

  const addApiMonster = (monster: ApiMonsterDetails, count: number) => {
    const newMonsters: Combatant[] = [];
    
    const getAcValue = (m: ApiMonsterDetails) => {
      if (Array.isArray(m.armor_class)) return m.armor_class[0]?.value || 10;
      return m.armor_class || 10;
    };

    for (let i = 1; i <= count; i++) {
        // Roll Initiative: d20 + DEX modifier
        const dexMod = Math.floor((monster.dexterity - 10) / 2);
        const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;
        
        const name = count > 1 ? `${monster.name} ${i}` : monster.name;

        newMonsters.push({
            id: Date.now().toString() + i,
            name: name,
            type: EntityType.MONSTER,
            initiative: initRoll,
            hp: monster.hit_points,
            maxHp: monster.hit_points,
            ac: getAcValue(monster),
            conditions: [],
            notes: `CR ${monster.challenge_rating}`
        });
    }

    setCombatants(prev => [...prev, ...newMonsters]);
    addLog({ 
        id: Date.now().toString(), 
        timestamp: Date.now(), 
        text: `Добавлено ${count} x ${monster.name} (API).`, 
        type: 'system' 
    });
  };

  const activeCombatant = combatants.find(c => c.id === activeId);

  return (
    <div className="h-full flex flex-col space-y-4 relative">
      {showBestiary && (
        <BestiaryBrowser 
            onClose={() => setShowBestiary(false)} 
            onAddMonster={addApiMonster} 
        />
      )}

      {/* Header Controls */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-dnd-card p-3 rounded-lg border border-gray-700">
        <div className="flex items-center gap-4">
          <div className="text-gold-500 font-serif text-xl font-bold flex flex-col leading-none">
             <span>Раунд {round}</span>
             {activeCombatant && <span className="text-xs text-gray-400 font-sans font-normal">Ход: {activeCombatant.name}</span>}
          </div>
          <button 
            onClick={nextTurn}
            className="flex items-center gap-2 bg-dnd-red hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition-colors"
          >
            <Play className="w-4 h-4" /> След. ход
          </button>
        </div>
        
        <div className="flex items-center gap-2">
             <button 
              onClick={generateLootForEncounter}
              disabled={lootLoading}
              className="bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200 flex items-center gap-1 text-sm px-3 py-2 rounded border border-yellow-800 transition-colors disabled:opacity-50"
              title="Сгенерировать добычу с текущих монстров (AI)"
            >
              {lootLoading ? <Loader className="w-4 h-4 animate-spin"/> : <Coins className="w-4 h-4" />} <span className="hidden sm:inline">Добыча</span>
            </button>
            <button 
              onClick={() => setShowBestiary(true)}
              className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 flex items-center gap-1 text-sm px-3 py-2 rounded border border-indigo-800 transition-colors"
              title="Открыть Бестиарий (API)"
            >
              <BookOpen className="w-4 h-4" /> <span className="hidden sm:inline">Бестиарий</span>
            </button>
            <button 
              onClick={loadParty}
              className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 flex items-center gap-1 text-sm px-3 py-2 rounded border border-blue-800 transition-colors"
              title="Загрузить активную группу"
            >
              <Users className="w-4 h-4" /> <span className="hidden sm:inline">Группа</span>
            </button>
            <button 
              onClick={sortCombatants}
              className="text-gray-400 hover:text-white flex items-center gap-1 text-sm px-3 py-2 rounded hover:bg-gray-800 transition-colors"
              title="Сортировать по инициативе"
            >
              <RefreshCw className="w-4 h-4" /> <span className="hidden sm:inline">Сорт.</span>
            </button>
            <button 
              onClick={clearEncounter}
              className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-sm px-3 py-2 rounded hover:bg-gray-800 transition-colors border border-transparent hover:border-red-500/30"
              title="Удалить всех монстров и сбросить раунд"
            >
              <Trash2 className="w-4 h-4" /> <span className="hidden sm:inline">Сброс</span>
            </button>
        </div>
      </div>

      {/* Combatant List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-2">
        {combatants.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 opacity-50">
                <Sword className="w-12 h-12 mb-2" />
                <p>Поле боя пусто</p>
                <p className="text-xs">Добавьте монстров из Бестиария или загрузите группу</p>
            </div>
        )}
        {combatants.map((c) => {
          const isActive = c.id === activeId;
          const isDead = c.hp === 0;
          return (
            <div 
              key={c.id}
              id={`combatant-${c.id}`}
              className={`relative p-3 rounded-lg border ${isActive ? 'border-gold-500 bg-dnd-darker ring-1 ring-gold-500/30 scale-[1.01]' : 'border-gray-700 bg-dnd-card'} transition-all duration-200`}
            >
              <div className="flex items-center justify-between">
                {/* Left: Name & Init */}
                <div className="flex items-center gap-3 flex-1">
                  <div className={`flex flex-col items-center justify-center w-10 h-10 rounded border ${isActive ? 'bg-gold-600 text-black border-gold-500' : 'bg-gray-800 border-gray-600 text-white'}`}>
                    <span className={`text-xs ${isActive ? 'text-black/70' : 'text-gray-400'}`}>ИНИЦ</span>
                    <span className="font-bold">{c.initiative}</span>
                  </div>
                  <div>
                    <h4 className={`font-serif font-bold text-lg flex items-center gap-2 ${isDead ? 'text-red-500 line-through decoration-2' : 'text-gray-100'}`}>
                      {c.name}
                      {isDead && <Skull className="w-4 h-4 text-red-500" />}
                    </h4>
                    <div className="text-xs text-gray-400 flex gap-2">
                      <span className={`px-1 rounded ${c.type === EntityType.PLAYER ? 'bg-blue-900/50 text-blue-200' : 'bg-red-900/50 text-red-200'}`}>
                        {c.type === EntityType.PLAYER ? 'ИГРОК' : c.type === EntityType.NPC ? 'NPC' : 'МОНСТР'}
                      </span>
                      <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> КД {c.ac}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: HP Controls */}
                <div className="flex items-center gap-2 mx-2">
                  <button onClick={() => updateHp(c.id, -1)} className="p-1 hover:bg-red-900/50 rounded text-red-400 hover:scale-110 transition-transform"><Sword className="w-4 h-4" /></button>
                  <div className="flex flex-col items-center w-24">
                    <div className="flex items-center gap-1">
                        <Heart className={`w-4 h-4 ${isDead ? 'text-gray-600' : 'text-red-500'}`} />
                        <span className={`font-mono font-bold text-lg ${isDead ? 'text-gray-500' : 'text-white'}`}>{c.hp}</span>
                        <span className="text-gray-500 text-xs">/{c.maxHp}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div 
                            className={`h-full rounded-full transition-all duration-300 ${c.hp < c.maxHp / 2 ? 'bg-red-500' : 'bg-green-500'}`} 
                            style={{ width: `${Math.min(100, (c.hp / c.maxHp) * 100)}%` }}
                        />
                    </div>
                  </div>
                  <button onClick={() => updateHp(c.id, 1)} className="p-1 hover:bg-green-900/50 rounded text-green-400 hover:scale-110 transition-transform"><Plus className="w-4 h-4" /></button>
                </div>

                {/* Right: Delete */}
                <button onClick={() => removeCombatant(c.id)} className="text-gray-600 hover:text-red-500 p-2 hover:bg-gray-800 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Conditions / Active Status */}
              {isActive && (
                  <div className="mt-2 pt-2 border-t border-gray-700/50 flex gap-2 overflow-x-auto">
                      <span className="text-xs text-gold-500 font-bold uppercase tracking-wider animate-pulse">⚡ Активный ход</span>
                      {c.hp < c.maxHp / 2 && <span className="text-xs text-red-400 italic">Ранен</span>}
                      {c.notes && <span className="text-xs text-gray-400 italic border-l border-gray-700 pl-2">{c.notes}</span>}
                  </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Manual Form */}
      <div className="bg-gray-900 p-3 rounded border border-gray-800 flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[120px]">
            <label className="text-xs text-gray-500">Имя (Ручное)</label>
            <input 
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gold-500 outline-none"
                value={newCombatant.name}
                onChange={e => setNewCombatant({...newCombatant, name: e.target.value})}
                placeholder="Напр. Ловушка"
            />
        </div>
        <div className="w-16">
            <label className="text-xs text-gray-500">Иниц</label>
            <input 
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gold-500 outline-none"
                value={newCombatant.initiative}
                onChange={e => setNewCombatant({...newCombatant, initiative: Number(e.target.value)})}
            />
        </div>
        <div className="w-16">
            <label className="text-xs text-gray-500">ХП</label>
            <input 
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gold-500 outline-none"
                value={newCombatant.hp}
                onChange={e => setNewCombatant({...newCombatant, hp: Number(e.target.value)})}
            />
        </div>
        <div className="w-16">
            <label className="text-xs text-gray-500">КД</label>
            <input 
                type="number"
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:border-gold-500 outline-none"
                value={newCombatant.ac}
                onChange={e => setNewCombatant({...newCombatant, ac: Number(e.target.value)})}
            />
        </div>
        <button 
            onClick={addCombatant}
            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1 rounded h-8 font-bold text-sm"
        >
            Добавить
        </button>
      </div>
    </div>
  );
};

export default CombatTracker;
