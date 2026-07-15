import { useState } from 'react';

interface ChatMessage {
  from: 'coach' | 'user';
  text: string;
}

interface CoachProps {
  messages: ChatMessage[];
  onAsk: (question: string) => void;
  sending: boolean;
}

export function Coach({ messages, onAsk, sending }: CoachProps) {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim() || sending) return;
    onAsk(input.trim());
    setInput('');
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 pt-14 pb-[108px] flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          className="w-11 h-11 rounded-full flex items-center justify-center text-white shrink-0"
          style={{ background: 'radial-gradient(circle at 30% 25%, #93B8F8, #2563EB 70%)' }}
        >
          <i className="ti ti-sparkles text-xl" />
        </span>
        <div>
          <h2 className="m-0 text-xl font-bold text-[#1C2430]">AI 教練</h2>
          <p className="mt-0.5 mb-0 text-xs text-[#9AA3B0]">根據 Garmin 數據即時分析</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-2.5 min-h-0 overflow-y-auto">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[82%] rounded-[20px] px-4 py-3 text-sm leading-[1.7] whitespace-pre-wrap ${
              m.from === 'coach' ? 'self-start bg-white text-[#2A3442] rounded-bl-[6px]' : 'self-end text-white rounded-br-[6px]'
            }`}
            style={m.from === 'user' ? { background: 'linear-gradient(135deg,#60A5FA,#2563EB)' } : undefined}
          >
            {m.text}
          </div>
        ))}
        {sending && (
          <div className="self-start bg-white max-w-[82%] rounded-[20px] rounded-bl-[6px] px-4 py-3 text-sm text-[#9AA3B0] animate-pulse">
            教練思考中...
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onAsk('分析我這週的訓練負荷')}
          className="text-xs px-3.5 py-2.5 rounded-full border border-[#DCD5CA] bg-white text-[#C2570F] cursor-pointer"
        >
          訓練負荷分析
        </button>
        <button
          onClick={() => onAsk('我這週的心率區間分佈如何')}
          className="text-xs px-3.5 py-2.5 rounded-full border border-[#BFD7FB] bg-white text-[#37548C] cursor-pointer"
        >
          心率區間
        </button>
      </div>

      <div
        className="flex items-center gap-2 bg-white rounded-full pl-[18px] pr-2 py-2"
        style={{ boxShadow: '0 4px 14px rgba(28,36,48,0.06)' }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="問問今天該怎麼訓練"
          className="border-none flex-1 text-sm bg-transparent outline-none text-[#1C2430]"
        />
        <button
          onClick={handleSend}
          aria-label="送出"
          disabled={sending}
          className="w-[38px] h-[38px] rounded-full border-none cursor-pointer flex items-center justify-center text-white disabled:opacity-50"
          style={{ background: '#2563EB' }}
        >
          <i className="ti ti-send text-base" />
        </button>
      </div>
    </div>
  );
}
