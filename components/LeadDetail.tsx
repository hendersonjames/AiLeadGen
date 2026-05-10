// components/LeadDetail.tsx
// Lead detail panel — polished with better mobile UX

import React, { useState } from 'react';
import { updateLeadStage, updateLead, addLeadNote, type Lead, type LeadStage } from '../services/leadsService';

declare const marked: any;

const STAGES: { key: LeadStage; label: string; color: string; bg: string }[] = [
  { key: 'new',           label: 'New',           color: 'text-blue-400',   bg: 'bg-blue-500/20 border-blue-500/40' },
  { key: 'contacted',     label: 'Contacted',     color: 'text-yellow-400', bg: 'bg-yellow-500/20 border-yellow-500/40' },
  { key: 'estimate_sent', label: 'Estimate Sent', color: 'text-orange-400', bg: 'bg-orange-500/20 border-orange-500/40' },
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
      const updatedNotes = lead.notes
        ? `${lead.notes}\n\n[${new Date().toLocaleDateString()}] ${note.trim()}`
        : `[${new Date().toLocaleDateString()}] ${note.trim()}`;
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

  const EditableField: React.FC<{ label: string; field: string; value?: string; placeholder?: string }> =
    ({ label, field, value, placeholder }) => {
      if (editingField === field) {
        return (
          <div className="mb-4">
            <label className="text-xs text-[#6b7280] mb-1.5 block font-medium">{label}</label>
            <div className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={fieldValue}
                onChange={e => setFieldValue(e.target.value)}
                className="flex-1 bg-[#374151] border border-[#1E40AF] text-[#d1d5db] rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E40AF]"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleEditField(field, fieldValue);
                  if (e.key === 'Escape') setEditingField(null);
                }}
              />
              <button
                onClick={() => handleEditField(field, fieldValue)}
                className="bg-[#1E40AF] hover:bg-[#2563eb] text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                Save
              </button>
              <button
                onClick={() => setEditingField(null)}
                className="text-[#6b7280] hover:text-[#9ca3af] px-2 py-2 text-sm transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
          </div>
        );
      }
      return (
        <div className="mb-4">
          <label className="text-xs text-[#6b7280] mb-1 block font-medium">{label}</label>
          <button
            onClick={() => { setEditingField(field); setFieldValue(value || ''); }}
            className="text-sm text-[#d1d5db] hover:text-[#3b82f6] text-left w-full group flex items-center gap-1.5 py-1"
          >
            {value ? (
              <span className="break-all">{value}</span>
            ) : (
              <span className="text-[#6b7280] italic">{placeholder || 'Click to add'}</span>
            )}
            <span className="opacity-0 group-hover:opacity-100 text-xs text-[#6b7280] transition-opacity shrink-0">✏️</span>
          </button>
        </div>
      );
    };

  return (
    /* Overlay */
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-[#1f2937] w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-2xl flex flex-col overflow-hidden border border-[#374151] shadow-[0_25px_60px_-12px_rgba(0,0,0,0.8)]">

        {/* Top color bar */}
        <div className="h-1 flex-shrink-0"
          style={{ background: 'linear-gradient(to right, #00aeef, #1c4a9a, #f7941d, #d9531e)' }} />

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-[#374151] flex-shrink-0 gap-3">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-[#d1d5db] truncate">
              {lead.name || lead.business_name || 'Unknown Lead'}
            </h2>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${currentStage.bg} ${currentStage.color}`}>
                {currentStage.label}
              </span>
              {lead.city && (
                <span className="text-xs text-[#6b7280]">{lead.city}{lead.state ? `, ${lead.state}` : ''}</span>
              )}
              {lead.estimated_value && (
                <span className="text-xs text-green-400 font-bold tabular-nums">
                  ${lead.estimated_value.toLocaleString()}
                </span>
              )}
            </div>
          </div>
          {/* Close button — larger on mobile */}
          <button
            onClick={onClose}
            className="text-[#6b7280] hover:text-[#d1d5db] text-lg leading-none p-2 rounded-lg hover:bg-[#374151] transition-colors sm:text-xl sm:p-1 flex-shrink-0"
            aria-label="Close panel"
          >
            ✕
          </button>
        </div>

        {/* Stage selector — horizontal scroll on tiny screens */}
        <div className="px-5 py-3 border-b border-[#374151] flex-shrink-0 overflow-x-auto">
          <div className="flex gap-2 w-max sm:w-auto">
            {STAGES.map(stage => (
              <button
                key={stage.key}
                onClick={() => handleStageChange(stage.key)}
                disabled={movingStage !== null}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all whitespace-nowrap ${
                  lead.stage === stage.key
                    ? `${stage.bg} ${stage.color} border-current`
                    : 'border-[#374151] text-[#6b7280] hover:border-[#6b7280]'
                }`}
              >
                {movingStage === stage.key ? '...' : stage.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#374151] px-3 sm:px-5 flex-shrink-0">
          {(['overview', 'report', 'notes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-sm py-3 px-3 sm:px-4 font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-[#1E40AF] text-[#3b82f6]'
                  : 'border-transparent text-[#6b7280] hover:text-[#9ca3af]'
              }`}
            >
              {tab === 'report' ? 'AI Report' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5">

          {/* ── Overview ── */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
              <EditableField label="Name" field="name" value={lead.name} placeholder="Add name" />
              <EditableField label="Phone" field="phone" value={lead.phone} placeholder="Add phone" />
              <EditableField label="Email" field="email" value={lead.email} placeholder="Add email" />
              <EditableField label="Business" field="business_name" value={lead.business_name} placeholder="Add business" />
              <EditableField label="Service Type" field="service_type" value={lead.service_type} />
              <EditableField label="City" field="city" value={lead.city} placeholder="Add city" />
              <EditableField label="State" field="state" value={lead.state} placeholder="Add state" />

              {/* Read-only extras */}
              {lead.estimated_value && (
                <div className="mb-4">
                  <label className="text-xs text-[#6b7280] mb-1 block font-medium">Est. Value</label>
                  <p className="text-green-400 font-bold text-base tabular-nums">${lead.estimated_value.toLocaleString()}</p>
                </div>
              )}
              {lead.urgency && (
                <div className="mb-4">
                  <label className="text-xs text-[#6b7280] mb-1 block font-medium">Urgency</label>
                  <div className="flex items-center gap-2 mt-0.5">
                    {[1,2,3,4,5].map(n => (
                      <div key={n} className={`w-4 h-4 rounded-full ${n <= lead.urgency! ? 'bg-[#1E40AF]' : 'bg-[#374151]'}`} />
                    ))}
                    <span className="text-[#9ca3af] text-xs ml-1">{lead.urgency}/5</span>
                  </div>
                </div>
              )}
              {lead.source && (
                <div className="mb-4">
                  <label className="text-xs text-[#6b7280] mb-1 block font-medium">Source</label>
                  <p className="text-[#9ca3af] text-sm capitalize">{lead.source.replace('_', ' ')}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="text-xs text-[#6b7280] mb-1 block font-medium">Added</label>
                <p className="text-[#9ca3af] text-sm">
                  {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}

          {/* ── AI Report ── */}
          {activeTab === 'report' && (
            <div>
              {lead.qualification_report ? (
                <div
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked.parse(lead.qualification_report) }}
                />
              ) : lead.raw_lead_text ? (
                <div
                  className="prose prose-invert prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: marked.parse(lead.raw_lead_text) }}
                />
              ) : (
                <div className="text-center py-12 text-[#6b7280]">
                  <p className="text-4xl mb-3">🤖</p>
                  <p className="font-medium text-[#9ca3af]">No AI report available</p>
                  <p className="text-sm mt-1">Use Lead Qualifier to generate an AI report for this lead.</p>
                </div>
              )}
            </div>
          )}

          {/* ── Notes ── */}
          {activeTab === 'notes' && (
            <div>
              {lead.notes ? (
                <div className="space-y-2 mb-5">
                  {lead.notes.split('\n\n').map((n, i) => (
                    <div key={i} className="bg-[#374151] rounded-xl p-3.5 text-sm text-[#d1d5db] leading-relaxed">
                      {n}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[#6b7280] text-sm mb-5 italic">No notes yet — add one below.</p>
              )}
              <div>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value)}
                  placeholder="Add a note about this lead..."
                  rows={3}
                  className="w-full bg-[#374151] border border-[#4b5563] text-[#d1d5db] rounded-xl p-3.5 text-sm placeholder-[#6b7280] focus:outline-none focus:ring-2 focus:ring-[#1E40AF] focus:border-[#1E40AF] resize-none"
                />
                <button
                  onClick={handleAddNote}
                  disabled={savingNote || !note.trim()}
                  className="mt-2.5 bg-[#1E40AF] hover:bg-[#2563eb] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
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
