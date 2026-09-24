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
    <div 
      className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-white via-white to-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 text-[#087f78] flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#172033]">سجل الرقابة والتدقيق الإداري (Audit Trail)</h3>
                <span className="px-2 py-0.5 rounded-md bg-teal-50 text-[#087f78] border border-teal-200/60 text-[10px] font-bold">
                  حوكمة معتمدة
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">توثيق كافة عمليات الحوكمة الزمنية، الرفع، والفتح الاستثنائي</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logs List */}
        <div className="p-5 overflow-y-auto space-y-3 bg-[#fafbfc] flex-1">
          {logs.length > 0 ? (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:border-slate-300 transition flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 text-xs">{log.actor_name}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold border border-slate-200/60">
                      {log.actor_role}
                    </span>
                    {log.target_district && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-[#eaf9f7] text-[#087f78] font-bold border border-teal-200/60">
                        {log.target_district}
                      </span>
                    )}
                    {log.action_type && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono">
                        {log.action_type}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-xs leading-relaxed font-medium">
                    {log.description}
                  </p>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1.5 flex-shrink-0 tabular-nums pt-0.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{log.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center gap-2 font-medium">
              <ShieldCheck className="w-8 h-8 text-slate-300" />
              <span>لا توجد سجلات تدقيق حتى الآن.</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500 font-medium">
            إجمالي العمليات المسجلة: <strong className="text-slate-800 font-bold tabular-nums mr-1">{logs.length}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-xs transition"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
};
