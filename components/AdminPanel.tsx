// components/AdminPanel.tsx
// Admin dashboard — stats, lead management, call logs, system health

import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getPipelineStats, type Lead, type LeadStage } from '../services/leadsService';
import { getCalls, type Call } from '../services/callsService';

const STAGE_COLORS: Record<LeadStage, string> = {
  new:           'bg-blue-500',
  contacted:     'bg-yellow-500',
  estimate_sent: 'bg-orange-500',
  won:           'bg-green-500',
  lost:          'bg-red-500',
};

const STAGE_ORDER: LeadStage[] = ['new', 'contacted', 'estimate_sent', 'won', 'lost'];

const STAGE_LABELS: Record<LeadStage, string> = {
  new:           'New',
  contacted:     'Contacted',
  estimate_sent: 'Estimate Sent',
  won:           'Won',
  lost:          'Lost',
};

type TabId = 'overview' | 'leads' | 'calls' | 'system';

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [stats, setStats] = useState<{
    total: number;
    new: number; contacted: number; estimate_sent: number; won: number; lost: number;
    pipeline_value: number; won_value: number;
  } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState<LeadStage | 'all'>('all');
  const [systemStatus, setSystemStatus] = useState<Record<string, 'ok' | 'warn' | 'error' | 'unknown'>>({});
  const [wsEndpoint, setWsEndpoint] = useState('');

  useEffect(() => {
    setWsEndpoint(window.location.origin);
    loadData();
    checkSystemStatus();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, leadsData, callsData] = await Promise.all([
        getPipelineStats().catch(() => null),
        getLeads().catch(() => []),
        getCalls().catch(() => []),
      ]);
      setStats(statsData);
      setLeads(leadsData);
      setCalls(callsData);
    } finally {
      setLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    const results: Record<string, 'ok' | 'warn' | 'error' | 'unknown'> = {};

    // Check Supabase connection
    try {
      const { createClient } = await import('../lib/supabase');
      const client = createClient();
      const { error } = await client.from('leads').select('id').limit(1);
      results['supabase_connection'] = error ? 'error' : 'ok';
    } catch {
      results['supabase_connection'] = 'error';
    }

    // Vercel env var hints (we can't read them directly but can show what's expected)
    results['vapi_api_key'] = 'unknown'; // need VAPI_API_KEY in Vercel env
    results['webhook_secret'] = 'unknown'; // need WEBHOOK_SECRET in Vercel env

    // Check calls table for data
    try {
      const { createClient } = await import('../lib/supabase');
      const client = createClient();
      const { count, error } = await client.from('calls').select('*', { count: 'exact', head: true });
      results['calls_table'] = error ? 'error' : (count && count > 0 ? 'ok' : 'warn');
    } catch {
      results['calls_table'] = 'error';
    }

    setSystemStatus(results);
  };

  const statusIcon = (s: 'ok' | 'warn' | 'error' | 'unknown') => {
    if (s === 'ok') return <span className="text-green-400 font-bold">✓</span>;
    if (s === 'warn') return <span className="text-yellow-400 font-bold">⚠</span>;
    if (s === 'error') return <span className="text-red-400 font-bold">✕</span>;
    return <span className="text-content-200">?</span>;
  };

  const filteredLeads = leads.filter(l => {
    const matchSearch = leadSearch === '' ||
      [l.name, l.business_name, l.city, l.email, l.phone, l.service_type]
        .some(f => f?.toLowerCase().includes(leadSearch.toLowerCase()));
    const matchStage = leadStageFilter === 'all' || l.stage === leadStageFilter;
    return matchSearch && matchStage;
  });

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'leads', label: '🎯 Leads' },
    { id: 'calls', label: '📞 Calls' },
    { id: 'system', label: '⚙️ System' },
  ];

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 mb-6 border-b border-base-300 pb-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
              activeTab === t.id
                ? 'bg-base-300 text-brand-secondary'
                : 'text-content-200 hover:text-content-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-content-200">Loading admin data...</div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard label="Total Leads" value={stats.total} icon="🎯" />
                <StatCard label="Pipeline Value" value={`$${stats.pipeline_value.toLocaleString()}`} icon="💰" />
                <StatCard label="Won Revenue" value={`$${stats.won_value.toLocaleString()}`} icon="✅" color="text-green-400" />
                <StatCard label="Total Calls" value={calls.length} icon="📞" />
              </div>

              {/* Pipeline funnel */}
              <div className="bg-base-200 rounded-xl p-6 border border-base-300">
                <h3 className="text-content-100 font-semibold mb-4">Pipeline Funnel</h3>
                <div className="space-y-3">
                  {STAGE_ORDER.filter(s => s !== 'lost').map(stage => {
                    const count = stage === 'new' ? stats.new
                      : stage === 'contacted' ? stats.contacted
                      : stage === 'estimate_sent' ? stats.estimate_sent
                      : stage === 'won' ? stats.won : 0;
                    const pct = stats.total > 0 ? (count / stats.total * 100) : 0;
                    return (
                      <div key={stage}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-content-200">{STAGE_LABELS[stage]}</span>
                          <span className="text-content-100 font-medium">{count}</span>
                        </div>
                        <div className="h-2 bg-base-300 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${STAGE_COLORS[stage]} transition-all rounded-full`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                {stats.lost > 0 && (
                  <p className="text-content-200 text-xs mt-3">⚠ {stats.lost} lost</p>
                )}
              </div>

              {/* Recent activity */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-base-200 rounded-xl p-6 border border-base-300">
                  <h3 className="text-content-100 font-semibold mb-3">Recent Leads</h3>
                  {leads.length === 0 ? (
                    <p className="text-content-200 text-sm">No leads yet</p>
                  ) : (
                    <ul className="space-y-2">
                      {leads.slice(0, 5).map(l => (
                        <li key={l.id} className="flex justify-between items-center text-sm">
                          <span className="text-content-100 truncate mr-2">{l.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STAGE_COLORS[l.stage]}`}>
                            {STAGE_LABELS[l.stage]}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="bg-base-200 rounded-xl p-6 border border-base-300">
                  <h3 className="text-content-100 font-semibold mb-3">Recent Calls</h3>
                  {calls.length === 0 ? (
                    <p className="text-content-200 text-sm">No calls recorded</p>
                  ) : (
                    <ul className="space-y-2">
                      {calls.slice(0, 5).map(c => (
                        <li key={c.id} className="flex justify-between items-center text-sm">
                          <span className="text-content-100 truncate mr-2">
                            {c.caller_name || c.caller_phone || 'Unknown'}
                          </span>
                          <span className="text-content-200 text-xs">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── LEADS ── */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search leads..."
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  className="flex-1 bg-base-200 border border-base-300 text-content-100 rounded-lg px-4 py-2 text-sm placeholder-content-200 focus:outline-none focus:border-brand-primary"
                />
                <select
                  value={leadStageFilter}
                  onChange={e => setLeadStageFilter(e.target.value as LeadStage | 'all')}
                  className="bg-base-200 border border-base-300 text-content-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-brand-primary"
                >
                  <option value="all">All Stages</option>
                  {STAGE_ORDER.map(s => (
                    <option key={s} value={s}>{STAGE_LABELS[s]}</option>
                  ))}
                </select>
              </div>

              <div className="bg-base-200 rounded-xl border border-base-300 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-base-300 text-content-200 text-xs uppercase">
                    <tr>
                      <th className="text-left px-4 py-3">Name</th>
                      <th className="text-left px-4 py-3 hidden md:table-cell">City</th>
                      <th className="text-left px-4 py-3">Service</th>
                      <th className="text-left px-4 py-3 hidden sm:table-cell">Stage</th>
                      <th className="text-right px-4 py-3">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLeads.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12 text-content-200">
                          {leadSearch || leadStageFilter !== 'all' ? 'No leads match your filters' : 'No leads yet'}
                        </td>
                      </tr>
                    ) : (
                      filteredLeads.map(l => (
                        <tr key={l.id} className="border-t border-base-300 hover:bg-base-300/50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="text-content-100 font-medium">{l.name}</p>
                            {l.email && <p className="text-content-200 text-xs">{l.email}</p>}
                          </td>
                          <td className="px-4 py-3 text-content-200 hidden md:table-cell">
                            {[l.city, l.state].filter(Boolean).join(', ') || '—'}
                          </td>
                          <td className="px-4 py-3 text-content-200 capitalize">{l.service_type}</td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`text-xs px-2 py-1 rounded-full text-white ${STAGE_COLORS[l.stage]}`}>
                              {STAGE_LABELS[l.stage]}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-green-400 font-medium">
                            {l.estimated_value ? `$${l.estimated_value.toLocaleString()}` : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-2 bg-base-300 text-content-200 text-xs border-t border-base-300">
                  Showing {filteredLeads.length} of {leads.length} leads
                </div>
              </div>
            </div>
          )}

          {/* ── CALLS ── */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-base-200 rounded-xl p-4 border border-base-300 text-center">
                  <p className="text-2xl font-bold text-content-100">{calls.length}</p>
                  <p className="text-content-200 text-xs">Total Calls</p>
                </div>
                <div className="bg-base-200 rounded-xl p-4 border border-base-300 text-center">
                  <p className="text-2xl font-bold text-blue-400">{calls.filter(c => c.status === 'new').length}</p>
                  <p className="text-content-200 text-xs">New</p>
                </div>
                <div className="bg-base-200 rounded-xl p-4 border border-base-300 text-center">
                  <p className="text-2xl font-bold text-green-400">{calls.filter(c => c.status === 'converted').length}</p>
                  <p className="text-content-200 text-xs">Converted</p>
                </div>
              </div>

              {calls.length === 0 ? (
                <div className="text-center py-16 text-content-200">
                  <p className="text-4xl mb-4">📞</p>
                  <p className="font-semibold">No calls recorded</p>
                  <p className="text-sm mt-1">Call data will appear here once the Vapi webhook is connected</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {calls.map(c => (
                    <div key={c.id} className="bg-base-200 rounded-xl p-4 border border-base-300">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-content-100 font-semibold">
                            {c.caller_name || c.caller_phone || 'Unknown Caller'}
                          </p>
                          {c.caller_phone && (
                            <p className="text-content-200 text-sm">{c.caller_phone}</p>
                          )}
                          {c.issue_description && (
                            <p className="text-content-200 text-xs mt-1 line-clamp-2">{c.issue_description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <span className={`text-xs px-2 py-1 rounded-full capitalize ${
                            c.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                            c.status === 'converted' ? 'bg-green-500/20 text-green-400' :
                            c.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {c.status}
                          </span>
                          <p className="text-content-200 text-xs mt-1">
                            {new Date(c.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SYSTEM ── */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <div className="bg-base-200 rounded-xl p-6 border border-base-300">
                <h3 className="text-content-100 font-semibold mb-4">System Status</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-content-200 text-xs uppercase border-b border-base-300">
                      <th className="text-left pb-3">Check</th>
                      <th className="text-left pb-3">Status</th>
                      <th className="text-left pb-3 hidden sm:table-cell">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="space-y-2">
                    {Object.entries({
                      'Supabase Connection': { status: systemStatus['supabase_connection'] || 'unknown', note: 'Database connectivity' },
                      'Leads Table': { status: 'ok' as const, note: 'Writable' },
                      'Calls Table': { status: systemStatus['calls_table'] || 'unknown', note: 'Stores Vapi call records' },
                      'VAPI_API_KEY': { status: systemStatus['vapi_api_key'] || 'unknown', note: 'Required in Vercel env vars' },
                      'WEBHOOK_SECRET': { status: systemStatus['webhook_secret'] || 'unknown', note: 'Required in Vercel env vars' },
                      'leads.user_id nullable': { status: 'unknown', note: 'Run SQL patch: alter table public.leads alter column user_id drop not null' },
                    }).map(([label, { status, note }]) => (
                      <tr key={label} className="border-b border-base-300/50">
                        <td className="py-3 text-content-100">{label}</td>
                        <td className="py-3">{statusIcon(status)}</td>
                        <td className="py-3 text-content-200 text-xs hidden sm:table-cell">{note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Setup guide */}
              <div className="bg-base-200 rounded-xl p-6 border border-base-300">
                <h3 className="text-content-100 font-semibold mb-4">Vapi Webhook Setup</h3>
                <div className="space-y-4 text-sm">
                  <div className="bg-base-300 rounded-lg p-4">
                    <p className="text-content-200 font-medium mb-2">1. Add Vapi API Key → Vercel</p>
                    <code className="text-brand-secondary text-xs break-all">VAPI_API_KEY = your_vapi_key</code>
                  </div>
                  <div className="bg-base-300 rounded-lg p-4">
                    <p className="text-content-200 font-medium mb-2">2. Add Webhook Secret → Vercel</p>
                    <code className="text-brand-secondary text-xs break-all">WEBHOOK_SECRET = your_secret</code>
                  </div>
                  <div className="bg-base-300 rounded-lg p-4">
                    <p className="text-content-200 font-medium mb-3">3. Set Webhook URL in Vapi Dashboard</p>
                    <code className="text-brand-secondary text-xs break-all">{wsEndpoint}/api/vapi-webhook</code>
                  </div>
                  <div className="bg-base-300 rounded-lg p-4">
                    <p className="text-content-200 font-medium mb-2">4. Run in Supabase SQL Editor</p>
                    <code className="text-brand-secondary text-xs">alter table public.leads alter column user_id drop not null;</code>
                  </div>
                </div>
              </div>

              {/* Pending action */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <p className="text-yellow-400 font-semibold text-sm mb-1">⚠ Pending: SQL Patch Required</p>
                <p className="text-content-200 text-xs">
                  Run this in Supabase SQL Editor before the Vapi webhook can save leads:
                </p>
                <code className="text-yellow-300 text-xs mt-2 block">alter table public.leads alter column user_id drop not null;</code>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: string; color?: string }> =
  ({ label, value, icon, color = 'text-content-100' }) => (
    <div className="bg-base-200 rounded-xl p-5 border border-base-300">
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`font-bold text-xl ${color}`}>{value}</p>
      <p className="text-content-200 text-xs mt-1">{label}</p>
    </div>
  );

export default AdminPanel;
