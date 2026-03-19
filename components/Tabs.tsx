import React from 'react';
import { Tab } from '../types';

interface TabsProps {
  tabs: { id: Tab; label: string }[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    /* Horizontal scroll container on mobile — no wrapping chaos */
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex gap-2 pb-4 border-b border-base-300 min-w-max sm:min-w-0 sm:flex-wrap sm:justify-center">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-primary ${
              activeTab === tab.id
                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/30 ring-1 ring-brand-primary/50'
                : 'bg-base-300 text-content-200 hover:bg-base-200 hover:text-content-100'
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
