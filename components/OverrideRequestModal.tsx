'use client';

import React, { useState } from 'react';
import { UserProfile, DailySubmission } from '@/lib/types';
import { MasarService } from '@/lib/masar-service';
import { persistDailySubmission, writeAuditEvent } from '@/lib/services/submissions-client';
import { OperationFeedbackDialog } from './OperationFeedbackDialog';
import { AlertTriangle, Send, X, ShieldAlert } from 'lucide-react';

interface OverrideRequestModalProps {
  submission: DailySubmission;
  user: UserProfile;
  onClose: () => void;
  onRequestSubmitted: (sub: DailySubmission) => void;
}

export const OverrideRequestModal: React.FC<OverrideRequestModalProps> = ({
  submission,
  user,
  onClose,
  onRequestSubmitted,
}) => {
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [operationError, setOperationError] = useState<{ title: string; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setOperationError({
        title: 'سبب الطلب مطلوب',
        message: 'اكتب سبب طلب الفتح الاستثنائي بصورة واضحة قبل إرسال الطلب إلى المديرية.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedSub = MasarService.requestOverride(submission.district_id, reason.trim(), user);
      const persisted = await persistDailySubmission(updatedSub, user);
      await writeAuditEvent({
        user,
        action: 'OVERRIDE_REQUEST',
        entity: 'daily_submissions',
        entityId: persisted.id,
        metadata: {
          actor_name: user.full_name,
          actor_role: user.role_title_ar,
          description: `طلب فتح استثنائي لإدارة (${persisted.district_name_ar}) - السبب: ${reason.trim()}`,
          target_district: persisted.district_name_ar,
        },
      });
      onRequestSubmitted(persisted);
      onClose();
    } catch {
      setOperationError({
        title: 'تعذر رفع طلب الفتح الاستثنائي',
        message: 'لم نتمكن من إرسال الطلب إلى المديرية الآن. أعد المحاولة، وإذا استمرت المشكلة تواصل مع الدعم الفني.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/45 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div 
        className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-amber-50/50 via-white to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#172033]">طلب فتح استثنائي (قيد الجهة الأم)</h3>
              <p className="text-xs text-slate-500 mt-0.5">Mother Authority Override Request</p>
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-900 leading-relaxed font-medium">
            وفقاً للائحة الحوكمة، تنتهي صلاحية الإدارة الصحية في تمام الساعة <strong>03:00 عصراً</strong>. يتطلب أي تعديل بعد هذا التوقيت موافقة مديرية الشئون الصحية التابعة لمنح نافذة فتح مؤقت (30 دقيقة) مسجلة في سجل التدقيق الرقابي.
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              سبب طلب التعديل أو التأخير في رفع البيان:
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: تأخر وصول كشوف عيادات المشورة الأسرية بإحدى الوحدات الصحية الريفية نظراً لعطل في خط المواصلات، وتم استلام الكشوف الورقية الآن للتدقيق..."
              className="w-full text-xs p-3.5 rounded-xl bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:border-[#087f78] focus:ring-2 focus:ring-[#087f78]/20 outline-none transition"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-[#087f78] hover:bg-[#066560] disabled:opacity-40 text-white flex items-center gap-2 shadow-sm transition"
            >
              <Send className="w-4 h-4" />
              <span>إرسال الطلب للمديرية</span>
            </button>
          </div>
        </form>

      </div>
      <OperationFeedbackDialog
        open={Boolean(operationError)}
        type="error"
        title={operationError?.title || 'تعذر إتمام العملية'}
        message={operationError?.message || 'حدث خطأ غير متوقع.'}
        onClose={() => setOperationError(null)}
        onRetry={() => setOperationError(null)}
      />

    </div>
  );
};
