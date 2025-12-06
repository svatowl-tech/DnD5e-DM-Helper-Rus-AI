
import React, { useState, useEffect } from 'react';
import { Combatant, EntityType, LogEntry, PartyMember, Condition, BestiaryEntry } from '../types';
import { CONDITIONS, SAMPLE_COMBATANTS } from '../constants';
import { Shield, Heart, Sword, Skull, Play, RefreshCw, Plus, X, Trash2, Users, BookOpen, Coins, Loader, Flag, Zap, Activity, HelpCircle, Trophy, Star, Dices, Compass, ArrowLeft, Check, Book, Sparkles, Save, UserPlus, Feather, RotateCcw } from 'lucide-react';
import BestiaryBrowser from './BestiaryBrowser';
import { generateCombatLoot, generateMonster } from '../services/polzaService';
import { calculateEncounterDifficulty, EncounterResult } from '../services/encounterService';
import { useAudio } from '../contexts/AudioContext';
import { useToast } from '../contexts/ToastContext';
import SmartText from './SmartText';
import LootInteraction from './LootInteraction';

interface CombatTrackerProps {
  addLog: (entry: LogEntry) => void;
}

// Helper to parse text and make dice clickable
const ActionRenderer: React.FC<{ text: string, sourceName: string, onRoll: (expr: string, result: number, total: number) => void }> = ({ text, sourceName, onRoll }) => {
    const diceRegex = /(\d+d\d+(?:\s*[+\-]\s*\d+)?)/g;
    const parts = text.split(diceRegex);
    
    const rollDice = (expression: string) => {
        try {
            const cleanExpr = expression.replace(/\s/g, '');
            const [dicePart, modPart] = cleanExpr.split(/[+\-]/);
            const [count, sides] = dicePart.split('d').map(Number);
            const modifier = modPart ? Number(modPart) : 0;
            const isNegative = cleanExpr.includes('-');
            
            let total = 0;
            for (let i = 0; i < count; i++) {
                total += Math.floor(Math.random() * sides) + 1;
            }
            const finalTotal = isNegative ? total - modifier : total + modifier;
            onRoll(expression, finalTotal, finalTotal);
        } catch (e) {
            console.error("Dice parse error", e);
        }
    };

    return (
        <span>
            {parts.map((part, i) => {
                if (part.match(diceRegex)) {
                    return (
                        <button 
                            key={i}
                            onClick={(e) => { e.stopPropagation(); rollDice(part); }}
                            className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-indigo-900/80 hover:bg-indigo-600 border border-indigo-500/50 rounded text-indigo-100 font-mono text-sm font-bold cursor-pointer transition-colors active:scale-95 touch-manipulation"
                        >
                            <Dices className="w-3 h-3"/> {part}
                        </button>
                    );
                }
                return <span key={i} dangerouslySetInnerHTML={{__html: part}} />;
            })}
        </span>
    );
};

