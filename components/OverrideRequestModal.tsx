'use client';

import React, { useState } from 'react';
import { UserProfile, DailySubmission } from '@/lib/types';
import { MasarService } from '@/lib/masar-service';
import { persistDailySubmission, writeAuditEvent } from '@/lib/services/submissions-client';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('يرجى توضيح سبب طلب الفتح الاستثنائي بصورة تفصيلية.');
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
      alert('تم رفع طلب الفتح الاستثنائي بنجاح إلى مديرية الشئون الصحية (الجهة الأم). سيتم فحص الطلب فورياً.');
      onClose();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء رفع الطلب');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-sovereign-card border border-amber-500/50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-in zoom-in-95">
        
        <div className="p-5 border-b border-slate-700 flex items-center justify-between bg-amber-500/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">طلب فتح استثنائي (قيد الجهة الأم)</h3>
              <p className="text-xs text-amber-300/80 mt-0.5">Mother Authority Override Request</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            وفقاً للائحة الحوكمة، تنتهي صلاحية الإدارة الصحية في تمام الساعة <strong>03:00 عصراً</strong>. يتطلب أي تعديل بعد هذا التوقيت موافقة مديرية الشئون الصحية التابعة لمنح نافذة فتح مؤقت (30 دقيقة) مسجلة في سجل التدقيق الرقابي.
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-white">
              سبب طلب التعديل أو التأخير في رفع البيان:
            </label>
            <textarea
              required
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: تأخر وصول كشوف عيادات المشورة الأسرية بإحدى الوحدات الصحية الريفية نظراً لعطل في خط المواصلات، وتم استلام الكشوف الورقية الآن للتدقيق..."
              className="w-full text-xs p-3.5 rounded-xl bg-slate-900 border border-slate-700 text-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-700/80">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !reason.trim()}
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
            >
              <Send className="w-4 h-4" />
              <span>إرسال الطلب للمديرية</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
