import React, { useState } from 'react';
import { findLeads } from '../services/geminiService';
import LoadingSpinner from './common/LoadingSpinner';
import LeadSaveButton from './LeadSaveButton';
import { SearchIcon } from './common/Icons';

declare const marked: any;

const SEARCH_TYPES = [
  { value: 'roofing',  label: 'Roofing' },
  { value: 'HVAC',     label: 'HVAC' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'general contractor', label: 'General Contractor' },
];

const LeadFinder: React.FC = () => {
  const [serviceType, setServiceType] = useState('roofing');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Please enter a city or zip code.');
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await findLeads(serviceType, location);
      setResult(response.text);
    } catch (err) {
      setError('Failed to find leads. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parseLocation = (loc: string) => {
    const parts = loc.split(',').map(p => p.trim());
    return { city: parts[0] || loc, state: parts[1] || '' };
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-white">Find Homeowner Leads</h2>
      <p className="text-content-200 mb-6">
        Search for homeowners and properties in your area that likely need {serviceType} services — storm damage, new homeowners, aging homes, permit activity, and more.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-content-200 mb-1">Your Trade</label>
            <select
              value={serviceType}
              onChange={e => setServiceType(e.target.value)}
              className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            >
              {SEARCH_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-content-200 mb-1">Search Area</label>
            <input
              type="text"
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="e.g., Denver, CO or 80203"
              className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 bg-brand-primary hover:bg-brand-primary/80 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-base-300"
        >
          {loading
            ? <><LoadingSpinner /> Searching for opportunities...</>
            : <><SearchIcon className="w-5 h-5" /> Find Homeowner Leads</>
          }
        </button>
      </form>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      {result && (
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Lead Opportunities in {location}</h3>
            <LeadSaveButton
              leadData={{
                name: `${serviceType} opportunities — ${location}`,
                service_type: serviceType,
                ...parseLocation(location),
                source: 'lead_finder',
                raw_lead_text: result,
                notes: `Found via Lead Finder on ${new Date().toLocaleDateString()}`,
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

export default LeadFinder;
