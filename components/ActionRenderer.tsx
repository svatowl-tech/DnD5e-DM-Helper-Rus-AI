
import React from 'react';
import { Dices } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

interface ActionRendererProps {
    text: string;
    sourceName?: string;
    onRoll?: (expr: string, result: number, total: number) => void;
}

const ActionRenderer: React.FC<ActionRendererProps> = ({ text, sourceName, onRoll }) => {
    const { showToast } = useToast();

    const diceRegex = /(\d+d\d+(?:\s*[+\-]\s*\d+)?)/g;
    const parts = text.split(diceRegex);
    
    const rollDice = (expression: string) => {
        try {
            const cleanExpr = expression.replace(/\s/g, '');
            const [dicePart, modPart] = cleanExpr.split(/[+\-]/);
            const [count, sides] = dicePart.split('d').map(Number);
            const modifier = modPart ? Number(modPart) : 0;
            const isNegative = cleanExpr.includes('-');
            
            let total = 0;
            for (let i = 0; i < count; i++) {
                total += Math.floor(Math.random() * sides) + 1;
            }
            const finalTotal = isNegative ? total - modifier : total + modifier;
            
            if (onRoll) {
                onRoll(expression, finalTotal, finalTotal);
            } else {
                showToast(`${sourceName || 'Бросок'}: ${finalTotal} (${expression})`, 'info');
            }
        } catch (e) {
            console.error("Dice parse error", e);
        }
    };

    return (
        <span>
            {parts.map((part, i) => {
                if (part.match(diceRegex)) {
                    return (
                        <button 
                            key={i}
                            onClick={(e) => { e.stopPropagation(); rollDice(part); }}
                            className="inline-flex items-center gap-1 px-2 py-1 mx-1 bg-indigo-900/80 hover:bg-indigo-600 border border-indigo-500/50 rounded text-indigo-100 font-mono text-xs sm:text-sm font-bold cursor-pointer transition-colors active:scale-95 touch-manipulation align-middle"
                        >
                            <Dices className="w-3 h-3"/> {part}
                        </button>
                    );
                }
                return <span key={i} dangerouslySetInnerHTML={{__html: part}} />;
            })}
        </span>
    );
};

export default ActionRenderer;
