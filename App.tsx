import React, { useState, useMemo, useEffect } from 'react';
import { onAuthStateChange, signOut, type User } from './services/authService';
import Header from './components/Header';
import Tabs from './components/Tabs';
import LeadFinder from './components/LeadFinder';
import LeadQualifier from './components/LeadQualifier';
import MarketingGenerator from './components/MarketingGenerator';
import BusinessPlanner from './components/BusinessPlanner';
import ChatBot from './components/ChatBot';
import BusinessNamer from './components/BusinessNamer';
import Pipeline from './components/Pipeline';
import Auth from './components/Auth';
import { Tab } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.LEAD_FINDER);
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Listen to auth state
  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const tabs = useMemo(() => [
    { id: Tab.LEAD_FINDER, label: 'Lead Finder' },
    { id: Tab.LEAD_QUALIFIER, label: 'Lead Qualifier' },
    { id: Tab.PIPELINE, label: 'Pipeline' },
    { id: Tab.BUSINESS_PLANNER, label: 'Strategy Planner' },
    { id: Tab.MARKETING_COPY, label: 'Marketing Copy' },
    { id: Tab.NAME_IDEAS, label: 'Name Ideas' },
    { id: Tab.CHAT, label: 'AI Chat' },
  ], []);

  const renderContent = () => {
    switch (activeTab) {
      case Tab.LEAD_FINDER: return <LeadFinder />;
      case Tab.LEAD_QUALIFIER: return <LeadQualifier />;
      case Tab.PIPELINE: return <Pipeline />;
      case Tab.MARKETING_COPY: return <MarketingGenerator />;
      case Tab.BUSINESS_PLANNER: return <BusinessPlanner />;
      case Tab.CHAT: return <ChatBot />;
      case Tab.NAME_IDEAS: return <BusinessNamer />;
      default: return <LeadFinder />;
    }
  };

  // Show loading spinner while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center">
        <div className="text-content-200">Loading...</div>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-base-100 text-content-100 font-sans">
      <Header />
      <div className="flex justify-end px-4 pt-2">
        <button
          onClick={signOut}
          className="text-xs text-content-200 hover:text-content-100 transition-colors"
        >
          Sign out ({user.email})
        </button>
      </div>
      <main className="container mx-auto px-4 py-4">
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="mt-8 bg-base-200 p-6 sm:p-8 rounded-xl shadow-2xl border border-base-300">
          {renderContent()}
        </div>
      </main>
      <footer className="text-center py-4 text-content-200 text-sm">
        <p>Powered by Google Gemini</p>
      </footer>
    </div>
  );
};

export default App;
