export type UserRole = 
  | 'district_user'      // موظف الإدارة الصحية (إدخال ورفع)
  | 'directorate_user'   // مديرية الشئون الصحية (تدقيق واعتماد)
  | 'general_director'   // ديوان عام الوزارة - مدير عام تنمية الأسرة
  | 'central_admin'      // ديوان عام الوزارة - رئيس الإدارة المركزية
  | 'sector_head'        // رئيس القطاع والوزير (اعتماد سيادي وفتح عام)
  | 'super_admin';       // مسؤول النظام العام وتكنولوجيا المعلومات

export type SubmissionStatus = 
  | 'DRAFT'              // مسودة مفتوحة للإدخال
  | 'SUBMITTED_LOCKED'   // تم الرفع ومقفل تلقائياً (بعد 03:00 م أو بالضغط على إرسال)
  | 'RETURNED'           // أرجعته المديرية للتعديل
  | 'APPROVED';          // تم الاعتماد

export interface HealthDistrict {
  id: string;
  code: string;
  name_ar: string;
  governorate_id: string;
}

export type FacilityType = 
  | 'FAMILY_HEALTH_UNIT'      // وحدة صحة الأسرة
  | 'FAMILY_HEALTH_CENTER'    // مركز طب أسرة حضري
  | 'MATERNITY_HOSPITAL'      // مستشفى ولادة ونساء (PPFP)
  | 'GENERAL_HOSPITAL'        // مستشفى عام / مركزي
  | 'MOBILE_CLINIC';          // عيادة متنقلة

export interface HealthFacility {
  id: string;
  code: string;
  name_ar: string;
  facility_type: FacilityType;
  facility_type_ar: string;
  governorate_id: string;
  governorate_name_ar: string;
  district_id: string;
  district_name_ar: string;
  has_ppfp_service: boolean;
  has_counseling_room: boolean;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface GeneralDirectorate {
  id: string;
  code: string;
  name_ar: string;
  central_admin_name_ar: string;
  sector_name_ar: string;
  head_name_ar: string;
  active_programs_count: number;
}

export interface Governorate {
  id: string;
  code: string;
  name_ar: string;
  districts?: HealthDistrict[];
}

export interface UserProfile {
  id: string;
  full_name: string;
  national_id?: string;
  email?: string;
  role: UserRole;
  role_title_ar: string;
  governorate_id?: string;
  governorate_name_ar?: string;
  district_id?: string;
  district_name_ar?: string;
}

export interface SectionDefinition {
  code: number;
  name_ar: string;
  group_id: 1 | 2 | 3;
  group_name_ar: string;
  field_1_label: string;
  field_2_label: string;
  field_3_label: string;
  description?: string;
  icon_name: string;
}

export interface SectionData {
  section_code: number;
  section_name_ar: string;
  field_1_value: number;
  field_2_value: number;
  field_3_value: number;
  status: 'empty' | 'draft' | 'completed';
  last_updated_at?: string;
  last_updated_by?: string;
  notes?: string;
}

export interface SectionHistoryEntry {
  id: string;
  date: string;
  field_1_value: number;
  field_2_value: number;
  field_3_value: number;
  editor_name: string;
  timestamp: string;
  notes?: string;
}

export interface DailySubmission {
  id: string;
  submission_date: string; // YYYY-MM-DD
  district_id: string;
  district_name_ar: string;
  governorate_id: string;
  governorate_name_ar: string;
  status: SubmissionStatus;
  directorate_status: 'PENDING' | 'APPROVED' | 'RETURNED';
  ministry_status: 'PENDING' | 'APPROVED';
  override_active: boolean;
  override_expires_at?: string; // ISO string
  override_reason?: string;
  override_granted_by?: string;
  override_granted_at?: string;
  returned_reason?: string;
  returned_by?: string;
  returned_at?: string;
  sections: Record<number, SectionData>;
  history_logs: Record<number, SectionHistoryEntry[]>;
  created_at: string;
  updated_at: string;
}

export interface TimeLockState {
  current_time_str: string;
  is_district_locked: boolean; // True after 03:00 PM
  is_directorate_locked: boolean; // True after 06:00 PM
  is_ministry_locked: boolean; // True after 10:00 PM
  district_deadline: string; // "15:00"
  directorate_deadline: string; // "18:00"
  ministry_deadline: string; // "22:00"
  has_active_override: boolean;
  override_minutes_remaining: number;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor_name: string;
  actor_role: string;
  action_type: string;
  description: string;
  target_district?: string;
}
