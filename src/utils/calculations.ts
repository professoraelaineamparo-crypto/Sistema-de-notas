import {
  Assessment,
  GradeRecord,
  AttendanceRecord,
  ClassRoom,
  Student,
  GradeCalculationType,
  TermRecoveryRecord,
  FinalRecoveryRecord
} from '../types';

export interface StudentTermGradeSummary {
  term: number;
  regularAverage: number | null;
  recoveryScore: number | null;
  average: number | null;
  isSubstituted: boolean;
  assessmentScores: {
    assessmentId: string;
    assessmentName: string;
    score: number | null;
    maxScore: number;
    weight: number;
  }[];
}

export function getTermCount(termType: 'bimestral' | 'trimestral'): number {
  return termType === 'bimestral' ? 4 : 3;
}

export function getTermLabel(termType: 'bimestral' | 'trimestral', termNumber: number): string {
  if (termType === 'bimestral') {
    return `${termNumber}º Bimestre`;
  }
  return `${termNumber}º Trimestre`;
}

export function getShortTermLabel(termType: 'bimestral' | 'trimestral', termNumber: number): string {
  if (termType === 'bimestral') {
    return `${termNumber}º Bim`;
  }
  return `${termNumber}º Trim`;
}

/**
 * Calculates the average of a student in a specific term,
 * taking into account Recuperação Paralela (which substitutes the average if higher).
 */
export function calculateStudentTermAverage(
  studentId: string,
  classId: string,
  term: number,
  assessments: Assessment[],
  gradeRecords: GradeRecord[],
  calculationType: GradeCalculationType = 'aritmetica',
  termRecoveries: TermRecoveryRecord[] = []
): {
  regularAverage: number | null;
  recoveryScore: number | null;
  average: number | null;
  isSubstituted: boolean;
  hasGrades: boolean;
  totalWeight: number;
  gradeCount: number;
} {
  const termAssessments = assessments.filter(
    a => a.classId === classId && Number(a.term) === Number(term)
  );

  let sumScores = 0;
  let weightedSum = 0;
  let weightSum = 0;
  let gradeCount = 0;

  for (const asm of termAssessments) {
    const grade = gradeRecords.find(
      g => g.assessmentId === asm.id && g.studentId === studentId
    );

    if (grade && grade.score !== null && grade.score !== undefined && !isNaN(Number(grade.score))) {
      const score = Number(grade.score);
      const weight = Number(asm.weight) > 0 ? Number(asm.weight) : 1;

      sumScores += score;
      weightedSum += score * weight;
      weightSum += weight;
      gradeCount++;
    }
  }

  let regularAverage: number | null = null;
  if (gradeCount > 0) {
    if (calculationType === 'somatoria') {
      regularAverage = Math.round(sumScores * 10) / 10;
    } else if (calculationType === 'ponderada') {
      regularAverage = weightSum > 0 ? Math.round((weightedSum / weightSum) * 10) / 10 : 0;
    } else {
      regularAverage = Math.round((sumScores / gradeCount) * 10) / 10;
    }
  }

  // Check Recuperação Paralela
  const recRecord = termRecoveries.find(
    r => r.classId === classId && Number(r.term) === Number(term) && r.studentId === studentId
  );
  const recoveryScore = recRecord && recRecord.score !== null && !isNaN(Number(recRecord.score))
    ? Number(recRecord.score)
    : null;

  let average: number | null = regularAverage;
  let isSubstituted = false;

  if (recoveryScore !== null) {
    if (regularAverage === null) {
      average = recoveryScore;
      isSubstituted = true;
    } else if (recoveryScore > regularAverage) {
      // Substitui a média caso a nota da recuperação seja maior que a média regular!
      average = recoveryScore;
      isSubstituted = true;
    }
  }

  return {
    regularAverage,
    recoveryScore,
    average,
    isSubstituted,
    hasGrades: gradeCount > 0 || recoveryScore !== null,
    totalWeight: weightSum,
    gradeCount
  };
}

