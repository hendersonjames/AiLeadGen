import React from 'react';
import { SparklesIcon } from './common/Icons';

const Header: React.FC = () => {
  return (
    <header className="bg-base-200/50 backdrop-blur-sm sticky top-0 z-10 border-b border-base-300">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <div className="flex items-center space-x-3 text-2xl font-bold text-white">
          <SparklesIcon className="w-8 h-8 text-brand-primary" />
          <h1>Home Services Lead Hub</h1>
        </div>
      </div>
    </header>
  );
};

export default Header;
