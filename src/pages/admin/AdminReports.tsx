import React, { useState, useEffect } from 'react';
import { fetchReports, updateReportStatus } from '../../firebase/firestore';
import { Report } from '../../types';
import { useToast } from '../../contexts/ToastContext';
import { ShieldAlert, CheckCircle2, XCircle, AlertCircle, Clock, Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export const AdminReports: React.FC = () => {
  const { success } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [statusFilter, setStatusFilter] = useState('All');

  const loadReports = async () => {
    const data = await fetchReports();
    setReports(data);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleStatusChange = async (reportId: string, status: Report['status']) => {
    await updateReportStatus(reportId, status);
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    success(`Report status updated to ${status.replace('_', ' ').toUpperCase()}.`);
  };

  const filtered = reports.filter(r =>
    statusFilter === 'All' ? true : r.status === statusFilter
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span>Community Moderation Queue</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Review reported posts, offensive comments, and code of conduct violations
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-gray-700 outline-none"
        >
          <option value="All">All Reports ({reports.length})</option>
          <option value="pending">Pending</option>
          <option value="under_review">Under Review</option>
          <option value="resolved">Resolved</option>
          <option value="rejected">Dismissed / Rejected</option>
        </select>
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center text-gray-400 text-xs border border-gray-200">
            No moderation flags in this category.
          </div>
        ) : (
          filtered.map(report => (
            <div
              key={report.id}
              className="bg-white rounded-2xl border border-gray-200/80 p-5 shadow-card space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    report.status === 'pending'
                      ? 'bg-red-100 text-red-800'
                      : report.status === 'under_review'
                      ? 'bg-amber-100 text-amber-800'
                      : report.status === 'resolved'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {report.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-gray-900">
                    Flagged {report.targetType.toUpperCase()}: <span className="text-red-700">{report.reason}</span>
                  </span>
                </div>

                <span className="text-[11px] text-gray-400">
                  Reported by {report.reporterName} • {new Date(report.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 text-xs text-gray-800">
                <span className="font-semibold text-red-900 block mb-1">Reported Content Snippet:</span>
                "{report.targetContent}"
              </div>

              {report.notes && (
                <p className="text-xs text-gray-500 italic">
                  Reporter Note: {report.notes}
                </p>
              )}

              <div className="pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-gray-400 font-mono text-[11px]">Ref ID: {report.id}</span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStatusChange(report.id, 'under_review')}
                    className="px-3 py-1 rounded-lg border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 font-semibold transition"
                  >
                    Mark Under Review
                  </button>

                  <button
                    onClick={() => handleStatusChange(report.id, 'resolved')}
                    className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold transition"
                  >
                    Resolve & Take Action
                  </button>

                  <button
                    onClick={() => handleStatusChange(report.id, 'rejected')}
                    className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 font-semibold transition"
                  >
                    Dismiss Flag
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
