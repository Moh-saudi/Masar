import { 
  DailySubmission, 
  SectionData, 
  SectionHistoryEntry, 
  AuditLog, 
  TimeLockState, 
  UserProfile 
} from './types';
import { SECTIONS_DEFINITIONS, SAMPLE_GOVERNORATES } from './constants';
import { approveNationalReport } from './services/submissions-client';

const STORAGE_KEY_SUBMISSIONS = 'masar_submissions_v4_prod';
const STORAGE_KEY_AUDIT = 'masar_audit_logs_v4_prod';
const STORAGE_KEY_SIM_TIME = 'masar_simulated_time_v4_prod';

export function getTodayDateString(): string {
  const d = new Date();
  return d.toISOString().split('T')[0];
}

// دالة صريحة لضمان كتابة التوقيت دائماً بالأرقام الإنجليزية (English Digits)
export function formatTimeEn(date: Date = new Date()): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? 'م' : 'ص';
  const h12 = hours % 12 || 12;
  const hStr = String(h12).padStart(2, '0');
  return `${hStr}:${minutes} ${period}`;
}

export function createEmptySections(): Record<number, SectionData> {
  const sections: Record<number, SectionData> = {};
  SECTIONS_DEFINITIONS.forEach((def) => {
    sections[def.code] = {
      section_code: def.code,
      section_name_ar: def.name_ar,
      field_1_value: 0,
      field_2_value: 0,
      field_3_value: 0,
      status: 'empty',
    };
  });
  return sections;
}

export function createDefaultHistory(sectionCode: number): SectionHistoryEntry[] {
  // سجل نظيف يبدأ من الصفر ولا يحتوي على أي بيانات وهمية
  return [];
}

