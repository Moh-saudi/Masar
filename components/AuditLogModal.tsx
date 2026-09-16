'use client';

import React from 'react';
import { AuditLog } from '@/lib/types';
import { Clock, ShieldCheck, X, Activity } from 'lucide-react';

interface AuditLogModalProps {
  logs: AuditLog[];
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ logs, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-sovereign-card border border-slate-700 rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95">
        
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">سجل الرقابة والتدقيق الإداري (Audit Trail)</h3>
              <p className="text-xs text-slate-400 mt-0.5">توثيق كافة عمليات الحوكمة الزمنية، الرفع، والفتح الاستثنائي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-3">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{log.actor_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {log.actor_role}
                    </span>
                    {log.target_district && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-health-600/20 text-health-400 border border-health-600/30">
                        {log.target_district}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed font-medium">
                    {log.description}
                  </p>
                </div>
                <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              لا توجد سجلات بعد.
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 border-t border-slate-700 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
