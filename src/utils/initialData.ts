import {
  AcademicYear,
  ClassRoom,
  Student,
  Assessment,
  GradeRecord,
  AttendanceRecord,
  LessonContent,
  StudentObservation,
  TermRecoveryRecord,
  FinalRecoveryRecord,
  StudentIncident,
  IncidentTypeDefinition
} from '../types';

export const initialAcademicYears: AcademicYear[] = [
  {
    id: 'year-2026',
    year: 2026,
    title: 'Ano Letivo 2026',
    termType: 'bimestral',
    isActive: true,
    notes: 'Calendário regular estadual com 200 dias letivos'
  },
  {
    id: 'year-2025',
    year: 2025,
    title: 'Ano Letivo 2025',
    termType: 'trimestral',
    isActive: false,
    notes: 'Ano letivo anterior arquivado'
  }
];

export const initialClasses: ClassRoom[] = [
  {
    id: 'class-9a',
    academicYearId: 'year-2026',
    name: '9º Ano A',
    gradeLevel: 'Ensino Fundamental II',
    subject: 'Matemática',
    shift: 'Matutino',
    passingGrade: 6.0,
    passingRecoveryGrade: 5.0,
    maxGrade: 10.0,
    termType: 'bimestral',
    gradeCalculationType: 'aritmetica',
    annualRecoveryFormula: 'rec_final_direta'
  },
  {
    id: 'class-8b',
    academicYearId: 'year-2026',
    name: '8º Ano B',
    gradeLevel: 'Ensino Fundamental II',
    subject: 'Matemática',
    shift: 'Vespertino',
    passingGrade: 6.0,
    passingRecoveryGrade: 5.0,
    maxGrade: 10.0,
    termType: 'bimestral',
    gradeCalculationType: 'aritmetica',
    annualRecoveryFormula: 'rec_final_direta'
  },
  {
    id: 'class-3m',
    academicYearId: 'year-2026',
    name: '3º Ano Médio - Alfa',
    gradeLevel: 'Ensino Médio',
    subject: 'Física Aplicada',
    shift: 'Matutino',
    passingGrade: 7.0,
    passingRecoveryGrade: 5.0,
    maxGrade: 10.0,
    termType: 'trimestral',
    gradeCalculationType: 'aritmetica',
    annualRecoveryFormula: 'rec_final_direta'
  }
];

