import { SectionDefinition, Governorate, UserProfile } from './types';

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

export const SAMPLE_GOVERNORATES: Governorate[] = [
  {
    id: 'gov-cairo',
    code: '01',
    name_ar: 'القاهرة',
    districts: [
      { id: 'dist-cairo-nasr-city', code: '0101', name_ar: 'إدارة مدينة نصر الطبية', governorate_id: 'gov-cairo' },
      { id: 'dist-cairo-helwan', code: '0102', name_ar: 'إدارة حلوان الطبية', governorate_id: 'gov-cairo' },
      { id: 'dist-cairo-maadi', code: '0103', name_ar: 'إدارة المعادي الطبية', governorate_id: 'gov-cairo' },
      { id: 'dist-cairo-shubra', code: '0104', name_ar: 'إدارة شبرا الطبية', governorate_id: 'gov-cairo' },
    ],
  },
  {
    id: 'gov-giza',
    code: '02',
    name_ar: 'الجيزة',
    districts: [
      { id: 'dist-giza-dokki', code: '0201', name_ar: 'إدارة الدقي والعجوزة الطبية', governorate_id: 'gov-giza' },
      { id: 'dist-giza-october', code: '0202', name_ar: 'إدارة 6 أكتوبر الطبية', governorate_id: 'gov-giza' },
      { id: 'dist-giza-omraneya', code: '0203', name_ar: 'إدارة العمرانية الطبية', governorate_id: 'gov-giza' },
    ],
  },
  {
    id: 'gov-alex',
    code: '03',
    name_ar: 'الإسكندرية',
    districts: [
      { id: 'dist-alex-montaza', code: '0301', name_ar: 'إدارة المنتزه الطبية', governorate_id: 'gov-alex' },
      { id: 'dist-alex-east', code: '0302', name_ar: 'إدارة شرق الطبية', governorate_id: 'gov-alex' },
      { id: 'dist-alex-wasat', code: '0303', name_ar: 'إدارة وسط الطبية', governorate_id: 'gov-alex' },
    ],
  },
  {
    id: 'gov-asyut',
    code: '25',
    name_ar: 'أسيوط',
    districts: [
      { id: 'dist-asyut-sharq', code: '2501', name_ar: 'إدارة أسيوط شرق الطبية', governorate_id: 'gov-asyut' },
      { id: 'dist-asyut-manfalut', code: '2502', name_ar: 'إدارة منفلوط الطبية', governorate_id: 'gov-asyut' },
      { id: 'dist-asyut-qusiya', code: '2503', name_ar: 'إدارة القوصية الطبية', governorate_id: 'gov-asyut' },
    ],
  },
  {
    id: 'gov-qalyubia',
    code: '14',
    name_ar: 'القليوبية',
    districts: [
      { id: 'dist-qal-benha', code: '1401', name_ar: 'إدارة بنها الطبية', governorate_id: 'gov-qalyubia' },
      { id: 'dist-qal-shubra', code: '1402', name_ar: 'إدارة شبرا الخيمة الطبية', governorate_id: 'gov-qalyubia' },
    ],
  },
];

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
