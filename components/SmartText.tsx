
import React, { useMemo } from 'react';
import { PartyMember, LocationData, NpcData } from '../types';
import { CONDITIONS } from '../constants';
import { RULES_DATA } from '../data/rulesData';

interface SmartTextProps {
  content: string;
  className?: string;
}

const SmartText: React.FC<SmartTextProps> = ({ content, className = "" }) => {
  const processedHtml = useMemo(() => {
    if (!content) return "";
    
    let html = content;

    // Basic heuristic to detect plain text with newlines and no block HTML
    // If it doesn't have common block tags, treat newlines as line breaks
    if (!/<(p|div|ul|ol|li|h[1-6]|table|tr|td|th|blockquote)[^>]*>/i.test(html)) {
        html = html.replace(/\n/g, '<br/>');
    }

    const keywords = new Map<string, { type: string; id: string; title: string }>();

    // 1. Load Data from Storage/Constants
    // Party
    try {
        const party: PartyMember[] = JSON.parse(localStorage.getItem('dmc_party') || '[]');
        party.forEach(p => keywords.set(p.name.toLowerCase(), { type: 'party', id: p.id, title: p.name }));
    } catch {}

    // Active Location NPCs
    try {
        const loc: LocationData = JSON.parse(localStorage.getItem('dmc_active_location') || 'null');
        if (loc) {
            // Link Location Name
            if (loc.name) keywords.set(loc.name.toLowerCase(), { type: 'location', id: 'active', title: loc.name });
            
            // Link NPCs
            loc.npcs?.forEach(n => {
                keywords.set(n.name.toLowerCase(), { type: 'npc', id: n.name, title: n.name }); // ID is name for NPCs
                // Also match first name if long enough
                const parts = n.name.split(' ');
                if (parts.length > 1 && parts[0].length > 3) {
                     keywords.set(parts[0].toLowerCase(), { type: 'npc', id: n.name, title: n.name });
                }
            });
        }
    } catch {}

    // Conditions
    CONDITIONS.forEach(c => {
        keywords.set(c.name.toLowerCase(), { type: 'condition', id: c.id, title: c.name });
        // Match simplified name (e.g. "Blinded" from "Blinded (Ослеплен)")
        const simple = c.name.split(' (')[0].toLowerCase();
        if (simple && simple !== c.name.toLowerCase()) {
            keywords.set(simple, { type: 'condition', id: c.id, title: c.name });
        }
    });

    // Rules (Titles only to avoid noise)
    RULES_DATA.forEach(r => {
        keywords.set(r.title.toLowerCase(), { type: 'rule', id: r.id, title: r.title });
    });

    // Sort keys by length (longest first) to avoid partial replacement issues
    const sortedKeys = Array.from(keywords.keys()).sort((a, b) => b.length - a.length);

    // Replacement Strategy:
    // We replace keywords with a placeholder {{{INDEX}}} to avoid replacing inside tags or re-replacing.
    // Then we restore placeholders with the span.
    
    let tempHtml = html;

    sortedKeys.forEach((key, index) => {
        if (key.length < 3) return; // Skip very short words
        
        const data = keywords.get(key);
        if (!data) return;

        // Regex: Match word boundary, case insensitive, NOT inside HTML tags
        // Negative lookahead for > (end of tag) without < (start of tag) is a poor man's HTML parser, 
        // but sufficient for simple descriptions.
        const regex = new RegExp(`(?<!<[^>]*)\\b(${key})\\b`, 'gi');
        
        // We assign a unique ID for this match type
        tempHtml = tempHtml.replace(regex, (match) => {
            return `<!--SMART:${data.type}:${data.id}:${data.title}:${match}-->`; 
        });
    });

    // Now replace the comments with actual spans
    tempHtml = tempHtml.replace(/<!--SMART:(.*?):(.*?):(.*?):(.*?)(-->)/g, (all, type, id, title, text) => {
        let colorClass = "text-gold-500 decoration-gold-500/50";
        if (type === 'condition') colorClass = "text-red-400 decoration-red-400/50";
        if (type === 'party') colorClass = "text-blue-400 decoration-blue-400/50";
        if (type === 'rule') colorClass = "text-gray-300 underline decoration-dashed decoration-gray-500";

        return `<button class="smart-link inline hover:underline decoration-2 ${colorClass} font-semibold bg-transparent p-0 border-0 cursor-pointer" data-type="${type}" data-id="${id}" data-title="${title}">${text}</button>`;
    });

    return tempHtml;
  }, [content]);

  const handleClick = (e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest('.smart-link');
    if (target) {
        const type = target.getAttribute('data-type');
        const id = target.getAttribute('data-id');
        const title = target.getAttribute('data-title');
        
        if (type && id) {
            const event = new CustomEvent('dmc-show-details', {
                detail: { type, id, title }
            });
            window.dispatchEvent(event);
        }
    }
  };

  return (
    <div 
        className={`smart-text-content ${className}`}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        onClick={handleClick}
    />
  );
};

export default SmartText;