export const initialStudents: Student[] = [
  {
    id: 'std-1',
    classId: 'class-9a',
    rollNumber: 1,
    name: 'Alice Beatriz Carvalho',
    enrollmentNumber: '20260901',
    guardianName: 'Marcos Carvalho',
    guardianPhone: '(11) 98765-4321',
    status: 'active',
    notes: 'Participativa, lidera trabalhos em equipe.'
  },
  {
    id: 'std-2',
    classId: 'class-9a',
    rollNumber: 2,
    name: 'Bernardo Oliveira Lima',
    enrollmentNumber: '20260902',
    guardianName: 'Silvia Oliveira',
    guardianPhone: '(11) 97654-3210',
    status: 'active',
    notes: 'Dificuldade pontual em equações de 2º grau.'
  },
  {
    id: 'std-3',
    classId: 'class-9a',
    rollNumber: 3,
    name: 'Camila Rodrigues Mendes',
    enrollmentNumber: '20260903',
    guardianName: 'Renato Mendes',
    guardianPhone: '(11) 96543-2109',
    status: 'active',
    notes: 'Excelente raciocínio lógico e pontualidade.'
  },
  {
    id: 'std-4',
    classId: 'class-9a',
    rollNumber: 4,
    name: 'Davi Lucas Santos',
    enrollmentNumber: '20260904',
    guardianName: 'Luciana Santos',
    guardianPhone: '(11) 95432-1098',
    status: 'active',
    notes: 'Necessita reforço no cálculo de áreas e frações.'
  },
  {
    id: 'std-5',
    classId: 'class-9a',
    rollNumber: 5,
    name: 'Eduarda Ferreira Neves',
    enrollmentNumber: '20260905',
    guardianName: 'Paulo Neves',
    guardianPhone: '(11) 94321-0987',
    status: 'active',
    notes: 'Apresenta grande evolução nas atividades práticas.'
  },
  {
    id: 'std-6',
    classId: 'class-9a',
    rollNumber: 6,
    name: 'Felipe Augusto Barbosa',
    enrollmentNumber: '20260906',
    guardianName: 'Carla Barbosa',
    guardianPhone: '(11) 93210-9876',
    status: 'active',
    notes: 'Algumas faltas justificadas por consulta médica.'
  },
  {
    id: 'std-7',
    classId: 'class-9a',
    rollNumber: 7,
    name: 'Gabriela Vasconcelos',
    enrollmentNumber: '20260907',
    guardianName: 'Helena Vasconcelos',
    guardianPhone: '(11) 92109-8765',
    status: 'active',
    notes: 'Excelente desempenho, medalhista da OBMEP.'
  },
  {
    id: 'std-8',
    classId: 'class-9a',
    rollNumber: 8,
    name: 'Henrique Moreira Prado',
    enrollmentNumber: '20260908',
    guardianName: 'Roberto Prado',
    guardianPhone: '(11) 91098-7654',
    status: 'active',
    notes: 'Atenção aos prazos de entrega das listas de exercícios.'
  },
  // Alunos para o 3º ano médio
  {
    id: 'std-301',
    classId: 'class-3m',
    rollNumber: 1,
    name: 'Arthur Vinicius Costa',
    enrollmentNumber: '20263001',
    guardianName: 'Sônia Costa',
    guardianPhone: '(11) 99123-4567',
    status: 'active'
  },
  {
    id: 'std-302',
    classId: 'class-3m',
    rollNumber: 2,
    name: 'Bruna Yasmin Alencar',
    enrollmentNumber: '20263002',
    guardianName: 'Jorge Alencar',
    guardianPhone: '(11) 98234-5678',
    status: 'active'
  },
  {
    id: 'std-303',
    classId: 'class-3m',
    rollNumber: 3,
    name: 'Carlos Eduardo Ramos',
    enrollmentNumber: '20263003',
    guardianName: 'Márcia Ramos',
    guardianPhone: '(11) 97345-6789',
    status: 'active'
  }
];

export const initialAssessments: Assessment[] = [
  // 9º Ano A - 1º Bimestre
  {
    id: 'asm-9a-1-p1',
    classId: 'class-9a',
    term: 1,
    name: 'Prova 1: Radiciação e Potenciação',
    type: 'prova',
    maxScore: 10,
    weight: 4,
    date: '2026-03-12'
  },
  {
    id: 'asm-9a-1-t1',
    classId: 'class-9a',
    term: 1,
    name: 'Trabalho em Grupo: Teorema de Tales',
    type: 'trabalho',
    maxScore: 10,
    weight: 3,
    date: '2026-03-26'
  },
  {
    id: 'asm-9a-1-pt',
    classId: 'class-9a',
    term: 1,
    name: 'Listas e Participação',
    type: 'participacao',
    maxScore: 10,
    weight: 3,
    date: '2026-04-10'
  },
  // 9º Ano A - 2º Bimestre
  {
    id: 'asm-9a-2-p1',
    classId: 'class-9a',
    term: 2,
    name: 'Prova 2: Equações do 2º Grau (Bhaskara)',
    type: 'prova',
    maxScore: 10,
    weight: 5,
    date: '2026-05-18'
  },
  {
    id: 'asm-9a-2-sm',
    classId: 'class-9a',
    term: 2,
    name: 'Simulado Diagnóstico',
    type: 'simulado',
    maxScore: 10,
    weight: 3,
    date: '2026-06-05'
  },
  {
    id: 'asm-9a-2-pt',
    classId: 'class-9a',
    term: 2,
    name: 'Caderno e Atividades Práticas',
    type: 'participacao',
    maxScore: 10,
    weight: 2,
    date: '2026-06-25'
  },
  // 9º Ano A - 3º Bimestre
  {
    id: 'asm-9a-3-p1',
    classId: 'class-9a',
    term: 3,
    name: 'Prova 3: Funções Afins e Gráficos',
    type: 'prova',
    maxScore: 10,
    weight: 5,
    date: '2026-08-20'
  },
  {
    id: 'asm-9a-3-t1',
    classId: 'class-9a',
    term: 3,
    name: 'Pesquisa Aplicada: Estatística e Probabilidade',
    type: 'trabalho',
    maxScore: 10,
    weight: 3,
    date: '2026-09-15'
  },
  {
    id: 'asm-9a-3-pt',
    classId: 'class-9a',
    term: 3,
    name: 'Exercícios Semanais',
    type: 'participacao',
    maxScore: 10,
    weight: 2,
    date: '2026-09-30'
  }
];

