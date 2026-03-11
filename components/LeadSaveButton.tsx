// components/LeadSaveButton.tsx
// Button to save a generated lead to the database

import React, { useState } from 'react';
import { saveLead, type CreateLeadInput } from '../services/leadsService';

interface LeadSaveButtonProps {
  leadData: CreateLeadInput;
  onSaved?: (leadId: string) => void;
}

const LeadSaveButton: React.FC<LeadSaveButtonProps> = ({ leadData, onSaved }) => {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const lead = await saveLead(leadData);
      setSaved(true);
      onSaved?.(lead.id);
    } catch (err: any) {
      setError(err.message || 'Failed to save lead');
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <span className="inline-flex items-center gap-1 text-green-400 text-sm font-semibold">
        ✓ Saved to Pipeline
      </span>
    );
  }

  return (
    <div>
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-green-600 hover:bg-green-500 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? 'Saving...' : '+ Save to Pipeline'}
      </button>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default LeadSaveButton;