const CombatTracker: React.FC<CombatTrackerProps> = ({ addLog }) => {
  const { autoPlayMusic } = useAudio();
  const { showToast } = useToast();

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
  const [viewingStatBlock, setViewingStatBlock] = useState<BestiaryEntry | null>(null);
  const [generatingStats, setGeneratingStats] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ message: string, onConfirm: () => void } | null>(null);

  const [newCombatant, setNewCombatant] = useState<Partial<Combatant>>({
    name: '', initiative: 10, hp: 10, maxHp: 10, ac: 10, type: EntityType.MONSTER
  });

  const [hasActiveTravel, setHasActiveTravel] = useState(false);

  useEffect(() => {
      const travelState = localStorage.getItem('dmc_active_travel');
      if (travelState) setHasActiveTravel(true);
  }, []);

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

  useEffect(() => {
      if (showInitModal) {
          const rolls: Record<string, number> = {};
          combatants.forEach(c => { rolls[c.id] = c.initiative; });
          setInitRolls(rolls);
      }
  }, [showInitModal]);

  const playCombatMusic = () => {
      const monsterNames = combatants.filter(c => c.type === EntityType.MONSTER).map(c => c.name + " " + c.notes).join(' ');
      autoPlayMusic('combat', monsterNames);
  };

  const sortCombatants = () => {
    const sorted = [...combatants].sort((a, b) => b.initiative - a.initiative);
    setCombatants(sorted);
    if (sorted.length > 0) {
        setActiveId(sorted[0].id);
        setTurnIndex(0);
    }
    showToast("Инициатива отсортирована", "info");
  };

  const applyInitiativeRolls = () => {
      setCombatants(prev => prev.map(c => ({
          ...c,
          initiative: initRolls[c.id] !== undefined ? initRolls[c.id] : c.initiative
      })).sort((a, b) => b.initiative - a.initiative));
      setShowInitModal(false);
      setTurnIndex(0);
      if (combatants.length > 0) setActiveId(combatants[0].id); 
      showToast("Инициатива обновлена", "success");
  };

  const rollForMonsters = () => {
      const newRolls = { ...initRolls };
      combatants.forEach(c => {
          if (c.type === EntityType.MONSTER) {
              newRolls[c.id] = Math.floor(Math.random() * 20) + 1;
          }
      });
      setInitRolls(newRolls);
      showToast("Инициатива монстров брошена", "success");
  };

  const nextTurn = () => {
    if (combatants.length === 0) return;
    let nextIndex = turnIndex + 1;
    if (nextIndex >= combatants.length) {
      nextIndex = 0;
      setRound(r => r + 1);
    }
    setTurnIndex(nextIndex);
    setActiveId(combatants[nextIndex].id);
    
    // Scroll to active combatant (optional, but good UX)
    const el = document.getElementById(`combatant-${combatants[nextIndex].id}`);
    if(el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  };

  const updateHp = (id: string, delta: number) => {
    setCombatants(prev => prev.map(c => {
      if (c.id === id) {
        const newHp = Math.max(0, c.hp + delta);
        if (newHp === 0 && c.hp > 0) {
             showToast(`${c.name} теряет сознание!`, 'warning');
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
    showToast(`${combatant.name} добавлен`, 'success');
  };

  const removeCombatant = (id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id));
  };

  const handleEndCombatClick = () => {
      if (combatants.filter(c => c.type === EntityType.MONSTER).length === 0) {
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
      autoPlayMusic('victory');
  };

  const cleanCombatState = () => {
      setCombatants(prev => prev.filter(c => c.type === EntityType.PLAYER));
      setRound(1);
      setTurnIndex(0);
      setActiveId(null);
      setShowVictoryModal(false);
      showToast("Сцена завершена", 'info');
  };

  const distributeXp = () => {
      const event = new CustomEvent('dmc-add-xp', { 
          detail: { amount: victoryXp, reason: 'за победу в бою' } 
      });
      window.dispatchEvent(event);
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
      } catch (e: any) {
          setVictoryLoot(`<span class='text-red-400'>Ошибка: ${e.message}</span>`);
      } finally {
          setLootLoading(false);
      }
  };

  const generateLootForEncounter = async () => {
      const monsters = combatants.filter(c => c.type === EntityType.MONSTER);
      if (monsters.length === 0) {
          showToast("Нет монстров для лута", "warning");
          return;
      }
      setLootLoading(true);
      try {
          const players = combatants.filter(c => c.type === EntityType.PLAYER);
          const avgLevel = players.length > 0 ? 3 : 1; 
          const names = monsters.map(m => m.name);
          const namesToUse = names.length > 0 ? names : ["Неизвестный враг"];
          
          const result = await generateCombatLoot(namesToUse, avgLevel);
          setVictoryLoot(result);
          setShowVictoryModal(true);
          setVictoryXp(0); 
          
          showToast("Добыча сгенерирована", "success");
      } catch (e: any) {
          showToast(`Ошибка: ${e.message}`, "error");
      } finally {
          setLootLoading(false);
      }
  };

  const saveLootToLog = () => {
        if (!victoryLoot) return;
        const cleanText = victoryLoot.replace(/<[^>]*>?/gm, ' ');
        addLog({ id: Date.now().toString(), timestamp: Date.now(), text: `[ДОБЫЧА]: ${cleanText}`, type: 'story' });
        showToast("Добыча записана в летопись", "success");
  };

  const loadParty = () => {
    const savedParty = localStorage.getItem('dmc_party');
    if (!savedParty) { showToast("Нет данных о группе", "warning"); return; }
    const partyMembers: PartyMember[] = JSON.parse(savedParty);
    const activeMembers = partyMembers.filter(p => p.active);
    if (activeMembers.length === 0) { showToast("Нет активных героев", "warning"); return; }

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
        showToast(`Добавлено ${newCombatants.length} героев`, "success");
    } else {
        showToast("Все герои уже в бою", "info");
    }
  };

  const addMonsterToTracker = (monster: BestiaryEntry, count: number) => {
    const newMonsters: Combatant[] = [];
    for (let i = 1; i <= count; i++) {
        const dexMod = Math.floor((monster.stats.dex - 10) / 2);
        const initRoll = Math.floor(Math.random() * 20) + 1 + dexMod;
        const name = count > 1 ? `${monster.name} ${i}` : monster.name;
        const actions = monster.actions?.map(a => `<b>${a.name}:</b> ${a.desc}`) || [];

        newMonsters.push({
            id: Date.now().toString() + i + Math.random(),
            name: name,
            type: EntityType.MONSTER,
            initiative: initRoll,
            hp: monster.hp,
            maxHp: monster.hp,
            ac: monster.ac,
            conditions: [],
            notes: `CR ${monster.cr} (${monster.type})`,
            xp: monster.xp,
            actions
        });
    }

    setCombatants(prev => {
        const monstersBefore = prev.filter(c => c.type === EntityType.MONSTER).length;
        if (monstersBefore === 0) {
             const contextText = `${monster.name} ${monster.type} CR ${monster.cr}`;
             autoPlayMusic('combat', contextText);
        }
        return [...prev, ...newMonsters];
    });
    showToast(`${count} x ${monster.name} добавлены`, "success");
  };

  const returnToTravel = () => {
      setConfirmAction({
          message: "Завершить бой и вернуться к экрану путешествия?",
          onConfirm: () => {
              cleanCombatState();
              window.dispatchEvent(new CustomEvent('dmc-switch-tab', { detail: 'location' }));
              setTimeout(() => window.dispatchEvent(new CustomEvent('dmc-open-travel')), 100);
              autoPlayMusic('travel');
              setConfirmAction(null);
          }
      });
  };

  const openStatBlock = (combatant: Combatant) => {
      if (combatant.type !== EntityType.MONSTER) return;
      const localBestiary = JSON.parse(localStorage.getItem('dmc_local_bestiary') || '[]');
      const baseName = combatant.name.replace(/\s\d+$/, '');
      const foundEntry = localBestiary.find((b: BestiaryEntry) => b.name.toLowerCase() === baseName.toLowerCase() || b.name === combatant.name);

      if (foundEntry) {
          setViewingStatBlock({ ...foundEntry, id: combatant.id });
      } else {
          const parsedActions = combatant.actions?.map(a => {
               const match = a.match(/<b>(.*?):<\/b>(.*)/);
               if (match) return { name: match[1], desc: match[2] };
               return { name: 'Action', desc: a };
          }) || [];

          setViewingStatBlock({
              id: combatant.id,
              name: combatant.name,
              type: 'Неизвестно',
              hp: combatant.maxHp,
              ac: combatant.ac,
              cr: '?',
              xp: combatant.xp || 0,
              stats: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
              actions: parsedActions,
              description: combatant.notes || '',
              source: 'local'
          });
      }
  };

  const saveStatBlockToBestiary = () => {
    if (!viewingStatBlock) return;
    const localBestiary = JSON.parse(localStorage.getItem('dmc_local_bestiary') || '[]');
    const filtered = localBestiary.filter((b: BestiaryEntry) => b.name !== viewingStatBlock.name);
    const entryToSave = { ...viewingStatBlock, source: 'local' as const };
    const updatedBestiary = [entryToSave, ...filtered];
    localStorage.setItem('dmc_local_bestiary', JSON.stringify(updatedBestiary));
    showToast("Сохранено в Бестиарий!", "success");
  };

  const convertToNpc = () => {
        if (!viewingStatBlock) return;
        const npcData = {
            name: viewingStatBlock.name,
            race: viewingStatBlock.type || 'Монстр',
            description: viewingStatBlock.description || "Бывший враг, спасенный в бою.",
            location: "С группой",
            status: 'alive',
            attitude: 'neutral',
            notes: `CR ${viewingStatBlock.cr}. HP: ${viewingStatBlock.hp}. AC: ${viewingStatBlock.ac}.`
        };
        window.dispatchEvent(new CustomEvent('dmc-add-npc', { detail: npcData }));
        setCombatants(prev => prev.map(c => c.id === viewingStatBlock.id ? { ...c, type: EntityType.NPC } : c));
        showToast(`${viewingStatBlock.name} теперь NPC`, 'success');
        setViewingStatBlock(null);
  };

  const handleGenerateStats = async () => {
    if (!viewingStatBlock) return;
    setGeneratingStats(true);
    try {
        const prompt = viewingStatBlock.name + (viewingStatBlock.description ? `. ${viewingStatBlock.description}` : "");
        const crHint = typeof viewingStatBlock.cr === 'string' && viewingStatBlock.cr !== '?' ? viewingStatBlock.cr : undefined;
        const newStats = await generateMonster(prompt, crHint);
        const savedBestiary = JSON.parse(localStorage.getItem('dmc_local_bestiary') || '[]');
        const filtered = savedBestiary.filter((b: BestiaryEntry) => b.name !== newStats.name);
        const updatedBestiary = [newStats, ...filtered];
        localStorage.setItem('dmc_local_bestiary', JSON.stringify(updatedBestiary));
        setViewingStatBlock({ ...newStats, id: viewingStatBlock.id });
        setCombatants(prev => prev.map(c => c.id === viewingStatBlock.id ? {
            ...c, actions: newStats.actions?.map(a => `<b>${a.name}:</b> ${a.desc}`) || []
        } : c));
    } catch (e: any) {
        showToast(`Ошибка: ${e.message}`, "error");
    } finally {
        setGeneratingStats(false);
    }
  };

  const handleActionRoll = (expr: string, result: number, total: number) => {
      const name = activeCombatant ? activeCombatant.name : 'Монстр';
      showToast(`${name}: ${total} (${expr})`, 'info');
  };

  const logCombatStart = () => {
      const enemies = combatants.filter(c => c.type === EntityType.MONSTER).map(c => c.name).join(', ');
      addLog({
          id: Date.now().toString(),
          timestamp: Date.now(),
          text: `[Бой] Начало сражения. Противники: ${enemies || 'Неизвестно'}`,
          type: 'combat'
      });
      showToast("Начало боя записано", 'success');
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
      {/* Confirm Modal */}
      {confirmAction && (
          <div className="fixed inset-0 z-[70] bg-black/90 flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-gray-900 border border-gold-600 p-6 rounded-lg max-w-sm w-full text-center">
                  <h3 className="text-lg font-bold text-white mb-4">{confirmAction.message}</h3>
                  <div className="flex gap-4 justify-center">
                      <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-gray-400 hover:text-white border border-gray-700 rounded">Отмена</button>
                      <button onClick={confirmAction.onConfirm} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold shadow-lg">Подтвердить</button>
                  </div>
              </div>
          </div>
      )}

      {showBestiary && <BestiaryBrowser onClose={() => setShowBestiary(false)} onAddMonster={addMonsterToTracker} />}

      {/* Stat Block Modal */}
      {viewingStatBlock && (
          <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={() => setViewingStatBlock(null)}>
              <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[85vh] overflow-hidden" onClick={e => e.stopPropagation()}>
                  <div className="p-4 bg-gray-900 border-b border-gold-600/50 flex justify-between items-start shrink-0">
                      <div>
                          <h3 className="text-2xl font-serif font-bold text-white leading-tight">{viewingStatBlock.name}</h3>
                          <p className="text-gold-500 italic text-sm capitalize mt-1">{viewingStatBlock.type} • CR {viewingStatBlock.cr} ({viewingStatBlock.xp} XP)</p>
                      </div>
                      <button onClick={() => setViewingStatBlock(null)} className="text-gray-400 hover:text-white p-2"><X className="w-6 h-6"/></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-900/95">
                      {/* Attributes */}
                      <div className="grid grid-cols-3 gap-2 bg-gray-800 p-3 rounded border border-gray-700 text-center">
                          <div><div className="text-xs text-gray-500 uppercase font-bold">AC</div><div className="text-xl font-bold text-white">{viewingStatBlock.ac}</div></div>
                          <div className="border-l border-gray-700"><div className="text-xs text-gray-500 uppercase font-bold">HP</div><div className="text-xl font-bold text-green-400">{viewingStatBlock.hp}</div></div>
                          <div className="border-l border-gray-700"><div className="text-xs text-gray-500 uppercase font-bold">SPD</div><div className="text-xl font-bold text-blue-400">30 ft</div></div>
                      </div>
                      {/* Stats */}
                      <div className="grid grid-cols-6 gap-1 text-center text-xs">
                          {Object.entries(viewingStatBlock.stats).map(([key, val]) => (
                              <div key={key} className="bg-gray-800 p-1 rounded border border-gray-700">
                                  <div className="font-bold text-gray-500 uppercase">{key}</div>
                                  <div>{val} <span className="text-gray-400">({Math.floor(((val as number) - 10) / 2)})</span></div>
                              </div>
                          ))}
                      </div>
                      {viewingStatBlock.description && <div className="text-sm text-gray-300 italic border-l-2 border-gold-500 pl-3 py-1"><SmartText content={viewingStatBlock.description} /></div>}
                      {viewingStatBlock.actions && viewingStatBlock.actions.length > 0 ? (
                          <div>
                              <h4 className="text-gold-500 font-bold uppercase text-xs border-b border-gray-700 pb-1 mb-2">Actions</h4>
                              <ul className="space-y-3">
                                  {viewingStatBlock.actions.map((action, i) => (
                                      <li key={i} className="text-sm"><span className="font-bold text-white">{action.name}.</span> <ActionRenderer text={action.desc} sourceName={viewingStatBlock.name} onRoll={handleActionRoll} /></li>
                                  ))}
                              </ul>
                          </div>
                      ) : (
                          <button onClick={handleGenerateStats} disabled={generatingStats} className="w-full bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 rounded py-3 text-sm font-bold flex items-center justify-center gap-2">
                            {generatingStats ? <Loader className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>} Сгенерировать статблок
                          </button>
                      )}
                  </div>
                  <div className="p-3 bg-gray-900 border-t border-gray-700 flex justify-end gap-2 shrink-0">
                      <button onClick={convertToNpc} className="text-gray-400 hover:text-green-500 p-2"><UserPlus className="w-6 h-6"/></button>
                      <button onClick={saveStatBlockToBestiary} className="text-gray-400 hover:text-blue-500 p-2"><Save className="w-6 h-6"/></button>
                  </div>
              </div>
          </div>
      )}

      {/* Init Modal */}
      {showInitModal && (
          <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-lg rounded-lg shadow-2xl flex flex-col max-h-[80vh] overflow-hidden">
                  <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                      <h3 className="text-xl font-serif font-bold text-gold-500 flex items-center gap-2"><Dices className="w-5 h-5"/> Бросок Инициативы</h3>
                      <button onClick={() => setShowInitModal(false)} className="text-gray-400 hover:text-white p-2"><X className="w-6 h-6"/></button>
                  </div>
                  <div className="p-4 border-b border-gray-700 bg-gray-800/50 flex gap-2 shrink-0">
                      <button onClick={rollForMonsters} className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 py-3 rounded text-sm font-bold flex items-center justify-center gap-2"><Dices className="w-4 h-4"/> Бросить за Монстров</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                      {combatants.map(c => (
                          <div key={c.id} className="flex items-center justify-between bg-gray-900/50 p-3 rounded border border-gray-700">
                              <div className="flex items-center gap-2"><span className={`w-3 h-3 rounded-full ${c.type === EntityType.PLAYER ? 'bg-blue-500' : 'bg-red-500'}`}></span><span className="font-bold text-white text-lg">{c.name}</span></div>
                              <input type="number" className="w-20 h-10 bg-black border border-gray-600 rounded p-1 text-center text-white font-bold text-lg" value={initRolls[c.id]} onChange={(e) => setInitRolls({...initRolls, [c.id]: Number(e.target.value)})} />
                          </div>
                      ))}
                  </div>
                  <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-2 shrink-0">
                      <button onClick={applyInitiativeRolls} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold px-6 py-3 rounded shadow-lg text-lg">Применить</button>
                  </div>
              </div>
          </div>
      )}

      {/* Victory Modal */}
      {showVictoryModal && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95">
              <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-lg rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                  <div className="bg-gradient-to-r from-gold-600 to-yellow-500 p-4 text-center shrink-0">
                      <h2 className="text-3xl font-serif font-bold text-black flex items-center justify-center gap-2"><Trophy className="w-8 h-8"/> ПОБЕДА!</h2>
                  </div>
                  <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                      <div className="text-center">
                          <p className="text-gray-400 text-sm uppercase tracking-widest">Награда за голову</p>
                          <div className="text-4xl font-bold text-gold-500 mt-2 flex items-center justify-center gap-2"><Star className="w-6 h-6 fill-current"/> {victoryXp} XP</div>
                          <p className="text-xs text-gray-500">каждому герою</p>
                          {victoryXp > 0 && <button onClick={distributeXp} className="mt-3 text-sm bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded font-bold w-full">Начислить Опыт</button>}
                      </div>
                      <div className="border-t border-gray-700 pt-4">
                          <div className="flex justify-between items-center mb-2">
                              <h3 className="font-bold text-white flex items-center gap-2"><Coins className="w-5 h-5 text-yellow-500"/> Добыча</h3>
                              <div className="flex gap-2">
                                  {victoryLoot && <button onClick={saveLootToLog} className="text-xs bg-gray-800 hover:bg-gray-700 text-green-400 px-3 py-2 rounded flex items-center gap-1 border border-green-900"><Feather className="w-3 h-3"/> В летопись</button>}
                                  <button onClick={generateVictoryLoot} disabled={lootLoading} className="text-xs bg-gray-800 hover:bg-gray-700 text-gold-500 px-3 py-2 rounded flex items-center gap-1"><RefreshCw className="w-3 h-3"/> Генерировать</button>
                              </div>
                          </div>
                          <div className="bg-gray-900 p-3 rounded border border-gray-700 min-h-[100px] text-sm text-gray-300">
                              {victoryLoot ? <LootInteraction htmlContent={victoryLoot} /> : <p className="text-gray-600 italic text-center mt-4">Трофеи еще не собраны...</p>}
                          </div>
                      </div>
                  </div>
                  <div className="p-4 bg-gray-900 border-t border-gray-700 flex flex-col gap-3 shrink-0">
                      {hasActiveTravel ? (
                          <button onClick={returnToTravel} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded font-bold shadow-lg flex items-center justify-center gap-2 w-full"><Compass className="w-4 h-4"/> В Путешествие</button>
                      ) : (
                          <button onClick={cleanCombatState} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded font-bold shadow-lg w-full">Завершить Сцену</button>
                      )}
                      <button onClick={() => setShowVictoryModal(false)} className="text-gray-400 hover:text-white px-4 py-2 w-full text-center">Отмена</button>
                  </div>
              </div>
          </div>
      )}

      {/* Top Bar Info */}
      <div className="flex flex-col gap-2 bg-dnd-card p-3 rounded-lg border border-gray-700 shadow-sm shrink-0">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="text-gold-500 font-serif text-xl font-bold leading-none">Раунд {round}</div>
                {difficulty && difficulty.difficulty !== 'Trivial' && (
                    <div className={`text-xs flex items-center gap-1 border px-2 py-1 rounded bg-gray-900/50 border-gray-700 ${getDifficultyColor(difficulty.difficulty)}`}>
                        <Skull className="w-3 h-3"/>
                        <span className="uppercase font-bold tracking-wider hidden sm:inline">{difficulty.difficulty === 'Deadly' ? 'Смертельно' : difficulty.difficulty === 'Hard' ? 'Сложно' : difficulty.difficulty === 'Medium' ? 'Средне' : 'Легко'}</span>
                    </div>
                )}
            </div>
            <div className="flex gap-2">
                <button onClick={logCombatStart} className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded"><Feather className="w-5 h-5"/></button>
                <button onClick={handleEndCombatClick} className="flex items-center gap-2 bg-gray-800 hover:bg-green-900 text-gray-300 hover:text-green-300 px-3 py-2 rounded font-bold border border-gray-700 text-xs sm:text-sm"><Flag className="w-4 h-4" /> <span>Завершить</span></button>
            </div>
        </div>
        {/* Active Combatant Info Bar */}
        {activeCombatant && (
            <div className="text-xs text-gray-400 font-sans bg-gray-900/30 p-2 rounded border border-gray-800 flex flex-col gap-2">
                <div className="flex items-center justify-between w-full">
                    <span className="text-sm">Ход: <span className="text-white font-bold text-base">{activeCombatant.name}</span></span>
                </div>
                {activeCombatant.actions && activeCombatant.actions.length > 0 && (
                    <div className="flex-1 border-t border-gray-700 pt-2 mt-1 text-gray-300">
                         <div className="flex flex-wrap gap-2">
                            {activeCombatant.actions.map((act, idx) => (
                                <div key={idx} className="bg-black/40 px-3 py-2 rounded border border-gray-700 text-xs w-full sm:w-auto touch-manipulation">
                                    <ActionRenderer text={act} sourceName={activeCombatant.name} onRoll={handleActionRoll} />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
        {/* Quick Tools */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 no-scrollbar pt-2 border-t border-gray-800">
            <button onClick={() => setShowInitModal(true)} className="bg-gray-800 hover:bg-gray-700 text-gold-500 flex items-center gap-1 text-xs px-3 py-2 rounded border border-gray-700 whitespace-nowrap"><Dices className="w-4 h-4" /> Инициатива</button>
            <div className="w-[1px] h-6 bg-gray-700 mx-1"></div>
            <button onClick={generateLootForEncounter} disabled={lootLoading} className="bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200 flex items-center gap-1 text-xs px-3 py-2 rounded border border-yellow-800 whitespace-nowrap"><Coins className="w-3 h-3" /> Лут</button>
            <button onClick={() => setShowBestiary(true)} className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 flex items-center gap-1 text-xs px-3 py-2 rounded border border-indigo-800 whitespace-nowrap"><BookOpen className="w-3 h-3" /> Бестиарий</button>
            <button onClick={loadParty} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 flex items-center gap-1 text-xs px-3 py-2 rounded border border-blue-800 whitespace-nowrap"><Users className="w-3 h-3" /> Группа</button>
            <div className="flex-1"></div>
            <button onClick={sortCombatants} className="text-gray-400 hover:text-white p-2 rounded hover:bg-gray-800"><RefreshCw className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Combatants List */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar pb-20">
        {combatants.map((c) => {
          const isActive = c.id === activeId;
          const isDead = c.hp === 0;
          const isEditingConditions = editingConditionsId === c.id;
          const currentConditions = c.conditions || [];

          return (
            <div id={`combatant-${c.id}`} key={c.id} className={`relative p-3 rounded-lg border flex flex-col gap-3 ${isActive ? 'border-gold-500 bg-gray-900 ring-1 ring-gold-500/30' : 'border-gray-700 bg-dnd-card'} transition-all`}>
                <div className="flex items-center justify-between gap-3">
                     <div className="flex items-center gap-3 min-w-0">
                         <div className={`flex flex-col items-center justify-center w-10 h-10 rounded border shrink-0 ${isActive ? 'bg-gold-600 text-black border-gold-500' : 'bg-gray-800 border-gray-600 text-white'}`}>
                            <span className="text-[9px] opacity-70 uppercase font-bold">Иниц</span>
                            <span className="font-bold text-lg leading-none">{c.initiative}</span>
                         </div>
                         <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h4 className={`font-serif font-bold text-lg truncate ${isDead ? 'text-red-500 line-through' : 'text-gray-100'}`}>{c.name}</h4>
                                {isDead && <Skull className="w-4 h-4 text-red-500" />}
                            </div>
                            <div className="text-xs text-gray-400 flex gap-2 items-center mt-0.5">
                               <span className="flex items-center gap-1 bg-black/30 px-1.5 rounded"><Shield className="w-3 h-3" /> {c.ac}</span>
                               {c.type === EntityType.MONSTER && <button onClick={() => openStatBlock(c)} className="text-gold-500 hover:text-white"><Book className="w-3 h-3"/></button>}
                            </div>
                         </div>
                     </div>
                     
                     <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditingConditionsId(isEditingConditions ? null : c.id)} className={`p-2 rounded border ${currentConditions.length > 0 ? 'text-red-400 border-red-900 bg-red-900/20' : 'text-gray-500 border-gray-700 bg-gray-800'}`}>
                            <Activity className="w-5 h-5"/>
                        </button>
                        <button onClick={() => removeCombatant(c.id)} className="text-gray-600 hover:text-red-500 p-2 border border-transparent hover:bg-gray-800 rounded">
                            <X className="w-5 h-5" />
                        </button>
                     </div>
                </div>

                {/* HP Control Row - Large Tap Targets */}
                <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg">
                    <button 
                        onClick={() => updateHp(c.id, -1)} 
                        className="w-12 h-12 flex items-center justify-center bg-red-900/20 rounded-lg text-red-400 border border-red-900/50 active:bg-red-600 active:text-white transition-colors touch-manipulation"
                    >
                        <Sword className="w-5 h-5" />
                    </button>
                    
                    <div className="flex flex-col items-center flex-1 mx-2">
                        <div className="flex items-end gap-1">
                            <span className={`text-2xl font-mono font-bold leading-none ${isDead ? 'text-gray-500' : 'text-white'}`}>{c.hp}</span>
                            <span className="text-gray-500 text-xs font-bold mb-1">/ {c.maxHp}</span>
                        </div>
                        <div className="w-full h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                            <div className={`h-full transition-all duration-300 ${c.hp < c.maxHp / 2 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (c.hp / c.maxHp) * 100)}%` }} />
                        </div>
                    </div>
                    
                    <button 
                        onClick={() => updateHp(c.id, 1)} 
                        className="w-12 h-12 flex items-center justify-center bg-green-900/20 rounded-lg text-green-400 border border-green-900/50 active:bg-green-600 active:text-white transition-colors touch-manipulation"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>

                {/* Conditions List */}
                {currentConditions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {currentConditions.map(cond => (
                            <button key={cond.id} onClick={() => openConditionInfo(cond.id, cond.name)} className="px-2 py-1 rounded bg-red-900/40 border border-red-500 text-xs text-red-100 flex items-center gap-1">
                                <Activity className="w-3 h-3"/> {cond.name.split(' (')[0]}
                            </button>
                        ))}
                    </div>
                )}

                {/* Conditions Selector Dropdown */}
                {isEditingConditions && (
                    <div className="bg-gray-900 border border-gold-500 rounded shadow-xl p-3 animate-in fade-in slide-in-from-top-2">
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                            {CONDITIONS.map(cond => {
                                const isActiveCond = currentConditions.some(active => active.id === cond.id);
                                return (
                                    <button key={cond.id} onClick={() => toggleCondition(c.id, cond)} className={`text-left text-xs px-3 py-2 rounded border flex items-center justify-between ${isActiveCond ? 'bg-red-900/40 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                                        <span>{cond.name.split(' (')[0]}</span>
                                        {isActiveCond && <Check className="w-3 h-3 text-red-400"/>}
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
      
      {/* Floating / Fixed Bottom Controls for Mobile */}
      <div className="sticky bottom-0 left-0 right-0 p-3 bg-gray-900/95 border-t border-gold-600/30 backdrop-blur-md flex gap-3 z-10 shadow-lg">
           {/* Add new simple input */}
           <div className="flex-1 flex gap-2 bg-gray-800 rounded-lg p-1 border border-gray-700">
               <input 
                   className="flex-1 bg-transparent px-2 text-sm text-white outline-none placeholder-gray-500 min-w-0"
                   value={newCombatant.name}
                   onChange={e => setNewCombatant({...newCombatant, name: e.target.value})}
                   placeholder="Имя..."
               />
               <input 
                   type="number" 
                   placeholder="Иниц" 
                   className="w-12 bg-gray-900 rounded text-center text-sm text-white border border-gray-700" 
                   value={newCombatant.initiative} 
                   onChange={e => setNewCombatant({...newCombatant, initiative: Number(e.target.value)})} 
               />
               <button onClick={addCombatant} className="bg-gray-700 text-white px-3 rounded hover:bg-gray-600">
                   <Plus className="w-5 h-5"/>
               </button>
           </div>
           
           <button 
                onClick={nextTurn}
                className="bg-dnd-red hover:bg-red-700 text-white px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
            >
                <Play className="w-6 h-6 fill-current" /> <span className="hidden sm:inline">След. ход</span>
           </button>
      </div>
    </div>
  );
};

export default CombatTracker;
