// components/Pipeline.tsx
// CRM Pipeline view — polished with better mobile layout

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
      className="bg-[#1f2937] rounded-xl p-4 border border-[#374151] mb-3 cursor-pointer hover:border-[#1E40AF]/60 transition-all group"
      onClick={() => onClick(lead)}
    >
      {/* Name + value */}
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#d1d5db] text-sm truncate group-hover:text-[#3b82f6] transition-colors">
            {lead.name || lead.business_name || 'Unknown Lead'}
          </p>
          {lead.city && (
            <p className="text-[#6b7280] text-xs mt-0.5">{lead.city}{lead.state ? `, ${lead.state}` : ''}</p>
          )}
        </div>
        {lead.estimated_value ? (
          <span className="text-green-400 text-xs font-bold shrink-0 tabular-nums">
            ${lead.estimated_value.toLocaleString()}
          </span>
        ) : null}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {lead.service_type && (
          <span className="bg-[#374151] text-[#9ca3af] text-xs px-2 py-0.5 rounded-full capitalize">
            {lead.service_type}
          </span>
        )}
        {lead.urgency && (
          <span className="bg-[#374151] text-[#9ca3af] text-xs px-2 py-0.5 rounded-full">
            Urgency: {lead.urgency}/5
          </span>
        )}
        {lead.phone && (
          <span className="bg-[#374151] text-[#9ca3af] text-xs px-2 py-0.5 rounded-full">📞</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2" onClick={e => e.stopPropagation()}>
        {nextStage && (
          <button
            onClick={() => onStageChange(lead, nextStage)}
            className="flex-1 text-xs bg-[#1E40AF] hover:bg-[#2563eb] text-white py-2 px-2 rounded-lg transition-colors font-medium"
          >
            → {STAGES.find(s => s.key === nextStage)?.label}
          </button>
        )}
        {lead.stage !== 'lost' && (
          <button
            onClick={() => onStageChange(lead, 'lost')}
            className="text-xs bg-[#374151] hover:bg-red-900/30 text-[#9ca3af] hover:text-red-400 py-2 px-2 rounded-lg transition-colors"
          >
            Lost
          </button>
        )}
        <button
          onClick={() => { if (confirm('Delete this lead?')) onDelete(lead.id); }}
          className="text-xs text-[#6b7280] hover:text-red-400 py-2 px-2 rounded-lg transition-colors"
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
      <div className="text-[#6b7280]">Loading pipeline...</div>
    </div>
  );

  if (error) return (
    <div className="text-red-400 p-4 bg-red-900/20 rounded-xl border border-red-500/30">
      {error}
    </div>
  );

  const activeLeads = leads.filter(l => l.stage !== 'lost');
  const totalValue = activeLeads.reduce((sum, l) => sum + (l.estimated_value || 0), 0);
  const wonValue = leads.filter(l => l.stage === 'won').reduce((sum, l) => sum + (l.estimated_value || 0), 0);

  return (
    <div>
      {/* Header stats */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#d1d5db]">Pipeline</h2>
          <p className="text-[#6b7280] text-sm">
            {leads.length} leads
            {totalValue > 0 && <span className="ml-1">· <span className="text-[#d1d5db]">${totalValue.toLocaleString()}</span> active value</span>}
          </p>
        </div>
        {wonValue > 0 && (
          <div className="text-left sm:text-right">
            <p className="text-green-400 font-bold text-lg">${wonValue.toLocaleString()}</p>
            <p className="text-[#6b7280] text-xs">Won Revenue</p>
          </div>
        )}
      </div>

      {leads.length === 0 ? (
        <div className="text-center py-20 text-[#6b7280]">
          <p className="text-5xl mb-4">🎯</p>
          <p className="text-lg font-semibold text-[#9ca3af] mb-2">No leads yet</p>
          <p className="text-sm max-w-sm mx-auto">
            Use Lead Finder or Qualifier to discover clients, then save them here.
          </p>
        </div>
      ) : (
        /* Pipeline columns — horizontal scroll on mobile */
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-3 min-w-max md:min-w-0"
            style={{ width: 'max-content' }}>
            {STAGES.map(stage => {
              const stageLeads = leads.filter(l => l.stage === stage.key);
              return (
                <div key={stage.key} className="w-64 md:w-auto md:min-w-0 flex-shrink-0">
                  {/* Column header */}
                  <div className={`${stage.color} text-white text-xs font-bold px-3 py-2 rounded-t-xl flex items-center justify-between`}>
                    <span>{stage.label}</span>
                    <span className="bg-white/20 text-white/90 text-xs font-bold px-1.5 py-0.5 rounded-full">
                      {stageLeads.length}
                    </span>
                  </div>
                  {/* Column body */}
                  <div className="bg-[#1f2937] rounded-b-xl p-3 min-h-[220px] border border-[#374151] border-t-0">
                    {stageLeads.length === 0 ? (
                      <p className="text-[#6b7280] text-xs text-center mt-8">Empty</p>
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
