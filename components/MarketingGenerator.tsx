import React, { useState } from 'react';
import { generateMarketingCopy } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import { SpeakerphoneIcon, ClipboardCopyIcon } from './common/Icons';

declare const marked: any;

const MarketingGenerator: React.FC = () => {
  const [serviceType, setServiceType] = useState('HVAC repair');
  const [targetAudience, setTargetAudience] = useState('homeowners in suburbs');
  const [tone, setTone] = useState('friendly and reliable');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceType || !targetAudience || !tone) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await generateMarketingCopy(serviceType, targetAudience, tone);
      setResult(response.text);
    } catch (err) {
      setError('Failed to generate marketing copy. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-white">Marketing Copy Generator</h2>
      <p className="text-content-200 mb-6">Create compelling ad copy for your services in seconds.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="mc_serviceType" className="block text-sm font-medium text-content-200 mb-1">Service Type</label>
            <input
              type="text" id="mc_serviceType" value={serviceType}
              onChange={(e) => setServiceType(e.target.value)} placeholder="e.g., painting"
              className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label htmlFor="targetAudience" className="block text-sm font-medium text-content-200 mb-1">Target Audience</label>
            <input
              type="text" id="targetAudience" value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)} placeholder="e.g., new homeowners"
              className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label htmlFor="tone" className="block text-sm font-medium text-content-200 mb-1">Tone of Voice</label>
            <input
              type="text" id="tone" value={tone}
              onChange={(e) => setTone(e.target.value)} placeholder="e.g., professional, witty"
              className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
        </div>
        <button
          type="submit" disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-base-300"
        >
          {loading ? <><LoadingSpinner /> Generating...</> : <><SpeakerphoneIcon className="w-5 h-5" /> Generate Copy</>}
        </button>
      </form>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {result && (
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-white">Generated Copy</h3>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 text-sm bg-base-300 hover:bg-brand-secondary/20 text-content-100 font-semibold py-2 px-3 rounded-lg transition-colors"
            >
              <ClipboardCopyIcon className="w-4 h-4" />
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <div 
            className="prose prose-invert prose-p:text-content-100 prose-headings:text-white bg-base-100 p-4 rounded-lg"
            dangerouslySetInnerHTML={{ __html: marked.parse(result) }}
          ></div>
        </div>
      )}
    </div>
  );
};

export default MarketingGenerator;
