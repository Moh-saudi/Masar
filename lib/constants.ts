import { SectionDefinition, Governorate, UserProfile } from './types';
import { OFFICIAL_GOVERNORATES } from './official-facilities-data';

export const SYSTEM_NAME = 'مَسَار';
export const SYSTEM_FULL_NAME = 'المنظومة الرقمية لتجميع وتحليل بيانات تنمية الأسرة';
export const MINISTRY_NAME = 'وزارة الصحة والسكان';
export const SECTOR_NAME = 'قطاع الرعاية الصحية وتنمية الأسرة';
export const DEPARTMENT_NAME = 'إدارة تنمية الأسرة';

export const SECTION_GROUPS = [
  { id: 1, name_ar: 'المجموعة الأولى: التردد الداخلي بالمنشآت والمستشفيات' },
  { id: 2, name_ar: 'المجموعة الثانية: الأنشطة الميدانية والشراكات الخارجية' },
  { id: 3, name_ar: 'المجموعة الثالثة: حصيلة الوسائل طويلة المدى LARC' },
] as const;

export const SECTIONS_DEFINITIONS: SectionDefinition[] = [
  // المجموعة الأولى
  {
    code: 1,
    name_ar: 'غرف المشورة الأسرية',
    group_id: 1,
    group_name_ar: 'المجموعة الأولى: التردد الداخلي بالمنشآت والمستشفيات',
    field_1_label: 'عدد المترددين',
    field_2_label: 'التحويلات لتنظيم الأسرة',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'إحصائية جلسات المشورة المباشرة داخل وحدات ومراكز الرعاية الأولية',
    icon_name: 'MessageSquareText',
  },
  {
    code: 2,
    name_ar: 'التطعيمات (درن/غدة)',
    group_id: 1,
    group_name_ar: 'المجموعة الأولى: التردد الداخلي بالمنشآت والمستشفيات',
    field_1_label: 'سيدات سن الإنجاب',
    field_2_label: 'التحويلات لتنظيم الأسرة',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'تردد الأمهات المصاحبات للأطفال في جلسات التطعيمات الإلزامية',
    icon_name: 'Syringe',
  },
  {
    code: 3,
    name_ar: 'منافذ صرف الألبان',
    group_id: 1,
    group_name_ar: 'المجموعة الأولى: التردد الداخلي بالمنشآت والمستشفيات',
    field_1_label: 'سيدات سن الإنجاب',
    field_2_label: 'التحويلات لتنظيم الأسرة',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'حصر السيدات المترددات على منافذ صرف الألبان الشبيهة بلبن الأم',
    icon_name: 'Baby',
  },
  {
    code: 4,
    name_ar: 'المستشفيات العلاجية',
    group_id: 1,
    group_name_ar: 'المجموعة الأولى: التردد الداخلي بالمنشآت والمستشفيات',
    field_1_label: 'سيدات سن الإنجاب',
    field_2_label: 'التحويلات لتنظيم الأسرة',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'تكامل الخدمات بعيادات النساء والتوليد وتنظيم الأسرة بالمستشفيات',
    icon_name: 'Hospital',
  },
  {
    code: 5,
    name_ar: 'المبادرات الرئاسية',
    group_id: 1,
    group_name_ar: 'المجموعة الأولى: التردد الداخلي بالمنشآت والمستشفيات',
    field_1_label: 'صحة المرأة',
    field_2_label: 'الأم والجنين',
    field_3_label: 'فحص السمع للأطفال',
    description: 'إجماليات المستفيدات من حزم المبادرات الرئاسية للرعاية والتشخيص المبكر',
    icon_name: 'HeartPulse',
  },
  {
    code: 6,
    name_ar: 'زيارات النفاس',
    group_id: 1,
    group_name_ar: 'المجموعة الأولى: التردد الداخلي بالمنشآت والمستشفيات',
    field_1_label: 'سيدات تمت زيارتهن',
    field_2_label: 'التحويلات (ثابتة/متنقلة)',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'متابعة الأمهات حديثات الولادة بالزيارات المنزلية ومنافذ الرعاية',
    icon_name: 'Home',
  },

  // المجموعة الثانية
  {
    code: 7,
    name_ar: 'الجمعيات الأهلية',
    group_id: 2,
    group_name_ar: 'المجموعة الثانية: الأنشطة الميدانية والشراكات الخارجية',
    field_1_label: 'عدد الحضور',
    field_2_label: 'التحويلات (ثابتة/متنقلة)',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'الندوات التوعوية والأنشطة التنسيقية مع مؤسسات المجتمع المدني',
    icon_name: 'Users',
  },
  {
    code: 8,
    name_ar: 'مراكز الشباب',
    group_id: 2,
    group_name_ar: 'المجموعة الثانية: الأنشطة الميدانية والشراكات الخارجية',
    field_1_label: 'عدد الحضور',
    field_2_label: 'التحويلات (ثابتة/متنقلة)',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'الفعاليات التثقيفية المنفذة بالتعاون مع مديريات الشباب والرياضة',
    icon_name: 'Award',
  },
  {
    code: 9,
    name_ar: 'المساجد والكنائس',
    group_id: 2,
    group_name_ar: 'المجموعة الثانية: الأنشطة الميدانية والشراكات الخارجية',
    field_1_label: 'عدد الحضور',
    field_2_label: 'التحويلات (ثابتة/متنقلة)',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'جلسات التوعية المجتمعية المشتركة مع الأوقاف والكنائس المصرية',
    icon_name: 'BookOpen',
  },
  {
    code: 10,
    name_ar: 'قوافل خارجية',
    group_id: 2,
    group_name_ar: 'المجموعة الثانية: الأنشطة الميدانية والشراكات الخارجية',
    field_1_label: 'عدد الحضور',
    field_2_label: 'التحويلات (ثابتة/متنقلة)',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'الخدمات الموجهة للمناطق النائية والأكثر احتياجاً عبر العيادات المتنقلة',
    icon_name: 'Truck',
  },
  {
    code: 11,
    name_ar: 'أنشطة القطاع الخاص',
    group_id: 2,
    group_name_ar: 'المجموعة الثانية: الأنشطة الميدانية والشراكات الخارجية',
    field_1_label: 'عدد الحضور',
    field_2_label: 'التحويلات (ثابتة/متنقلة)',
    field_3_label: 'مستخدمات وسائل LARC',
    description: 'الأنشطة المنسقة في المصانع والشركات والعيادات الخاصة',
    icon_name: 'Building2',
  },

  // المجموعة الثالثة
  {
    code: 12,
    name_ar: 'منصرف وسائل LARC',
    group_id: 3,
    group_name_ar: 'المجموعة الثالثة: حصيلة الوسائل طويلة المدى LARC',
    field_1_label: 'لولب نحاسي المنصرف',
    field_2_label: 'لولب هرموني المنصرف',
    field_3_label: 'كبسولات إمبلانون المنصرف',
    description: 'حصر أرصدة ومخرجات صرف الوسائل طويلة المفعول على مستوى منافذ الإدارة',
    icon_name: 'ShieldCheck',
  },
];

