

import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, User, BookOpen, X, CornerDownLeft, ScrollText, Users } from 'lucide-react';
import { FAERUN_LORE } from '../data/faerunLore';
import { RULES_DATA } from '../data/rulesData';
import { CampaignNpc, LoreEntry, LocationData, FullQuest, PartyMember } from '../types';

const Omnibar: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const [results, setResults] = useState<any[]>([]);

    // Toggle with Ctrl+K
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen(prev => !prev);
            }
            if (e.key === 'Escape' && isOpen) {
                setIsOpen(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 10);
            setQuery('');
            setResults([]);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!query.trim()) {
            setResults([]);
            return;
        }

        const lowerQ = query.toLowerCase();
        const searchResults: any[] = [];

        // 1. Search Rules
        RULES_DATA.forEach(rule => {
            if (rule.title.toLowerCase().includes(lowerQ)) {
                searchResults.push({ type: 'rule', icon: <BookOpen className="w-4 h-4 text-blue-400"/>, title: rule.title, id: rule.id, detail: rule.category });
            }
        });

        // 2. Search Lore (Locations)
        FAERUN_LORE.forEach(region => {
            if (region.name.toLowerCase().includes(lowerQ)) {
                searchResults.push({ type: 'region', icon: <MapPin className="w-4 h-4 text-gold-500"/>, title: region.name, id: region.id, detail: 'Регион' });
            }
            region.locations.forEach(loc => {
                if (loc.name.toLowerCase().includes(lowerQ)) {
                    searchResults.push({ type: 'location', icon: <MapPin className="w-4 h-4 text-green-400"/>, title: loc.name, id: loc.name, detail: region.name });
                }
            });
        });

        // 3. Search NPCs (Local Storage)
        const savedNpcs: CampaignNpc[] = JSON.parse(localStorage.getItem('dmc_npcs') || '[]');
        savedNpcs.forEach(npc => {
            if (npc.name.toLowerCase().includes(lowerQ)) {
                searchResults.push({ type: 'npc', icon: <User className="w-4 h-4 text-purple-400"/>, title: npc.name, id: npc.name, detail: npc.race });
            }
        });

        // 4. Search Quests (Local Storage)
        const savedQuests: FullQuest[] = JSON.parse(localStorage.getItem('dmc_quests') || '[]');
        savedQuests.forEach(q => {
            if (q.title.toLowerCase().includes(lowerQ)) {
                searchResults.push({ type: 'quest', icon: <ScrollText className="w-4 h-4 text-orange-400"/>, title: q.title, id: q.id, detail: q.status });
            }
        });

        // 5. Search Party (Local Storage)
        const savedParty: PartyMember[] = JSON.parse(localStorage.getItem('dmc_party') || '[]');
        savedParty.forEach(p => {
             if (p.name.toLowerCase().includes(lowerQ)) {
                searchResults.push({ type: 'party', icon: <Users className="w-4 h-4 text-indigo-400"/>, title: p.name, id: p.id, detail: `${p.class} (Lvl ${p.level})` });
             }
        });

        setResults(searchResults.slice(0, 10)); // Limit results
        setSelectedIndex(0);
    }, [query]);

    const handleSelect = (item: any) => {
        if (!item) return;

        setIsOpen(false);
        
        if (item.type === 'rule') {
            window.dispatchEvent(new CustomEvent('dmc-show-details', { detail: { type: 'rule', id: item.id, title: item.title } }));
        } else if (item.type === 'npc') {
            window.dispatchEvent(new CustomEvent('dmc-show-details', { detail: { type: 'npc', id: item.id, title: item.title } }));
        } else if (item.type === 'party') {
             window.dispatchEvent(new CustomEvent('dmc-show-details', { detail: { type: 'party', id: item.id, title: item.title } }));
        } else if (item.type === 'region') {
            // Switch tab to location and select region (requires complex logic, for now just open tab)
            localStorage.setItem('dmc_active_region_id', item.id); // Quick hack to pre-select
            window.dispatchEvent(new CustomEvent('dmc-switch-tab', { detail: 'location' }));
        } else if (item.type === 'location') {
             // Need to find region first
             const region = FAERUN_LORE.find(r => r.locations.some(l => l.name === item.title));
             if (region) {
                 localStorage.setItem('dmc_active_region_id', region.id);
                 // Try to set active location directly?
                 const locData = region.locations.find(l => l.name === item.title);
                 if(locData) localStorage.setItem('dmc_active_location', JSON.stringify(locData));
             }
             window.dispatchEvent(new CustomEvent('dmc-switch-tab', { detail: 'location' }));
        } else if (item.type === 'quest') {
             window.dispatchEvent(new CustomEvent('dmc-switch-tab', { detail: 'quests' }));
             // To truly focus, QuestTracker would need to listen for an ID, but switching tab is good start
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            setSelectedIndex(prev => (prev + 1) % results.length);
        } else if (e.key === 'ArrowUp') {
            setSelectedIndex(prev => (prev - 1 + results.length) % results.length);
        } else if (e.key === 'Enter') {
            handleSelect(results[selectedIndex]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-start justify-center pt-[15vh] animate-in fade-in duration-150" onClick={() => setIsOpen(false)}>
            <div className="w-full max-w-2xl bg-dnd-card border border-gray-700 rounded-xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center p-4 border-b border-gray-700 gap-3">
                    <Search className="w-5 h-5 text-gray-400" />
                    <input 
                        ref={inputRef}
                        className="flex-1 bg-transparent text-lg text-white outline-none placeholder-gray-600"
                        placeholder="Поиск... (Правила, Места, NPC, Квесты)"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                    />
                    <div className="text-xs text-gray-600 border border-gray-700 rounded px-2 py-1">ESC</div>
                </div>
                
                {results.length > 0 ? (
                    <div className="max-h-[50vh] overflow-y-auto p-2">
                        {results.map((item, idx) => (
                            <div 
                                key={idx}
                                onClick={() => handleSelect(item)}
                                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${idx === selectedIndex ? 'bg-gold-600/20 border border-gold-600/50' : 'hover:bg-gray-800 border border-transparent'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-gray-800 rounded-md">{item.icon}</div>
                                    <div>
                                        <div className={`font-bold ${idx === selectedIndex ? 'text-gold-500' : 'text-gray-200'}`}>{item.title}</div>
                                        <div className="text-xs text-gray-500 uppercase">{item.detail}</div>
                                    </div>
                                </div>
                                {idx === selectedIndex && <CornerDownLeft className="w-4 h-4 text-gold-500"/>}
                            </div>
                        ))}
                    </div>
                ) : query ? (
                    <div className="p-8 text-center text-gray-500">Ничего не найдено</div>
                ) : (
                    <div className="p-4 text-xs text-gray-500 text-center">
                        Введите название правила, локации, квеста или NPC.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Omnibar;