
import React, { useState } from 'react';
import { BrainCircuit, Dices, Sparkles, X, Cloud, User, Skull, Info } from 'lucide-react';
import { generateNpc, generateScenarioDescription } from '../services/polzaService';
import { CONDITIONS } from '../constants';

const DmHelperWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [dcValue, setDcValue] = useState(15);
    const [activeTab, setActiveTab] = useState<'dc' | 'improv' | 'conditions'>('dc');
    const [loading, setLoading] = useState(false);
    const [improvResult, setImprovResult] = useState<string | null>(null);
    const [selectedCondition, setSelectedCondition] = useState<string | null>(null);

    const getDcDescription = (val: number) => {
        if (val <= 5) return "Очень легко (Ребенок)";
        if (val <= 10) return "Легко (Обыватель)";
        if (val <= 15) return "Средне (Герой 1-4 ур)";
        if (val <= 20) return "Сложно (Герой 5-10 ур)";
        if (val <= 25) return "Очень сложно (Герой 11-16 ур)";
        return "Почти невозможно (Герой 17+)";
    };

    const handleImprov = async (type: 'npc' | 'event' | 'weather') => {
        setLoading(true);
        setImprovResult(null);
        try {
            let res = "";
            if (type === 'npc') {
                const data = await generateNpc('случайный прохожий');
                res = `${data.name} (${data.race}): ${data.description}`;
            } else if (type === 'event') {
                res = await generateScenarioDescription('Случайное городское событие или происшествие на дороге');
            } else {
                res = await generateScenarioDescription('Текущая погода и атмосфера');
            }
            setImprovResult(res);
        } catch (e) {
            setImprovResult("Ошибка генерации.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-28 right-4 z-[60] bg-gold-600 text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white xl:bottom-32"
                title="Помощник ДМ"
            >
                <BrainCircuit className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-28 right-4 z-[60] bg-dnd-card border border-gold-600 rounded-lg shadow-2xl w-80 overflow-hidden animate-in slide-in-from-bottom-5 xl:bottom-32 flex flex-col max-h-[500px]">
            <div className="flex justify-between items-center bg-gray-900 p-2 border-b border-gray-700 shrink-0">
                <h4 className="font-bold text-gold-500 text-sm flex items-center gap-2"><BrainCircuit className="w-4 h-4"/> DM Helper</h4>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4"/></button>
            </div>

            <div className="flex bg-gray-800 shrink-0">
                <button onClick={() => setActiveTab('dc')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'dc' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>Сложность</button>
                <button onClick={() => setActiveTab('improv')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'improv' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>Импровизация</button>
                <button onClick={() => setActiveTab('conditions')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'conditions' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}>Состояния</button>
            </div>

            <div className="p-4 bg-dnd-darker flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'dc' && (
                    <div className="text-center space-y-4">
                        <div className="text-4xl font-bold text-white font-mono">{dcValue}</div>
                        <div className="text-sm text-gold-500">{getDcDescription(dcValue)}</div>
                        <input 
                            type="range" min="5" max="30" step="5" 
                            value={dcValue} onChange={e => setDcValue(Number(e.target.value))}
                            className="w-full accent-gold-600"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500">
                            <span>5</span><span>15</span><span>30</span>
                        </div>
                    </div>
                )}

                {activeTab === 'improv' && (
                    <div className="space-y-3">
                        <div className="flex justify-between gap-2">
                            <button onClick={() => handleImprov('npc')} disabled={loading} className="flex-1 bg-gray-800 p-2 rounded hover:bg-gray-700 flex flex-col items-center gap-1 border border-gray-700">
                                <User className="w-4 h-4 text-blue-400"/> <span className="text-[10px]">NPC</span>
                            </button>
                            <button onClick={() => handleImprov('event')} disabled={loading} className="flex-1 bg-gray-800 p-2 rounded hover:bg-gray-700 flex flex-col items-center gap-1 border border-gray-700">
                                <Dices className="w-4 h-4 text-red-400"/> <span className="text-[10px]">Событие</span>
                            </button>
                            <button onClick={() => handleImprov('weather')} disabled={loading} className="flex-1 bg-gray-800 p-2 rounded hover:bg-gray-700 flex flex-col items-center gap-1 border border-gray-700">
                                <Cloud className="w-4 h-4 text-gray-300"/> <span className="text-[10px]">Погода</span>
                            </button>
                        </div>
                        
                        {loading && <div className="text-center text-xs text-gold-500 animate-pulse">Думаем...</div>}
                        
                        {improvResult && (
                            <div className="text-xs bg-gray-900 p-3 rounded text-gray-300 border border-gray-700 max-h-48 overflow-y-auto">
                                {improvResult}
                            </div>
                        )}
                        
                        <p className="text-[10px] text-gray-500 text-center mt-2">Генерирует случайный контент для сцены.</p>
                    </div>
                )}

                {activeTab === 'conditions' && (
                    <div className="space-y-2">
                        {selectedCondition ? (
                            <div className="bg-gray-900 border border-gold-600/50 rounded p-3 animate-in fade-in zoom-in">
                                <div className="flex justify-between items-start mb-2">
                                    <h5 className="font-bold text-white text-sm">{CONDITIONS.find(c => c.id === selectedCondition)?.name}</h5>
                                    <button onClick={() => setSelectedCondition(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4"/></button>
                                </div>
                                <p className="text-xs text-gray-300 leading-relaxed">
                                    {CONDITIONS.find(c => c.id === selectedCondition)?.description}
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {CONDITIONS.map(c => (
                                    <button 
                                        key={c.id}
                                        onClick={() => setSelectedCondition(c.id)}
                                        className="text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-1.5 px-2 rounded truncate text-left"
                                    >
                                        {c.name.split(' (')[0]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DmHelperWidget;
