import { useState } from 'react';
import type { NavTab } from '../types';
import { BottomNav } from './BottomNav';

interface ChatMessage {
  from: 'coach' | 'user';
  text: string;
}

interface CoachProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  messages: ChatMessage[];
  onAsk: (question: string) => void;
}

export function Coach({ activeTab, onTabChange, messages, onAsk }: CoachProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    onAsk(input.trim());
    setInput('');
  };

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl p-3 flex flex-col gap-2.5">
      <div className="px-1.5 pt-1 pb-0.5">
        <h2 className="text-lg font-medium">AI 教練</h2>
        <p className="text-xs text-gray-400 mt-0.5">根據 Garmin 數據即時分析</p>
      </div>

      <div className="flex flex-col gap-2 bg-gray-50 rounded-xl p-3.5 min-h-[220px]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-xl px-3 py-2.5 text-sm leading-relaxed ${
              m.from === 'coach'
                ? 'self-start bg-white'
                : 'self-end bg-blue-50 text-blue-700'
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAsk('分析我這週的訓練負荷')}
          className="text-xs px-2.5 py-2 flex-1 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          訓練負荷分析
        </button>
        <button
          onClick={() => onAsk('我這週的心率區間分佈如何')}
          className="text-xs px-2.5 py-2 flex-1 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          心率區間
        </button>
      </div>

      <div className="flex items-center gap-2 border border-gray-300 rounded-md px-2.5 py-1.5">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="問問今天該怎麼訓練"
          className="border-none flex-1 text-sm bg-transparent outline-none"
        />
        <button onClick={handleSend} aria-label="送出">
          <i className="ti ti-send text-base text-blue-600" />
        </button>
      </div>

      <BottomNav active={activeTab} onChange={onTabChange} />
    </div>
  );
}