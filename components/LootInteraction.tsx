
import React, { useState, useEffect, useRef } from 'react';
import { PartyMember } from '../types';
import { Gift, ChevronDown, Coins, Check } from 'lucide-react';

interface LootInteractionProps {
    htmlContent: string;
}

const LootInteraction: React.FC<LootInteractionProps> = ({ htmlContent }) => {
    const [party, setParty] = useState<PartyMember[]>([]);
    // Track which item (index) has the dropdown open
    const [openDropdownIndex, setOpenDropdownIndex] = useState<number | null>(null);
    
    useEffect(() => {
        // Load party for dropdowns
        const saved = localStorage.getItem('dmc_party');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed)) setParty(parsed.filter(p => p.active));
            } catch(e) { console.error(e); }
        }

        // Close dropdowns on outside click
        const close = () => setOpenDropdownIndex(null);
        window.addEventListener('click', close);
        return () => window.removeEventListener('click', close);
    }, []);

    const handleGiveItem = (e: React.MouseEvent, itemName: string, memberId: string) => {
        e.stopPropagation();
        // Dispatch event to App.tsx to handle storage update
        window.dispatchEvent(new CustomEvent('dmc-give-item', {
            detail: { memberId, itemName }
        }));
        setOpenDropdownIndex(null);
    };

    const toggleDropdown = (e: React.MouseEvent, index: number) => {
        e.stopPropagation();
        setOpenDropdownIndex(openDropdownIndex === index ? null : index);
    };

    // Parse HTML string into React elements with interactivity
    const renderContent = () => {
        // Create a temporary DOM element to parse HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        
        const elements: React.ReactNode[] = [];
        
        // Helper to process nodes
        const processNode = (node: Node, index: number): React.ReactNode => {
            if (node.nodeType === Node.TEXT_NODE) {
                return node.textContent;
            }
            
            if (node.nodeType === Node.ELEMENT_NODE) {
                const el = node as HTMLElement;
                const tagName = el.tagName.toLowerCase();
                
                // If it's a list item <li>, make it interactive
                if (tagName === 'li') {
                    const itemText = el.textContent || '';
                    const cleanItemText = itemText.replace(/<[^>]*>/g, '').trim();
                    
                    // Check if it looks like an item (not just text)
                    const isItem = cleanItemText.length > 2;

                    return (
                        <li key={index} className="group flex items-start justify-between gap-2 py-1 px-2 hover:bg-gray-800/50 rounded transition-colors relative">
                            <span className="text-gray-300 text-sm leading-snug" dangerouslySetInnerHTML={{__html: el.innerHTML}} />
                            
                            {isItem && (
                                <div className="relative shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => toggleDropdown(e, index)}
                                        className="p-1 text-gray-500 hover:text-gold-500 bg-gray-800 rounded border border-gray-600 hover:border-gold-500 transition-all"
                                        title="Отдать герою"
                                    >
                                        <Gift className="w-3 h-3" />
                                    </button>
                                    
                                    {openDropdownIndex === index && (
                                        <div className="absolute right-0 top-full mt-1 w-40 bg-gray-900 border border-gold-600 rounded shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95">
                                            <div className="bg-gray-800 px-2 py-1 text-[10px] font-bold text-gray-400 uppercase border-b border-gray-700">
                                                В инвентарь:
                                            </div>
                                            {party.length === 0 ? (
                                                <div className="px-3 py-2 text-xs text-gray-500 italic">Нет героев</div>
                                            ) : (
                                                party.map(p => (
                                                    <button
                                                        key={p.id}
                                                        onClick={(e) => handleGiveItem(e, cleanItemText, p.id)}
                                                        className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:bg-gold-600 hover:text-black transition-colors flex items-center gap-2"
                                                    >
                                                        <div className="w-2 h-2 rounded-full bg-gray-500 shrink-0"></div>
                                                        {p.name}
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                }

                // If list <ul> or <ol>, process children
                if (tagName === 'ul' || tagName === 'ol') {
                    const children = Array.from(el.childNodes).map((child, i) => processNode(child, index * 100 + i));
                    return tagName === 'ul' 
                        ? <ul key={index} className="list-disc list-inside space-y-1 my-2 pl-2">{children}</ul>
                        : <ol key={index} className="list-decimal list-inside space-y-1 my-2 pl-2">{children}</ol>;
                }

                // For other tags, just return sanitized HTML wrapper (simplified)
                return React.createElement(
                    tagName,
                    { key: index, dangerouslySetInnerHTML: { __html: el.innerHTML } }
                );
            }
            return null;
        };

        // Only process body children
        Array.from(doc.body.childNodes).forEach((node, i) => {
            elements.push(processNode(node, i));
        });

        return elements;
    };

    return (
        <div className="loot-interaction">
            {renderContent()}
        </div>
    );
};

export default LootInteraction;
