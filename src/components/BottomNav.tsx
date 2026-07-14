import type { NavTab } from '../types';

interface BottomNavProps {
  active: NavTab;
  onChange: (tab: NavTab) => void;
}

const items: { key: NavTab; label: string; icon: string }[] = [
  { key: 'dashboard', label: '看板', icon: 'ti-layout-dashboard' },
  { key: 'history', label: '歷史', icon: 'ti-history' },
  { key: 'coach', label: '教練', icon: 'ti-message-circle' },
  { key: 'fitness', label: '體能', icon: 'ti-heartbeat' },
  { key: 'settings', label: '設定', icon: 'ti-settings' },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <div className="flex justify-around pt-2 border-t border-gray-200">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className="flex flex-col items-center gap-0.5 py-1"
          >
            <i
              className={`ti ${item.icon} text-xl ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            />
            <span
              className={`text-[10px] ${
                isActive ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}