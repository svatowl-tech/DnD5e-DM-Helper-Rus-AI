
import React, { useState, useRef } from 'react';
import { BrainCircuit, Dices, Sparkles, X, Cloud, User, Skull, Volume2, Sword, Ghost, Square, Download, Upload, Plus } from 'lucide-react';
import { generateNpc, generateScenarioDescription } from '../services/polzaService';
import { CONDITIONS } from '../constants';

// Updated SFX Library using reliable Mixkit Preview links (MP3)
const SFX_LIBRARY = [
    { 
        category: 'Погода', 
        icon: <Cloud className="w-4 h-4"/>,
        sounds: [
            { label: 'Гром', url: 'https://assets.mixkit.co/active_storage/sfx/1270/1270-preview.mp3' },
            { label: 'Ливень', url: 'https://assets.mixkit.co/active_storage/sfx/1252/1252-preview.mp3' },
            { label: 'Ветер', url: 'https://assets.mixkit.co/active_storage/sfx/1255/1255-preview.mp3' },
            { label: 'Костер', url: 'https://assets.mixkit.co/active_storage/sfx/1289/1289-preview.mp3' }
        ]
    },
    { 
        category: 'Бой', 
        icon: <Sword className="w-4 h-4"/>,
        sounds: [
            { label: 'Лязг', url: 'https://assets.mixkit.co/active_storage/sfx/2607/2607-preview.mp3' },
            { label: 'Удар', url: 'https://assets.mixkit.co/active_storage/sfx/2155/2155-preview.mp3' },
            { label: 'Взрыв', url: 'https://assets.mixkit.co/active_storage/sfx/1275/1275-preview.mp3' },
            { label: 'Магия', url: 'https://assets.mixkit.co/active_storage/sfx/888/888-preview.mp3' }
        ]
    },
    { 
        category: 'Ужас', 
        icon: <Ghost className="w-4 h-4"/>,
        sounds: [
            { label: 'Крик', url: 'https://assets.mixkit.co/active_storage/sfx/2208/2208-preview.mp3' },
            { label: 'Призрак', url: 'https://assets.mixkit.co/active_storage/sfx/2526/2526-preview.mp3' }, 
            { label: 'Дыхание', url: 'https://assets.mixkit.co/active_storage/sfx/2223/2223-preview.mp3' },
            { label: 'Рык', url: 'https://assets.mixkit.co/active_storage/sfx/1292/1292-preview.mp3' }
        ]
    },
    { 
        category: 'Город', 
        icon: <User className="w-4 h-4"/>,
        sounds: [
            { label: 'Скрип', url: 'https://assets.mixkit.co/active_storage/sfx/195/195-preview.mp3' },
            { label: 'Стекло', url: 'https://assets.mixkit.co/active_storage/sfx/1669/1669-preview.mp3' },
            { label: 'Шаги', url: 'https://assets.mixkit.co/active_storage/sfx/533/533-preview.mp3' },
            { label: 'Стук', url: 'https://assets.mixkit.co/active_storage/sfx/236/236-preview.mp3' }
        ]
    }
];

