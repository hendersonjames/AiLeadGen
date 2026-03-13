// components/Calls.tsx
// AI Phone Receptionist — view call logs and manage inbound calls

import React, { useEffect, useState } from 'react';
import { getCalls, updateCallStatus, formatDuration, type Call } from '../services/callsService';

const URGENCY_STYLES = {
  emergency: 'bg-red-500/20 text-red-400 border-red-500/40',
  high:      'bg-orange-500/20 text-orange-400 border-orange-500/40',
  medium:    'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  low:       'bg-blue-500/20 text-blue-400 border-blue-500/40',
};

const STATUS_STYLES = {
  new:       'bg-blue-500/20 text-blue-400',
  contacted: 'bg-yellow-500/20 text-yellow-400',
  converted: 'bg-green-500/20 text-green-400',
  lost:      'bg-red-500/20 text-red-400',
};

const CallCard: React.FC<{ call: Call; onStatusChange: (id: string, status: Call['status']) => void }> = ({ call, onStatusChange }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-base-100 rounded-lg border border-base-300 mb-3 overflow-hidden">
      <div
        className="p-4 cursor-pointer hover:bg-base-300/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-semibold text-content-100">
                {call.caller_name || call.caller_phone || 'Unknown Caller'}
              </p>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${URGENCY_STYLES[call.urgency]}`}>
                {call.urgency}
              </span>
            </div>
            <p className="text-content-200 text-sm truncate">
              {call.issue_description || call.service_needed || 'No details captured'}
            </p>
            {call.address && (
              <p className="text-content-200 text-xs mt-0.5">📍 {call.address}</p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-content-200 text-xs">{formatDuration(call.duration_seconds)}</p>
            <p className="text-content-200 text-xs mt-1">
              {new Date(call.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-base-300 p-4 space-y-4">
          {/* Contact info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            {call.caller_phone && (
              <div>
                <p className="text-content-200 text-xs mb-0.5">Phone</p>
                <a href={`tel:${call.caller_phone}`} className="text-brand-secondary hover:underline">{call.caller_phone}</a>
              </div>
            )}
            {call.address && (
              <div>
                <p className="text-content-200 text-xs mb-0.5">Address</p>
                <p className="text-content-100">{call.address}</p>
              </div>
            )}
            {call.service_needed && (
              <div>
                <p className="text-content-200 text-xs mb-0.5">Service</p>
                <p className="text-content-100 capitalize">{call.service_needed}</p>
              </div>
            )}
          </div>

          {/* Transcript */}
          {call.transcript && (
            <div>
              <p className="text-content-200 text-xs mb-1">Call Transcript</p>
              <div className="bg-base-300 rounded-lg p-3 text-xs text-content-100 max-h-40 overflow-y-auto whitespace-pre-wrap">
                {call.transcript}
              </div>
            </div>
          )}

          {/* Recording */}
          {call.recording_url && (
            <div>
              <p className="text-content-200 text-xs mb-1">Recording</p>
              <audio controls src={call.recording_url} className="w-full h-8" />
            </div>
          )}

          {/* Status + actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {(['new', 'contacted', 'converted', 'lost'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => onStatusChange(call.id, s)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors capitalize ${
                    call.status === s
                      ? STATUS_STYLES[s]
                      : 'bg-base-300 text-content-200 hover:bg-base-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {call.caller_phone && (
              <a
                href={`tel:${call.caller_phone}`}
                className="text-xs bg-brand-primary hover:bg-brand-primary/80 text-white px-4 py-1.5 rounded-lg transition-colors"
              >
                📞 Call Back
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Calls: React.FC = () => {
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCalls()
      .then(setCalls)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (callId: string, status: Call['status']) => {
    await updateCallStatus(callId, status);
    setCalls(prev => prev.map(c => c.id === callId ? { ...c, status } : c));
  };

  const newCalls = calls.filter(c => c.status === 'new').length;
  const emergencies = calls.filter(c => c.urgency === 'emergency' || c.urgency === 'high').length;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-content-100">AI Receptionist</h2>
          <p className="text-content-200 text-sm">{calls.length} total calls · {newCalls} new</p>
        </div>
        {emergencies > 0 && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-lg px-3 py-2 text-right">
            <p className="text-red-400 font-bold text-sm">{emergencies} urgent</p>
            <p className="text-red-400/70 text-xs">needs callback</p>
          </div>
        )}
      </div>

      {/* Setup banner — shown until Vapi is connected */}
      <div className="bg-brand-primary/10 border border-brand-primary/30 rounded-lg p-4 mb-6">
        <p className="text-brand-secondary font-semibold text-sm mb-1">⚡ AI Phone Receptionist — Setup Required</p>
        <p className="text-content-200 text-xs">
          To activate: add your Vapi API key to Vercel environment variables as <code className="bg-base-300 px-1 rounded">VAPI_API_KEY</code>,
          then import <code className="bg-base-300 px-1 rounded">vapi-assistant-config.json</code> to your Vapi dashboard.
          The webhook URL is: <code className="bg-base-300 px-1 rounded">{window.location.origin}/api/vapi-webhook</code>
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-content-200">Loading calls...</div>
      ) : calls.length === 0 ? (
        <div className="text-center py-16 text-content-200">
          <p className="text-4xl mb-4">📞</p>
          <p className="text-lg font-semibold mb-2">No calls yet</p>
          <p className="text-sm">Once your AI receptionist is live, every inbound call will appear here automatically.</p>
        </div>
      ) : (
        calls.map(call => (
          <CallCard key={call.id} call={call} onStatusChange={handleStatusChange} />
        ))
      )}
    </div>
  );
};

export default Calls;
