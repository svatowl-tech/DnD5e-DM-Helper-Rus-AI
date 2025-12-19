
import React from 'react';
import { X, Settings, Key, Save, CheckCircle, Sparkles } from 'lucide-react';
import { AiProvider, CampaignMode } from '../../types';
import { AVAILABLE_MODELS, OPENROUTER_MODELS, AVAILABLE_IMAGE_MODELS } from '../../services/polzaService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    aiProvider: AiProvider;
    setAiProvider: (p: AiProvider) => void;
    polzaKey: string;
    setPolzaKey: (k: string) => void;
    openrouterKey: string;
    setOpenrouterKey: (k: string) => void;
    selectedModel: string;
    setSelectedModel: (m: string) => void;
    selectedImageModel: string;
    setSelectedImageModel: (m: string) => void;
    campaignMode: CampaignMode;
    setCampaignMode: (m: CampaignMode) => void;
    onSave: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen, onClose, aiProvider, setAiProvider, polzaKey, setPolzaKey,
    openrouterKey, setOpenrouterKey, selectedModel, setSelectedModel,
    selectedImageModel, setSelectedImageModel, campaignMode, setCampaignMode, onSave
}) => {
    if (!isOpen) return null;

    const currentModels = aiProvider === 'openrouter' ? OPENROUTER_MODELS : AVAILABLE_MODELS;

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-md rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center shrink-0">
                    <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                        <Settings className="w-5 h-5 text-gold-500"/> Настройки Кодекса
                    </h3>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-white"><X className="w-6 h-6"/></button>
                </div>
                
                <div className="p-6 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="space-y-2">
                        <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Провайдер ИИ</label>
                        <div className="p-1 bg-gray-900 rounded-lg flex border border-gray-800">
                            <button 
                                onClick={() => setAiProvider('polza')}
                                className={`flex-1 py-2 text-xs font-bold rounded transition-all ${aiProvider === 'polza' ? 'bg-gold-600 text-black shadow-lg' : 'text-gray-400 hover:text-gray-100'}`}
                            >
                                Polza.ai
                            </button>
                            <button 
                                onClick={() => setAiProvider('openrouter')}
                                className={`flex-1 py-2 text-xs font-bold rounded transition-all ${aiProvider === 'openrouter' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-gray-100'}`}
                            >
                                OpenRouter
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Ключ доступа ({aiProvider})</label>
                            <div className="relative">
                                <Key className={`absolute left-3 top-3 w-4 h-4 ${aiProvider === 'polza' ? 'text-gold-500' : 'text-indigo-400'}`}/>
                                <input 
                                    type="password"
                                    className="w-full bg-gray-800 border border-gray-700 rounded pl-10 pr-3 py-3 text-sm text-white focus:border-gold-500 outline-none"
                                    value={aiProvider === 'polza' ? polzaKey : openrouterKey}
                                    onChange={e => aiProvider === 'polza' ? setPolzaKey(e.target.value) : setOpenrouterKey(e.target.value)}
                                    placeholder="Введите API ключ..."
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Текстовая модель</label>
                                <select 
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-sm text-white focus:border-gold-500 outline-none appearance-none cursor-pointer"
                                    value={selectedModel}
                                    onChange={e => setSelectedModel(e.target.value)}
                                >
                                    {currentModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block mb-1">Модель визуализации</label>
                                <select 
                                    className="w-full bg-gray-800 border border-gray-700 rounded p-3 text-sm text-white focus:border-gold-500 outline-none appearance-none cursor-pointer"
                                    value={selectedImageModel}
                                    onChange={e => setSelectedImageModel(e.target.value)}
                                >
                                    {AVAILABLE_IMAGE_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-800 space-y-3">
                         <label className="text-[10px] text-gray-500 uppercase font-bold tracking-widest block">Режим Кампании</label>
                         <div className="flex flex-col gap-2">
                             <button 
                                onClick={() => setCampaignMode('standard')}
                                className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${campaignMode === 'standard' ? 'bg-blue-950/40 border-blue-500 text-blue-100' : 'bg-gray-900/50 border-gray-800 text-gray-500'}`}
                             >
                                 <div>
                                     <div className="font-bold text-sm">Классический D&D</div>
                                     <div className="text-[10px] opacity-60">Стандартное фэнтези Фаэруна</div>
                                 </div>
                                 {campaignMode === 'standard' && <CheckCircle className="w-5 h-5 text-blue-400"/>}
                             </button>
                             <button 
                                onClick={() => setCampaignMode('echoes')}
                                className={`p-3 rounded-lg border text-left transition-all flex items-center justify-between ${campaignMode === 'echoes' ? 'bg-purple-950/40 border-purple-500 text-purple-100' : 'bg-gray-900/50 border-gray-800 text-gray-500'}`}
                             >
                                 <div>
                                     <div className="font-bold text-sm flex items-center gap-2">Project: Echoes <Sparkles className="w-3 h-3 text-purple-400"/></div>
                                     <div className="text-[10px] opacity-60">Мультивселенные аномалии и техномагия</div>
                                 </div>
                                 {campaignMode === 'echoes' && <CheckCircle className="w-5 h-5 text-purple-400"/>}
                             </button>
                         </div>
                    </div>
                </div>

                <div className="p-4 bg-gray-900 border-t border-gray-700 shrink-0">
                    <button onClick={onSave} className="w-full bg-gold-600 hover:bg-gold-500 active:scale-95 transition-transform text-black font-bold py-4 rounded-xl shadow-lg text-lg flex items-center justify-center gap-2">
                        <Save className="w-5 h-5"/> Сохранить изменения
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
