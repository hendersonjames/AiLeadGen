// components/LeadFinder.tsx
// Find verified, fresh homeowner leads for contractors

import React, { useState } from 'react';
import { findLeads, type StructuredLead } from '../services/geminiService';
import { saveLead } from '../services/leadsService';
import LoadingSpinner from './common/LoadingSpinner';
import { SearchIcon, PhoneIcon, LocationMarkerIcon, ExternalLinkIcon } from './common/Icons';

const SEARCH_TYPES = [
  { value: 'roofing',          label: 'Roofing' },
  { value: 'hvac',             label: 'HVAC' },
  { value: 'plumbing',         label: 'Plumbing' },
  { value: 'electrical',       label: 'Electrical' },
  { value: 'general contractor', label: 'General Contractor' },
];

const URGENCY_CONFIG = {
  high:   { label: 'High',   bg: 'bg-red-500/20 border-red-500/40',   text: 'text-red-400' },
  medium: { label: 'Medium', bg: 'bg-yellow-500/20 border-yellow-500/40', text: 'text-yellow-400' },
  low:    { label: 'Low',    bg: 'bg-blue-500/20 border-blue-500/40',  text: 'text-blue-400' },
};

const TYPE_LABELS: Record<string, string> = {
  storm_damage:      'Storm Damage',
  permit_activity:   'Permit Activity',
  new_construction:  'New Construction',
  aging_home:        'Aging Home',
  commercial:        'Commercial',
};

interface LeadCardProps {
  lead: StructuredLead;
  onSaved: () => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveLead({
        name: lead.name,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        zip: lead.zip,
        phone: lead.phone,
        email: lead.email,
        service_type: 'roofing',
        source: `lead_finder:${lead.opportunity_type}`,
        source_url: lead.source_url,
        raw_lead_text: JSON.stringify(lead, null, 2),
        notes: [
          `Opportunity: ${TYPE_LABELS[lead.opportunity_type] || lead.opportunity_type}`,
          `Why: ${lead.why_lead}`,
          `Action: ${lead.suggested_action}`,
          `Freshness: ${lead.data_freshness}`,
          lead.source ? `Source: ${lead.source}` : '',
        ].filter(Boolean).join('\n'),
        estimated_value: lead.estimated_value,
        urgency: lead.urgency === 'high' ? 5 : lead.urgency === 'medium' ? 3 : 1,
      });
      setSaved(true);
      onSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const uc = URGENCY_CONFIG[lead.urgency] || URGENCY_CONFIG.low;

  return (
    <div className="bg-base-100 border border-base-300 rounded-xl p-5 mb-4 hover:border-brand-primary/40 transition-colors">
      {/* Header row */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-content-100 text-lg leading-tight">{lead.name}</h3>
          <div className="flex items-center gap-1 mt-1 text-content-200 text-sm">
            <LocationMarkerIcon className="w-4 h-4 shrink-0" />
            <span>{lead.address}, {lead.city}, {lead.state}{lead.zip ? ` ${lead.zip}` : ''}</span>
          </div>
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ml-2 shrink-0 ${uc.bg} ${uc.text}`}>
          {uc.label} Priority
        </span>
      </div>

      {/* Tags */}
      <div className="flex gap-2 flex-wrap mb-3">
        <span className="bg-brand-primary/20 text-brand-primary text-xs font-medium px-2.5 py-1 rounded-full">
          {TYPE_LABELS[lead.opportunity_type] || lead.opportunity_type}
        </span>
        {lead.phone && (
          <span className="bg-base-300 text-content-200 text-xs font-medium px-2.5 py-1 rounded-full">
            {lead.phone}
          </span>
        )}
        {lead.data_freshness && (
          <span className="bg-green-500/10 text-green-400 text-xs font-medium px-2.5 py-1 rounded-full">
            {lead.data_freshness}
          </span>
        )}
      </div>

      {/* Why this lead */}
      <div className="bg-base-200 rounded-lg p-3 mb-3">
        <p className="text-content-100 text-sm leading-relaxed">{lead.why_lead}</p>
      </div>

      {/* Suggested action */}
      <div className="bg-brand-secondary/10 border border-brand-secondary/20 rounded-lg p-3 mb-4">
        <p className="text-xs text-brand-secondary font-semibold mb-1">Suggested Action</p>
        <p className="text-content-100 text-sm">{lead.suggested_action}</p>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center gap-3">
        {lead.source && (
          <div className="text-xs text-content-200 flex items-center gap-1 flex-1 min-w-0">
            <span>Source:</span>
            {lead.source_url ? (
              <a href={lead.source_url} target="_blank" rel="noopener noreferrer"
                className="text-brand-primary hover:underline truncate">
                {lead.source.slice(0, 50)}{lead.source.length > 50 ? '...' : ''}
                <ExternalLinkIcon className="w-3 h-3 inline ml-1" />
              </a>
            ) : (
              <span className="truncate">{lead.source}</span>
            )}
          </div>
        )}
        {saved ? (
          <span className="text-green-400 text-sm font-semibold shrink-0">Saved to Pipeline</span>
        ) : (
          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors shrink-0"
          >
            {saving ? 'Saving...' : '+ Save to Pipeline'}
          </button>
        )}
      </div>
    </div>
  );
};

const LeadFinder: React.FC = () => {
  const [serviceType, setServiceType] = useState('roofing');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leads, setLeads] = useState<StructuredLead[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!location.trim()) {
      setError('Please enter a city or zip code.');
      return;
    }
    setLoading(true);
    setError(null);
    setLeads([]);
    setSearched(false);

    try {
      const results = await findLeads(serviceType, location);
      setLeads(results);
      setSearched(true);
    } catch (err) {
      setError('Failed to find leads. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-1 text-white">Find Verified Leads</h2>
      <p className="text-content-200 mb-6">
        AI-powered search for fresh, verified homeowner leads in your area — storm damage, permits, new sales, and more.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
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
            ? <><LoadingSpinner /> Searching verified leads...</>
            : <><SearchIcon className="w-5 h-5" /> Find Verified Leads</>
          }
        </button>
      </form>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading && (
        <div className="text-center py-12">
          <LoadingSpinner />
          <p className="text-content-200 text-sm mt-3">Searching for fresh leads in {location || 'your area'}...</p>
        </div>
      )}

      {searched && !loading && leads.length === 0 && (
        <div className="text-center py-12 text-content-200">
          <p className="text-lg mb-2">No leads found for this area.</p>
          <p className="text-sm">Try a different city or zip code, or broaden your search area.</p>
        </div>
      )}

      {searched && !loading && leads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">
              {leads.length} Lead{leads.length !== 1 ? 's' : ''} Found in {location}
            </h3>
            <span className="text-content-200 text-sm">
              {leads.filter(l => l.urgency === 'high').length} high priority
            </span>
          </div>
          {leads.map((lead, i) => (
            <LeadCard key={i} lead={lead} onSaved={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
};

export default LeadFinder;