const DmHelperWidget: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [dcValue, setDcValue] = useState(15);
    const [activeTab, setActiveTab] = useState<'dc' | 'improv' | 'conditions' | 'sfx'>('dc');
    const [loading, setLoading] = useState(false);
    const [improvResult, setImprovResult] = useState<string | null>(null);
    const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
    
    // Local SFX State
    const activeAudios = useRef<HTMLAudioElement[]>([]);
    const [customSounds, setCustomSounds] = useState<{ label: string, url: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const playSfx = (url: string) => {
        const audio = new Audio(url);
        audio.volume = 0.5;
        audio.play().catch(e => console.error(e));
        activeAudios.current.push(audio);
        audio.onended = () => {
             activeAudios.current = activeAudios.current.filter(a => a !== audio);
        };
    };

    const stopAllSfx = () => {
        activeAudios.current.forEach(a => { a.pause(); a.currentTime = 0; });
        activeAudios.current = [];
    };

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

    const downloadSfx = async (url: string, filename: string) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `${filename}.mp3`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (e) {
            // Fallback for CORS issues
            window.open(url, '_blank');
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setCustomSounds(prev => [...prev, { label: file.name.replace(/\.[^/.]+$/, ""), url }]);
        }
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-28 right-4 z-[60] bg-gold-600 text-black p-3 rounded-full shadow-lg hover:bg-gold-500 transition-transform hover:scale-110"
                title="DM Помощник"
            >
                <BrainCircuit className="w-6 h-6"/>
            </button>
        );
    }

    return (
        <div className="fixed bottom-28 right-4 z-[60] bg-dnd-card border border-gold-600 rounded-lg shadow-2xl w-80 sm:w-96 max-h-[60vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4">
            {/* Header */}
            <div className="p-3 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gold-500 flex items-center gap-2">
                    <BrainCircuit className="w-5 h-5"/> DM Помощник
                </h3>
                <button onClick={() => setIsOpen(false)}><X className="w-5 h-5 text-gray-400 hover:text-white"/></button>
            </div>
            
            {/* Tabs */}
            <div className="flex bg-gray-800 p-1 shrink-0">
                <button onClick={() => setActiveTab('dc')} className={`flex-1 py-2 rounded text-xs font-bold ${activeTab === 'dc' ? 'bg-gold-600 text-black' : 'text-gray-400 hover:text-white'}`}>DC</button>
                <button onClick={() => setActiveTab('improv')} className={`flex-1 py-2 rounded text-xs font-bold ${activeTab === 'improv' ? 'bg-gold-600 text-black' : 'text-gray-400 hover:text-white'}`}>Импров</button>
                <button onClick={() => setActiveTab('conditions')} className={`flex-1 py-2 rounded text-xs font-bold ${activeTab === 'conditions' ? 'bg-gold-600 text-black' : 'text-gray-400 hover:text-white'}`}>Сост.</button>
                <button onClick={() => setActiveTab('sfx')} className={`flex-1 py-2 rounded text-xs font-bold ${activeTab === 'sfx' ? 'bg-gold-600 text-black' : 'text-gray-400 hover:text-white'}`}>SFX</button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {activeTab === 'dc' && (
                    <div className="space-y-4 text-center">
                        <div className="text-4xl font-bold text-white">{dcValue}</div>
                        <div className="text-gold-500 font-serif text-lg">{getDcDescription(dcValue)}</div>
                        <input 
                            type="range" 
                            min="5" 
                            max="30" 
                            step="5" 
                            value={dcValue} 
                            onChange={(e) => setDcValue(Number(e.target.value))}
                            className="w-full accent-gold-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 px-1">
                            <span>5</span>
                            <span>10</span>
                            <span>15</span>
                            <span>20</span>
                            <span>25</span>
                            <span>30</span>
                        </div>
                    </div>
                )}

                {activeTab === 'improv' && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                            <button onClick={() => handleImprov('npc')} className="bg-indigo-900/50 hover:bg-indigo-800 text-indigo-200 border border-indigo-700 py-2 rounded text-xs font-bold flex flex-col items-center gap-1">
                                <User className="w-4 h-4"/> NPC
                            </button>
                            <button onClick={() => handleImprov('event')} className="bg-orange-900/50 hover:bg-orange-800 text-orange-200 border border-orange-700 py-2 rounded text-xs font-bold flex flex-col items-center gap-1">
                                <Sparkles className="w-4 h-4"/> Сцена
                            </button>
                            <button onClick={() => handleImprov('weather')} className="bg-blue-900/50 hover:bg-blue-800 text-blue-200 border border-blue-700 py-2 rounded text-xs font-bold flex flex-col items-center gap-1">
                                <Cloud className="w-4 h-4"/> Погода
                            </button>
                        </div>
                        
                        <div className="min-h-[100px] bg-gray-900 p-3 rounded border border-gray-700 text-sm text-gray-300">
                            {loading ? (
                                <span className="animate-pulse">Думаем...</span>
                            ) : (
                                improvResult || <span className="text-gray-600 italic">Нажмите кнопку для вдохновения.</span>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'conditions' && (
                    <div className="space-y-2">
                        {CONDITIONS.map(c => (
                            <div key={c.id} className="border border-gray-700 rounded p-2 hover:bg-gray-800">
                                <div 
                                    className="flex justify-between items-center cursor-pointer"
                                    onClick={() => setSelectedCondition(selectedCondition === c.id ? null : c.id)}
                                >
                                    <span className="font-bold text-sm text-white">{c.name}</span>
                                </div>
                                {selectedCondition === c.id && (
                                    <p className="text-xs text-gray-400 mt-1 border-t border-gray-700 pt-1">{c.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'sfx' && (
                    <div className="space-y-4">
                        <button onClick={stopAllSfx} className="w-full bg-red-900/50 text-red-200 text-xs py-1 rounded hover:bg-red-900 border border-red-800 flex items-center justify-center gap-2">
                            <Square className="w-3 h-3 fill-current"/> Остановить всё
                        </button>
                        
                        {SFX_LIBRARY.map((cat, idx) => (
                            <div key={idx}>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">{cat.icon} {cat.category}</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {cat.sounds.map((s, i) => (
                                        <div key={i} className="flex gap-1">
                                            <button onClick={() => playSfx(s.url)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 rounded border border-gray-700 flex items-center justify-center gap-1">
                                                <Volume2 className="w-3 h-3"/> {s.label}
                                            </button>
                                            <button onClick={() => downloadSfx(s.url, s.label)} className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-2 rounded border border-gray-700">
                                                <Download className="w-3 h-3"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Custom Sounds */}
                        {customSounds.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2"><Upload className="w-3 h-3"/> Свои</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {customSounds.map((s, i) => (
                                        <button key={i} onClick={() => playSfx(s.url)} className="bg-gray-800 hover:bg-gray-700 text-white text-xs py-2 rounded border border-gray-700 flex items-center justify-center gap-1">
                                            <Volume2 className="w-3 h-3"/> {s.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button onClick={() => fileInputRef.current?.click()} className="w-full border border-dashed border-gray-600 text-gray-400 text-xs py-2 rounded hover:text-white hover:border-gray-500 flex items-center justify-center gap-2">
                            <Plus className="w-3 h-3"/> Добавить (MP3)
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={handleFileUpload} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default DmHelperWidget;
