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
import {
  initialAcademicYears,
  initialClasses,
  initialStudents,
  initialAssessments,
  initialGradeRecords,
  initialAttendances,
  initialLessons,
  initialObservations,
  initialTermRecoveries,
  initialFinalRecoveries,
  initialIncidents,
  initialIncidentTypes
} from './initialData';

export interface AppDataState {
  academicYears: AcademicYear[];
  classes: ClassRoom[];
  students: Student[];
  assessments: Assessment[];
  gradeRecords: GradeRecord[];
  termRecoveries: TermRecoveryRecord[];
  finalRecoveries: FinalRecoveryRecord[];
  attendances: AttendanceRecord[];
  lessons: LessonContent[];
  observations: StudentObservation[];
  incidents: StudentIncident[];
  incidentTypes: IncidentTypeDefinition[];
  selectedYearId: string;
  selectedClassId: string;
  selectedTerm: number;
}

const STORAGE_KEY = 'diario_professor_data_v1';

export function loadStoredData(): AppDataState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.academicYears && parsed.classes && parsed.students) {
        // Ensure recoveries arrays exist and classes have default annualRecoveryFormula
        const classes = (parsed.classes || []).map((c: any) => ({
          ...c,
          annualRecoveryFormula: c.annualRecoveryFormula || 'rec_final_direta'
        }));

        return {
          ...parsed,
          classes,
          termRecoveries: parsed.termRecoveries || initialTermRecoveries,
          finalRecoveries: parsed.finalRecoveries || initialFinalRecoveries,
          incidents: parsed.incidents || initialIncidents,
          incidentTypes: parsed.incidentTypes || initialIncidentTypes
        };
      }
    }
  } catch (e) {
    console.error('Falha ao ler dados do localStorage:', e);
  }

  // Fallback initial
  const defaultYear = initialAcademicYears.find(y => y.isActive) || initialAcademicYears[0];
  const defaultClass = initialClasses.find(c => c.academicYearId === defaultYear.id) || initialClasses[0];

  return {
    academicYears: initialAcademicYears,
    classes: initialClasses,
    students: initialStudents,
    assessments: initialAssessments,
    gradeRecords: initialGradeRecords,
    termRecoveries: initialTermRecoveries,
    finalRecoveries: initialFinalRecoveries,
    attendances: initialAttendances,
    lessons: initialLessons,
    observations: initialObservations,
    incidents: initialIncidents,
    incidentTypes: initialIncidentTypes,
    selectedYearId: defaultYear.id,
    selectedClassId: defaultClass.id,
    selectedTerm: 1
  };
}

export function saveStoredData(data: AppDataState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Falha ao salvar dados no localStorage:', e);
  }
}

export function resetToSampleData(): AppDataState {
  const defaultYear = initialAcademicYears.find(y => y.isActive) || initialAcademicYears[0];
  const defaultClass = initialClasses.find(c => c.academicYearId === defaultYear.id) || initialClasses[0];

  const state: AppDataState = {
    academicYears: initialAcademicYears,
    classes: initialClasses,
    students: initialStudents,
    assessments: initialAssessments,
    gradeRecords: initialGradeRecords,
    termRecoveries: initialTermRecoveries,
    finalRecoveries: initialFinalRecoveries,
    attendances: initialAttendances,
    lessons: initialLessons,
    observations: initialObservations,
    incidents: initialIncidents,
    incidentTypes: initialIncidentTypes,
    selectedYearId: defaultYear.id,
    selectedClassId: defaultClass.id,
    selectedTerm: 1
  };
  saveStoredData(state);
  return state;
}
