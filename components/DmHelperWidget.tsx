
import React, { useState, useRef } from 'react';
import { BrainCircuit, Dices, Sparkles, X, Cloud, User, Skull, Volume2, Sword, Ghost, Square, Download, Upload, Plus } from 'lucide-react';
import { generateNpc, generateScenarioDescription } from '../services/polzaService';
import { CONDITIONS } from '../constants';
import { useAudio } from '../contexts/AudioContext';

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
    const { playSfx, stopAllSfx } = useAudio();
    const [isOpen, setIsOpen] = useState(false);
    const [dcValue, setDcValue] = useState(15);
    const [activeTab, setActiveTab] = useState<'dc' | 'improv' | 'conditions' | 'sfx'>('dc');
    const [loading, setLoading] = useState(false);
    const [improvResult, setImprovResult] = useState<string | null>(null);
    const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
    
    // Custom SFX
    const [customSounds, setCustomSounds] = useState<{ label: string, url: string }[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                className="fixed bottom-40 md:bottom-28 right-4 z-[60] bg-gold-600 text-black p-3 rounded-full shadow-lg hover:scale-110 transition-transform border-2 border-white xl:bottom-32"
                title="Помощник ДМ"
            >
                <BrainCircuit className="w-6 h-6" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-40 md:bottom-28 right-4 z-[60] bg-dnd-card border border-gold-600 rounded-lg shadow-2xl w-80 overflow-hidden animate-in slide-in-from-bottom-5 xl:bottom-32 flex flex-col max-h-[500px]">
            <div className="flex justify-between items-center bg-gray-900 p-2 border-b border-gray-700 shrink-0">
                <h4 className="font-bold text-gold-500 text-sm flex items-center gap-2"><BrainCircuit className="w-4 h-4"/> DM Helper</h4>
                <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X className="w-4 h-4"/></button>
            </div>

            <div className="flex bg-gray-800 shrink-0">
                <button onClick={() => setActiveTab('dc')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'dc' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Сложность">
                    <Dices className="w-4 h-4 mx-auto"/>
                </button>
                <button onClick={() => setActiveTab('improv')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'improv' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Импровизация">
                    <Sparkles className="w-4 h-4 mx-auto"/>
                </button>
                <button onClick={() => setActiveTab('conditions')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'conditions' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Состояния">
                    <Skull className="w-4 h-4 mx-auto"/>
                </button>
                <button onClick={() => setActiveTab('sfx')} className={`flex-1 py-2 text-xs font-bold ${activeTab === 'sfx' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`} title="Звуки">
                    <Volume2 className="w-4 h-4 mx-auto"/>
                </button>
            </div>

            <div className="p-4 bg-dnd-darker flex-1 overflow-y-auto custom-scrollbar">
                {activeTab === 'dc' && (
                    <div className="text-center space-y-4">
                        <div className="text-4xl font-bold text-white font-mono">{dcValue}</div>
                        <div className="text-sm text-gold-500">{getDcDescription(dcValue)}</div>
                        <input 
                            type="range" min="5" max="30" step="5" 
                            value={dcValue} onChange={e => setDcValue(Number(e.target.value))}
                            className="w-full accent-gold-600 h-6"
                        />
                        <div className="flex justify-between text-[10px] text-gray-500">
                            <span>5</span><span>15</span><span>30</span>
                        </div>
                    </div>
                )}

                {activeTab === 'improv' && (
                    <div className="space-y-3">
                        <div className="flex justify-between gap-2">
                            <button onClick={() => handleImprov('npc')} disabled={loading} className="flex-1 bg-gray-800 p-3 rounded hover:bg-gray-700 flex flex-col items-center gap-1 border border-gray-700 touch-manipulation">
                                <User className="w-5 h-5 text-blue-400"/> <span className="text-[10px]">NPC</span>
                            </button>
                            <button onClick={() => handleImprov('event')} disabled={loading} className="flex-1 bg-gray-800 p-3 rounded hover:bg-gray-700 flex flex-col items-center gap-1 border border-gray-700 touch-manipulation">
                                <Dices className="w-5 h-5 text-red-400"/> <span className="text-[10px]">Событие</span>
                            </button>
                            <button onClick={() => handleImprov('weather')} disabled={loading} className="flex-1 bg-gray-800 p-3 rounded hover:bg-gray-700 flex flex-col items-center gap-1 border border-gray-700 touch-manipulation">
                                <Cloud className="w-5 h-5 text-gray-300"/> <span className="text-[10px]">Погода</span>
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
                                    <button onClick={() => setSelectedCondition(null)} className="text-gray-400 hover:text-white p-1"><X className="w-4 h-4"/></button>
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
                                        className="text-[10px] bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 px-2 rounded truncate text-left touch-manipulation"
                                    >
                                        {c.name.split(' (')[0]}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'sfx' && (
                    <div className="space-y-4">
                        {/* Stop Button */}
                        <button 
                            onClick={stopAllSfx}
                            className="w-full bg-red-900/80 hover:bg-red-800 text-white py-3 rounded flex justify-center items-center gap-2 font-bold text-xs border border-red-700 mb-2 shadow-lg touch-manipulation"
                        >
                            <Square className="w-3 h-3 fill-current"/> Стоп Эффекты
                        </button>

                        {SFX_LIBRARY.map((group, idx) => (
                            <div key={idx} className="space-y-2">
                                <h5 className="text-xs text-gold-500 font-bold uppercase flex items-center gap-2 border-b border-gray-800 pb-1">
                                    {group.icon} {group.category}
                                </h5>
                                <div className="grid grid-cols-2 gap-2">
                                    {group.sounds.map((snd, sIdx) => (
                                        <div key={sIdx} className="flex gap-1">
                                            <button 
                                                onClick={() => playSfx(snd.url)}
                                                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gold-500/50 text-gray-300 py-2 rounded text-xs font-bold transition-all active:scale-95 flex justify-center items-center touch-manipulation"
                                            >
                                                {snd.label}
                                            </button>
                                            <button 
                                                onClick={() => downloadSfx(snd.url, snd.label)}
                                                className="bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-500 hover:text-white px-2 rounded touch-manipulation"
                                                title="Скачать"
                                            >
                                                <Download className="w-3 h-3"/>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Custom SFX Section */}
                        <div className="space-y-2 pt-2 border-t border-gray-800">
                            <h5 className="text-xs text-gold-500 font-bold uppercase flex items-center gap-2">
                                <Volume2 className="w-4 h-4"/> Свои звуки
                            </h5>
                            <div className="grid grid-cols-2 gap-2">
                                {customSounds.map((snd, idx) => (
                                    <button 
                                        key={idx}
                                        onClick={() => playSfx(snd.url)}
                                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 py-2 rounded text-xs font-bold transition-all active:scale-95 truncate touch-manipulation"
                                        title={snd.label}
                                    >
                                        {snd.label}
                                    </button>
                                ))}
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="bg-gray-800 hover:bg-gray-700 border border-dashed border-gray-600 text-gray-400 py-2 rounded text-xs font-bold flex justify-center items-center gap-1 touch-manipulation"
                                >
                                    <Plus className="w-3 h-3"/> Загрузить
                                </button>
                                <input 
                                    type="file" 
                                    className="hidden" 
                                    ref={fileInputRef} 
                                    accept="audio/*" 
                                    onChange={handleFileUpload}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DmHelperWidget;
