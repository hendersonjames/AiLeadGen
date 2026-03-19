// components/Pipeline.tsx
// CRM Pipeline view - shows leads by stage with clickable detail panel

import React, { useEffect, useState } from 'react';
import { getLeads, updateLeadStage, deleteLead, type Lead, type LeadStage } from '../services/leadsService';
import LeadDetail from './LeadDetail';

const STAGES: { key: LeadStage; label: string; color: string }[] = [
  { key: 'new',           label: 'New',           color: 'bg-blue-500' },
  { key: 'contacted',     label: 'Contacted',     color: 'bg-yellow-500' },
  { key: 'estimate_sent', label: 'Estimate Sent', color: 'bg-orange-500' },
  { key: 'won',           label: 'Won ✓',         color: 'bg-green-500' },
  { key: 'lost',          label: 'Lost',          color: 'bg-red-500' },
];

const STAGE_ORDER: LeadStage[] = ['new', 'contacted', 'estimate_sent', 'won', 'lost'];

const LeadCard: React.FC<{
  lead: Lead;
  onClick: (lead: Lead) => void;
  onStageChange: (lead: Lead, newStage: LeadStage) => void;
  onDelete: (leadId: string) => void;
}> = ({ lead, onClick, onStageChange, onDelete }) => {
  const currentIdx = STAGE_ORDER.indexOf(lead.stage);
  const canAdvance = currentIdx < STAGE_ORDER.length - 2;
  const nextStage = canAdvance ? STAGE_ORDER[currentIdx + 1] : null;

  return (
    <div
      className="bg-base-100 rounded-lg p-4 border border-base-300 mb-3 cursor-pointer hover:border-brand-primary/50 transition-colors group"
      onClick={() => onClick(lead)}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 mr-2">
          <p className="font-semibold text-content-100 text-sm truncate group-hover:text-brand-secondary transition-colors">
            {lead.name || lead.business_name || 'Unknown Lead'}
          </p>
          {lead.city && (
            <p className="text-content-200 text-xs">{lead.city}{lead.state ? `, ${lead.state}` : ''}</p>
          )}
        </div>
        {lead.estimated_value && (
          <span className="text-green-400 text-xs font-bold shrink-0">${lead.estimated_value.toLocaleString()}</span>
        )}
      </div>

      <div className="flex gap-1 flex-wrap mb-3">
        <span className="bg-base-300 text-content-200 text-xs px-2 py-0.5 rounded-full capitalize">
          {lead.service_type}
        </span>
        {lead.urgency && (
          <span className="bg-base-300 text-content-200 text-xs px-2 py-0.5 rounded-full">
            Urgency: {lead.urgency}/5
          </span>
        )}
        {lead.phone && (
          <span className="bg-base-300 text-content-200 text-xs px-2 py-0.5 rounded-full">📞</span>
        )}
      </div>

      <div className="flex gap-2 mt-1" onClick={e => e.stopPropagation()}>
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
          onClick={() => { if (confirm('Delete this lead?')) onDelete(lead.id); }}
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
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

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

  useEffect(() => { loadLeads(); }, []);

  const handleStageChange = async (lead: Lead, newStage: LeadStage) => {
    try {
      await updateLeadStage(lead.id, newStage, lead.stage);
      setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, stage: newStage } : l));
      if (selectedLead?.id === lead.id) {
        setSelectedLead(prev => prev ? { ...prev, stage: newStage } : prev);
      }
    } catch (err: any) {
      alert('Failed to update lead: ' + err.message);
    }
  };

  const handleDelete = async (leadId: string) => {
    try {
      await deleteLead(leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
      if (selectedLead?.id === leadId) setSelectedLead(null);
    } catch (err: any) {
      alert('Failed to delete lead: ' + err.message);
    }
  };

  const handleLeadUpdate = (updated: Lead) => {
    setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
    setSelectedLead(updated);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="text-content-200">Loading pipeline...</div>
    </div>
  );

  if (error) return <div className="text-red-400 p-4">{error}</div>;

  const activeLeads = leads.filter(l => l.stage !== 'lost');
  const totalValue = activeLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const wonValue = leads.filter(l => l.stage === 'won').reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  return (
    <div>
      {/* Header stats */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-content-100">Pipeline</h2>
          <p className="text-content-200 text-sm">{leads.length} leads · ${totalValue.toLocaleString()} active value</p>
        </div>
        {wonValue > 0 && (
          <div className="text-right">
            <p className="text-green-400 font-bold text-lg">${wonValue.toLocaleString()}</p>
            <p className="text-content-200 text-xs">Won</p>
          </div>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-16 text-content-200">
          <p className="text-lg mb-2">No leads yet</p>
          <p className="text-sm">Use Lead Finder or Qualifier to find clients, then save them here.</p>
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
                        onClick={setSelectedLead}
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

      {/* Lead detail panel */}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStageChange={handleStageChange}
          onLeadUpdate={handleLeadUpdate}
        />
      )}
    </div>
  );
};

export default Pipeline;
