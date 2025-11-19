
import React, { useState, useEffect } from 'react';
import { Note } from '../types';
import { FileText, Save, Plus, Trash2, Check, Clock, Eye, Edit } from 'lucide-react';

const CampaignNotes: React.FC = () => {
    const [notes, setNotes] = useState<Note[]>(() => {
        const saved = localStorage.getItem('dmc_notes');
        return saved ? JSON.parse(saved) : [];
    });
    const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
    const [savedIndicator, setSavedIndicator] = useState(false);
    const [isViewMode, setIsViewMode] = useState(true);

    useEffect(() => {
        localStorage.setItem('dmc_notes', JSON.stringify(notes));
        // Blink saved indicator
        setSavedIndicator(true);
        const timer = setTimeout(() => setSavedIndicator(false), 1000);
        return () => clearTimeout(timer);
    }, [notes]);

    // Switch to view mode when changing notes
    useEffect(() => {
        setIsViewMode(true);
    }, [activeNoteId]);

    const activeNote = notes.find(n => n.id === activeNoteId);

    const createNote = () => {
        const newNote: Note = {
            id: Date.now().toString(),
            title: 'Новая заметка',
            content: '',
            tags: [],
            type: 'session',
            date: new Date().toISOString()
        };
        setNotes([newNote, ...notes]);
        setActiveNoteId(newNote.id);
        setIsViewMode(false); // Auto switch to edit for new notes
    };

    const updateActiveNote = (updates: Partial<Note>) => {
        if (!activeNoteId) return;
        setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, ...updates } : n));
    };

    const deleteNote = (id: string) => {
        if(window.confirm('Удалить эту заметку безвозвратно?')) {
            setNotes(prev => prev.filter(n => n.id !== id));
            if (activeNoteId === id) setActiveNoteId(null);
        }
    };

    return (
        <div className="h-full flex gap-4">
            {/* Sidebar List */}
            <div className="w-1/3 border-r border-gray-700 flex flex-col">
                <div className="mb-4 flex items-center justify-between">
                     <button 
                        onClick={createNote}
                        className="bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2 flex-1"
                    >
                        <Plus className="w-4 h-4" /> Создать
                    </button>
                    <div className="ml-2 text-xs text-gray-500 flex flex-col items-center w-16">
                        {savedIndicator ? (
                            <span className="text-green-500 flex items-center gap-1 animate-in fade-in"><Check className="w-3 h-3"/> Сохр.</span>
                        ) : (
                            <span className="flex items-center gap-1 opacity-50"><Clock className="w-3 h-3"/> Авто</span>
                        )}
                    </div>
                </div>
                
                <div className="overflow-y-auto flex-1 space-y-2 pr-2 custom-scrollbar">
                    {notes.map(note => (
                        <div 
                            key={note.id}
                            onClick={() => setActiveNoteId(note.id)}
                            className={`p-3 rounded cursor-pointer transition-colors border-l-2 ${activeNoteId === note.id ? 'bg-gray-800 border-gold-500' : 'bg-transparent border-transparent hover:bg-gray-800/50 hover:border-gray-600'}`}
                        >
                            <div className="font-bold text-gray-200 truncate">{note.title || 'Без названия'}</div>
                            <div className="flex justify-between items-center mt-1">
                                <span className="text-xs text-gray-500">{new Date(note.date).toLocaleDateString('ru-RU')}</span>
                                <span className="text-[10px] uppercase text-gray-600 border border-gray-700 px-1 rounded">{note.type}</span>
                            </div>
                        </div>
                    ))}
                    {notes.length === 0 && <div className="text-center text-gray-500 mt-10 text-sm">Журнал пуст.<br/>Создайте первую запись.</div>}
                </div>
            </div>

            {/* Editor Area */}
            <div className="flex-1 flex flex-col bg-dnd-card/30 rounded-lg border border-gray-800 overflow-hidden relative">
                {activeNote ? (
                    <>
                        <div className="p-4 border-b border-gray-700 bg-gray-900/50 flex justify-between items-start gap-4">
                            <div className="flex-1">
                                <input 
                                    className="w-full bg-transparent text-2xl font-serif font-bold text-gold-500 outline-none placeholder-gray-600"
                                    value={activeNote.title}
                                    onChange={e => updateActiveNote({ title: e.target.value })}
                                    placeholder="Заголовок..."
                                />
                                <div className="flex gap-2 mt-2">
                                    {activeNote.tags.map((tag, i) => (
                                        <span key={i} className="text-xs text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded">#{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsViewMode(!isViewMode)}
                                    className={`p-2 rounded transition-colors border ${isViewMode ? 'bg-gold-600 text-black border-gold-500' : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'}`}
                                    title={isViewMode ? "Редактировать текст" : "Просмотр"}
                                >
                                    {isViewMode ? <Edit className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {isViewMode ? (
                            <div 
                                className="flex-1 bg-transparent p-6 text-gray-300 leading-relaxed overflow-y-auto custom-scrollbar [&_h1]:text-gold-500 [&_h1]:text-2xl [&_h1]:font-serif [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-gold-500 [&_h2]:text-xl [&_h2]:font-serif [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-5 [&_h3]:text-gold-500 [&_h3]:font-serif [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3:first-child]:mt-0 [&_h4]:text-gold-400 [&_h4]:font-bold [&_h4]:mb-2 [&_strong]:text-white [&_strong]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_p]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_th]:text-left [&_th]:p-2 [&_th]:border-b [&_th]:border-gray-700 [&_td]:p-2 [&_td]:border-b [&_td]:border-gray-800"
                                dangerouslySetInnerHTML={{ __html: activeNote.content || '<p class="text-gray-500 italic">Нет содержимого...</p>' }}
                            />
                        ) : (
                            <textarea 
                                className="flex-1 bg-black/20 p-6 text-gray-300 leading-relaxed outline-none resize-none font-mono text-sm"
                                value={activeNote.content}
                                onChange={e => updateActiveNote({ content: e.target.value })}
                                placeholder="Записывайте секреты кампании, статы NPC или идеи для сюжета здесь... Поддерживается HTML."
                            />
                        )}

                        <div className="absolute bottom-4 right-4">
                            <button 
                                onClick={() => deleteNote(activeNote.id)}
                                className="bg-gray-800 text-gray-500 hover:bg-red-900/50 hover:text-red-400 p-2 rounded-full transition-colors border border-gray-700 hover:border-red-500"
                                title="Удалить заметку"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-600">
                        <div className="text-center">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p>Выберите заметку или создайте новую.</p>
                            <p className="text-sm opacity-50 mt-2">Все изменения сохраняются автоматически.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CampaignNotes;
