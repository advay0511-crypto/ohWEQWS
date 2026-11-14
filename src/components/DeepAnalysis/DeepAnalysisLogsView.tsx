import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Search,
  Filter,
  X,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  Info,
  Database,
  Sparkles,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';
import { DeepAnalysisReport, SavedFarmPlan } from '../../types';
import { loadDeepAnalysisLogs } from '../../store/farmStorage';

interface DeepAnalysisLogsViewProps {
  farms: SavedFarmPlan[];
  onOpenFarm: (farmId: string) => void;
}

export const DeepAnalysisLogsView: React.FC<DeepAnalysisLogsViewProps> = ({
  farms,
  onOpenFarm,
}) => {
  const [logs] = useState<DeepAnalysisReport[]>(() => loadDeepAnalysisLogs());
  const [selectedFarmFilter, setSelectedFarmFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<DeepAnalysisReport | null>(null);

  // Trace expansion inside modal
  const [expandedTraceIds, setExpandedTraceIds] = useState<Set<string>>(new Set());

  const filteredLogs = logs.filter((log) => {
    if (selectedFarmFilter !== 'all' && log.farmId !== selectedFarmFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.farmName.toLowerCase().includes(q) ||
        (log.overallStatusReason || '').toLowerCase().includes(q) ||
        log.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const toggleTrace = (id: string) => {
    setExpandedTraceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] px-4 sm:px-6 py-8 text-[#F0F7FA]">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.12] pb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-[#27D7B2]" />
              <h1 className="text-xl font-black text-white">Deep Analysis Logs &amp; History</h1>
            </div>
            <p className="text-xs text-slate-300">
              Immutable audit history of all automated and on-demand farm health investigations.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={selectedFarmFilter}
              onChange={(e) => setSelectedFarmFilter(e.target.value)}
              className="bg-white/[0.06] border border-white/[0.14] text-xs text-white rounded-xl px-3 py-2 focus:border-[#27D7B2] focus:outline-none backdrop-blur-md"
            >
              <option value="all" className="bg-[#031522] text-white">All Farms</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id} className="bg-[#031522] text-white">
                  {f.name}
                </option>
              ))}
            </select>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search logs..."
                className="bg-white/[0.06] border border-white/[0.14] text-xs text-white rounded-xl pl-8 pr-3 py-2 placeholder:text-slate-400 focus:border-[#27D7B2] focus:outline-none backdrop-blur-md"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Logs Table / List */}
        <div className="glass-card rounded-2xl overflow-hidden shadow-xl border border-white/[0.14]">
          {filteredLogs.length > 0 ? (
            <div className="divide-y divide-[#293B2E]">
              {filteredLogs.map((log) => {
                const dateStr = new Date(log.createdAt || log.generatedAt || Date.now()).toLocaleString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="p-4 hover:bg-[#19291F] transition-colors cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-[#203428] flex items-center justify-center text-[#89B96F] shrink-0 mt-0.5">
                        <Sparkles className="w-4 h-4" />
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-[#EDF3EC] truncate">{log.farmName}</h4>
                          <span className="text-[10px] text-[#819082] font-mono">
                            {log.scope === 'single_field' ? `(${log.fieldName || 'Field Parcel'})` : '(All Fields)'}
                          </span>
                          <span className={`text-[10px] font-mono px-2 py-0.2 rounded-full ${
                            log.overallStatus === 'alert'
                              ? 'bg-[#D96C63]/20 text-[#D96C63]'
                              : log.overallStatus === 'needs_attention'
                              ? 'bg-[#D7AC58]/20 text-[#D7AC58]'
                              : 'bg-[#79B77A]/20 text-[#79B77A]'
                          }`}>
                            {log.overallStatus === 'alert' ? 'Alert' : log.overallStatus === 'needs_attention' ? 'Needs Attention' : 'Good'}
                          </span>
                        </div>

                        <p className="text-xs text-[#B1BDB0] truncate mt-1">
                          {log.overallStatusReason}
                        </p>

                        <div className="flex items-center gap-3 text-[11px] font-mono text-[#819082] mt-1.5">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {dateStr}
                          </span>
                          <span>·</span>
                          <span>{log.durationMs}ms duration</span>
                          <span>·</span>
                          <span>{(log.traceEvents || []).length} execution steps</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-[#89B96F] hover:underline flex items-center gap-1">
                        <span>Inspect Log</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center text-xs text-[#819082] space-y-2">
              <FileText className="w-8 h-8 text-[#405744] mx-auto mb-2" />
              <p className="text-[#EDF3EC] font-medium">No Analysis Logs Found</p>
              <p>Run a Deep Analysis on any farm to populate the execution audit trail.</p>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* DETAIL MODAL POPUP WITH TOP-RIGHT CLOSE (X)                   */}
      {/* ------------------------------------------------------------- */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 backdrop-blur-[3px] p-4 overflow-y-auto">
          <div className="w-full max-w-3xl glass-modal rounded-3xl shadow-2xl overflow-hidden my-6 flex flex-col max-h-[88vh] border border-white/20">
            {/* Header with Top-Right Close Button */}
            <div className="p-4 border-b border-white/[0.12] bg-white/[0.04] flex items-center justify-between shrink-0">
              <div>
                <span className="text-[10px] font-mono text-[#27D7B2] uppercase tracking-wider font-bold">
                  Immutable Log Snapshot · {selectedLog.id}
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedLog.farmName} — Deep Analysis
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                title="Close log details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Summary Strip */}
              <div className="p-4 rounded-xl bg-[#19291F] border border-[#293B2E] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#819082]">Overall Status Verdict:</span>
                  <span className="font-semibold text-[#EDF3EC] uppercase">{selectedLog.overallStatus ? selectedLog.overallStatus.replace('_', ' ') : 'NORMAL'}</span>
                </div>
                <p className="text-xs text-[#B1BDB0]">{selectedLog.overallStatusReason}</p>
                <div className="flex items-center gap-4 text-[11px] font-mono text-[#819082] pt-2 border-t border-[#293B2E]">
                  <span>Confidence: {selectedLog.recommendationConfidence}</span>
                  <span>Coverage: {typeof selectedLog.dataCoverage === 'object' ? selectedLog.dataCoverage?.percentage : selectedLog.dataCoverage || 100}%</span>
                  <span>Recorded: {new Date(selectedLog.createdAt || selectedLog.generatedAt || Date.now()).toLocaleString()}</span>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#EDF3EC] uppercase tracking-wider">
                  Recommended Field Actions
                </h4>
                <div className="space-y-1.5">
                  {(selectedLog.recommendations || []).map((r: any) => (
                    <div key={r.id} className="p-3 rounded-lg bg-[#19291F] border border-[#293B2E] text-xs">
                      <div className="font-semibold text-[#EDF3EC]">{r.title}</div>
                      <p className="text-[#B1BDB0] mt-0.5">{r.rationale || r.reason}</p>
                      <div className="text-[10px] text-[#819082] font-mono mt-1">Grounding: {r.supportedBy || r.evidenceSource}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Steps */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-[#EDF3EC] uppercase tracking-wider">
                  Execution Steps ({(selectedLog.traceEvents || []).length})
                </h4>
                <div className="space-y-1 font-mono text-xs">
                  {(selectedLog.traceEvents || []).map((t: any) => {
                    const isExp = expandedTraceIds.has(t.id);
                    return (
                      <div key={t.id} className="rounded-lg bg-[#19291F] border border-[#293B2E] overflow-hidden">
                        <button
                          type="button"
                          onClick={() => toggleTrace(t.id)}
                          className="w-full p-2.5 text-left flex items-center justify-between hover:bg-[#203428]"
                        >
                          <div className="flex items-center gap-2 truncate pr-2">
                            <span className="text-[#89B96F]">✓</span>
                            <span className="font-medium text-[#EDF3EC] truncate">{t.stepName}</span>
                            <span className="text-[10px] text-[#819082]">({t.durationMs}ms)</span>
                          </div>
                          {isExp ? <ChevronDown className="w-3.5 h-3.5 text-[#819082]" /> : <ChevronRight className="w-3.5 h-3.5 text-[#819082]" />}
                        </button>
                        {isExp && (
                          <div className="p-3 bg-[#121F17] border-t border-[#293B2E] text-[11px] text-[#B1BDB0] space-y-1">
                            <p>{t.details}</p>
                            {t.formulaOrRule && (
                              <div className="p-1.5 rounded bg-[#0B1410] text-[#78B6C7] break-all">
                                {t.formulaOrRule}
                              </div>
                            )}
                            {t.outputSummary && <div className="text-[#89B96F]">Result: {t.outputSummary}</div>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[#293B2E] bg-[#0E1913] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  onOpenFarm(selectedLog.farmId);
                  setSelectedLog(null);
                }}
                className="text-xs text-[#89B96F] hover:underline"
              >
                Go to {selectedLog.farmName} Farm View
              </button>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="btn-primary text-xs py-1.5 px-3"
              >
                Close (X)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
