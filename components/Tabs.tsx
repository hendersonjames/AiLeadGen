import React from 'react';
import { Tab } from '../types';

interface TabsProps {
  tabs: { id: Tab; label: string }[];
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <div className="flex flex-wrap justify-center gap-2 sm:gap-4 border-b border-base-300 pb-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-sm sm:text-base font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-base-100 focus:ring-brand-primary ${
            activeTab === tab.id
              ? 'bg-brand-primary text-white shadow-md'
              : 'bg-base-300 text-content-200 hover:bg-base-200 hover:text-content-100'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
