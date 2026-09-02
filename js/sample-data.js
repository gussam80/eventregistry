/**
 * Default Presets and Initial Data for Smart Event Registry
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

// Initial Sample Events & Registrations (Clean Initial State)
const INITIAL_SAMPLE_DATA = {
  events: [],
  registrations: []
};