export interface StudentAnnualSummary {
  annualAverage: number | null; // Média das etapas (bimestres/trimestres)
  partialAverage: number | null; // Média acumulada até o momento
  totalPoints: number; // Soma total dos pontos obtidos nas etapas
  termsWithGrades: number;
  totalTerms: number;
  isComplete: boolean; // Se todos os períodos têm notas lançadas
  finalRecoveryScore: number | null; // Nota da recuperação final
  definitiveAverage: number | null; // Média final após exame/recuperação final
  formulaUsed: string; // Explicação legível da fórmula usada (ex: "(5.0 + 7.0) ÷ 2 = 6.0")
  status: 'approved' | 'approved_recovery' | 'recovery' | 'failed' | 'pending';
  termsSummary: StudentTermGradeSummary[];
}

export function calculateStudentOverallAverage(
  studentId: string,
  classRoom: ClassRoom,
  assessments: Assessment[],
  gradeRecords: GradeRecord[],
  termRecoveries: TermRecoveryRecord[] = [],
  finalRecoveries: FinalRecoveryRecord[] = []
): StudentAnnualSummary {
  const numTerms = getTermCount(classRoom.termType);
  const termsSummary: StudentTermGradeSummary[] = [];
  let sumTermAverages = 0;
  let termsWithGrades = 0;

  for (let t = 1; t <= numTerms; t++) {
    const termResult = calculateStudentTermAverage(
      studentId,
      classRoom.id,
      t,
      assessments,
      gradeRecords,
      classRoom.gradeCalculationType,
      termRecoveries
    );

    const termAssessments = assessments.filter(
      a => a.classId === classRoom.id && Number(a.term) === Number(t)
    );
    const assessmentScores = termAssessments.map(asm => {
      const g = gradeRecords.find(gr => gr.assessmentId === asm.id && gr.studentId === studentId);
      return {
        assessmentId: asm.id,
        assessmentName: asm.name,
        score: g && g.score !== null && !isNaN(Number(g.score)) ? Number(g.score) : null,
        maxScore: Number(asm.maxScore) || 10,
        weight: Number(asm.weight) || 1
      };
    });

    termsSummary.push({
      term: t,
      regularAverage: termResult.regularAverage,
      recoveryScore: termResult.recoveryScore,
      average: termResult.average,
      isSubstituted: termResult.isSubstituted,
      assessmentScores
    });

    if (termResult.average !== null) {
      sumTermAverages += termResult.average;
      termsWithGrades++;
    }
  }

  const isComplete = termsWithGrades >= numTerms;
  const partialAverage = termsWithGrades > 0
    ? Math.round((sumTermAverages / termsWithGrades) * 10) / 10
    : null;
  const annualAverage = partialAverage;
  const totalPoints = Math.round(sumTermAverages * 10) / 10;

  // Recuperação Final (Exame Final)
  const finalRecRecord = finalRecoveries.find(
    r => r.classId === classRoom.id && r.studentId === studentId
  );
  const finalRecoveryScore = finalRecRecord && finalRecRecord.score !== null && !isNaN(Number(finalRecRecord.score))
    ? Number(finalRecRecord.score)
    : null;

  let definitiveAverage = annualAverage;
  let status: 'approved' | 'approved_recovery' | 'recovery' | 'failed' | 'pending' = 'pending';
  let formulaUsed = 'Sem notas lançadas';

  // Regra padrão: Repetir a nota lançada na Recuperação Final como Média Definitiva
  const recoveryFormula = classRoom.annualRecoveryFormula || 'rec_final_direta';
  const recPassingMin = classRoom.passingRecoveryGrade ?? classRoom.passingGrade;

  if (annualAverage !== null) {
    if (annualAverage >= classRoom.passingGrade) {
      if (isComplete) {
        status = 'approved';
        definitiveAverage = annualAverage;
        formulaUsed = `Aprovado direto com média anual ${annualAverage.toFixed(1)}`;
      } else {
        status = 'pending';
        definitiveAverage = annualAverage;
        formulaUsed = `Em andamento (${termsWithGrades}/${numTerms} etapas) • Média parcial ${annualAverage.toFixed(1)}`;
      }
    } else {
      // Aluno com média abaixo da meta de aprovação
      if (finalRecoveryScore !== null) {
        // Aluno realizou o exame de Recuperação Final
        if (recoveryFormula === 'rec_final_direta') {
          // Repete diretamente a nota lançada na Rec. Final como a Média Definitiva
          definitiveAverage = finalRecoveryScore;
          formulaUsed = `Média Definitiva: ${finalRecoveryScore.toFixed(1)} (Nota da Rec. Final)`;
        } else if (recoveryFormula === 'media_aritmetica') {
          // Padrão nacional alternativo: (Média Anual + Rec. Final) ÷ 2
          definitiveAverage = Math.round(((annualAverage + finalRecoveryScore) / 2) * 10) / 10;
          formulaUsed = `(${annualAverage.toFixed(1)} + ${finalRecoveryScore.toFixed(1)}) ÷ 2 = ${definitiveAverage.toFixed(1)}`;
        } else if (recoveryFormula === 'media_ponderada') {
          // Média Ponderada: 60% Média Anual + 40% Recuperação Final
          definitiveAverage = Math.round(((annualAverage * 0.6 + finalRecoveryScore * 0.4)) * 10) / 10;
          formulaUsed = `(${annualAverage.toFixed(1)} × 6 + ${finalRecoveryScore.toFixed(1)} × 4) ÷ 10 = ${definitiveAverage.toFixed(1)}`;
        } else if (recoveryFormula === 'substitui_menor_bimestre') {
          // Substitui a menor etapa pela nota da recuperação final
          const termAvgs = termsSummary.map(t => t.average).filter((v): v is number => v !== null);
          if (termAvgs.length > 0) {
            const minTerm = Math.min(...termAvgs);
            if (finalRecoveryScore > minTerm) {
              const newSum = termAvgs.reduce((a, b) => a + b, 0) - minTerm + finalRecoveryScore;
              definitiveAverage = Math.round((newSum / termAvgs.length) * 10) / 10;
              formulaUsed = `Substitui menor etapa (${minTerm.toFixed(1)}) por rec (${finalRecoveryScore.toFixed(1)}) = ${definitiveAverage.toFixed(1)}`;
            } else {
              definitiveAverage = annualAverage;
              formulaUsed = `Manteve ${annualAverage.toFixed(1)} (rec ${finalRecoveryScore.toFixed(1)} ≤ menor etapa ${minTerm.toFixed(1)})`;
            }
          } else {
            definitiveAverage = finalRecoveryScore;
            formulaUsed = `Média: ${finalRecoveryScore.toFixed(1)}`;
          }
        } else {
          // 'substituicao': A nota da Recuperação Final substitui a média se for maior
          definitiveAverage = Math.max(annualAverage, finalRecoveryScore);
          formulaUsed = `max(${annualAverage.toFixed(1)}, ${finalRecoveryScore.toFixed(1)}) = ${definitiveAverage.toFixed(1)}`;
        }

        // Verifica aprovação no exame final
        if (definitiveAverage >= recPassingMin) {
          status = 'approved_recovery';
        } else {
          status = 'failed';
        }
      } else {
        // Aluno abaixo da média, sem exame final ainda
        if (isComplete) {
          status = 'recovery';
          definitiveAverage = annualAverage;
          formulaUsed = `Em Recuperação Final (Média anual: ${annualAverage.toFixed(1)} < ${classRoom.passingGrade.toFixed(1)})`;
        } else {
          status = 'pending';
          definitiveAverage = annualAverage;
          formulaUsed = `Em andamento (${termsWithGrades}/${numTerms} etapas) • Média parcial ${annualAverage.toFixed(1)}`;
        }
      }
    }
  }

  return {
    annualAverage,
    partialAverage,
    totalPoints,
    termsWithGrades,
    totalTerms: numTerms,
    isComplete,
    finalRecoveryScore,
    definitiveAverage,
    formulaUsed,
    status,
    termsSummary
  };
}