export const initialGradeRecords: GradeRecord[] = [
  // Term 1 - Prova 1
  { id: 'gr-1', assessmentId: 'asm-9a-1-p1', studentId: 'std-1', score: 9.5 },
  { id: 'gr-2', assessmentId: 'asm-9a-1-p1', studentId: 'std-2', score: 6.0 },
  { id: 'gr-3', assessmentId: 'asm-9a-1-p1', studentId: 'std-3', score: 10.0 },
  { id: 'gr-4', assessmentId: 'asm-9a-1-p1', studentId: 'std-4', score: 4.5 },
  { id: 'gr-5', assessmentId: 'asm-9a-1-p1', studentId: 'std-5', score: 8.0 },
  { id: 'gr-6', assessmentId: 'asm-9a-1-p1', studentId: 'std-6', score: 7.0 },
  { id: 'gr-7', assessmentId: 'asm-9a-1-p1', studentId: 'std-7', score: 9.8 },
  { id: 'gr-8', assessmentId: 'asm-9a-1-p1', studentId: 'std-8', score: 5.5 },

  // Term 1 - Trabalho 1
  { id: 'gr-9', assessmentId: 'asm-9a-1-t1', studentId: 'std-1', score: 9.0 },
  { id: 'gr-10', assessmentId: 'asm-9a-1-t1', studentId: 'std-2', score: 7.5 },
  { id: 'gr-11', assessmentId: 'asm-9a-1-t1', studentId: 'std-3', score: 9.5 },
  { id: 'gr-12', assessmentId: 'asm-9a-1-t1', studentId: 'std-4', score: 5.5 },
  { id: 'gr-13', assessmentId: 'asm-9a-1-t1', studentId: 'std-5', score: 8.5 },
  { id: 'gr-14', assessmentId: 'asm-9a-1-t1', studentId: 'std-6', score: 8.0 },
  { id: 'gr-15', assessmentId: 'asm-9a-1-t1', studentId: 'std-7', score: 10.0 },
  { id: 'gr-16', assessmentId: 'asm-9a-1-t1', studentId: 'std-8', score: 6.5 },

  // Term 1 - Participação
  { id: 'gr-17', assessmentId: 'asm-9a-1-pt', studentId: 'std-1', score: 10.0 },
  { id: 'gr-18', assessmentId: 'asm-9a-1-pt', studentId: 'std-2', score: 7.0 },
  { id: 'gr-19', assessmentId: 'asm-9a-1-pt', studentId: 'std-3', score: 10.0 },
  { id: 'gr-20', assessmentId: 'asm-9a-1-pt', studentId: 'std-4', score: 6.0 },
  { id: 'gr-21', assessmentId: 'asm-9a-1-pt', studentId: 'std-5', score: 9.0 },
  { id: 'gr-22', assessmentId: 'asm-9a-1-pt', studentId: 'std-6', score: 7.5 },
  { id: 'gr-23', assessmentId: 'asm-9a-1-pt', studentId: 'std-7', score: 10.0 },
  { id: 'gr-24', assessmentId: 'asm-9a-1-pt', studentId: 'std-8', score: 7.0 },

  // Term 2 - Prova 2
  { id: 'gr-25', assessmentId: 'asm-9a-2-p1', studentId: 'std-1', score: 9.0 },
  { id: 'gr-26', assessmentId: 'asm-9a-2-p1', studentId: 'std-2', score: 5.0 },
  { id: 'gr-27', assessmentId: 'asm-9a-2-p1', studentId: 'std-3', score: 9.8 },
  { id: 'gr-28', assessmentId: 'asm-9a-2-p1', studentId: 'std-4', score: 5.0 },
  { id: 'gr-29', assessmentId: 'asm-9a-2-p1', studentId: 'std-5', score: 8.5 },
  { id: 'gr-30', assessmentId: 'asm-9a-2-p1', studentId: 'std-6', score: 6.5 },
  { id: 'gr-31', assessmentId: 'asm-9a-2-p1', studentId: 'std-7', score: 10.0 },
  { id: 'gr-32', assessmentId: 'asm-9a-2-p1', studentId: 'std-8', score: 6.0 },

  // Term 2 - Simulado
  { id: 'gr-33', assessmentId: 'asm-9a-2-sm', studentId: 'std-1', score: 8.5 },
  { id: 'gr-34', assessmentId: 'asm-9a-2-sm', studentId: 'std-2', score: 6.5 },
  { id: 'gr-35', assessmentId: 'asm-9a-2-sm', studentId: 'std-3', score: 9.5 },
  { id: 'gr-36', assessmentId: 'asm-9a-2-sm', studentId: 'std-4', score: 5.5 },
  { id: 'gr-37', assessmentId: 'asm-9a-2-sm', studentId: 'std-5', score: 8.0 },
  { id: 'gr-38', assessmentId: 'asm-9a-2-sm', studentId: 'std-6', score: 7.0 },
  { id: 'gr-39', assessmentId: 'asm-9a-2-sm', studentId: 'std-7', score: 9.5 },
  { id: 'gr-40', assessmentId: 'asm-9a-2-sm', studentId: 'std-8', score: 6.0 },

  // Term 2 - Participação
  { id: 'gr-41', assessmentId: 'asm-9a-2-pt', studentId: 'std-1', score: 9.5 },
  { id: 'gr-42', assessmentId: 'asm-9a-2-pt', studentId: 'std-2', score: 7.0 },
  { id: 'gr-43', assessmentId: 'asm-9a-2-pt', studentId: 'std-3', score: 10.0 },
  { id: 'gr-44', assessmentId: 'asm-9a-2-pt', studentId: 'std-4', score: 6.5 },
  { id: 'gr-45', assessmentId: 'asm-9a-2-pt', studentId: 'std-5', score: 9.0 },
  { id: 'gr-46', assessmentId: 'asm-9a-2-pt', studentId: 'std-6', score: 8.0 },
  { id: 'gr-47', assessmentId: 'asm-9a-2-pt', studentId: 'std-7', score: 10.0 },
  { id: 'gr-48', assessmentId: 'asm-9a-2-pt', studentId: 'std-8', score: 6.5 },

  // Term 3 - Prova 3
  { id: 'gr-49', assessmentId: 'asm-9a-3-p1', studentId: 'std-1', score: 9.5 },
  { id: 'gr-50', assessmentId: 'asm-9a-3-p1', studentId: 'std-2', score: 6.5 },
  { id: 'gr-51', assessmentId: 'asm-9a-3-p1', studentId: 'std-3', score: 10.0 },
  { id: 'gr-52', assessmentId: 'asm-9a-3-p1', studentId: 'std-4', score: 6.0 },
  { id: 'gr-53', assessmentId: 'asm-9a-3-p1', studentId: 'std-5', score: 8.5 },
  { id: 'gr-54', assessmentId: 'asm-9a-3-p1', studentId: 'std-6', score: 7.5 },
  { id: 'gr-55', assessmentId: 'asm-9a-3-p1', studentId: 'std-7', score: 9.8 },
  { id: 'gr-56', assessmentId: 'asm-9a-3-p1', studentId: 'std-8', score: 7.0 }
];

