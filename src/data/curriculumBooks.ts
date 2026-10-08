export interface CurriculumLecture {
  name: string;
  url?: string;
  lectureNumber?: number;
}

export interface CurriculumSubject {
  id: string;
  name: string;
  code?: string;
  url?: string;
  fileKey?: string;
  lectures: CurriculumLecture[];
  // Backwards-compatible aliases if referenced elsewhere
  parts?: CurriculumLecture[];
}

export interface CurriculumGrade {
  id: string;
  name: string;
  folderName?: string;
  branch: 'none' | 'scientific' | 'literary';
  subjects: CurriculumSubject[];
}

export interface CurriculumStage {
  id: string;
  name: string;
  color?: string;
  grades: CurriculumGrade[];
}

// ============================================================================
// محاضرات قسم تقنيات الأشعة والتصوير الطبي (المراحل الأربعة المتكاملة)
// كل مادة تضم سلسلة محاضرات أكاديمية مفصلة ومرتبة
// ============================================================================
export const LECTURES_DATA: CurriculumStage[] = [
  {
    id: 'undergrad_radiology',
    name: 'المراحل الجامعية - تقنيات الأشعة والتصوير الطبي',
    color: 'cyan',
    grades: [
      // ----------------------------------------------------------------------
      // المرحلة الأولى: الأساسيات والفيزياء والتشريح
      // ----------------------------------------------------------------------
      {
        id: 'stage_1',
        name: 'المرحلة الأولى',
        folderName: 'stage_1',
        branch: 'none',
        subjects: [
          {
            id: 'rad_phys_1',
            name: 'فيزياء الإشعاع والأشعة (Radiation Physics)',
            code: 'RAD101',
            lectures: [
              { name: 'المحاضرة 1: مدخل إلى بنية الذرة والإشعاع الكهرومغناطيسي', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: آلية إنتاج الأشعة السينية وأنبوبة الأشعة (X-Ray Production & Tube Physics)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: تفاعل الإشعاع مع المادة (Compton & Photoelectric Effect)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: توهين الأشعة والجرعات الإشعاعية (Attenuation & Radiation Quantities)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: معايير جودة الحزمة الإشعاعية والفلترة (Beam Quality & Filtration)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: الكواشف الإشعاعية وقياس الإشعاع (Radiation Detectors & Dosimetry)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 7: العوامل المؤثرة على التعريض الإشعاعي (kVp, mAs, Distance)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 8: مراجعة شاملة ومسائل الحسابات الإشعاعية للفاينل الوزاري', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'anatomy_1',
            name: 'التشريح البشري العام (Human Anatomy)',
            code: 'ANAT102',
            lectures: [
              { name: 'المحاضرة 1: تشريح عظام ومفاصل الطرف العلوي (Upper Limb Anatomy)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: تشريح عظام ومفاصل الطرف السفلي (Lower Limb Anatomy)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: تشريح القفص الصدري والرئتين (Thoracic Cage & Respiratory Anatomy)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: تشريح القلب والأوعية الدموية الرئيسية (Cardiovascular Anatomy)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: تشريح العمود الفقري والحبل الشوكي (Vertebral Column & Spinal Cord)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: تشريح البطن والأحشاء الداخلية (Abdomen & Viscera)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 7: تشريح الحوض والأعضاء التناسلية والبولية (Pelvic Anatomy)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 8: تشريح الجمجمة وعظام الوجه (Skull & Facial Bones)', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'physiology_1',
            name: 'الفسلجة الطبية العامة (Medical Physiology)',
            code: 'PHYS103',
            lectures: [
              { name: 'المحاضرة 1: فسلجة الخلية ونقل المواد وتوازن السوائل (Cell Physiology & Homeostasis)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: فسلجة القلب والدورة الدموية وضغط الدم (Cardiovascular System)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: فسلجة الجهاز التنفسي وتبادل الغازات (Respiratory Physiology)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: فسلجة الجهاز البولي ووظائف الكلى (Renal Physiology & GFR)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: فسلجة الجهاز العصبي المركزي ونقل الإشارات (Nervous System)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: فسلجة الغدد الصماء والهرمونات (Endocrine System)', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'med_terms_1',
            name: 'المصطلحات الطبية واللغة (Medical Terminology)',
            code: 'TERM104',
            lectures: [
              { name: 'المحاضرة 1: اللواحق والبوادئ والجذور الطبية (Medical Prefixes & Suffixes)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: مصطلحات الأوضاع والاتجاهات التشريحية (Anatomical Directions & Positions)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: مصطلحات الأمراض والإجراءات الإشعاعية (Diagnostic Radiology Terms)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: المصطلحات السريرية الشائعة في المستشفيات وكتابة التقارير', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'biochem_1',
            name: 'الكيمياء الحياتية الطبية (Medical Biochemistry)',
            code: 'BIO105',
            lectures: [
              { name: 'المحاضرة 1: كيمياء الدم والإنزيمات والبروتينات الحيوية', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: وظائف الكلى والكرياتينين وتأثير صبغات التباين الإشعاعية', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: وظائف الكبد والأيض الحيوي والتوازن الحمضي القاعدي', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'informatics_1',
            name: 'الحاسوب والأنظمة الطبية (Medical Informatics)',
            code: 'COMP106',
            lectures: [
              { name: 'المحاضرة 1: أساسيات معالجة الصور الرقمية الإشعاعية (Digital Image Processing)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: أنظمة الشبكات وقواعد البيانات الطبية في المستشفيات', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: مقدمة في أنظمة حفظ الصور الطبية (DICOM & PACS Basics)', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'ethics_1',
            name: 'أخلاقيات المهن الطبية والسلامة (Medical Ethics)',
            code: 'ETH107',
            lectures: [
              { name: 'المحاضرة 1: ميثاق أخلاقيات تقني الأشعة وحقوق المريض وسرية البيانات', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: إجراءات مكافحة العدوى والتعقيم في أقسام الأشعة', url: 'https://drive.google.com' },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // المرحلة الثانية: الأشعة السينية والتشريح الشعاعي والوقاية
      // ----------------------------------------------------------------------
      {
        id: 'stage_2',
        name: 'المرحلة الثانية',
        folderName: 'stage_2',
        branch: 'none',
        subjects: [
          {
            id: 'xray_tech_2',
            name: 'تقنيات الأشعة السينية التقليدية (X-Ray Positioning)',
            code: 'RAD201',
            lectures: [
              { name: 'المحاضرة 1: وضعيات تصوير الصدر الروتينية والخاصة (Chest Radiography: PA, Lat, Lordotic)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: وضعيات تصوير البطن والحوض (Abdomen Erect/Supine & Pelvis AP)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: وضعيات تصوير الطرف العلوي (Hand, Wrist, Forearm, Elbow)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: وضعيات تصوير الكتف وعظم الترقوة ولوح الكتف (Shoulder & Clavicle)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: وضعيات تصوير الطرف السفلي (Foot, Ankle, Leg, Knee, Femur)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: وضعيات تصوير العمود الفقري العنقي والصدري (Cervical & Thoracic Spine)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 7: وضعيات تصوير العمود الفقري القطني والعجزي (Lumbar & Sacrum Spine)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 8: وضعيات تصوير الجمجمة وعظام الوجه (Skull, Towne, Waters View)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 9: فحوصات التنظير التألقي والصبغات (Fluoroscopy & Barium Meal / Enema)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 10: تقنيات تصوير الأطفال والحوادث الطارئة في المستشفى (Pediatric & Trauma Radiography)', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'rad_anatomy_2',
            name: 'التشريح الشعاعي (Radiological Anatomy)',
            code: 'RAD202',
            lectures: [
              { name: 'المحاضرة 1: قراءة وتحليل التشريح الشعاعي الطبيعي للصدر (Normal Chest X-Ray Landmarks)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: التشريح الشعاعي لعظام ومفاصل الأطراف العلوية والسفلية', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: التشريح الشعاعي للعمود الفقري ومخارج الأعصاب', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: التشريح الشعاعي للجمجمة والجيوب الأنفية وقاعدة الجمجمة', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: العلامات الشعاعية الطبيعية والتشوهات التطورية الشائعة', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: التشريح الشعاعي لفحوصات الجهاز الهضمي والبولي الملونة', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'rad_protection_2',
            name: 'الوقاية الإشعاعية والسلامة (Radiation Protection)',
            code: 'RAD203',
            lectures: [
              { name: 'المحاضرة 1: المبادئ الدولية للحماية الإشعاعية وقاعدة ALARA ومعايير ICRP', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: التأثيرات البيولوجية للإشعاع (Deterministic & Stochastic Effects)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: وسائل الوقاية والتدريع الرصاصي للمريض ولتقني الأشعة', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: أجهزة مراقبة الجرعات الشخصية (Film Badges & TLD Dosimeters)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: حسابات سمك الجدران والتدريع لغرف الأشعة والمفراس', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: بنك أسئلة الامتحان التقويمي الوزاري للوقاية الإشعاعية', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'rad_equip_2',
            name: 'أجهزة ومعدات التصوير الطبي (Radiographic Equipment)',
            code: 'RAD204',
            lectures: [
              { name: 'المحاضرة 1: تصميم أنبوبة الأشعة السينية والأنود الدوار والكاثود', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: مولدات الجهد العالي والدوائر الكهربائية للتحكم بالتعريض', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: أنظمة الأشعة المحوسبة (Computed Radiography - CR & PSP Plates)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: أنظمة الأشعة الرقمية المباشرة (Direct Radiography - Flat Panel Detectors)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: الشبكات المانعة للتبعثر (Anti-Scatter Grids) وتأثيرها على جودة الصورة', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: أجهزة التنظير التألقي الرقمي (Digital Fluoroscopy & C-Arm)', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'pathology_2',
            name: 'علم الأمراض الشعاعي (Radiographic Pathology)',
            code: 'PATH205',
            lectures: [
              { name: 'المحاضرة 1: أمراض الجهاز التنفسي في أفلام الأشعة (Pneumonia, Pleural Effusion, TB)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: أمراض وأورام العظام والكسور المرضية وهشاشة العظام', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: أمراض البطن والانسداد المعوي والتثقب (Pneumoperitoneum)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: أمراض الجهاز البولي وحصوات الكلى في صور الأشعة KUB', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'clinical_train_2',
            name: 'التدريب السريري في المستشفيات (Hospital Clinical Log)',
            code: 'CLIN206',
            lectures: [
              { name: 'المحاضرة 1: بروتوكول استقبال المريض والتحقق من الهوية وطلب الفحص', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: التعامل مع الحالات الطارئة وغرف الإنعاش والعناية المركزة', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: إرشادات كتابة تقرير الحالات الإشعاعية وتوثيق الفحوصات', url: 'https://drive.google.com' },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // المرحلة الثالثة: المفراس والرنين والسونار والقسطرة
      // ----------------------------------------------------------------------
      {
        id: 'stage_3',
        name: 'المرحلة الثالثة',
        folderName: 'stage_3',
        branch: 'none',
        subjects: [
          {
            id: 'ct_scan_3',
            name: 'تقنيات المفراس الحلزوني المقطعي (Computed Tomography - CT)',
            code: 'CT301',
            lectures: [
              { name: 'المحاضرة 1: فيزياء المفراس المقطعي وتاريخ أجيال الماسحات (CT Generations & Physics)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: معايير ومحددات الفحص: Pitch, Slice Thickness, kVp, mAs', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: مقياس هاونسفيلد وضبط النوافذ التشخيصية (Hounsfield Units & Windowing)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: بروتوكولات فحص الدماغ والحوادث الطارئة والنزف الدماغي (Brain CT Protocols)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: بروتوكولات فحص الصدر والجلطة الرئوية (Chest CT & CTPA Protocols)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: بروتوكولات فحص البطن والحوض وحقن الصبغة الوريدية ثلاثي المراحل (Triphasic Abdomen CT)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 7: تصوير الشرايين والأوعية بالمفراس المقطعي (CT Angiography - CTA)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 8: الجرعة الإشعاعية وتقنيات خفض الجرعة في المفراس (CTDI & Dose Modulation)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 9: التشوهات والعيوب الصورية في المفراس وطرق التغلب عليها (CT Artifacts)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 10: بنك أسئلة الامتحان التقويمي الوزاري لمادة المفراس الحلزوني CT', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'mri_intro_3',
            name: 'تقنيات الرنين المغناطيسي الأساسي (MRI Technology - Principles)',
            code: 'MRI302',
            lectures: [
              { name: 'المحاضرة 1: فيزياء الرنين المغناطيسي وحركة البروتونات والمجال المغناطيسي B0', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: ظاهرة الرنين والتردد النبضي Larmor Frequency ومعادلة لارمور', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: تسلسلات النبض الأساسية ومبدأ التباين: T1-Weighted, T2-Weighted, PD', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: تسلسلات الصدى السريع ومبدأ الانعكاس: Spin Echo, Fast Spin Echo, Inversion Recovery (STIR, FLAIR)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: السلامة والاحتياطات الصارمة داخل غرفة الرنين (MRI Safety Zones, SAR & Implants)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: بروتوكولات رنين الدماغ والجهاز العصبي (Brain MRI Routine Protocols)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 7: بروتوكولات رنين العمود الفقري العنقي والقطني (Spine MRI Protocols)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 8: صبغات التباين في الرنين (Gadolinium Contrast Properties & Safety)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 9: التشوهات والعيوب الصورية في الرنين المغناطيسي وطرق تفاديها (MRI Artifacts)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 10: بنك أسئلة الامتحان التقويمي الوزاري لمادة الرنين المغناطيسي MRI', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'ultrasound_3',
            name: 'تقنيات الموجات فوق الصوتية والسونار (Ultrasound Imaging)',
            code: 'US303',
            lectures: [
              { name: 'المحاضرة 1: الفيزياء الصوتية ومبدأ الكهروإجهاد والمجسات الترددية (Transducers & Piezoelectric Effect)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: تقنيات الدوبلر اللوني والموجي وتصوير تدفق الدم (Color & Spectral Doppler)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: بروتوكولات فحص البطن وسونار الكبد والمرارة والبنكرياس والطحال', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: سونار الكلى والمثانة والجهاز البولي وفحوصات الحوض', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: سونار الرقبة والغدة الدرقية والأنسجة السطحية (Small Parts & Thyroid Ultrasound)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: التشوهات والعيوب الصورية في السونار (Ultrasound Artifacts & Optimization)', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'interventional_3',
            name: 'تقنيات الأشعة التداخلية والقسطرة (Interventional Radiology)',
            code: 'INT304',
            lectures: [
              { name: 'المحاضرة 1: تصميم غرف القسطرة وتقنيات التصوير الطرحي الرقمي (Digital Subtraction Angiography - DSA)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: أدوات القسطرة: القساطر الشريانية، الأسلاك التوجيهية، والدعامات (Catheters & Stents)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: الإجراءات العلاجية: قسطرة وتوسيع الشرايين، الانصمام، وسحب السوائل تحت التوجيه الإشعاعي', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'nuclear_med_3',
            name: 'الطب النووي والتصوير النظائري (Nuclear Medicine)',
            code: 'NUC305',
            lectures: [
              { name: 'المحاضرة 1: فيزياء النظائر المشعة وإنتاج التكنوشيوم Tc-99m ومولدات النظائر', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: مبدأ عمل كاميرا جاما وتصوير الـ SPECT ثلاثي الأبعاد', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: المسح الوميضي للعظام والغدة الدرقية والكلى (Bone & Thyroid Scintigraphy)', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'patient_care_3',
            name: 'العناية بالمرضى ومواد التباين والصبغات (Contrast Media & Care)',
            code: 'CARE306',
            lectures: [
              { name: 'المحاضرة 1: تصنيف صبغات التباين اليودية وغير اليودية ومستويات الأسمولية (Osmolality)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: اعتلال الكلى الناتج عن الصبغات والبروتوكولات الوقائية (Contrast-Induced Nephropathy - CIN)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: التعامل الفوري مع صدمات الحساسية وحقن الأدرينالين والإسعافات الطارئة', url: 'https://drive.google.com' },
            ],
          },
        ],
      },

      // ----------------------------------------------------------------------
      // المرحلة الرابعة: الرنين والمفراس المتقدم والطب النووي وبحوث التخرج
      // ----------------------------------------------------------------------
      {
        id: 'stage_4',
        name: 'المرحلة الرابعة',
        folderName: 'stage_4',
        branch: 'none',
        subjects: [
          {
            id: 'adv_mri_4',
            name: 'تقنيات الرنين المغناطيسي المتقدم (Advanced MRI)',
            code: 'AMRI401',
            lectures: [
              { name: 'المحاضرة 1: تصوير الانتشار والتروية بالرنين المغناطيسي (Diffusion-Weighted MRI & ADC Map)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: تصوير الأوعية الدموية بالرنين المغناطيسي مع الصبغة وبدونها (MRA & MRV)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: تصوير القنوات الصفراوية والبنكرياس بالرنين (MRCP Protocols & Sequences)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: رنين العظام والمفاصل والأربطة والأوتار المتقدم (Musculoskeletal MRI - MSK)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 5: الرنين الوظيفي وتخطيط مسارات الدماغ (Functional MRI & DTI Tractography)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 6: الرنين الطيفي وتحليل كيمياء الأورام (Magnetic Resonance Spectroscopy - MRS)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 7: بروتوكولات رنين القلب والأوعية الدموية (Cardiac MRI Protocols)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 8: مراجعة شاملة لأسئلة الامتحان التقويمي الوزاري لمادة الرنين المتقدم', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'adv_ct_4',
            name: 'المفراس المتقدم والتصوير الهجين PET-CT (Advanced CT & Molecular Imaging)',
            code: 'ACT402',
            lectures: [
              { name: 'المحاضرة 1: المفراس ثنائي الطاقة والمطيافي (Dual-Source & Spectral CT)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: فيزياء ومبدأ التصوير البوزيتروني الهجين PET-CT في الأورام', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: المادة الصيدلانية المشعة 18F-FDG وبروتوكولات تحضير المريض وفحص الجسم الشامل', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: تقييم الاستجابة للعلاج الكيماوي والإشعاعي ومتابعة الأورام عبر PET-CT', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'qa_pacs_4',
            name: 'إدارة وضمان جودة أقسام الأشعة ونظام PACS / DICOM',
            code: 'QA403',
            lectures: [
              { name: 'المحاضرة 1: معايير وبرامج ضبط وتوكيد الجودة الدولية (QA/QC) لأجهزة الأشعة والمفراس والرنين', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: فانتومات المعايرة الدورية واختبارات الدقة والتجانس (Phantoms & Calibration Tests)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: معيار DICOM الطبي وأرشفة الصور والربط الشبكي في المستشفيات (PACS Architecture)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 4: نظام معلومات قسم الأشعة (Radiology Information System - RIS) وأمن البيانات الطبية', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'radiotherapy_4',
            name: 'العلاج الإشعاعي والمعجلات الخطية (Radiation Therapy & LINAC)',
            code: 'RT404',
            lectures: [
              { name: 'المحاضرة 1: مبادئ العلاج الإشعاعي للأورام وفيزياء المعجلات الخطية (Linear Accelerators - LINAC)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: محاكاة وتخطيط العلاج الإشعاعي عبر المفراس (CT Simulation & 3D-CRT Planning)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: العلاج الإشعاعي معدل الكثافة والتوجيه الصوري (IMRT & IGRT Techniques)', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'mammography_4',
            name: 'تصوير الثدي الشعاعي والماموغرام وفحص هشاشة العظام (Mammography & DEXA)',
            code: 'MAM405',
            lectures: [
              { name: 'المحاضرة 1: تقنيات الماموغرام الرقمي وضبط ضغط وضغط الثدي والوضعيات الروتينية (CC & MLO Views)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: التصوير المقطعي ثلاثي الأبعاد للثدي (Digital Breast Tomosynthesis - DBT)', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: فحص كثافة العظام ثنائي الطاقة (Dual-Energy X-Ray Absorptiometry - DEXA) ومعايير T-Score', url: 'https://drive.google.com' },
            ],
          },
          {
            id: 'grad_project_4',
            name: 'دليل وإرشادات مشروع وبحث التخرج (Graduation Research Project)',
            code: 'RES406',
            lectures: [
              { name: 'المحاضرة 1: منهجية البحث العلمي واختيار عنوان بحث تقنيات الأشعة والتصوير الطبي', url: 'https://drive.google.com' },
              { name: 'المحاضرة 2: صياغة خطة البحث، جمع الحالات السريرية في المستشفيات، وتحليل البيانات الإحصائية', url: 'https://drive.google.com' },
              { name: 'المحاضرة 3: كتابة الأطروحة والتوثيق الأكاديمي لمراجع فانكوفر وإرشادات جلسة المناقشة', url: 'https://drive.google.com' },
            ],
          },
        ],
      },
    ],
  },
];

// Compatibility alias if any external component imports BOOKS_DATA or HANDOUTS_DATA
export const BOOKS_DATA: CurriculumStage[] = LECTURES_DATA;
export const HANDOUTS_DATA: CurriculumStage[] = LECTURES_DATA;
