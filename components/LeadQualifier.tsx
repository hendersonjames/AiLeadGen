import React, { useState } from 'react';
import { qualifyLead } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { ClipboardCheckIcon } from './common/Icons';

declare const marked: any;

const LeadQualifier: React.FC = () => {
  const [leadInfo, setLeadInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadInfo.trim()) {
      setError('Please paste some lead information to analyze.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await qualifyLead(leadInfo);
      setResult(response.text);
    } catch (err) {
      setError('Failed to qualify lead. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-white">Qualify Potential Leads</h2>
      <p className="text-content-200 mb-6">Paste a client inquiry, email, or message to get an AI-powered analysis and suggested next steps.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="leadInfo" className="block text-sm font-medium text-content-200 mb-1">Lead Information</label>
          <textarea
            id="leadInfo"
            value={leadInfo}
            onChange={(e) => setLeadInfo(e.target.value)}
            rows={8}
            placeholder="e.g., 'Hi, I saw your ad and need a quote for a new roof. My current one is leaking. It's a 2000 sq ft house. How soon can you come take a look?'"
            className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-base-300"
        >
          {loading ? <><LoadingSpinner /> Analyzing...</> : <><ClipboardCheckIcon className="w-5 h-5" /> Qualify Lead</>}
        </button>
      </form>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {result && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-white">Lead Analysis</h3>
          <div 
            className="prose prose-invert prose-p:text-content-100 prose-headings:text-white bg-base-100 p-4 rounded-lg" 
            dangerouslySetInnerHTML={{ __html: marked.parse(result) }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default LeadQualifier;
