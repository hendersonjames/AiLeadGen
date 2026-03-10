import React, { useState } from 'react';
import { generateBusinessNames } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { TagIcon } from './common/Icons';

declare const marked: any;

const BusinessNamer: React.FC = () => {
  const [serviceType, setServiceType] = useState('landscaping');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType.trim()) {
      setError('Please enter a service type.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateBusinessNames(serviceType);
      setResult(response.text);
    } catch (err)      {
      setError('Failed to generate names. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-white">Business Name Idea Generator</h2>
      <p className="text-content-200 mb-6">Get fast, creative name suggestions for your new venture.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="bn_serviceType" className="block text-sm font-medium text-content-200 mb-1">Service Type</label>
          <input
            type="text"
            id="bn_serviceType"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            placeholder="e.g., house cleaning, mobile mechanic"
            className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-base-300"
        >
          {loading ? <><LoadingSpinner /> Getting Ideas...</> : <><TagIcon className="w-5 h-5" /> Get Name Ideas</>}
        </button>
      </form>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {result && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-white">Name Suggestions</h3>
          <div 
            className="prose prose-invert prose-p:text-content-100 prose-headings:text-white bg-base-100 p-4 rounded-lg"
            dangerouslySetInnerHTML={{ __html: marked.parse(result) }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default BusinessNamer;
