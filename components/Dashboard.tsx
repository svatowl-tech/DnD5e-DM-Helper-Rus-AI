import React, { useEffect, useState } from 'react';
import { Combatant, EntityType, PartyMember } from '../types';
import { Sword, ScrollText, BrainCircuit, Users, ArrowRight } from 'lucide-react';
import { SAMPLE_COMBATANTS } from '../constants';

interface DashboardProps {
    onChangeTab: (tab: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onChangeTab }) => {
    const [combatants, setCombatants] = useState<Combatant[]>([]);
    const [party, setParty] = useState<PartyMember[]>([]);
    const [noteCount, setNoteCount] = useState(0);

    useEffect(() => {
        // Read active combat
        const savedCombatants = localStorage.getItem('dmc_combatants');
        const parsedCombatants = savedCombatants ? JSON.parse(savedCombatants) : SAMPLE_COMBATANTS;
        setCombatants(parsedCombatants);

        // Read party roster
        const savedParty = localStorage.getItem('dmc_party');
        const parsedParty = savedParty ? JSON.parse(savedParty) : [];
        setParty(parsedParty);

        // Read notes
        const savedNotes = localStorage.getItem('dmc_notes');
        setNoteCount(savedNotes ? JSON.parse(savedNotes).length : 0);
    }, []);

    const monsters = combatants.filter(c => c.type === EntityType.MONSTER);
    const activeParty = party.filter(p => p.active);
    
    // Fallback: if no party defined in manager, show players from combat tracker if any
    const displayParty = party.length > 0 
        ? activeParty 
        : combatants.filter(c => c.type === EntityType.PLAYER).map(c => ({ 
            id: c.id, 
            name: c.name, 
            race: 'Unknown',
            class: 'Unknown',
            level: 0,
            maxHp: c.maxHp, 
            ac: c.ac,
            passivePerception: 10,
            notes: c.notes,
            active: true 
        } as PartyMember));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-serif font-bold text-gold-500">Добро пожаловать, Мастер</h1>
                <div className="text-sm text-gray-400">Сессия активна</div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-dnd-card p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-900/30 rounded text-blue-400"><Users className="w-5 h-5"/></div>
                            <h3 className="font-bold text-gray-200">Группа</h3>
                        </div>
                        {party.length === 0 && (
                             <button onClick={() => onChangeTab('party')} className="text-xs text-gold-500 hover:underline">Настроить</button>
                        )}
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                        {displayParty.map(p => (
                            <div key={p.id} className="flex justify-between text-sm border-b border-gray-800 last:border-0 pb-1">
                                <span>{p.name}</span>
                                <span className={`${p.level ? 'text-gray-500 text-xs' : 'hidden'}`}>Ур.{p.level}</span>
                            </div>
                        ))}
                        {displayParty.length === 0 && <span className="text-gray-500 italic text-sm">Группа не собрана</span>}
                    </div>
                </div>

                <div className="bg-dnd-card p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-900/30 rounded text-red-400"><Sword className="w-5 h-5"/></div>
                        <h3 className="font-bold text-gray-200">Активная угроза</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{monsters.length}</div>
                    <p className="text-sm text-gray-400">Врагов в текущем бою</p>
                    {monsters.length > 0 && (
                         <button onClick={() => onChangeTab('combat')} className="mt-2 text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
                            Перейти к бою <ArrowRight className="w-3 h-3"/>
                         </button>
                    )}
                </div>

                <div className="bg-dnd-card p-4 rounded-lg border border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gold-900/30 rounded text-gold-500"><ScrollText className="w-5 h-5"/></div>
                        <h3 className="font-bold text-gray-200">Заметки</h3>
                    </div>
                    <div className="text-3xl font-bold text-white">{noteCount}</div>
                    <p className="text-sm text-gray-400">Записей в журнале</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div>
                <h2 className="text-xl font-serif text-gray-300 mb-4">Быстрый доступ</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button onClick={() => onChangeTab('party')} className="p-4 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 flex flex-col items-center gap-2 transition-colors">
                        <Users className="w-8 h-8 text-blue-400" />
                        <span className="font-bold">Герои</span>
                    </button>
                    <button onClick={() => onChangeTab('combat')} className="p-4 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 flex flex-col items-center gap-2 transition-colors">
                        <Sword className="w-8 h-8 text-red-500" />
                        <span className="font-bold">Бой</span>
                    </button>
                    <button onClick={() => onChangeTab('notes')} className="p-4 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 flex flex-col items-center gap-2 transition-colors">
                        <ScrollText className="w-8 h-8 text-gold-500" />
                        <span className="font-bold">Журнал</span>
                    </button>
                    <button onClick={() => onChangeTab('generators')} className="p-4 bg-gray-800 hover:bg-gray-700 rounded border border-gray-700 flex flex-col items-center gap-2 transition-colors">
                        <BrainCircuit className="w-8 h-8 text-indigo-500" />
                        <span className="font-bold">AI Генератор</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;