export function calculateStudentAttendance(
  studentId: string,
  classId: string,
  attendances: AttendanceRecord[],
  termFilter?: number
): {
  totalClasses: number;
  presents: number;
  absents: number;
  justified: number;
  attendanceRate: number; // 0 to 100
} {
  const records = attendances.filter(a => {
    if (a.classId !== classId || a.studentId !== studentId) return false;
    if (termFilter !== undefined && Number(a.term) !== Number(termFilter)) return false;
    return true;
  });

  const totalClasses = records.length;
  if (totalClasses === 0) {
    return {
      totalClasses: 0,
      presents: 0,
      absents: 0,
      justified: 0,
      attendanceRate: 100
    };
  }

  let presents = 0;
  let absents = 0;
  let justified = 0;

  for (const r of records) {
    if (r.status === 'present') presents++;
    else if (r.status === 'absent') absents++;
    else if (r.status === 'justified') justified++;
  }

  const effectivePresence = presents + justified;
  const attendanceRate = Math.round((effectivePresence / totalClasses) * 100);

  return {
    totalClasses,
    presents,
    absents,
    justified,
    attendanceRate
  };
}

export interface ClassStats {
  classAverageCurrentTerm: number | null;
  overallClassAverage: number | null;
  highestGrade: number | null;
  lowestGrade: number | null;
  approvedCount: number;
  recoveryCount: number;
  atRiskAttendanceCount: number;
  totalStudents: number;
  termAverages: { term: number; label: string; average: number | null }[];
  distribution: {
    range: string;
    count: number;
    color: string;
  }[];
}

