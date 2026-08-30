/**
 * Default Presets and Initial Sample Data for Smart Event Registry
 */

// Target preset standard field definitions
const TARGET_PRESETS = {
  student: {
    name: '학생',
    icon: 'graduation-cap',
    description: '교내 대회, 진로체험, 방과후학교, 학생 프로그램 등',
    fields: [
      { id: 'seq', label: '연번', type: 'number', required: false, enabled: true, auto: true },
      { id: 'grade', label: '학년', type: 'select', options: ['1학년', '2학년', '3학년', '4학년', '5학년', '6학년'], required: true, enabled: true },
      { id: 'classRoom', label: '반', type: 'select', options: ['1반', '2반', '3반', '4반', '5반', '6반', '7반', '8반', '9반', '10반'], required: true, enabled: true },
      { id: 'num', label: '번호', type: 'number', required: false, enabled: true },
      { id: 'name', label: '이름', type: 'text', required: true, enabled: true },
      { id: 'phone', label: '전화번호', type: 'tel', placeholder: '010-0000-0000', required: false, enabled: true },
      { id: 'email', label: '이메일', type: 'email', placeholder: 'student@school.kr', required: false, enabled: false },
      { id: 'affiliation', label: '소속 (동아리/학급)', type: 'text', required: false, enabled: false },
      { id: 'timestamp', label: '입력 시간', type: 'time', required: false, enabled: true, auto: true },
      { id: 'signature', label: '자필 서명', type: 'signature', required: true, enabled: true }
    ]
  },
  teacher: {
    name: '교사 / 교직원',
    icon: 'briefcase',
    description: '교직원 연수, 교내 회의, 협의회, 공개수업 참관 등',
    fields: [
      { id: 'seq', label: '연번', type: 'number', required: false, enabled: true, auto: true },
      { id: 'name', label: '이름', type: 'text', required: true, enabled: true },
      { id: 'department', label: '부서 / 소속', type: 'select', options: ['교무기획부', '교육과정부', '학생생활안전부', '진로진학상담부', '창의체험부', '행정실', '1학년부', '2학년부', '3학년부'], required: true, enabled: true },
      { id: 'jobTitle', label: '담당 업무 / 직책', type: 'text', placeholder: '예: 부장교사, 담임, 학적담당', required: false, enabled: true },
      { id: 'phone', label: '전화번호', type: 'tel', placeholder: '010-0000-0000', required: false, enabled: true },
      { id: 'email', label: '이메일', type: 'email', placeholder: 'teacher@school.kr', required: false, enabled: false },
      { id: 'timestamp', label: '입력 시간', type: 'time', required: false, enabled: true, auto: true },
      { id: 'signature', label: '자필 서명', type: 'signature', required: true, enabled: true }
    ]
  },
  parent: {
    name: '학부모',
    icon: 'users',
    description: '학부모 설명회, 학교 공개수업, 입학설명회, 총회 등',
    fields: [
      { id: 'seq', label: '연번', type: 'number', required: false, enabled: true, auto: true },
      { id: 'studentName', label: '학생 이름', type: 'text', placeholder: '자녀 이름', required: true, enabled: true },
      { id: 'gradeClass', label: '학년 / 반', type: 'text', placeholder: '예: 2학년 3반', required: true, enabled: true },
      { id: 'parentName', label: '학부모 이름', type: 'text', placeholder: '참석 학부모 성함', required: true, enabled: true },
      { id: 'relationship', label: '관계', type: 'select', options: ['부', '모', '조부', '조모', '보호자', '기타'], required: true, enabled: true },
      { id: 'phone', label: '전화번호', type: 'tel', placeholder: '010-0000-0000', required: true, enabled: true },
      { id: 'email', label: '이메일', type: 'email', placeholder: 'parent@email.com', required: false, enabled: false },
      { id: 'timestamp', label: '입력 시간', type: 'time', required: false, enabled: true, auto: true },
      { id: 'signature', label: '자필 서명', type: 'signature', required: true, enabled: true }
    ]
  },
  other: {
    name: '기타 / 일반 참가자',
    icon: 'globe',
    description: '학교 축제 방문객, 외부 초청 인사, 지역사회 행사 등',
    fields: [
      { id: 'seq', label: '연번', type: 'number', required: false, enabled: true, auto: true },
      { id: 'name', label: '이름', type: 'text', required: true, enabled: true },
      { id: 'affiliation', label: '소속 기관 / 직책', type: 'text', placeholder: '예: 00교육청 장학사, 00대학교', required: false, enabled: true },
      { id: 'phone', label: '전화번호', type: 'tel', placeholder: '010-0000-0000', required: true, enabled: true },
      { id: 'email', label: '이메일', type: 'email', placeholder: 'user@email.com', required: false, enabled: false },
      { id: 'timestamp', label: '입력 시간', type: 'time', required: false, enabled: true, auto: true },
      { id: 'signature', label: '자필 서명', type: 'signature', required: true, enabled: true }
    ]
  }
};

