
import React, { useState, useEffect } from 'react';
import { Combatant, EntityType, LogEntry, PartyMember, Condition } from '../types';
import { CONDITIONS, SAMPLE_COMBATANTS } from '../constants';
import { Shield, Heart, Sword, Skull, Play, RefreshCw, Plus, X, Trash2, Users, BookOpen, Coins, Loader, Flag, Zap, Activity, HelpCircle, Trophy, Star, Dices, Compass, ArrowLeft, Check } from 'lucide-react';
import BestiaryBrowser from './BestiaryBrowser';
import { ApiMonsterDetails } from '../services/dndApiService';
import { generateCombatLoot } from '../services/polzaService';
import { calculateEncounterDifficulty, EncounterResult } from '../services/encounterService';
import { useAudio } from '../contexts/AudioContext';
import SmartText from './SmartText';

interface CombatTrackerProps {
  addLog: (entry: LogEntry) => void;
}

const CombatTracker: React.FC<CombatTrackerProps> = ({ addLog }) => {
  const { playPlaylist, autoPlayMusic } = useAudio();

  const [combatants, setCombatants] = useState<Combatant[]>(() => {
      const saved = localStorage.getItem('dmc_combatants');
      return saved ? JSON.parse(saved) : SAMPLE_COMBATANTS;
  });

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
  const [difficulty, setDifficulty] = useState<EncounterResult | null>(null);
  const [editingConditionsId, setEditingConditionsId] = useState<string | null>(null);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [victoryXp, setVictoryXp] = useState(0);
  const [victoryLoot, setVictoryLoot] = useState<string>('');
  const [showInitModal, setShowInitModal] = useState(false);
  const [initRolls, setInitRolls] = useState<Record<string, number>>({});
  
  // Custom Confirmation State (replaces window.confirm)
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const [newCombatant, setNewCombatant] = useState<Partial<Combatant>>({
    name: '', initiative: 10, hp: 10, maxHp: 10, ac: 10, type: EntityType.MONSTER
  });

  // Travel Integration State
  const [hasActiveTravel, setHasActiveTravel] = useState(false);

  // Check for active travel on mount
  useEffect(() => {
      const travelState = localStorage.getItem('dmc_active_travel');
      if (travelState) setHasActiveTravel(true);
  }, []);

  // Listen for updates
  useEffect(() => {
      const handleUpdate = () => {
          const saved = localStorage.getItem('dmc_combatants');
          if (saved) {
              setCombatants(JSON.parse(saved));
              playCombatMusic();
          }
      };
      window.addEventListener('dmc-update-combat', handleUpdate);
      return () => window.removeEventListener('dmc-update-combat', handleUpdate);
  }, []);

  // Save & Calc Difficulty
  useEffect(() => {
    localStorage.setItem('dmc_combatants', JSON.stringify(combatants));
    const savedParty = localStorage.getItem('dmc_party');
    if (savedParty) {
        const party = JSON.parse(savedParty);
        const res = calculateEncounterDifficulty(party, combatants);
        setDifficulty(res);
    }
  }, [combatants]);

  useEffect(() => {
      localStorage.setItem('dmc_combat_round', round.toString());
      localStorage.setItem('dmc_combat_turn', turnIndex.toString());
      if (activeId) localStorage.setItem('dmc_combat_active_id', activeId);
      else localStorage.removeItem('dmc_combat_active_id');
  }, [round, turnIndex, activeId]);

  // Init State
  useEffect(() => {
      if (showInitModal) {
          const rolls: Record<string, number> = {};
          combatants.forEach(c => { rolls[c.id] = c.initiative; });
          setInitRolls(rolls);
      }
  }, [showInitModal]);

  const playCombatMusic = () => {
      // Check names for intelligent switching
      const monsterNames = combatants.filter(c => c.type === EntityType.MONSTER).map(c => c.name + " " + c.notes).join(' ');
      autoPlayMusic('combat', monsterNames);
      addLog({ id: Date.now().toString(), timestamp: Date.now(), text: "Включена боевая музыка.", type: 'system' });
  };

  const sortCombatants = () => {
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
    setCombatants(sorted);
    if (sorted.length > 0) {
        setActiveId(sorted[0].id);
        setTurnIndex(0);
    }
    addLog({ id: Date.now().toString(), timestamp: Date.now(), text: "Инициатива отсортирована.", type: 'system' });
  };

  const applyInitiativeRolls = () => {
      setCombatants(prev => prev.map(c => ({
          ...c,
          initiative: initRolls[c.id] !== undefined ? initRolls[c.id] : c.initiative
      })).sort((a, b) => b.initiative - a.initiative));
      setShowInitModal(false);
      setTurnIndex(0);
      if (combatants.length > 0) setActiveId(combatants[0].id); 
      addLog({ id: Date.now().toString(), timestamp: Date.now(), text: "Новая инициатива применена.", type: 'roll' });
  };

  const rollForMonsters = () => {
      const newRolls = { ...initRolls };
      combatants.forEach(c => {
          if (c.type === EntityType.MONSTER) {
              newRolls[c.id] = Math.floor(Math.random() * 20) + 1;
          }
      });
      setInitRolls(newRolls);
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

  const toggleCondition = (combatantId: string, condition: Condition) => {
      setCombatants(prev => prev.map(c => {
          if (c.id === combatantId) {
              const safeConditions = c.conditions || [];
              const exists = safeConditions.some(cond => cond.id === condition.id);
              let newConditions;
              if (exists) newConditions = safeConditions.filter(cond => cond.id !== condition.id);
              else newConditions = [...safeConditions, condition];
              return { ...c, conditions: newConditions };
          }
          return c;
      }));
  };

  const openConditionInfo = (conditionId: string, conditionName: string) => {
      const event = new CustomEvent('dmc-show-details', {
          detail: { type: 'condition', id: conditionId, title: conditionName }
      });
      window.dispatchEvent(event);
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
      notes: '',
      xp: 50,
      actions: []
    };
    setCombatants(prev => {
        const updated = [...prev, combatant];
        if (combatant.type === EntityType.MONSTER && prev.filter(c => c.type === EntityType.MONSTER).length === 0) {
            playCombatMusic();
        }
        return updated;
    });
    setNewCombatant({ name: '', initiative: 10, hp: 10, maxHp: 10, ac: 10, type: EntityType.MONSTER });
  };

  const removeCombatant = (id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id));
  };

  const handleEndCombatClick = () => {
      if (combatants.filter(c => c.type === EntityType.MONSTER).length === 0) {
          // Use custom confirm instead of window.confirm
          setConfirmAction({
              message: "В бою нет монстров. Просто очистить трекер и закончить?",
              onConfirm: () => {
                  cleanCombatState();
                  setConfirmAction(null);
              }
          });
          return;
      }
      const activePlayers = combatants.filter(c => c.type === EntityType.PLAYER);
      const playerCount = activePlayers.length || 1;
      const monsters = combatants.filter(c => c.type === EntityType.MONSTER);
      const totalXp = monsters.reduce((sum, m) => sum + (m.xp || 0), 0);
      const xpPerPlayer = Math.floor(totalXp / playerCount);

      setVictoryXp(xpPerPlayer);
      setVictoryLoot('');
      setShowVictoryModal(true);
      
      // Auto play victory music
      autoPlayMusic('victory');
  };

  const cleanCombatState = () => {
      setCombatants(prev => prev.filter(c => c.type === EntityType.PLAYER));
      setRound(1);
      setTurnIndex(0);
      setActiveId(null);
      setShowVictoryModal(false);
      addLog({ id: Date.now().toString(), timestamp: Date.now(), text: "Боевая сцена завершена.", type: 'system' });
  };

  const distributeXp = () => {
      const event = new CustomEvent('dmc-add-xp', { 
          detail: { amount: victoryXp, reason: 'за победу в бою' } 
      });
      window.dispatchEvent(event);
      alert(`Начислено ${victoryXp} XP каждому герою.`);
  };

  const generateVictoryLoot = async () => {
      setLootLoading(true);
      try {
          const monsters = combatants.filter(c => c.type === EntityType.MONSTER);
          const names = monsters.map(m => m.name);
          const players = combatants.filter(c => c.type === EntityType.PLAYER);
          const avgLevel = players.length > 0 ? 3 : 1; 
          const result = await generateCombatLoot(names, avgLevel);
          setVictoryLoot(result);
          addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[ДОБЫЧА]: ${result.replace(/<[^>]*>?/gm, ' ')}`, type: 'story' });
      } catch (e: any) {
          setVictoryLoot(`<span class='text-red-400'>Ошибка: ${e.message}</span>`);
      } finally {
          setLootLoading(false);
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
          const players = combatants.filter(c => c.type === EntityType.PLAYER);
          const avgLevel = players.length > 0 ? 3 : 1; 
          const names = monsters.map(m => m.name);
          const namesToUse = names.length > 0 ? names : ["Неизвестный враг"];
          
          const result = await generateCombatLoot(namesToUse, avgLevel);
          addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[ДОБЫЧА]: ${result.replace(/<[^>]*>?/gm, ' ')}`, type: 'story' });
          alert("Добыча сгенерирована и добавлена в лог сессии.");
      } catch (e: any) {
          alert(`Ошибка генерации лута: ${e.message}`);
      } finally {
          setLootLoading(false);
      }
  };

  const loadParty = () => {
    const savedParty = localStorage.getItem('dmc_party');
    if (!savedParty) { alert("В менеджере персонажей нет данных."); return; }
    const partyMembers: PartyMember[] = JSON.parse(savedParty);
    const activeMembers = partyMembers.filter(p => p.active);
    if (activeMembers.length === 0) { alert("Нет активных персонажей."); return; }

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
            notes: `Пасс. воспр: ${p.passivePerception}`,
            xp: 0,
            actions: []
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
        const dexMod = Math.floor((monster.dexterity - 10) / 2);
        const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;
        const name = count > 1 ? `${monster.name} ${i}` : monster.name;
        const actions = (monster as any).actions?.map((a: any) => `<b>${a.name}:</b> ${a.desc}`) || [];

        newMonsters.push({
            id: Date.now().toString() + i + Math.random(),
            name: name,
            type: EntityType.MONSTER,
            initiative: initRoll,
            hp: monster.hit_points,
            maxHp: monster.hit_points,
            ac: getAcValue(monster),
            conditions: [],
            notes: `CR ${monster.challenge_rating}`,
            xp: monster.xp,
            actions
        });
    }

    setCombatants(prev => {
        const monstersBefore = prev.filter(c => c.type === EntityType.MONSTER).length;
        if (monstersBefore === 0) {
             const contextText = `${monster.name} ${monster.type} CR ${monster.challenge_rating}`;
             autoPlayMusic('combat', contextText);
        }
        return [...prev, ...newMonsters];
    });
    addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `Добавлено ${count} x ${monster.name} (API).`, type: 'system' });
  };

  const returnToTravel = () => {
      // Custom confirm for returning to travel
      setConfirmAction({
          message: "Завершить бой и вернуться к экрану путешествия?",
          onConfirm: () => {
              cleanCombatState();
              // Switch to Location tab and trigger travel modal open
              window.dispatchEvent(new CustomEvent('dmc-switch-tab', { detail: 'location' }));
              setTimeout(() => window.dispatchEvent(new CustomEvent('dmc-open-travel')), 100);
              
              // Switch back to travel music
              autoPlayMusic('travel');
              setConfirmAction(null);
          }
      });
  };

  const activeCombatant = combatants.find(c => c.id === activeId);
  const getDifficultyColor = (diff?: string) => {
      switch(diff) {
          case 'Trivial': return 'text-gray-400';
          case 'Easy': return 'text-green-400';
          case 'Medium': return 'text-yellow-400';
          case 'Hard': return 'text-orange-500';
          case 'Deadly': return 'text-red-500 font-bold animate-pulse';
          default: return 'text-gray-400';
      }
  };

  return (
    <div className="h-full flex flex-col space-y-4 relative">
      {/* Custom Confirmation Modal */}
      {confirmAction && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-gray-900 border border-gold-600 p-6 rounded-lg max-w-sm w-full text-center">
                  <h3 className="text-lg font-bold text-white mb-4">{confirmAction.message}</h3>
                  <div className="flex gap-4 justify-center">
                      <button 
                        onClick={() => setConfirmAction(null)} 
                        className="px-4 py-2 text-gray-400 hover:text-white border border-gray-700 rounded"
                      >
                          Отмена
                      </button>
                      <button 
                        onClick={confirmAction.onConfirm} 
                        className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-lg"
                      >
                          Подтвердить
                      </button>
                  </div>
              </div>
          </div>
      )}

      {showBestiary && (
        <BestiaryBrowser 
            onClose={() => setShowBestiary(false)} 
            onAddMonster={addApiMonster} 
        />
      )}

      {/* Init Modal */}
      {showInitModal && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                  <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                      <h3 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2">
                          <Dices className="w-5 h-5"/> Бросок Инициативы
                      </h3>
                      <button onClick={() => setShowInitModal(false)} className="text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                  </div>
                  
                  <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex gap-2 shrink-0">
                      <button 
                        onClick={rollForMonsters}
                        className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 py-2 rounded text-sm font-bold flex items-center justify-center gap-2"
                      >
                          <Dices className="w-4 h-4"/> Бросить за Монстров (d20)
                      </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                      {combatants.map(c => (
                          <div key={c.id} className="flex items-center justify-between bg-gray-900/50 p-2 rounded border border-gray-700">
                              <div className="flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${c.type === EntityType.PLAYER ? 'bg-blue-500' : 'bg-red-500'}`}></span>
                                  <span className={c.type === EntityType.PLAYER ? 'font-bold text-white' : 'text-gray-300'}>{c.name}</span>
                              </div>
                              <input 
                                type="number" 
                                className="w-16 bg-black border border-gray-600 rounded p-1 text-center text-white font-bold"
                                value={initRolls[c.id]}
                                onChange={(e) => setInitRolls({...initRolls, [c.id]: Number(e.target.value)})}
                              />
                          </div>
                      ))}
                  </div>

                  <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-2 shrink-0">
                      <button onClick={() => setShowInitModal(false)} className="text-gray-400 px-4 py-2 hover:text-white">Отмена</button>
                      <button 
                        onClick={applyInitiativeRolls}
                        className="bg-gold-600 hover:bg-gold-500 text-black font-bold px-6 py-2 rounded shadow-lg"
                      >
                          Применить и Сортировать
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Victory Modal */}
      {showVictoryModal && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
              <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="bg-gradient-to-r from-gold-600 to-yellow-500 p-4 text-center shrink-0">
                      <h2 className="text-3xl font-serif font-bold text-black flex items-center justify-center gap-2">
                          <Trophy className="w-8 h-8"/> ПОБЕДА!
                      </h2>
                  </div>
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                      <div className="text-center">
                          <p className="text-gray-400 text-sm uppercase tracking-widest">Награда за голову</p>
                          <div className="text-4xl font-bold text-gold-500 mt-2 flex items-center justify-center gap-2">
                              <Star className="w-6 h-6 fill-current"/> {victoryXp} XP
                          </div>
                          <p className="text-xs text-gray-500">каждому герою</p>
                          <button 
                            onClick={distributeXp}
                            className="mt-2 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-1 rounded font-bold"
                          >
                              Начислить Опыт
                          </button>
                      </div>

                      <div className="border-t border-gray-700 pt-4">
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="font-bold text-white flex items-center gap-2"><Coins className="w-5 h-5 text-yellow-500"/> Добыча</h3>
                              <button 
                                onClick={generateVictoryLoot}
                                disabled={lootLoading}
                                className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-3 py-1 rounded flex items-center gap-1 disabled:opacity-50"
                              >
                                  {lootLoading ? <Loader className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>} Генерировать
                              </button>
                          </div>
                          <div className="bg-gray-900 p-3 rounded border border-gray-700 min-h-[100px] text-sm text-gray-300">
                              {victoryLoot ? (
                                  <div dangerouslySetInnerHTML={{ __html: victoryLoot }} />
                              ) : (
                                  <p className="text-gray-600 italic text-center mt-4">Трофеи еще не собраны...</p>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-between shrink-0">
                      <button onClick={() => setShowVictoryModal(false)} className="text-gray-400 hover:text-white px-4">Отмена</button>
                      
                      {/* Show proper exit button based on context */}
                      {hasActiveTravel ? (
                          <button onClick={returnToTravel} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold shadow-lg flex items-center gap-2">
                              <Compass className="w-4 h-4"/> В Путешествие
                          </button>
                      ) : (
                          <button onClick={cleanCombatState} className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded font-bold shadow-lg">
                              Завершить Сцену
                          </button>
                      )}
                  </div>
              </div>
          </div>
      )}

      {/* Header Controls */}
      <div className="flex flex-col gap-2 bg-dnd-card p-3 rounded-lg border border-gray-700 shadow-sm shrink-0">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="text-gold-500 font-serif text-xl font-bold leading-none">
                    <span>Раунд {round}</span>
                </div>
                
                {difficulty && difficulty.difficulty !== 'Trivial' && (
                    <div className={`text-xs flex items-center gap-1 border px-2 py-1 rounded bg-gray-900/50 border-gray-700 ${getDifficultyColor(difficulty.difficulty)}`}>
                        <Skull className="w-3 h-3"/>
                        <span className="uppercase font-bold tracking-wider hidden sm:inline">{difficulty.difficulty === 'Deadly' ? 'Смертельно' : difficulty.difficulty === 'Hard' ? 'Сложно' : difficulty.difficulty === 'Medium' ? 'Средне' : 'Легко'}</span>
                        <span className="text-gray-500 ml-1">({Math.round(difficulty.adjustedXp)} XP)</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                {hasActiveTravel && (
                    <button 
                        onClick={returnToTravel}
                        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gold-500 border border-gold-600/50 px-3 py-2 rounded font-bold transition-colors text-xs sm:text-sm"
                        title="Вернуться к экрану путешествия"
                    >
                        <Compass className="w-4 h-4" /> <span>В Путь</span>
                    </button>
                )}
                <button onClick={handleEndCombatClick} className="flex items-center gap-2 bg-gray-800 hover:bg-green-900 text-gray-300 hover:text-green-300 px-3 py-2 rounded font-bold border border-gray-700 transition-colors text-xs sm:text-sm">
                    <Flag className="w-4 h-4" /> <span>Завершить</span>
                </button>
                <button 
                    onClick={nextTurn}
                    className="flex items-center gap-2 bg-dnd-red hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition-colors shadow-md text-xs sm:text-sm"
                >
                    <Play className="w-4 h-4" /> След. ход
                </button>
            </div>
        </div>

        {/* Active Combatant Bar */}
        {activeCombatant && (
            <div className="text-xs text-gray-400 font-sans bg-gray-900/30 p-2 rounded border border-gray-800 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <span>Ход: <span className="text-white font-bold text-sm">{activeCombatant.name}</span></span>
                    <div className="flex gap-2 items-center sm:hidden">
                        {(activeCombatant.conditions || []).map(c => (
                            <span key={c.id} className="bg-red-900/50 text-red-200 px-1.5 rounded border border-red-800 text-[10px] font-bold">
                                {c.name.split(' (')[0]}
                            </span>
                        ))}
                    </div>
                </div>
                
                {activeCombatant.actions && activeCombatant.actions.length > 0 && (
                    <div className="flex-1 border-t sm:border-t-0 sm:border-l border-gray-700 pt-2 sm:pt-0 sm:pl-2 text-gray-300 overflow-x-auto">
                        <div className="flex gap-2">
                            {activeCombatant.actions.map((act, idx) => (
                                <span key={idx} className="bg-black/40 px-2 py-0.5 rounded border border-gray-700 whitespace-nowrap" dangerouslySetInnerHTML={{__html: act}} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
        
        {/* Tools */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 no-scrollbar pt-2 border-t border-gray-800">
            <button onClick={() => setShowInitModal(true)} className="bg-gray-800 hover:bg-gray-700 text-gold-500 flex items-center gap-1 text-xs px-3 py-2 rounded border border-gray-700 whitespace-nowrap">
              <Dices className="w-4 h-4" /> Инициатива
            </button>
            <div className="w-[1px] h-6 bg-gray-700 mx-1"></div>
            <button onClick={generateLootForEncounter} disabled={lootLoading} className="bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200 flex items-center gap-1 text-xs px-3 py-2 rounded border border-yellow-800 whitespace-nowrap">
              {lootLoading ? <Loader className="w-3 h-3 animate-spin"/> : <Coins className="w-3 h-3" />} Лут
            </button>
            <button onClick={() => setShowBestiary(true)} className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 flex items-center gap-1 text-xs px-3 py-2 rounded border border-indigo-800 whitespace-nowrap">
              <BookOpen className="w-3 h-3" /> Бестиарий
            </button>
            <button onClick={loadParty} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 flex items-center gap-1 text-xs px-3 py-2 rounded border border-blue-800 whitespace-nowrap">
              <Users className="w-3 h-3" /> Группа
            </button>
            <div className="flex-1"></div>
            <button onClick={sortCombatants} className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-800" title="Сортировать по инициативе">
              <RefreshCw className="w-4 h-4" />
            </button>
        </div>
      </div>

      {/* Combatant List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {combatants.map((c) => {
          const isActive = c.id === activeId;
          const isDead = c.hp === 0;
          const isEditingConditions = editingConditionsId === c.id;
          const currentConditions = c.conditions || [];

          return (
            <div 
              key={c.id}
              id={`combatant-${c.id}`}
              className={`relative p-2 sm:p-3 rounded-lg border flex flex-col sm:flex-row gap-2 sm:items-center ${isActive ? 'border-gold-500 bg-gray-900 ring-1 ring-gold-500/30' : 'border-gray-700 bg-dnd-card'} transition-all`}
            >
                <div className="flex-1">
                    <div className="flex items-center justify-between sm:justify-start sm:gap-3">
                         <div className="flex items-center gap-3">
                             <div className={`flex flex-col items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded border shrink-0 ${isActive ? 'bg-gold-600 text-black border-gold-500' : 'bg-gray-800 border-gray-600 text-white'}`}>
                                <span className="text-[10px] opacity-70">ИНИЦ</span>
                                <span className="font-bold text-sm sm:text-base">{c.initiative}</span>
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                    <h4 className={`font-serif font-bold text-base sm:text-lg flex items-center gap-2 leading-tight ${isDead ? 'text-red-500 line-through' : 'text-gray-100'}`}>
                                    {c.name}
                                    {isDead && <Skull className="w-4 h-4 text-red-500" />}
                                    </h4>
                                    {/* Condition Badges */}
                                    <div className="flex flex-wrap gap-1">
                                        {currentConditions.map(cond => (
                                            <button key={cond.id} onClick={() => openConditionInfo(cond.id, cond.name)} className="w-4 h-4 rounded-full bg-red-900 border border-red-500 flex items-center justify-center text-[10px] text-white hover:scale-110 transition-transform">
                                                <Activity className="w-2.5 h-2.5"/>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 flex gap-2 items-center mt-0.5">
                                   <span className={`px-1 rounded ${c.type === EntityType.PLAYER ? 'bg-blue-900/50 text-blue-200' : 'bg-red-900/50 text-red-200'}`}>
                                     {c.type === EntityType.PLAYER ? 'ИГРОК' : 'МОНСТР'}
                                   </span>
                                   <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> КД {c.ac}</span>
                                   {c.notes && <span className="text-gray-500 truncate max-w-[100px]">{c.notes}</span>}
                                </div>
                             </div>
                         </div>
                         
                         <div className="sm:hidden flex gap-2">
                            <button onClick={() => setEditingConditionsId(isEditingConditions ? null : c.id)} className={`p-1 rounded ${currentConditions.length > 0 ? 'text-red-400' : 'text-gray-600'}`}>
                                <Activity className="w-5 h-5"/>
                            </button>
                            <button onClick={() => removeCombatant(c.id)} className="text-gray-600 hover:text-red-500 p-1">
                                <X className="w-5 h-5" />
                            </button>
                         </div>
                    </div>
                    
                    {c.type === EntityType.MONSTER && isActive && c.actions && c.actions.length > 0 && (
                        <div className="mt-2 text-xs text-gray-300 bg-black/20 p-2 rounded border border-gray-800">
                            <ul className="space-y-1 list-disc list-inside">
                                {c.actions.map((action, i) => (
                                    <li key={i} dangerouslySetInnerHTML={{__html: action}} />
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between sm:justify-center gap-2 bg-gray-900/30 p-1 rounded sm:bg-transparent sm:p-0 min-w-[120px]">
                    <button onClick={() => updateHp(c.id, -1)} className="w-8 h-8 flex items-center justify-center bg-red-900/30 rounded text-red-400 border border-red-900/50 active:scale-95"><Sword className="w-4 h-4" /></button>
                    
                    <div className="flex flex-col items-center flex-1">
                        <div className="flex items-center gap-1">
                            <Heart className={`w-3 h-3 ${isDead ? 'text-gray-600' : 'text-red-500'}`} />
                            <span className={`font-mono font-bold ${isDead ? 'text-gray-500' : 'text-white'}`}>{c.hp}</span>
                            <span className="text-gray-500 text-xs">/{c.maxHp}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-700 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full transition-all duration-300 ${c.hp < c.maxHp / 2 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (c.hp / c.maxHp) * 100)}%` }} />
                        </div>
                    </div>
                    
                    <button onClick={() => updateHp(c.id, 1)} className="w-8 h-8 flex items-center justify-center bg-green-900/30 rounded text-green-400 border border-green-900/50 active:scale-95"><Plus className="w-4 h-4" /></button>
                </div>

                <div className="hidden sm:flex items-center gap-1 ml-2">
                    <button onClick={() => setEditingConditionsId(isEditingConditions ? null : c.id)} className={`p-2 rounded hover:bg-gray-800 transition-colors ${currentConditions.length > 0 ? 'text-red-400' : 'text-gray-500 hover:text-white'}`}>
                        <Activity className="w-5 h-5"/>
                    </button>
                    <button onClick={() => removeCombatant(c.id)} className="text-gray-600 hover:text-red-500 p-2 hover:bg-gray-800 rounded">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {isEditingConditions && (
                    <div className="absolute top-full left-0 right-0 z-20 bg-gray-900 border border-gold-500 rounded-b-lg shadow-xl p-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-center mb-2 border-b border-gray-700 pb-1">
                            <span className="text-xs font-bold text-gold-500 uppercase">Состояния</span>
                            <button onClick={() => setEditingConditionsId(null)} className="text-gray-400 hover:text-white"><X className="w-3 h-3"/></button>
                        </div>
                        <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto custom-scrollbar">
                            {CONDITIONS.map(cond => {
                                const isActiveCond = currentConditions.some(active => active.id === cond.id);
                                return (
                                    <button key={cond.id} onClick={() => toggleCondition(c.id, cond)} className={`text-left text-[10px] px-2 py-1.5 rounded border flex items-center justify-between ${isActiveCond ? 'bg-red-900/40 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                                        <span>{cond.name.split(' (')[0]}</span>
                                        {isActiveCond && <Activity className="w-3 h-3 text-red-400"/>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
          );
        })}
      </div>

      {/* Add New Manual Form */}
      <div className="bg-gray-900 p-3 rounded border border-gray-800 flex flex-col sm:flex-row gap-2 items-end shrink-0">
        <div className="w-full sm:flex-1">
            <input 
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm text-white focus:border-gold-500 outline-none"
                value={newCombatant.name}
                onChange={e => setNewCombatant({...newCombatant, name: e.target.value})}
                placeholder="Имя существа..."
            />
        </div>
        <div className="flex w-full sm:w-auto gap-2">
            <div className="flex-1 sm:w-16">
                <input type="number" placeholder="Иниц" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm text-white focus:border-gold-500" value={newCombatant.initiative} onChange={e => setNewCombatant({...newCombatant, initiative: Number(e.target.value)})} />
            </div>
            <div className="flex-1 sm:w-16">
                <input type="number" placeholder="HP" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm text-white focus:border-gold-500" value={newCombatant.hp} onChange={e => setNewCombatant({...newCombatant, hp: Number(e.target.value)})} />
            </div>
            <div className="flex-1 sm:w-16">
                <input type="number" placeholder="AC" className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-2 text-sm text-white focus:border-gold-500" value={newCombatant.ac} onChange={e => setNewCombatant({...newCombatant, ac: Number(e.target.value)})} />
            </div>
            <button onClick={addCombatant} className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded font-bold text-sm">
                <Plus className="w-5 h-5"/>
            </button>
        </div>
      </div>
    </div>
  );
};

export default CombatTracker;