export function calculateClassStats(
  classRoom: ClassRoom,
  students: Student[],
  assessments: Assessment[],
  gradeRecords: GradeRecord[],
  attendances: AttendanceRecord[],
  currentTerm: number,
  termRecoveries: TermRecoveryRecord[] = [],
  finalRecoveries: FinalRecoveryRecord[] = []
): ClassStats {
  const activeStudents = students.filter(s => s.classId === classRoom.id && s.status === 'active');
  const numTerms = getTermCount(classRoom.termType);

  let currentTermSum = 0;
  let currentTermCount = 0;
  let allTermSum = 0;
  let allTermCount = 0;

  let highest = -Infinity;
  let lowest = Infinity;
  let approved = 0;
  let recovery = 0;
  let atRiskAttendance = 0;

  const dist = [
    { range: '0.0 - 4.9 (Crítico)', count: 0, color: '#ef4444' },
    { range: '5.0 - 6.9 (Atenção)', count: 0, color: '#f59e0b' },
    { range: '7.0 - 8.9 (Bom)', count: 0, color: '#3b82f6' },
    { range: '9.0 - 10.0 (Excelente)', count: 0, color: '#10b981' }
  ];

  for (const student of activeStudents) {
    const termRes = calculateStudentTermAverage(
      student.id,
      classRoom.id,
      currentTerm,
      assessments,
      gradeRecords,
      classRoom.gradeCalculationType,
      termRecoveries
    );

    if (termRes.average !== null) {
      currentTermSum += termRes.average;
      currentTermCount++;

      if (termRes.average > highest) highest = termRes.average;
      if (termRes.average < lowest) lowest = termRes.average;

      if (termRes.average < 5.0) dist[0].count++;
      else if (termRes.average < 7.0) dist[1].count++;
      else if (termRes.average < 9.0) dist[2].count++;
      else dist[3].count++;

      if (termRes.average >= classRoom.passingGrade) {
        approved++;
      } else {
        recovery++;
      }
    }

    const { definitiveAverage } = calculateStudentOverallAverage(
      student.id,
      classRoom,
      assessments,
      gradeRecords,
      termRecoveries,
      finalRecoveries
    );
    if (definitiveAverage !== null) {
      allTermSum += definitiveAverage;
      allTermCount++;
    }

    const att = calculateStudentAttendance(student.id, classRoom.id, attendances);
    if (att.totalClasses > 0 && att.attendanceRate < 75) {
      atRiskAttendance++;
    }
  }

  const termAverages = [];
  for (let t = 1; t <= numTerms; t++) {
    let tSum = 0;
    let tCount = 0;
    for (const student of activeStudents) {
      const { average } = calculateStudentTermAverage(
        student.id,
        classRoom.id,
        t,
        assessments,
        gradeRecords,
        classRoom.gradeCalculationType,
        termRecoveries
      );
      if (average !== null) {
        tSum += average;
        tCount++;
      }
    }
    termAverages.push({
      term: t,
      label: getShortTermLabel(classRoom.termType, t),
      average: tCount > 0 ? Math.round((tSum / tCount) * 10) / 10 : null
    });
  }

  return {
    classAverageCurrentTerm: currentTermCount > 0 ? Math.round((currentTermSum / currentTermCount) * 10) / 10 : null,
    overallClassAverage: allTermCount > 0 ? Math.round((allTermSum / allTermCount) * 10) / 10 : null,
    highestGrade: highest !== -Infinity ? highest : null,
    lowestGrade: lowest !== Infinity ? lowest : null,
    approvedCount: approved,
    recoveryCount: recovery,
    atRiskAttendanceCount: atRiskAttendance,
    totalStudents: activeStudents.length,
    termAverages,
    distribution: dist
  };
}
