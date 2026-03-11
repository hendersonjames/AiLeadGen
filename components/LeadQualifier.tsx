import React, { useState } from 'react';
import { qualifyLead } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import LeadSaveButton from './LeadSaveButton';
import { ClipboardCheckIcon } from './common/Icons';

declare const marked: any;

const LeadQualifier: React.FC = () => {
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadInfo, setLeadInfo] = useState('');
  const [serviceType, setServiceType] = useState('roofing');
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

  // Try to extract urgency score from AI response (looks for "score: X" or "X/10")
  const extractUrgency = (text: string): number | undefined => {
    const match = text.match(/urgency[:\s]+([1-9]|10)(?:\/10)?/i) ||
                  text.match(/score[:\s]+([1-9]|10)(?:\/10)?/i);
    if (match) {
      const score = parseInt(match[1]);
      // Convert 1-10 scale to 1-5
      return Math.ceil(score / 2);
    }
    return undefined;
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-white">Qualify Potential Leads</h2>
      <p className="text-content-200 mb-6">Paste a client inquiry, email, or message to get an AI-powered analysis and suggested next steps.</p>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-content-200 mb-1">Contact Name</label>
            <input
              type="text"
              value={leadName}
              onChange={e => setLeadName(e.target.value)}
              placeholder="e.g., John Smith"
              className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-200 mb-1">Phone (optional)</label>
            <input
              type="text"
              value={leadPhone}
              onChange={e => setLeadPhone(e.target.value)}
              placeholder="e.g., 720-555-0100"
              className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-200 mb-1">Service Type</label>
            <input
              type="text"
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
              placeholder="e.g., roofing, HVAC"
              className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
        </div>

        <div>
          <label htmlFor="leadInfo" className="block text-sm font-medium text-content-200 mb-1">Lead Information</label>
          <textarea
            id="leadInfo"
            value={leadInfo}
            onChange={(e) => setLeadInfo(e.target.value)}
            rows={6}
            placeholder="Paste a client inquiry, voicemail transcript, email, or form submission here..."
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Lead Analysis</h3>
            <LeadSaveButton
              leadData={{
                name: leadName || 'Unknown Contact',
                phone: leadPhone || undefined,
                service_type: serviceType,
                source: 'qualifier',
                raw_lead_text: leadInfo,
                qualification_report: result,
                urgency: extractUrgency(result),
                notes: `Qualified on ${new Date().toLocaleDateString()}`,
              }}
            />
          </div>
          <div
            className="prose prose-invert prose-p:text-content-100 prose-headings:text-white bg-base-100 p-4 rounded-lg"
            dangerouslySetInnerHTML={{ __html: marked.parse(result) }}
          />
        </div>
      )}
    </div>
  );
};

export default LeadQualifier;
