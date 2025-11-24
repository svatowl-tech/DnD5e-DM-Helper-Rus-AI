
import React, { useState, useEffect, useRef } from 'react';
import { Dices, RotateCcw } from 'lucide-react';
import { LogEntry } from '../types';

interface DiceRollerProps {
  addLog: (entry: LogEntry) => void;
}

const DiceRoller: React.FC<DiceRollerProps> = ({ addLog }) => {
  const [history, setHistory] = useState<string[]>([]);
  const [lastRoll, setLastRoll] = useState<number | null>(null);
  const historyEndRef = useRef<HTMLDivElement>(null);

  const roll = (sides: number, count: number = 1) => {
    let total = 0;
    const rolls = [];
    for (let i = 0; i < count; i++) {
      const val = Math.floor(Math.random() * sides) + 1;
      rolls.push(val);
      total += val;
    }

    const resultText = `Бросок ${count}d${sides}: [${rolls.join(', ')}] = ${total}`;
    setLastRoll(total);
    setHistory(prev => [resultText, ...prev].slice(0, 20)); // Keep more history
    
    addLog({
      id: Date.now().toString(),
      timestamp: Date.now(),
      text: resultText,
      type: 'roll'
    });
  };

  return (
    <div className="bg-dnd-card border border-gray-700 rounded-lg p-4 shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <h3 className="text-gold-500 font-serif font-bold flex items-center gap-2">
          <Dices className="w-5 h-5" /> Лоток дайсов
        </h3>
        {lastRoll !== null && (
          <span className="text-2xl font-bold text-white animate-pulse">{lastRoll}</span>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4 shrink-0">
        {[4, 6, 8, 10, 12, 20, 100].map(d => (
          <button
            key={d}
            onClick={() => roll(d)}
            className="bg-dnd-darker hover:bg-gray-700 text-gray-300 border border-gray-600 rounded py-2 px-1 text-sm transition-colors"
          >
            d{d}
          </button>
        ))}
        <button 
           onClick={() => roll(20, 2)}
           className="bg-gold-600 hover:bg-gold-500 text-black font-bold rounded py-2 px-1 text-sm"
           title="Преимущество/Помеха"
        >
          2d20
        </button>
      </div>

      <div className="flex-1 flex flex-col min-h-0 border-t border-gray-700 pt-2">
        <div className="flex justify-between items-center mb-1 shrink-0">
          <span className="text-xs text-gray-400 uppercase tracking-wider">История</span>
          <button onClick={() => setHistory([])}><RotateCcw className="w-3 h-3 text-gray-500 hover:text-white" /></button>
        </div>
        <div className="space-y-1 overflow-y-auto custom-scrollbar pr-1">
          {history.map((h, i) => (
            <div key={i} className="truncate text-xs text-gray-300 border-b border-gray-800/50 last:border-0 py-0.5">{h}</div>
          ))}
          {history.length === 0 && <span className="text-xs italic opacity-50 text-gray-500">Пока пусто.</span>}
          <div ref={historyEndRef} />
        </div>
      </div>
    </div>
  );
};

export default DiceRoller;