export const initialAttendances: AttendanceRecord[] = [
  // Data 1
  { id: 'att-1', classId: 'class-9a', date: '2026-03-02', term: 1, studentId: 'std-1', status: 'present' },
  { id: 'att-2', classId: 'class-9a', date: '2026-03-02', term: 1, studentId: 'std-2', status: 'present' },
  { id: 'att-3', classId: 'class-9a', date: '2026-03-02', term: 1, studentId: 'std-3', status: 'present' },
  { id: 'att-4', classId: 'class-9a', date: '2026-03-02', term: 1, studentId: 'std-4', status: 'absent', note: 'Sem justificativa informada' },
  { id: 'att-5', classId: 'class-9a', date: '2026-03-02', term: 1, studentId: 'std-5', status: 'present' },
  { id: 'att-6', classId: 'class-9a', date: '2026-03-02', term: 1, studentId: 'std-6', status: 'justified', note: 'Atestado médico odontológico' },
  { id: 'att-7', classId: 'class-9a', date: '2026-03-02', term: 1, studentId: 'std-7', status: 'present' },
  { id: 'att-8', classId: 'class-9a', date: '2026-03-02', term: 1, studentId: 'std-8', status: 'present' },

  // Data 2
  { id: 'att-9', classId: 'class-9a', date: '2026-03-09', term: 1, studentId: 'std-1', status: 'present' },
  { id: 'att-10', classId: 'class-9a', date: '2026-03-09', term: 1, studentId: 'std-2', status: 'present' },
  { id: 'att-11', classId: 'class-9a', date: '2026-03-09', term: 1, studentId: 'std-3', status: 'present' },
  { id: 'att-12', classId: 'class-9a', date: '2026-03-09', term: 1, studentId: 'std-4', status: 'present' },
  { id: 'att-13', classId: 'class-9a', date: '2026-03-09', term: 1, studentId: 'std-5', status: 'present' },
  { id: 'att-14', classId: 'class-9a', date: '2026-03-09', term: 1, studentId: 'std-6', status: 'present' },
  { id: 'att-15', classId: 'class-9a', date: '2026-03-09', term: 1, studentId: 'std-7', status: 'present' },
  { id: 'att-16', classId: 'class-9a', date: '2026-03-09', term: 1, studentId: 'std-8', status: 'absent' },

  // Data 3
  { id: 'att-17', classId: 'class-9a', date: '2026-03-16', term: 1, studentId: 'std-1', status: 'present' },
  { id: 'att-18', classId: 'class-9a', date: '2026-03-16', term: 1, studentId: 'std-2', status: 'absent' },
  { id: 'att-19', classId: 'class-9a', date: '2026-03-16', term: 1, studentId: 'std-3', status: 'present' },
  { id: 'att-20', classId: 'class-9a', date: '2026-03-16', term: 1, studentId: 'std-4', status: 'absent' },
  { id: 'att-21', classId: 'class-9a', date: '2026-03-16', term: 1, studentId: 'std-5', status: 'present' },
  { id: 'att-22', classId: 'class-9a', date: '2026-03-16', term: 1, studentId: 'std-6', status: 'present' },
  { id: 'att-23', classId: 'class-9a', date: '2026-03-16', term: 1, studentId: 'std-7', status: 'present' },
  { id: 'att-24', classId: 'class-9a', date: '2026-03-16', term: 1, studentId: 'std-8', status: 'present' },

  // Data 4 (Hoje recente)
  { id: 'att-25', classId: 'class-9a', date: '2026-03-23', term: 1, studentId: 'std-1', status: 'present' },
  { id: 'att-26', classId: 'class-9a', date: '2026-03-23', term: 1, studentId: 'std-2', status: 'present' },
  { id: 'att-27', classId: 'class-9a', date: '2026-03-23', term: 1, studentId: 'std-3', status: 'present' },
  { id: 'att-28', classId: 'class-9a', date: '2026-03-23', term: 1, studentId: 'std-4', status: 'present' },
  { id: 'att-29', classId: 'class-9a', date: '2026-03-23', term: 1, studentId: 'std-5', status: 'present' },
  { id: 'att-30', classId: 'class-9a', date: '2026-03-23', term: 1, studentId: 'std-6', status: 'present' },
  { id: 'att-31', classId: 'class-9a', date: '2026-03-23', term: 1, studentId: 'std-7', status: 'present' },
  { id: 'att-32', classId: 'class-9a', date: '2026-03-23', term: 1, studentId: 'std-8', status: 'present' }
];

