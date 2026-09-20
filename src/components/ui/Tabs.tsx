import React from 'react';

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  variant?: 'pills' | 'underline';
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  variant = 'pills',
  className = ''
}) => {
  if (variant === 'underline') {
    return (
      <div className={`flex border-b border-gray-200 gap-6 ${className}`}>
        {tabs.map(t => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`pb-3 text-sm font-semibold transition-all relative ${
                isActive
                  ? 'text-[#0b4627]'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-emerald-100 text-[#0b4627]' : 'bg-gray-100 text-gray-600'
                }`}>
                  {t.count}
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0b4627] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Pill variant (like reference image department & category filters)
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {tabs.map(t => {
        const isActive = activeTab === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${
              isActive
                ? 'bg-[#0b4627] text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className={`ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full ${
                isActive ? 'bg-emerald-700 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