// Sample Signature SVG base64 helper
function createSampleSignSvg(name) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="60" viewBox="0 0 160 60">
    <path d="M 20,40 Q 40,10 65,35 T 110,25 Q 130,45 145,20" fill="none" stroke="#1e293b" stroke-width="3" stroke-linecap="round"/>
    <text x="75" y="48" font-size="12" font-family="sans-serif" fill="#64748b" text-anchor="middle">${name}</text>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

// Initial Sample Events & Registrations
const INITIAL_SAMPLE_DATA = {
  events: [
    {
      id: 'evt_sample_001',
      title: '2026학년도 2학기 학부모 교육과정 설명회',
      date: '2026-09-05',
      time: '14:00',
      location: '본관 1층 시청각실',
      description: '2026학년도 2학기 학교 교육활동 및 고교학점제 운영 계획 안내를 위한 학부모 설명회입니다. 등록 후 자료집을 수령해주시기 바랍니다.',
      target: 'parent',
      fields: [
        { id: 'seq', label: '연번', type: 'number', required: false, enabled: true, auto: true },
        { id: 'studentName', label: '학생 이름', type: 'text', placeholder: '자녀 이름', required: true, enabled: true },
        { id: 'gradeClass', label: '학년 / 반', type: 'text', placeholder: '예: 2학년 3반', required: true, enabled: true },
        { id: 'parentName', label: '학부모 성함', type: 'text', placeholder: '참석 학부모 성함', required: true, enabled: true },
        { id: 'relationship', label: '관계', type: 'select', options: ['부', '모', '조부', '조모', '보호자', '기타'], required: true, enabled: true },
        { id: 'phone', label: '전화번호', type: 'tel', placeholder: '010-0000-0000', required: true, enabled: true },
        { id: 'email', label: '이메일', type: 'email', placeholder: 'parent@email.com', required: false, enabled: false },
        { id: 'timestamp', label: '입력 시간', type: 'time', required: false, enabled: true, auto: true },
        { id: 'signature', label: '자필 서명', type: 'signature', required: true, enabled: true }
      ],
      customFields: [
        { id: 'cust_car_num', label: '차량 번호 (주차 등록)', type: 'text', placeholder: '예: 12가 3456 (미주차시 공란)', required: false, enabled: true },
        { id: 'cust_attend_count', label: '참석 인원', type: 'select', options: ['1명', '2명', '3명 이상'], required: true, enabled: true }
      ],
      printSettings: {
        showTitle: true,
        showDate: true,
        showLocation: true,
        showPhone: true,
        showTimestamp: true,
        showSignature: true,
        showSignBox: true
      },
      createdAt: '2026-08-30T09:00:00',
      updatedAt: '2026-08-30T09:00:00'
    },
    {
      id: 'evt_sample_002',
      title: '2026학년도 창의융합 진로체험의 날 (꿈찾기 페스티벌)',
      date: '2026-09-12',
      time: '09:30',
      location: '체육관 및 각 특별교실',
      description: '미래 신산업(AI, 로봇, 바이오, 콘텐츠) 진로직업 체험 활동 등록부입니다.',
      target: 'student',
      fields: [
        { id: 'seq', label: '연번', type: 'number', required: false, enabled: true, auto: true },
        { id: 'grade', label: '학년', type: 'select', options: ['1학년', '2학년', '3학년'], required: true, enabled: true },
        { id: 'classRoom', label: '반', type: 'select', options: ['1반', '2반', '3반', '4반', '5반', '6반', '7반', '8반'], required: true, enabled: true },
        { id: 'num', label: '번호', type: 'number', placeholder: '출석번호', required: true, enabled: true },
        { id: 'name', label: '학생 이름', type: 'text', required: true, enabled: true },
        { id: 'phone', label: '전화번호', type: 'tel', placeholder: '010-0000-0000', required: true, enabled: true },
        { id: 'timestamp', label: '입력 시간', type: 'time', required: false, enabled: true, auto: true },
        { id: 'signature', label: '자필 서명', type: 'signature', required: true, enabled: true }
      ],
      customFields: [
        { id: 'cust_booth', label: '1지망 희망 부스', type: 'select', options: ['AI 자율주행 로봇', '드론 항공 시뮬레이션', '바이오 유전자 연구', '디지털 메타버스 크리에이터', '신재생 에너지'], required: true, enabled: true }
      ],
      printSettings: {
        showTitle: true,
        showDate: true,
        showLocation: true,
        showPhone: true,
        showTimestamp: true,
        showSignature: true,
        showSignBox: true
      },
      createdAt: '2026-08-30T10:00:00',
      updatedAt: '2026-08-30T10:00:00'
    },
    {
      id: 'evt_sample_003',
      title: '2026학년도 교직원 AI 디지털 역량강화 직무연수',
      date: '2026-09-18',
      time: '15:30',
      location: '본관 3층 컴퓨터실',
      description: '수업 및 업무 혁신을 위한 생성형 AI 도구 활용 직무연수 등록부입니다.',
      target: 'teacher',
      fields: [
        { id: 'seq', label: '연번', type: 'number', required: false, enabled: true, auto: true },
        { id: 'name', label: '성명', type: 'text', required: true, enabled: true },
        { id: 'department', label: '부서 / 학년', type: 'select', options: ['교무기획부', '교육과정부', '학생생활안전부', '진로진학상담부', '창의체험부', '행정실', '1학년부', '2학년부', '3학년부'], required: true, enabled: true },
        { id: 'jobTitle', label: '담당 교과 / 업무', type: 'text', placeholder: '예: 수학, 정보, 학적담당', required: false, enabled: true },
        { id: 'phone', label: '연락처', type: 'tel', placeholder: '010-0000-0000', required: true, enabled: true },
        { id: 'timestamp', label: '입력 시간', type: 'time', required: false, enabled: true, auto: true },
        { id: 'signature', label: '자필 서명', type: 'signature', required: true, enabled: true }
      ],
      customFields: [
        { id: 'cust_device', label: '연수용 태블릿 대여 희망', type: 'checkbox', required: false, enabled: true }
      ],
      printSettings: {
        showTitle: true,
        showDate: true,
        showLocation: true,
        showPhone: true,
        showTimestamp: true,
        showSignature: true,
        showSignBox: true
      },
      createdAt: '2026-08-30T11:00:00',
      updatedAt: '2026-08-30T11:00:00'
    }
  ],
  registrations: [
    // Sample registrations for Parent Event (evt_sample_001)
    {
      id: 'reg_p_001',
      eventId: 'evt_sample_001',
      seq: 1,
      data: {
        studentName: '김민준',
        gradeClass: '2학년 3반',
        parentName: '김철수',
        relationship: '부',
        phone: '010-3456-7890',
        cust_car_num: '12가 3456',
        cust_attend_count: '1명'
      },
      signatureUrl: createSampleSignSvg('김철수'),
      registeredAt: '2026-09-05 13:42:15'
    },
    {
      id: 'reg_p_002',
      eventId: 'evt_sample_001',
      seq: 2,
      data: {
        studentName: '이서연',
        gradeClass: '2학년 1반',
        parentName: '박영희',
        relationship: '모',
        phone: '010-9876-5432',
        cust_car_num: '56너 7890',
        cust_attend_count: '2명'
      },
      signatureUrl: createSampleSignSvg('박영희'),
      registeredAt: '2026-09-05 13:45:30'
    },
    {
      id: 'reg_p_003',
      eventId: 'evt_sample_001',
      seq: 3,
      data: {
        studentName: '박지훈',
        gradeClass: '1학년 4반',
        parentName: '박태원',
        relationship: '부',
        phone: '010-2345-6789',
        cust_car_num: '',
        cust_attend_count: '1명'
      },
      signatureUrl: createSampleSignSvg('박태원'),
      registeredAt: '2026-09-05 13:48:10'
    },
    {
      id: 'reg_p_004',
      eventId: 'evt_sample_001',
      seq: 4,
      data: {
        studentName: '최예은',
        gradeClass: '3학년 2반',
        parentName: '정미경',
        relationship: '모',
        phone: '010-4567-8901',
        cust_car_num: '34다 9012',
        cust_attend_count: '1명'
      },
      signatureUrl: createSampleSignSvg('정미경'),
      registeredAt: '2026-09-05 13:52:45'
    },
    {
      id: 'reg_p_005',
      eventId: 'evt_sample_001',
      seq: 5,
      data: {
        studentName: '정우진',
        gradeClass: '2학년 5반',
        parentName: '정성훈',
        relationship: '부',
        phone: '010-6789-0123',
        cust_car_num: '78라 4321',
        cust_attend_count: '2명'
      },
      signatureUrl: createSampleSignSvg('정성훈'),
      registeredAt: '2026-09-05 13:56:02'
    },

    // Sample registrations for Student Career Event (evt_sample_002)
    {
      id: 'reg_s_001',
      eventId: 'evt_sample_002',
      seq: 1,
      data: {
        grade: '2학년',
        classRoom: '3반',
        num: 15,
        name: '강다니엘',
        phone: '010-1111-2222',
        cust_booth: 'AI 자율주행 로봇'
      },
      signatureUrl: createSampleSignSvg('강다니엘'),
      registeredAt: '2026-09-12 09:10:14'
    },
    {
      id: 'reg_s_002',
      eventId: 'evt_sample_002',
      seq: 2,
      data: {
        grade: '1학년',
        classRoom: '2반',
        num: 7,
        name: '윤하은',
        phone: '010-3333-4444',
        cust_booth: '디지털 메타버스 크리에이터'
      },
      signatureUrl: createSampleSignSvg('윤하은'),
      registeredAt: '2026-09-12 09:14:28'
    },
    {
      id: 'reg_s_003',
      eventId: 'evt_sample_002',
      seq: 3,
      data: {
        grade: '3학년',
        classRoom: '1반',
        num: 21,
        name: '송민호',
        phone: '010-5555-6666',
        cust_booth: '드론 항공 시뮬레이션'
      },
      signatureUrl: createSampleSignSvg('송민호'),
      registeredAt: '2026-09-12 09:18:50'
    },

    // Sample registrations for Teacher Training Event (evt_sample_003)
    {
      id: 'reg_t_001',
      eventId: 'evt_sample_003',
      seq: 1,
      data: {
        name: '홍길동',
        department: '교육과정부',
        jobTitle: '부장 / 수학',
        phone: '010-7777-8888',
        cust_device: true
      },
      signatureUrl: createSampleSignSvg('홍길동'),
      registeredAt: '2026-09-18 15:15:20'
    },
    {
      id: 'reg_t_002',
      eventId: 'evt_sample_003',
      seq: 2,
      data: {
        name: '김은지',
        department: '창의체험부',
        jobTitle: '교사 / 정보',
        phone: '010-8888-9999',
        cust_device: false
      },
      signatureUrl: createSampleSignSvg('김은지'),
      registeredAt: '2026-09-18 15:20:41'
    }
  ]
};
