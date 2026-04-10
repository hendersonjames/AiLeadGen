import React from 'react';
import { Tab } from '../types';

interface TabsProps {
  tabs: { id: Tab; label: string }[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="-mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-1.5 pb-3 border-b border-[#374151] min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap
              focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:ring-offset-2 focus:ring-offset-[#111827] ${
              activeTab === tab.id
                ? 'bg-[#1E40AF] text-white shadow-md ring-1 ring-[#1E40AF]/50'
                : 'bg-[#374151] text-[#9ca3af] hover:bg-[#4b5563] hover:text-[#d1d5db]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Tabs;