// components/AdminPanel.tsx
// Admin dashboard — polished, with CSV export and time filter

import React, { useEffect, useState } from 'react';
import { getLeads, getPipelineStats, type Lead, type LeadStage } from '../services/leadsService';
import { getCalls, type Call } from '../services/callsService';

const STAGE_COLORS: Record<LeadStage, string> = {
  new:           'bg-blue-500',
  contacted:     'bg-yellow-500',
  estimate_sent: 'bg-orange-500',
  won:           'bg-green-500',
  lost:          'bg-red-500',
};

const STAGE_PILL: Record<LeadStage, string> = {
  new:           'bg-blue-500/20 text-blue-400 border-blue-500/40',
  contacted:     'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
  estimate_sent: 'bg-orange-500/20 text-orange-400 border-orange-500/40',
  won:           'bg-green-500/20 text-green-400 border-green-500/40',
  lost:          'bg-red-500/20 text-red-400 border-red-500/40',
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
type TimeRange = 'all' | '7d' | '30d';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

const formatCurrency = (n: number) => `$${n.toLocaleString()}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionCard: React.FC<{ title?: string; children: React.ReactNode; className?: string }> =
  ({ title, children, className = '' }) => (
    <div className={`bg-[#1f2937] rounded-2xl p-5 border border-[#374151] ${className}`}>
      {title && <h3 className="text-[#d1d5db] font-semibold text-base mb-4">{title}</h3>}
      {children}
    </div>
  );

// ─── Main component ────────────────────────────────────────────────────────────

const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [allStats, setAllStats] = useState<{
    total: number;
    new: number; contacted: number; estimate_sent: number; won: number; lost: number;
    pipeline_value: number; won_value: number;
  } | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadSearch, setLeadSearch] = useState('');
  const [leadStageFilter, setLeadStageFilter] = useState<LeadStage | 'all'>('all');
  const [timeRange, setTimeRange] = useState<TimeRange>('all');
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
        getLeads().catch(() => [] as Lead[]),
        getCalls().catch(() => [] as Call[]),
      ]);
      setAllStats(statsData);
      setLeads(leadsData);
      setCalls(callsData);
    } finally {
      setLoading(false);
    }
  };

  const checkSystemStatus = async () => {
    const results: Record<string, 'ok' | 'warn' | 'error' | 'unknown'> = {};
    try {
      const { createClient } = await import('../lib/supabase');
      const client = createClient();
      const { error } = await client.from('leads').select('id').limit(1);
      results['supabase_connection'] = error ? 'error' : 'ok';
    } catch { results['supabase_connection'] = 'error'; }

    results['vapi_api_key'] = 'unknown';
    results['webhook_secret'] = 'unknown';

    try {
      const { createClient } = await import('../lib/supabase');
      const client = createClient();
      const { count, error } = await client.from('calls').select('*', { count: 'exact', head: true });
      results['calls_table'] = error ? 'error' : (count && count > 0 ? 'ok' : 'warn');
    } catch { results['calls_table'] = 'error'; }

    setSystemStatus(results);
  };

  const statusIcon = (s: 'ok' | 'warn' | 'error' | 'unknown') => {
    if (s === 'ok') return <span className="text-green-400 font-bold text-sm">✓ OK</span>;
    if (s === 'warn') return <span className="text-yellow-400 font-bold text-sm">⚠ Warn</span>;
    if (s === 'error') return <span className="text-red-400 font-bold text-sm">✕ Error</span>;
    return <span className="text-[#6b7280] text-sm">— Unknown</span>;
  };

  // Filter leads by time range
  const filteredLeads = leads.filter(l => {
    if (timeRange === 'all') return true;
    const createdAt = new Date(l.created_at || 0);
    if (timeRange === '7d') return createdAt >= daysAgo(7);
    if (timeRange === '30d') return createdAt >= daysAgo(30);
    return true;
  }).filter(l => {
    const matchSearch = leadSearch === '' ||
      [l.name, l.business_name, l.city, l.email, l.phone, l.service_type]
        .some(f => f?.toLowerCase().includes(leadSearch.toLowerCase()));
    const matchStage = leadStageFilter === 'all' || l.stage === leadStageFilter;
    return matchSearch && matchStage;
  });

  // Time-filtered stats
  const stats = allStats; // For now, stats are always full — filter applies to table display

  // CSV export
  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Business', 'City', 'State', 'Service', 'Stage', 'Est. Value', 'Created'];
    const rows = filteredLeads.map(l => [
      l.name || '',
      l.email || '',
      l.phone || '',
      l.business_name || '',
      l.city || '',
      l.state || '',
      l.service_type || '',
      STAGE_LABELS[l.stage] || '',
      l.estimated_value || '',
      l.created_at ? new Date(l.created_at).toLocaleDateString() : '',
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leadhub-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'leads',    label: '🎯 Leads' },
    { id: 'calls',    label: '📞 Calls' },
    { id: 'system',   label: '⚙️ System' },
  ];

  return (
    <div>
      {/* Tab nav */}
      <div className="flex gap-1 mb-6 border-b border-[#374151] pb-1 overflow-x-auto">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all duration-150 whitespace-nowrap ${
              activeTab === t.id
                ? 'bg-[#374151] text-[#d1d5db] border-b-2 border-[#1E40AF]'
                : 'text-[#6b7280] hover:text-[#9ca3af]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-20 text-[#6b7280]">
          <div className="text-4xl mb-3 animate-pulse">⏳</div>
          <p>Loading admin data...</p>
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && stats && (
            <div className="space-y-6">
              {/* KPI grid with time filter */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[#9ca3af] text-sm font-medium">Key Metrics</h3>
                <div className="flex rounded-lg bg-[#374151] p-0.5 gap-0.5">
                  {([['all','All time'],['7d','Last 7d'],['30d','This month']] as [TimeRange, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setTimeRange(val)}
                      className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                        timeRange === val
                          ? 'bg-[#1E40AF] text-white'
                          : 'text-[#9ca3af] hover:text-[#d1d5db]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#1f2937] rounded-2xl p-5 border border-[#374151] hover:border-[#4b5563] transition-colors">
                  <div className="text-2xl mb-3">🎯</div>
                  <p className="font-bold text-2xl text-[#d1d5db] leading-none">{stats.total}</p>
                  <p className="text-[#6b7280] text-xs mt-2 font-medium">Total Leads</p>
                </div>
                <div className="bg-[#1f2937] rounded-2xl p-5 border border-[#374151] hover:border-[#4b5563] transition-colors">
                  <div className="text-2xl mb-3">💰</div>
                  <p className="font-bold text-2xl text-[#d1d5db] leading-none">{formatCurrency(stats.pipeline_value)}</p>
                  <p className="text-[#6b7280] text-xs mt-2 font-medium">Pipeline Value</p>
                </div>
                <div className="bg-[#1f2937] rounded-2xl p-5 border border-[#374151] hover:border-[#4b5563] transition-colors">
                  <div className="text-2xl mb-3">✅</div>
                  <p className="font-bold text-2xl text-green-400 leading-none">{formatCurrency(stats.won_value)}</p>
                  <p className="text-[#6b7280] text-xs mt-2 font-medium">Won Revenue</p>
                </div>
                <div className="bg-[#1f2937] rounded-2xl p-5 border border-[#374151] hover:border-[#4b5563] transition-colors">
                  <div className="text-2xl mb-3">📞</div>
                  <p className="font-bold text-2xl text-[#d1d5db] leading-none">{calls.length}</p>
                  <p className="text-[#6b7280] text-xs mt-2 font-medium">Total Calls</p>
                </div>
              </div>

              {/* Pipeline funnel + recent activity — 2-column */}
              <div className="grid md:grid-cols-2 gap-4">
                <SectionCard title="📈 Pipeline Funnel">
                  <div className="space-y-3">
                    {STAGE_ORDER.filter(s => s !== 'lost').map(stage => {
                      const count = stage === 'new' ? stats.new
                        : stage === 'contacted' ? stats.contacted
                        : stage === 'estimate_sent' ? stats.estimate_sent
                        : stats.won;
                      const pct = stats.total > 0 ? (count / stats.total * 100) : 0;
                      return (
                        <div key={stage}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-[#9ca3af]">{STAGE_LABELS[stage]}</span>
                            <span className="text-[#d1d5db] font-semibold">{count}</span>
                          </div>
                          <div className="h-2 bg-[#374151] rounded-full overflow-hidden">
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
                    <p className="text-[#6b7280] text-xs mt-3">⚠ {stats.lost} lost</p>
                  )}
                </SectionCard>

                <div className="space-y-4">
                  <SectionCard title="🆕 Recent Leads">
                    {leads.length === 0 ? (
                      <p className="text-[#6b7280] text-sm">No leads yet</p>
                    ) : (
                      <ul className="space-y-2">
                        {leads.slice(0, 5).map(l => (
                          <li key={l.id} className="flex justify-between items-center text-sm">
                            <span className="text-[#d1d5db] truncate mr-3 font-medium">{l.name || 'Unnamed'}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border shrink-0 ${STAGE_PILL[l.stage]}`}>
                              {STAGE_LABELS[l.stage]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </SectionCard>

                  <SectionCard title="📞 Recent Calls">
                    {calls.length === 0 ? (
                      <p className="text-[#6b7280] text-sm">No calls recorded</p>
                    ) : (
                      <ul className="space-y-2">
                        {calls.slice(0, 5).map(c => (
                          <li key={c.id} className="flex justify-between items-center text-sm">
                            <span className="text-[#d1d5db] truncate mr-3">
                              {c.caller_name || c.caller_phone || 'Unknown'}
                            </span>
                            <span className="text-[#6b7280] text-xs shrink-0">
                              {new Date(c.created_at).toLocaleDateString()}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </SectionCard>
                </div>
              </div>
            </div>
          )}

          {/* ── LEADS ── */}
          {activeTab === 'leads' && (
            <div className="space-y-4">
              {/* Toolbar: search + filter + export */}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Search by name, city, email, service..."
                  value={leadSearch}
                  onChange={e => setLeadSearch(e.target.value)}
                  className="flex-1 bg-[#1f2937] border border-[#374151] text-[#d1d5db] rounded-xl px-4 py-2.5 text-sm placeholder-[#6b7280] focus:outline-none focus:border-[#1E40AF] transition-colors"
                />
                <select
                  value={leadStageFilter}
                  onChange={e => setLeadStageFilter(e.target.value as LeadStage | 'all')}
                  className="bg-[#1f2937] border border-[#374151] text-[#d1d5db] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1E40AF] cursor-pointer"
                >
                  <option value="all">All Stages</option>
                  {STAGE_ORDER.map(s => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
                </select>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 bg-[#1f2937] border border-[#374151] text-[#d1d5db] rounded-xl px-4 py-2.5 text-sm hover:border-[#1E40AF] hover:text-[#d1d5db] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                  </svg>
                  Export CSV
                </button>
              </div>

              {/* Results summary */}
              <div className="flex items-center justify-between px-1">
                <p className="text-[#6b7280] text-xs">
                  Showing <span className="text-[#9ca3af] font-medium">{filteredLeads.length}</span> of {leads.length} leads
                </p>
                {(leadSearch || leadStageFilter !== 'all') && (
                  <button
                    onClick={() => { setLeadSearch(''); setLeadStageFilter('all'); }}
                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Clear filters ✕
                  </button>
                )}
              </div>

              {/* Table */}
              <div className="bg-[#1f2937] rounded-2xl border border-[#374151] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#374151] text-[#9ca3af] text-xs uppercase tracking-wider">
                        <th className="text-left px-5 py-3.5 font-semibold">Name</th>
                        <th className="text-left px-5 py-3.5 font-semibold hidden md:table-cell">Location</th>
                        <th className="text-left px-5 py-3.5 font-semibold hidden sm:table-cell">Service</th>
                        <th className="text-left px-5 py-3.5 font-semibold hidden sm:table-cell">Stage</th>
                        <th className="text-right px-5 py-3.5 font-semibold">Est. Value</th>
                        <th className="text-left px-5 py-3.5 font-semibold hidden lg:table-cell">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLeads.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-16 text-[#6b7280]">
                            {leadSearch || leadStageFilter !== 'all'
                              ? 'No leads match your filters'
                              : 'No leads yet — use Lead Finder or Qualifier to add some.'}
                          </td>
                        </tr>
                      ) : (
                        filteredLeads.map((l, i) => (
                          <tr key={l.id}
                            className={`border-t border-[#374151]/60 hover:bg-[#374151]/30 transition-colors ${i % 2 === 0 ? '' : 'bg-[#374151]/10'}`}>
                            <td className="px-5 py-3.5">
                              <p className="text-[#d1d5db] font-medium">{l.name || l.business_name || '—'}</p>
                              {l.email && <p className="text-[#6b7280] text-xs mt-0.5">{l.email}</p>}
                            </td>
                            <td className="px-5 py-3.5 text-[#9ca3af] hidden md:table-cell">
                              {[l.city, l.state].filter(Boolean).join(', ') || '—'}
                            </td>
                            <td className="px-5 py-3.5 text-[#9ca3af] hidden sm:table-cell capitalize">{l.service_type || '—'}</td>
                            <td className="px-5 py-3.5 hidden sm:table-cell">
                              <span className={`text-xs px-2.5 py-1 rounded-full border ${STAGE_PILL[l.stage]}`}>
                                {STAGE_LABELS[l.stage]}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right text-green-400 font-semibold tabular-nums">
                              {l.estimated_value ? `$${l.estimated_value.toLocaleString()}` : '—'}
                            </td>
                            <td className="px-5 py-3.5 text-[#6b7280] text-xs hidden lg:table-cell">
                              {l.created_at ? new Date(l.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ── CALLS ── */}
          {activeTab === 'calls' && (
            <div className="space-y-4">
              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Total Calls', value: calls.length, color: 'text-[#d1d5db]' },
                  { label: 'New', value: calls.filter(c => c.status === 'new').length, color: 'text-blue-400' },
                  { label: 'Converted', value: calls.filter(c => c.status === 'converted').length, color: 'text-green-400' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-[#1f2937] rounded-2xl p-5 border border-[#374151] text-center">
                    <p className={`font-bold text-2xl ${color}`}>{value}</p>
                    <p className="text-[#6b7280] text-xs mt-1 font-medium">{label}</p>
                  </div>
                ))}
              </div>

              {calls.length === 0 ? (
                <SectionCard>
                  <div className="text-center py-12">
                    <p className="text-5xl mb-4">📞</p>
                    <p className="text-[#d1d5db] font-semibold text-base">No calls recorded</p>
                    <p className="text-[#6b7280] text-sm mt-2 max-w-sm mx-auto">
                      Connect the Vapi webhook in System settings to start receiving call data.
                    </p>
                  </div>
                </SectionCard>
              ) : (
                <div className="space-y-3">
                  {calls.map(c => (
                    <div key={c.id} className="bg-[#1f2937] rounded-2xl p-5 border border-[#374151] hover:border-[#4b5563] transition-colors">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-[#d1d5db] font-semibold text-base">
                              {c.caller_name || c.caller_phone || 'Unknown Caller'}
                            </p>
                            <span className={`text-xs px-2 py-0.5 rounded-full border capitalize ${
                              c.status === 'new'       ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' :
                              c.status === 'converted' ? 'bg-green-500/20 text-green-400 border-green-500/40' :
                              c.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' :
                              'bg-red-500/20 text-red-400 border-red-500/40'
                            }`}>
                              {c.status}
                            </span>
                          </div>
                          {c.caller_phone && <p className="text-[#6b7280] text-sm mb-1">{c.caller_phone}</p>}
                          {c.issue_description && <p className="text-[#9ca3af] text-sm leading-relaxed mt-2">{c.issue_description}</p>}
                          {c.service_needed && (
                            <p className="text-[#6b7280] text-xs mt-1 capitalize">
                              Service: {c.service_needed.replace('_', ' ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[#6b7280] text-xs">
                            {new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          {c.duration_seconds && (
                            <p className="text-[#6b7280] text-xs mt-0.5">
                              {Math.round(c.duration_seconds / 60)}m {c.duration_seconds % 60}s
                            </p>
                          )}
                          {c.urgency && c.urgency !== 'low' && (
                            <span className={`text-xs mt-1 inline-block px-1.5 py-0.5 rounded font-medium ${
                              c.urgency === 'emergency' ? 'bg-red-500/20 text-red-400' :
                              c.urgency === 'high' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {c.urgency}
                            </span>
                          )}
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
              <SectionCard title="🔍 System Status">
                <div className="space-y-0">
                  {[
                    { label: 'Supabase Connection', key: 'supabase_connection', note: 'Database connectivity' },
                    { label: 'Leads Table', key: 'leads_table', note: 'Writable' },
                    { label: 'Calls Table', key: 'calls_table', note: 'Stores Vapi call records' },
                    { label: 'VAPI_API_KEY', key: 'vapi_api_key', note: 'Required in Vercel env vars' },
                    { label: 'WEBHOOK_SECRET', key: 'webhook_secret', note: 'Required in Vercel env vars' },
                  ].map(({ label, key, note }) => (
                    <div key={key} className="flex items-center justify-between py-3 border-b border-[#374151]/50 last:border-0">
                      <div>
                        <p className="text-[#d1d5db] text-sm font-medium">{label}</p>
                        <p className="text-[#6b7280] text-xs mt-0.5">{note}</p>
                      </div>
                      {statusIcon(systemStatus[key] || 'unknown')}
                    </div>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="🚀 Vapi Webhook Setup">
                <div className="space-y-3 text-sm">
                  {[
                    { step: '1', title: 'Add Vapi API Key → Vercel', code: 'VAPI_API_KEY = your_vapi_key' },
                    { step: '2', title: 'Add Webhook Secret → Vercel', code: 'WEBHOOK_SECRET = your_secret' },
                    { step: '3', title: 'Set Webhook URL in Vapi Dashboard', code: `${wsEndpoint}/api/vapi-webhook` },
                    { step: '4', title: 'Run in Supabase SQL Editor', code: 'alter table public.leads alter column user_id drop not null;' },
                  ].map(({ step, title, code }) => (
                    <div key={step} className="bg-[#374151] rounded-xl p-4">
                      <p className="text-[#9ca3af] font-medium mb-1.5">{step}. {title}</p>
                      <code className="text-[#60a5fa] text-xs break-all leading-relaxed block">{code}</code>
                    </div>
                  ))}
                </div>
              </SectionCard>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-5">
                <p className="text-yellow-400 font-semibold text-sm mb-1">⚠ Pending: SQL Patch Required</p>
                <p className="text-[#9ca3af] text-xs mb-3">
                  Run this in Supabase SQL Editor before the Vapi webhook can save leads:
                </p>
                <code className="text-yellow-300 text-xs block bg-[#374151] rounded p-3">
                  alter table public.leads alter column user_id drop not null;
                </code>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminPanel;