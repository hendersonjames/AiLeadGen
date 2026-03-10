import React, { useState } from 'react';
import { generateBusinessPlan } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { LightBulbIcon } from './common/Icons';

declare const marked: any;

const BusinessPlanner: React.FC = () => {
  const [prompt, setPrompt] = useState('Develop a 3-month growth strategy for a new residential plumbing business focusing on eco-friendly solutions in a competitive urban market.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please enter a prompt for your business plan.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateBusinessPlan(prompt);
      setResult(response.text);
    } catch (err) {
      setError('Failed to generate business plan. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-white">AI Business Strategy Planner</h2>
      <p className="text-content-200 mb-6">Describe your goal and let Gemini Pro's "thinking mode" generate a detailed strategy for you. This may take a few moments.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="planPrompt" className="block text-sm font-medium text-content-200 mb-1">Your Business Goal or Challenge</label>
          <textarea
            id="planPrompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            placeholder="e.g., 'Create a marketing plan to get my first 20 clients for a new landscaping business.'"
            className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-base-300"
        >
          {loading ? <><LoadingSpinner /> Thinking...</> : <><LightBulbIcon className="w-5 h-5" /> Generate Plan</>}
        </button>
      </form>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {result && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4 text-white">Generated Business Plan</h3>
          <div 
            className="prose prose-invert prose-p:text-content-100 prose-headings:text-white bg-base-100 p-4 rounded-lg max-w-none" 
            dangerouslySetInnerHTML={{ __html: marked.parse(result) }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default BusinessPlanner;