export const initialLessons: LessonContent[] = [
  {
    id: 'les-1',
    classId: 'class-9a',
    date: '2026-03-02',
    term: 1,
    lessonCount: 2,
    topic: 'Introdução aos Números Reais e Notação Científica',
    contentDescription: 'Apresentação do plano de ensino do 1º Bimestre. Revisão de potenciação de base 10 e grandezas astronômicas e microscópicas.',
    bnccSkills: 'EF09MA01, EF09MA02',
    homework: 'Exercícios página 14 a 16 (números 1 ao 8).',
    status: 'dado'
  },
  {
    id: 'les-2',
    classId: 'class-9a',
    date: '2026-03-09',
    term: 1,
    lessonCount: 2,
    topic: 'Propriedades dos Radicais e Racionalização',
    contentDescription: 'Simplificação de radicais aritméticos, operações com raízes não exatas e métodos de racionalização de denominadores com conjugados.',
    bnccSkills: 'EF09MA02, EF09MA03',
    homework: 'Lista impressa entregue em sala - exercícios ímpares.',
    status: 'dado'
  },
  {
    id: 'les-3',
    classId: 'class-9a',
    date: '2026-03-16',
    term: 1,
    lessonCount: 2,
    topic: 'Teorema de Tales e Razão entre Segmentos',
    contentDescription: 'Construção geométrica com feixes de retas paralelas cortadas por transversais. Aplicações práticas na medição de alturas inacessíveis.',
    bnccSkills: 'EF09MA10, EF09MA14',
    homework: 'Resolução das questões 1 a 5 da página 45 do livro didático.',
    status: 'dado'
  },
  {
    id: 'les-4',
    classId: 'class-9a',
    date: '2026-03-23',
    term: 1,
    lessonCount: 2,
    topic: 'Semelhança de Triângulos e Critérios (AA, LAL, LLL)',
    contentDescription: 'Demonstração dos casos de semelhança e resolução de problemas contextualizados envolvendo sombras de edifícios e projeções.',
    bnccSkills: 'EF09MA11',
    homework: 'Ficha complementar de geometria plana no caderno.',
    status: 'dado'
  },
  {
    id: 'les-5',
    classId: 'class-9a',
    date: '2026-03-30',
    term: 1,
    lessonCount: 2,
    topic: 'Relações Métricas no Triângulo Retângulo e Pitágoras',
    contentDescription: 'Dedução algébrica do Teorema de Pitágoras e relações métricas auxiliares. Aplicação em triângulos e diagonais.',
    bnccSkills: 'EF09MA13',
    homework: 'Lista de exercícios preparatória para a prova.',
    status: 'previsto'
  }
];

