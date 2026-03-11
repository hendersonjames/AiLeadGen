// components/Pipeline.tsx
// CRM Pipeline view - shows leads by stage

import React, { useEffect, useState } from 'react';
import { getLeads, updateLeadStage, deleteLead, type Lead, type LeadStage } from '../services/leadsService';

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'new', label: 'New Lead', color: 'bg-blue-500' },
  { key: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
  { key: 'estimate_sent', label: 'Estimate Sent', color: 'bg-purple-500' },
  { key: 'won', label: 'Won ✓', color: 'bg-green-500' },
  { key: 'lost', label: 'Lost', color: 'bg-red-500' },
];

const STAGE_ORDER: LeadStage[] = ['new', 'contacted', 'estimate_sent', 'won', 'lost'];

const LeadCard: React.FC<{
  lead: Lead;
  onStageChange: (lead: Lead, newStage: LeadStage) => void;
  onDelete: (leadId: string) => void;
}> = ({ lead, onStageChange, onDelete }) => {
  const currentIdx = STAGE_ORDER.indexOf(lead.stage);
  const canAdvance = currentIdx < STAGE_ORDER.length - 2; // not won or lost
  const nextStage = canAdvance ? STAGE_ORDER[currentIdx + 1] : null;

  return (
    <div className="bg-base-100 rounded-lg p-4 border border-base-300 mb-3">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-semibold text-content-100 text-sm">{lead.name || lead.business_name || 'Unknown Lead'}</p>
          {lead.city && <p className="text-content-200 text-xs">{lead.city}{lead.state ? `, ${lead.state}` : ''}</p>}
        </div>
        {lead.estimated_value && (
          <span className="text-green-400 text-xs font-bold">${lead.estimated_value.toLocaleString()}</span>
        )}
      </div>

      <div className="flex gap-1 flex-wrap mb-2">
        <span className="bg-base-300 text-content-200 text-xs px-2 py-0.5 rounded-full capitalize">{lead.service_type}</span>
        {lead.urgency && (
          <span className="bg-base-300 text-content-200 text-xs px-2 py-0.5 rounded-full">Urgency: {lead.urgency}/5</span>
        )}
      </div>

      {lead.notes && (
        <p className="text-content-200 text-xs mb-3 line-clamp-2">{lead.notes}</p>
      )}

      <div className="flex gap-2 mt-2">
        {nextStage && (
          <button
            onClick={() => onStageChange(lead, nextStage)}
            className="flex-1 text-xs bg-brand-primary hover:bg-brand-primary/80 text-white py-1.5 px-2 rounded transition-colors"
          >
            → {STAGES.find(s => s.key === nextStage)?.label}
          </button>
        )}
        {lead.stage !== 'lost' && (
          <button
            onClick={() => onStageChange(lead, 'lost')}
            className="text-xs bg-base-300 hover:bg-red-900/30 text-content-200 hover:text-red-400 py-1.5 px-2 rounded transition-colors"
          >
            Lost
          </button>
        )}
        <button
          onClick={() => onDelete(lead.id)}
          className="text-xs text-content-200 hover:text-red-400 py-1.5 px-2 rounded transition-colors"
          title="Delete lead"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const Pipeline: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = async () => {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const handleStageChange = async (lead: Lead, newStage: LeadStage) => {
    try {
      await updateLeadStage(lead.id, newStage, lead.stage);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: newStage } : l));
    } catch (err: any) {
      alert('Failed to update lead: ' + err.message);
    }
  };

  const handleDelete = async (leadId: string) => {
    if (!confirm('Delete this lead?')) return;
    try {
      await deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (err: any) {
      alert('Failed to delete lead: ' + err.message);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-content-200">Loading pipeline...</div>
    </div>
  );

  if (error) return <div className="text-red-400 p-4">{error}</div>;

  const totalValue = leads
    .filter(l => l.stage !== 'lost')
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  const wonValue = leads
    .filter(l => l.stage === 'won')
    .reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-content-100">Pipeline</h2>
          <p className="text-content-200 text-sm">{leads.length} leads · ${totalValue.toLocaleString()} pipeline value</p>
        </div>
        {wonValue > 0 && (
          <div className="text-right">
            <p className="text-green-400 font-bold">${wonValue.toLocaleString()}</p>
            <p className="text-content-200 text-xs">Won</p>
          </div>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-16 text-content-200">
          <p className="text-lg mb-2">No leads yet</p>
          <p className="text-sm">Use Lead Finder to find potential clients, then save them here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {STAGES.map(stage => {
            const stageLeads = leads.filter(l => l.stage === stage.key);
            return (
              <div key={stage.key}>
                <div className={`${stage.color} text-white text-xs font-bold px-3 py-1.5 rounded-t-lg`}>
                  {stage.label} ({stageLeads.length})
                </div>
                <div className="bg-base-200 rounded-b-lg p-3 min-h-[200px] border border-base-300">
                  {stageLeads.length === 0 ? (
                    <p className="text-content-200 text-xs text-center mt-8">Empty</p>
                  ) : (
                    stageLeads.map(lead => (
                      <LeadCard
                        key={lead.id}
                        lead={lead}
                        onStageChange={handleStageChange}
                        onDelete={handleDelete}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Pipeline;