export function getInitialSubmissions(): DailySubmission[] {
  const today = getTodayDateString();
  const list: DailySubmission[] = [];

  SAMPLE_GOVERNORATES.forEach((gov) => {
    gov.districts?.forEach((dist) => {
      // كافة الاستمارات تبدأ فارغة تماماً ونظيفة برسم الإدخال الفعلي اليومي
      const sections = createEmptySections();
      const history: Record<number, SectionHistoryEntry[]> = {};
      SECTIONS_DEFINITIONS.forEach(d => {
        history[d.code] = [];
      });

      list.push({
        id: `sub-${dist.id}-${today}`,
        submission_date: today,
        district_id: dist.id,
        district_name_ar: dist.name_ar,
        governorate_id: gov.id,
        governorate_name_ar: gov.name_ar,
        status: 'DRAFT',
        directorate_status: 'PENDING',
        ministry_status: 'PENDING',
        override_active: false,
        sections,
        history_logs: history,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    });
  });

  return list;
}

export class MasarService {
  private static submissions: DailySubmission[] = [];
  private static auditLogs: AuditLog[] = [];
  private static simulatedTime: string | null = null;

  public static initialize(): void {
    if (typeof window === 'undefined') return;

    const savedSubs = localStorage.getItem(STORAGE_KEY_SUBMISSIONS);
    if (savedSubs) {
      try {
        this.submissions = JSON.parse(savedSubs);
      } catch {
        this.submissions = getInitialSubmissions();
      }
    } else {
      this.submissions = getInitialSubmissions();
      this.saveSubmissions();
    }

    const savedLogs = localStorage.getItem(STORAGE_KEY_AUDIT);
    if (savedLogs) {
      try {
        this.auditLogs = JSON.parse(savedLogs);
      } catch {
        this.auditLogs = [];
      }
    } else {
      this.auditLogs = [];
      this.saveAuditLogs();
    }

    const savedSim = localStorage.getItem(STORAGE_KEY_SIM_TIME);
    this.simulatedTime = savedSim || null;
  }

  private static saveSubmissions(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_SUBMISSIONS, JSON.stringify(this.submissions));
    }
  }

  private static saveAuditLogs(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
    }
  }

  public static setSimulatedTime(timeStr: string | null): void {
    this.simulatedTime = timeStr;
    if (typeof window !== 'undefined') {
      if (timeStr) {
        localStorage.setItem(STORAGE_KEY_SIM_TIME, timeStr);
      } else {
        localStorage.removeItem(STORAGE_KEY_SIM_TIME);
      }
    }
  }

  public static getSimulatedTime(): string | null {
    return this.simulatedTime;
  }

  public static getTimeLockState(submission?: DailySubmission): TimeLockState {
    let nowHours: number;
    let nowMinutes: number;

    if (this.simulatedTime) {
      const [h, m] = this.simulatedTime.split(':').map(Number);
      nowHours = h;
      nowMinutes = m;
    } else {
      const now = new Date();
      nowHours = now.getHours();
      nowMinutes = now.getMinutes();
    }

    const timeStr = `${String(nowHours).padStart(2, '0')}:${String(nowMinutes).padStart(2, '0')}`;
    const decimalTime = nowHours + nowMinutes / 60;

    let hasActiveOverride = false;
    let overrideMinutesRemaining = 0;

    if (submission && submission.override_active && submission.override_expires_at) {
      const expiresAt = new Date(submission.override_expires_at).getTime();
      const currentEpoch = new Date().getTime();
      if (expiresAt > currentEpoch) {
        hasActiveOverride = true;
        overrideMinutesRemaining = Math.max(1, Math.round((expiresAt - currentEpoch) / 60000));
      }
    }

    const isDistrictLocked = decimalTime >= 15.0 && !hasActiveOverride;
    const isDirectorateLocked = decimalTime >= 18.0;
    const isMinistryLocked = decimalTime >= 22.0;

    return {
      current_time_str: timeStr,
      is_district_locked: isDistrictLocked,
      is_directorate_locked: isDirectorateLocked,
      is_ministry_locked: isMinistryLocked,
      district_deadline: '15:00',
      directorate_deadline: '18:00',
      ministry_deadline: '22:00',
      has_active_override: hasActiveOverride,
      override_minutes_remaining: overrideMinutesRemaining,
    };
  }

  public static getSubmissions(): DailySubmission[] {
    if (this.submissions.length === 0) {
      this.initialize();
    }
    return this.submissions;
  }

  public static getSubmissionByDistrict(districtId: string): DailySubmission {
    const list = this.getSubmissions();
    let sub = list.find(s => s.district_id === districtId);
    if (!sub) {
      sub = getInitialSubmissions().find(s => s.district_id === districtId) || getInitialSubmissions()[0];
    }
    return sub;
  }

  public static getDelinquentDistricts(timeLock: TimeLockState): { district_name_ar: string; governorate_name_ar: string; completed_sections: number }[] {
    if (!timeLock.is_district_locked) {
      return [];
    }

    const delinquents: { district_name_ar: string; governorate_name_ar: string; completed_sections: number }[] = [];
    
    this.submissions.forEach(sub => {
      const completed = Object.values(sub.sections).filter(s => s.status === 'completed').length;
      if (sub.status === 'DRAFT' || (sub.status !== 'APPROVED' && sub.status !== 'SUBMITTED_LOCKED' && completed < 12)) {
        delinquents.push({
          district_name_ar: sub.district_name_ar,
          governorate_name_ar: sub.governorate_name_ar,
          completed_sections: completed,
        });
      }
    });

    return delinquents;
  }

  public static updateSectionData(
    districtId: string,
    sectionCode: number,
    data: { field_1_value: number; field_2_value: number; field_3_value: number; notes?: string },
    user: UserProfile
  ): DailySubmission {
    const sub = this.getSubmissionByDistrict(districtId);
    const lockState = this.getTimeLockState(sub);

    if (lockState.is_district_locked && sub.status === 'SUBMITTED_LOCKED') {
      throw new Error('انتهت نافذة الإدخال المسموحة للإدارة (03:00 م). يتطلب التعديل موافقة الجهة الأم (المديرية).');
    }

    const isComplete = data.field_1_value > 0 || data.field_2_value > 0 || data.field_3_value > 0;
    const nowStr = 'اليوم، ' + formatTimeEn();

    sub.sections[sectionCode] = {
      ...sub.sections[sectionCode],
      field_1_value: data.field_1_value,
      field_2_value: data.field_2_value,
      field_3_value: data.field_3_value,
      status: isComplete ? 'completed' : 'empty',
      last_updated_at: nowStr,
      last_updated_by: user.full_name,
      notes: data.notes || sub.sections[sectionCode]?.notes,
    };

    sub.updated_at = new Date().toISOString();
    this.saveSubmissions();
    return sub;
  }

  public static updateAllSectionsBulk(
    districtId: string,
    updatedSections: Record<number, { field_1_value: number; field_2_value: number; field_3_value: number; notes?: string }>,
    user: UserProfile
  ): DailySubmission {
    const sub = this.getSubmissionByDistrict(districtId);
    const nowStr = 'اليوم، ' + formatTimeEn();

    Object.entries(updatedSections).forEach(([codeStr, vals]) => {
      const code = parseInt(codeStr);
      const isComplete = vals.field_1_value > 0 || vals.field_2_value > 0 || vals.field_3_value > 0;
      sub.sections[code] = {
        ...sub.sections[code],
        field_1_value: vals.field_1_value,
        field_2_value: vals.field_2_value,
        field_3_value: vals.field_3_value,
        status: isComplete ? 'completed' : 'empty',
        last_updated_at: nowStr,
        last_updated_by: user.full_name,
        notes: vals.notes || sub.sections[code]?.notes,
      };
    });

    sub.updated_at = new Date().toISOString();
    this.saveSubmissions();
    return sub;
  }

  public static submitDistrictDailyReport(districtId: string, user: UserProfile): DailySubmission {
    const sub = this.getSubmissionByDistrict(districtId);
    sub.status = 'SUBMITTED_LOCKED';
    sub.directorate_status = 'PENDING';
    sub.override_active = false;
    sub.updated_at = new Date().toISOString();

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: 'اليوم، ' + formatTimeEn(),
      actor_name: user.full_name,
      actor_role: user.role_title_ar,
      action_type: 'DISTRICT_SUBMIT',
      description: `رفع البيان الإجمالي التجميعي لإدارة (${sub.district_name_ar}) وإقفاله رسمياً للمراجعة`,
      target_district: sub.district_name_ar,
    });

    this.saveSubmissions();
    return sub;
  }

  public static requestOverride(districtId: string, reason: string, user: UserProfile): DailySubmission {
    const sub = this.getSubmissionByDistrict(districtId);
    sub.override_reason = reason;

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: 'اليوم، ' + formatTimeEn(),
      actor_name: user.full_name,
      actor_role: user.role_title_ar,
      action_type: 'OVERRIDE_REQUEST',
      description: `طلب فتح استثنائي لإدارة (${sub.district_name_ar}) - السبب: ${reason}`,
      target_district: sub.district_name_ar,
    });

    this.saveSubmissions();
    return sub;
  }

  public static grantOverride(districtId: string, user: UserProfile): DailySubmission {
    const sub = this.getSubmissionByDistrict(districtId);
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const timeNowStr = 'اليوم، ' + formatTimeEn();
    
    sub.override_active = true;
    sub.override_expires_at = expiresAt;
    sub.override_granted_by = `${user.full_name} (${user.role_title_ar})`;
    sub.override_granted_at = timeNowStr;
    sub.status = 'DRAFT';

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: timeNowStr,
      actor_name: user.full_name,
      actor_role: user.role_title_ar,
      action_type: 'OVERRIDE_GRANTED',
      description: `منح فتح استثنائي مؤقت لمدة 30 دقيقة لإدارة (${sub.district_name_ar}) بواسطة ${user.full_name}`,
      target_district: sub.district_name_ar,
    });

    this.saveSubmissions();
    return sub;
  }

  public static returnSubmission(districtId: string, returnReason: string, user: UserProfile): DailySubmission {
    const sub = this.getSubmissionByDistrict(districtId);
    const timeNowStr = 'اليوم، ' + formatTimeEn();

    sub.status = 'RETURNED';
    sub.directorate_status = 'RETURNED';
    sub.returned_reason = returnReason;
    sub.returned_by = `${user.full_name} (${user.role_title_ar})`;
    sub.returned_at = timeNowStr;
    sub.override_active = true;
    sub.override_expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: timeNowStr,
      actor_name: user.full_name,
      actor_role: user.role_title_ar,
      action_type: 'SUBMISSION_RETURNED',
      description: `إرجاع بيان إدارة (${sub.district_name_ar}) للتعديل بواسطة ${user.full_name} - السبب: ${returnReason}`,
      target_district: sub.district_name_ar,
    });

    this.saveSubmissions();
    return sub;
  }

  public static approveDirectorateSubmission(districtId: string, user: UserProfile): DailySubmission {
    const sub = this.getSubmissionByDistrict(districtId);
    sub.directorate_status = 'APPROVED';
    sub.status = 'APPROVED';

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: 'اليوم، ' + formatTimeEn(),
      actor_name: user.full_name,
      actor_role: user.role_title_ar,
      action_type: 'DIRECTORATE_APPROVE',
      description: `اعتماد بيان إدارة (${sub.district_name_ar}) رسمياً بواسطة ${user.full_name}`,
      target_district: sub.district_name_ar,
    });

    this.saveSubmissions();
    return sub;
  }

  public static approveNationalMinistryReport(user: UserProfile): void {
    this.submissions.forEach(sub => {
      sub.ministry_status = 'APPROVED';
    });

    this.addAuditLog({
      id: `log-${Date.now()}`,
      timestamp: 'اليوم، ' + formatTimeEn(),
      actor_name: user.full_name,
      actor_role: user.role_title_ar,
      action_type: 'MINISTRY_NATIONAL_APPROVAL',
      description: 'الاعتماد الوزاري القومي الشامل للتقرير اليومي لكافة محافظات الجمهورية',
    });

    this.saveSubmissions();

    void approveNationalReport(user).catch((error) => {
      console.error('Failed to persist national approval', error);
    });
  }

  public static addAuditLog(log: AuditLog): void {
    this.auditLogs.unshift(log);
    this.saveAuditLogs();
  }

  public static getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }
}
