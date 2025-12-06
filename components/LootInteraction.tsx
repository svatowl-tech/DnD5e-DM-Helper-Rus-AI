
import React, { useState, useEffect, useRef } from 'react';
import { PartyMember } from '../types';
import { Gift, ChevronDown, Coins, Check, PackagePlus, Landmark, MoreHorizontal, X, Sparkles, Archive, Feather, ArrowRightCircle } from 'lucide-react';

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

    const handleGiveItem = (e: React.MouseEvent, itemName: string, itemDesc: string, memberId: string) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('dmc-give-item', {
            detail: { memberId, itemName, itemDescription: itemDesc }
        }));
        setOpenDropdownIndex(null);
    };

    const handleAddToStash = (e: React.MouseEvent, itemName: string, itemDesc: string, isMoney: boolean = false) => {
        e.stopPropagation();
        
        if (isMoney) {
            // Parse amount and type
            const matches = itemName.match(/(\d+)\s*(?:gp|zm|зм|sp|см|cp|мм|gold|silver|copper)/i);
            if (matches) {
                const amount = parseInt(matches[1]);
                const typeStr = matches[0].toLowerCase();
                
                let coins = { gp: 0, sp: 0, cp: 0 };
                if (typeStr.includes('gp') || typeStr.includes('зм') || typeStr.includes('zm') || typeStr.includes('gold')) coins.gp = amount;
                else if (typeStr.includes('sp') || typeStr.includes('см') || typeStr.includes('silver')) coins.sp = amount;
                else if (typeStr.includes('cp') || typeStr.includes('мм') || typeStr.includes('copper')) coins.cp = amount;
                
                window.dispatchEvent(new CustomEvent('dmc-add-to-stash', {
                    detail: { coins }
                }));
            }
        } else {
            window.dispatchEvent(new CustomEvent('dmc-add-to-stash', {
                detail: { itemName, itemDescription: itemDesc }
            }));
        }
        
        setOpenDropdownIndex(null);
    };

    const handleSplitMoney = (e: React.MouseEvent, itemName: string) => {
        e.stopPropagation();
        // First add to stash wallet, then trigger distribute
        handleAddToStash(e, itemName, "", true);
        setTimeout(() => {
             window.dispatchEvent(new CustomEvent('dmc-distribute-currency'));
        }, 100); // slight delay to ensure add completes
    };

    const handleInspect = (e: React.MouseEvent, itemName: string) => {
        e.stopPropagation();
        const event = new CustomEvent('dmc-show-details', {
            detail: { type: 'loot', id: itemName, title: itemName }
        });
        window.dispatchEvent(event);
        setOpenDropdownIndex(null);
    };
    
    const handleLog = (e: React.MouseEvent, itemName: string) => {
        e.stopPropagation();
         // Assuming addLog isn't directly available, we might need a global event for logging if not passed as prop
         // Or rely on the fact this component is usually inside something that handles logs.
         // But for now, let's skip "Log" here since it's already IN the log usually.
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
                    // Smart Parsing for "Name: Description" format
                    let name = "";
                    let desc = "";
                    
                    // Try to find bold tag at start for name
                    const boldTag = el.querySelector('strong, b');
                    if (boldTag) {
                        name = boldTag.textContent || "";
                        // Description is everything after the bold tag (and colon)
                        let fullText = el.innerHTML;
                        // Remove the bold part from description
                        desc = fullText.replace(boldTag.outerHTML, '').trim();
                        // Remove leading colon or dash if present
                        desc = desc.replace(/^[:\-\s]+/, '').trim();
                    } else {
                        // Fallback: Split by colon if bold tag missing
                        const textContent = el.textContent || "";
                        const colonIndex = textContent.indexOf(':');
                        if (colonIndex > -1) {
                            name = textContent.substring(0, colonIndex).trim();
                            desc = textContent.substring(colonIndex + 1).trim();
                        } else {
                            name = textContent.trim();
                            desc = ""; // No description found
                        }
                    }
                    
                    const cleanItemText = name.replace(/<[^>]*>/g, '').trim();
                    
                    // Check if it looks like an item (not just text)
                    const isItem = cleanItemText.length > 1;
                    
                    // Simple money detection
                    const isMoney = /(\d+)\s*(?:gp|zm|зм|sp|см|cp|мм|gold|silver|copper)/i.test(cleanItemText);

                    return (
                        <li key={index} className="group flex items-start justify-between gap-2 py-1 px-2 hover:bg-gray-800/50 rounded transition-colors relative">
                            <span className="text-gray-300 text-sm leading-snug flex-1" dangerouslySetInnerHTML={{__html: el.innerHTML}} />
                            
                            {isItem && (
                                <>
                                    <button 
                                        onClick={(e) => toggleDropdown(e, index)}
                                        className={`shrink-0 p-1.5 rounded border transition-all ${isMoney ? 'text-yellow-400 border-yellow-600/50 bg-yellow-900/10' : 'text-gray-400 border-gray-700 bg-gray-800'}`}
                                        title={isMoney ? "Управление деньгами" : "Действия с предметом"}
                                    >
                                        {isMoney ? <Coins className="w-4 h-4"/> : <Gift className="w-4 h-4" />}
                                    </button>
                                    
                                    {openDropdownIndex === index && (
                                        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in" onClick={(e) => e.stopPropagation()}>
                                            <div className="bg-dnd-card border-2 border-gold-600 w-full max-w-sm rounded-lg shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                                <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
                                                     <h3 className="font-bold text-white text-lg truncate pr-2">{cleanItemText}</h3>
                                                     <button onClick={() => setOpenDropdownIndex(null)} className="text-gray-400 hover:text-white p-2"><X className="w-6 h-6"/></button>
                                                </div>
                                                <div className="p-4 space-y-3">
                                                    {isMoney ? (
                                                        <div className="space-y-2">
                                                           <button 
                                                                onClick={(e) => handleAddToStash(e, cleanItemText, "", true)}
                                                                className="w-full text-left px-4 py-3 bg-yellow-900/30 hover:bg-yellow-900/50 border border-yellow-700 rounded text-yellow-200 flex items-center gap-3 font-bold"
                                                           >
                                                                <Landmark className="w-5 h-5"/> В казну
                                                           </button>
                                                           <button 
                                                                onClick={(e) => handleSplitMoney(e, cleanItemText)}
                                                                className="w-full text-left px-4 py-3 bg-green-900/30 hover:bg-green-900/50 border border-green-700 rounded text-green-300 flex items-center gap-3 font-bold"
                                                           >
                                                                <Coins className="w-5 h-5"/> Разделить на всех
                                                           </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            <div className="grid grid-cols-2 gap-2">
                                                                <button 
                                                                    onClick={(e) => handleInspect(e, cleanItemText)}
                                                                    className="px-3 py-3 bg-indigo-900/30 hover:bg-indigo-900/50 border border-indigo-700 rounded text-indigo-200 flex flex-col items-center justify-center gap-1 font-bold text-xs"
                                                                >
                                                                    <Sparkles className="w-5 h-5"/> Изучить (AI)
                                                                </button>
                                                                <button 
                                                                    onClick={(e) => handleAddToStash(e, cleanItemText, desc, false)}
                                                                    className="px-3 py-3 bg-blue-900/30 hover:bg-blue-900/50 border border-blue-700 rounded text-blue-200 flex flex-col items-center justify-center gap-1 font-bold text-xs"
                                                                >
                                                                    <Archive className="w-5 h-5"/> В общий мешок
                                                                </button>
                                                            </div>
                                                            
                                                            <div>
                                                                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Передать герою:</p>
                                                                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                                                                    {party.length === 0 ? (
                                                                        <div className="px-2 py-2 text-sm text-gray-500 italic text-center border border-dashed border-gray-700 rounded">Нет активных героев</div>
                                                                    ) : (
                                                                        party.map(p => (
                                                                            <button
                                                                                key={p.id}
                                                                                onClick={(e) => handleGiveItem(e, cleanItemText, desc, p.id)}
                                                                                className="flex items-center gap-3 p-2 bg-gray-800 hover:bg-gold-900/30 border border-gray-700 hover:border-gold-500 rounded text-left transition-colors active:scale-95"
                                                                            >
                                                                                <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-bold text-white shrink-0">
                                                                                    {p.name.charAt(0)}
                                                                                </div>
                                                                                <span className="text-sm font-bold text-gray-200 flex-1 truncate">{p.name}</span>
                                                                                <ArrowRightCircle className="w-5 h-5 text-gray-500"/>
                                                                            </button>
                                                                        ))
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
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