export const initialObservations: StudentObservation[] = [
  {
    id: 'obs-1',
    studentId: 'std-4',
    term: 1,
    observation: 'Estudante apresentou desatenção nas primeiras semanas e faltas pontuais. Foi realizada conversa com a coordenação pedagógica e encaminhada lista de reforço.',
    updatedAt: '2026-03-20'
  },
  {
    id: 'obs-2',
    studentId: 'std-1',
    term: 1,
    observation: 'Excelente desempenho e proatividade nos grupos de estudo. Auxilia os colegas nas dúvidas de álgebra.',
    updatedAt: '2026-03-25'
  }
];

export const initialTermRecoveries: TermRecoveryRecord[] = [
  {
    id: 'rec-t-1',
    classId: 'class-9a',
    term: 1,
    studentId: 'std-4',
    score: 6.5 // Aluno Davi Lucas fez Recuperação Paralela no 1º Bimestre e tirou 6.5, substituindo a média
  }
];

export const initialFinalRecoveries: FinalRecoveryRecord[] = [];

export const initialIncidents: StudentIncident[] = [
  {
    id: 'inc-1',
    classId: 'class-9a',
    studentId: 'std-2',
    date: '2026-03-09',
    term: 1,
    type: 'tarefa',
    title: 'Não entregou lista de exercícios',
    description: 'Estudante não apresentou a lista impressa de radicais no início da aula, alegando esquecimento.',
    actionTaken: 'Concedido prazo até a aula seguinte com penalidade de 10% no visto.',
    notifiedGuardian: false,
    createdAt: '2026-03-09T10:30:00Z'
  },
  {
    id: 'inc-2',
    classId: 'class-9a',
    studentId: 'std-4',
    date: '2026-03-16',
    term: 1,
    type: 'comportamento',
    title: 'Uso indevido de celular durante explicação',
    description: 'O aluno utilizou o smartphone para jogos durante a explicação do Teorema de Tales e dispersou os colegas ao redor.',
    actionTaken: 'Advertência verbal e pedido para guardar o aparelho na mochila até o término da aula.',
    notifiedGuardian: true,
    createdAt: '2026-03-16T11:15:00Z'
  },
  {
    id: 'inc-3',
    classId: 'class-9a',
    studentId: 'std-1',
    date: '2026-03-23',
    term: 1,
    type: 'elogio',
    title: 'Destaque e tutoria voluntária',
    description: 'Alice auxiliou ativamente os grupos com maior dificuldade na resolução dos problemas de semelhança de triângulos.',
    actionTaken: 'Elogio registrado e comunicado oral em sala para valorização do trabalho colaborativo.',
    notifiedGuardian: false,
    createdAt: '2026-03-23T11:40:00Z'
  }
];

export const initialIncidentTypes: IncidentTypeDefinition[] = [
  {
    id: 'comportamento',
    label: 'Indisciplina / Comportamento',
    color: 'rose',
    isDefault: true
  },
  {
    id: 'tarefa',
    label: 'Falta de Tarefa / Dever',
    color: 'amber',
    isDefault: true
  },
  {
    id: 'atraso',
    label: 'Atraso na Entrada',
    color: 'orange',
    isDefault: true
  },
  {
    id: 'pedagogica',
    label: 'Dificuldade Pedagógica',
    color: 'blue',
    isDefault: true
  },
  {
    id: 'material',
    label: 'Falta de Material Escolar',
    color: 'purple',
    isDefault: true
  },
  {
    id: 'elogio',
    label: 'Elogio / Participação Destacada',
    color: 'emerald',
    isDefault: true
  },
  {
    id: 'comunicacao_responsavel',
    label: 'Comunicação com a Família',
    color: 'indigo',
    isDefault: true
  },
  {
    id: 'outro',
    label: 'Outra Ocorrência',
    color: 'slate',
    isDefault: true
  }
];