export const SAMPLE_GOVERNORATES: Governorate[] = OFFICIAL_GOVERNORATES;

export const DEMO_PROFILES: Record<string, UserProfile> = {
  district: {
    id: 'usr-district-01',
    full_name: 'أحمد محمود إسماعيل',
    national_id: '29005150102456',
    role: 'district_user',
    role_title_ar: 'موظف إدخال وتجميع - الإدارة الصحية',
    governorate_id: 'gov-cairo',
    governorate_name_ar: 'القاهرة',
    district_id: 'dist-cairo-nasr-city',
    district_name_ar: 'إدارة مدينة نصر الطبية',
  },
  directorate: {
    id: 'usr-dir-01',
    full_name: 'د. مروة كمال الدين الشريف',
    national_id: '28203100109988',
    role: 'directorate_user',
    role_title_ar: 'مدير إدارة تنظيم وتنمية الأسرة بالمديرية',
    governorate_id: 'gov-cairo',
    governorate_name_ar: 'القاهرة',
  },
  ministry_director: {
    id: 'usr-min-dir-01',
    full_name: 'د. سامح عبد الفتاح رضوان',
    national_id: '27508210103421',
    role: 'general_director',
    role_title_ar: 'مدير عام تنمية الأسرة بديوان الوزارة',
  },
  central_admin: {
    id: 'usr-central-01',
    full_name: 'د. إيناس مصطفى عز العرب',
    national_id: '27211150101122',
    role: 'central_admin',
    role_title_ar: 'رئيس الإدارة المركزية لشئون السكان ورعاية الأمومة',
  },
  sector_head: {
    id: 'usr-sector-01',
    full_name: 'أ.د. رئيس قطاع الرعاية الصحية وتنمية الأسرة',
    national_id: '26804120100011',
    role: 'sector_head',
    role_title_ar: 'رئيس القطاع ومفوض معالي الوزير',
  },
};
