
import React, { useState } from 'react';
import { Combatant, EntityType, Condition } from '../../types';
import { Shield, Heart, Sword, Skull, Activity, X, Book, Check } from 'lucide-react';
import ActionRenderer from '../ActionRenderer';
import { CONDITIONS } from '../../constants';

interface CombatantCardProps {
    combatant: Combatant;
    isActive: boolean;
    isEditingConditions: boolean;
    onToggleConditionEdit: (id: string | null) => void;
    onRemove: (id: string) => void;
    onUpdateHp: (id: string, type: 'damage' | 'heal', amount: number) => void;
    onToggleCondition: (id: string, condition: Condition) => void;
    onOpenConditionInfo: (id: string, name: string) => void;
    onOpenStatBlock: (c: Combatant) => void;
    onRoll: (expr: string, result: number, total: number) => void;
}

const CombatantCard: React.FC<CombatantCardProps> = ({
    combatant: c,
    isActive,
    isEditingConditions,
    onToggleConditionEdit,
    onRemove,
    onUpdateHp,
    onToggleCondition,
    onOpenConditionInfo,
    onOpenStatBlock,
    onRoll
}) => {
    const [hpInput, setHpInput] = useState('');
    const isDead = c.hp === 0;
    const isBloodied = c.hp <= c.maxHp / 2 && !isDead;
    const currentConditions = c.conditions || [];

    const handleApplyHp = (type: 'damage' | 'heal') => {
        const val = parseInt(hpInput || '0');
        if (!val || isNaN(val)) return;
        onUpdateHp(c.id, type, val);
        setHpInput('');
    };

    return (
        <div id={`combatant-${c.id}`} className={`relative p-3 rounded-lg border flex flex-col gap-3 ${isActive ? 'border-gold-500 bg-gray-900 ring-1 ring-gold-500/30' : 'border-gray-700 bg-dnd-card'} ${isBloodied ? 'shadow-[inset_0_0_10px_rgba(220,38,38,0.2)]' : ''} transition-all`}>
            <div className="flex items-center justify-between gap-3">
                 <div className="flex items-center gap-3 min-w-0">
                     <div className={`flex flex-col items-center justify-center w-10 h-10 rounded border shrink-0 ${isActive ? 'bg-gold-600 text-black border-gold-500' : 'bg-gray-800 border-gray-600 text-white'}`}>
                        <span className="text-[9px] opacity-70 uppercase font-bold">Иниц</span>
                        <span className="font-bold text-lg leading-none">{c.initiative}</span>
                     </div>
                     <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className={`font-serif font-bold text-lg truncate ${isDead ? 'text-red-500 line-through' : isBloodied ? 'text-red-400' : 'text-gray-100'}`}>{c.name}</h4>
                            {isDead && <Skull className="w-4 h-4 text-red-500" />}
                            {isBloodied && !isDead && <div className="text-[10px] bg-red-900 text-red-200 px-1 rounded">Ранен</div>}
                        </div>
                        <div className="text-xs text-gray-400 flex gap-2 items-center mt-0.5">
                           <span className="flex items-center gap-1 bg-black/30 px-1.5 rounded"><Shield className="w-3 h-3" /> {c.ac}</span>
                           {c.type === EntityType.MONSTER && <button onClick={() => onOpenStatBlock(c)} className="text-gold-500 hover:text-white"><Book className="w-3 h-3"/></button>}
                        </div>
                     </div>
                 </div>
                 
                 <div className="flex gap-2 shrink-0">
                    <button onClick={() => onToggleConditionEdit(isEditingConditions ? null : c.id)} className={`p-2 rounded border ${currentConditions.length > 0 ? 'text-red-400 border-red-900 bg-red-900/20' : 'text-gray-500 border-gray-700 bg-gray-800'}`}>
                        <Activity className="w-5 h-5"/>
                    </button>
                    <button onClick={() => onRemove(c.id)} className="text-gray-600 hover:text-red-500 p-2 border border-transparent hover:bg-gray-800 rounded">
                        <X className="w-5 h-5" />
                    </button>
                 </div>
            </div>

            {/* HP Control Row */}
            <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg relative">
                <div className="flex flex-col items-center flex-1 mx-2 relative z-10">
                     <div className="flex items-end gap-1 mb-1">
                        <span className={`text-2xl font-mono font-bold leading-none ${isDead ? 'text-gray-500' : isBloodied ? 'text-red-400' : 'text-white'}`}>{c.hp}</span>
                        <span className="text-gray-500 text-xs font-bold mb-1">/ {c.maxHp}</span>
                    </div>
                    <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden border border-gray-700">
                        <div className={`h-full transition-all duration-300 ${c.hp < c.maxHp / 2 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, (c.hp / c.maxHp) * 100)}%` }} />
                    </div>
                </div>
                
                <div className="flex items-center gap-1 bg-gray-900 p-1 rounded border border-gray-700">
                    <input 
                        type="number" 
                        className="w-12 bg-transparent text-white text-center font-bold outline-none text-sm" 
                        placeholder="0"
                        value={hpInput}
                        onChange={(e) => setHpInput(e.target.value)}
                    />
                    <button 
                        onClick={() => handleApplyHp('damage')}
                        className="p-1.5 bg-red-900/50 hover:bg-red-600 text-red-200 hover:text-white rounded transition-colors"
                        title="Нанести урон"
                    >
                        <Sword className="w-4 h-4"/>
                    </button>
                    <button 
                        onClick={() => handleApplyHp('heal')}
                        className="p-1.5 bg-green-900/50 hover:bg-green-600 text-green-200 hover:text-white rounded transition-colors"
                        title="Исцелить"
                    >
                        <Heart className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            {/* Conditions List */}
            {currentConditions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                    {currentConditions.map(cond => (
                        <button key={cond.id} onClick={() => onOpenConditionInfo(cond.id, cond.name)} className="px-2 py-1 rounded bg-red-900/40 border border-red-500 text-xs text-red-100 flex items-center gap-1">
                            <Activity className="w-3 h-3"/> {cond.name.split(' (')[0]}
                        </button>
                    ))}
                </div>
            )}

            {/* Conditions Selector Dropdown */}
            {isEditingConditions && (
                <div className="bg-gray-900 border border-gold-500 rounded shadow-xl p-3 animate-in fade-in slide-in-from-top-2 z-20">
                    <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                        {CONDITIONS.map(cond => {
                            const isActiveCond = currentConditions.some(active => active.id === cond.id);
                            return (
                                <button key={cond.id} onClick={() => onToggleCondition(c.id, cond)} className={`text-left text-xs px-3 py-2 rounded border flex items-center justify-between ${isActiveCond ? 'bg-red-900/40 border-red-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700'}`}>
                                    <span>{cond.name.split(' (')[0]}</span>
                                    {isActiveCond && <Check className="w-3 h-3 text-red-400"/>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
            
            {/* Quick Actions (If active or monsters) */}
            {isActive && c.actions && c.actions.length > 0 && (
                 <div className="mt-2 pt-2 border-t border-gray-700">
                     <div className="flex flex-wrap gap-2">
                        {c.actions.map((act, idx) => (
                            <div key={idx} className="bg-black/40 px-2 py-1 rounded border border-gray-700 text-xs text-gray-300">
                                <ActionRenderer text={act} sourceName={c.name} onRoll={onRoll} />
                            </div>
                        ))}
                    </div>
                 </div>
            )}
        </div>
    );
};

export default CombatantCard;
