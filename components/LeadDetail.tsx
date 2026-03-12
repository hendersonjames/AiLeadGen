// components/LeadDetail.tsx
// Full lead detail panel — view info, move stage, add notes

import React, { useState } from 'react';
import { updateLeadStage, updateLead, addLeadNote, type Lead, type LeadStage } from '../services/leadsService';

declare const marked: any;

const STAGES: { key: LeadStage; label: string; color: string; bg: string }[] = [
  { key: 'new',           label: 'New',           color: 'text-blue-400',   bg: 'bg-blue-500/20 border-blue-500/40' },
  { key: 'contacted',     label: 'Contacted',     color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40' },
  { key: 'estimate_sent', label: 'Estimate Sent', color: 'text-purple-400', bg: 'bg-purple-500/20 border-purple-500/40' },
  { key: 'won',           label: 'Won ✓',         color: 'text-green-400',  bg: 'bg-green-500/20 border-green-500/40' },
  { key: 'lost',          label: 'Lost',          color: 'text-red-400',    bg: 'bg-red-500/20 border-red-500/40' },
];

interface LeadDetailProps {
  lead: Lead;
  onClose: () => void;
  onStageChange: (lead: Lead, newStage: LeadStage) => void;
  onLeadUpdate: (lead: Lead) => void;
}

const LeadDetail: React.FC<LeadDetailProps> = ({ lead, onClose, onStageChange, onLeadUpdate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'report' | 'notes'>('overview');
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [movingStage, setMovingStage] = useState<LeadStage | null>(null);

  const currentStage = STAGES.find(s => s.key === lead.stage) || STAGES[0];

  const handleStageChange = async (newStage: LeadStage) => {
    if (newStage === lead.stage) return;
    setMovingStage(newStage);
    try {
      await updateLeadStage(lead.id, newStage, lead.stage);
      onStageChange({ ...lead, stage: newStage }, newStage);
    } catch (err: any) {
      alert('Failed to update stage: ' + err.message);
    } finally {
      setMovingStage(null);
    }
  };

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSavingNote(true);
    try {
      await addLeadNote(lead.id, note.trim());
      // Append note to lead's notes field locally
      const updatedNotes = lead.notes ? `${lead.notes}\n\n[${new Date().toLocaleDateString()}] ${note.trim()}` : `[${new Date().toLocaleDateString()}] ${note.trim()}`;
      await updateLead(lead.id, { notes: updatedNotes });
      onLeadUpdate({ ...lead, notes: updatedNotes });
      setNote('');
    } catch (err: any) {
      alert('Failed to save note: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  const handleEditField = async (field: string, value: string) => {
    try {
      const updated = await updateLead(lead.id, { [field]: value });
      onLeadUpdate(updated);
      setEditingField(null);
    } catch (err: any) {
      alert('Failed to update: ' + err.message);
    }
  };

  const EditableField: React.FC<{ label: string; field: string; value?: string; placeholder?: string }> = ({ label, field, value, placeholder }) => {
    if (editingField === field) {
      return (
        <div className="mb-3">
          <label className="text-xs text-content-200 mb-1 block">{label}</label>
          <div className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={fieldValue}
              onChange={e => setFieldValue(e.target.value)}
              className="flex-1 bg-base-300 border border-brand-primary text-content-100 rounded p-2 text-sm"
              onKeyDown={e => { if (e.key === 'Enter') handleEditField(field, fieldValue); if (e.key === 'Escape') setEditingField(null); }}
            />
            <button onClick={() => handleEditField(field, fieldValue)} className="text-xs bg-brand-primary text-white px-3 rounded">Save</button>
            <button onClick={() => setEditingField(null)} className="text-xs text-content-200 px-2">✕</button>
          </div>
        </div>
      );
    }
    return (
      <div className="mb-3">
        <label className="text-xs text-content-200 mb-0.5 block">{label}</label>
        <button
          onClick={() => { setEditingField(field); setFieldValue(value || ''); }}
          className="text-sm text-content-100 hover:text-brand-secondary text-left w-full group flex items-center gap-1"
        >
          {value || <span className="text-content-200 italic">{placeholder || 'Click to add'}</span>}
          <span className="opacity-0 group-hover:opacity-100 text-xs text-content-200 ml-1">✏️</span>
        </button>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-base-200 w-full max-w-2xl max-h-[90vh] rounded-t-2xl md:rounded-2xl flex flex-col overflow-hidden border border-base-300 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-base-300">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="text-lg font-bold text-content-100 truncate">{lead.name || lead.business_name || 'Unknown Lead'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${currentStage.bg} ${currentStage.color}`}>
                {currentStage.label}
              </span>
              {lead.city && <span className="text-xs text-content-200">{lead.city}{lead.state ? `, ${lead.state}` : ''}</span>}
            </div>
          </div>
          <button onClick={onClose} className="text-content-200 hover:text-content-100 text-xl leading-none p-1">✕</button>
        </div>

        {/* Stage selector */}
        <div className="px-5 py-3 border-b border-base-300 overflow-x-auto">
          <div className="flex gap-2 min-w-max">
            {STAGES.map(stage => (
              <button
                key={stage.key}
                onClick={() => handleStageChange(stage.key)}
                disabled={movingStage !== null}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                  lead.stage === stage.key
                    ? `${stage.bg} ${stage.color} border-current`
                    : 'border-base-300 text-content-200 hover:border-content-200'
                }`}
              >
                {movingStage === stage.key ? '...' : stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-base-300 px-5">
          {(['overview', 'report', 'notes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm py-3 px-4 font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-brand-primary text-brand-primary'
                  : 'border-transparent text-content-200 hover:text-content-100'
              }`}
            >
              {tab === 'report' ? 'AI Report' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-2 gap-x-6">
                <EditableField label="Name" field="name" value={lead.name} placeholder="Add name" />
                <EditableField label="Phone" field="phone" value={lead.phone} placeholder="Add phone" />
                <EditableField label="Email" field="email" value={lead.email} placeholder="Add email" />
                <EditableField label="Business" field="business_name" value={lead.business_name} placeholder="Add business name" />
                <EditableField label="Service Type" field="service_type" value={lead.service_type} />
                <EditableField label="City" field="city" value={lead.city} placeholder="Add city" />
                {lead.estimated_value && (
                  <div className="mb-3">
                    <label className="text-xs text-content-200 mb-0.5 block">Est. Value</label>
                    <p className="text-green-400 font-bold">${lead.estimated_value.toLocaleString()}</p>
                  </div>
                )}
                {lead.urgency && (
                  <div className="mb-3">
                    <label className="text-xs text-content-200 mb-0.5 block">Urgency</label>
                    <p className="text-content-100 text-sm">{lead.urgency}/5</p>
                  </div>
                )}
              </div>
              <div className="mt-2">
                <label className="text-xs text-content-200 mb-0.5 block">Source</label>
                <p className="text-content-100 text-sm capitalize">{lead.source?.replace('_', ' ')}</p>
              </div>
              <div className="mt-2">
                <label className="text-xs text-content-200 mb-0.5 block">Added</label>
                <p className="text-content-100 text-sm">{new Date(lead.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          )}

          {activeTab === 'report' && (
            <div>
              {lead.qualification_report ? (
                <div
                  className="prose prose-invert prose-sm prose-p:text-content-100 prose-headings:text-white"
                  dangerouslySetInnerHTML={{ __html: marked.parse(lead.qualification_report) }}
                />
              ) : lead.raw_lead_text ? (
                <div
                  className="prose prose-invert prose-sm prose-p:text-content-100 prose-headings:text-white"
                  dangerouslySetInnerHTML={{ __html: marked.parse(lead.raw_lead_text) }}
                />
              ) : (
                <p className="text-content-200 text-sm italic">No AI report available for this lead.</p>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              {lead.notes && (
                <div className="mb-4 space-y-2">
                  {lead.notes.split('\n\n').map((n, i) => (
                    <div key={i} className="bg-base-300 rounded-lg p-3 text-sm text-content-100">{n}</div>
                  ))}
                </div>
              )}
              <div className="mt-4">
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={3}
                  className="w-full bg-base-300 border border-base-300 text-content-100 rounded-lg p-3 text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !note.trim()}
                  className="mt-2 bg-brand-primary hover:bg-brand-primary/80 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-colors"
                >
                  {savingNote ? 'Saving...' : 'Add Note'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadDetail;
