import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
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
  calculateStudentTermAverage,
  calculateStudentOverallAverage,
  calculateStudentAttendance,
  getTermLabel,
  getTermCount
} from './calculations';

/**
 * Generates and downloads a Grade Map PDF (Mapa de Notas da Turma)
 * including Recuperação Paralela and Recuperação Final
 */
export function generateGradeMapPDF(
  currentClass: ClassRoom,
  students: Student[],
  assessments: Assessment[],
  gradeRecords: GradeRecord[],
  selectedTerm: number,
  viewMode: 'term' | 'annual' = 'term',
  termRecoveries: TermRecoveryRecord[] = [],
  finalRecoveries: FinalRecoveryRecord[] = []
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const activeStudents = students
    .filter(s => s.classId === currentClass.id && s.status === 'active')
    .sort((a, b) => a.rollNumber - b.rollNumber);

  const termAssessments = assessments.filter(
    a => a.classId === currentClass.id && Number(a.term) === Number(selectedTerm)
  );

  const numTerms = getTermCount(currentClass.termType);

  // Document Title & Header
  doc.setFillColor(30, 41, 59); // Slate-800
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DIÁRIO DO PROFESSOR - MAPA DE NOTAS DA TURMA', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const termTitle = viewMode === 'term' ? getTermLabel(currentClass.termType, selectedTerm) : 'Consolidado Anual';
  doc.text(
    `Turma: ${currentClass.name} | Disciplina: ${currentClass.subject} | Período: ${termTitle} | Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
    14,
    18
  );

  let head: string[][] = [];
  let body: any[][] = [];

  if (viewMode === 'term') {
    const asmHeaders = termAssessments.map(
      a => `${a.name}\n(P:${a.weight || 1})`
    );
    head = [
      [
        'Nº',
        'Matrícula',
        'Nome do Estudante',
        ...asmHeaders,
        'Média\nRegular',
        'Rec.\nParalela',
        `Média Final\n${getTermLabel(currentClass.termType, selectedTerm)}`,
        'Situação'
      ]
    ];

    body = activeStudents.map(student => {
      const row: any[] = [
        String(student.rollNumber).padStart(2, '0'),
        student.enrollmentNumber || '—',
        student.name
      ];

      termAssessments.forEach(asm => {
        const grade = gradeRecords.find(g => g.assessmentId === asm.id && g.studentId === student.id);
        row.push(grade && grade.score !== null ? Number(grade.score).toFixed(1) : '—');
      });

      const termRes = calculateStudentTermAverage(
        student.id,
        currentClass.id,
        selectedTerm,
        assessments,
        gradeRecords,
        currentClass.gradeCalculationType,
        termRecoveries
      );

      row.push(termRes.regularAverage !== null ? termRes.regularAverage.toFixed(1) : '—');
      row.push(termRes.recoveryScore !== null ? termRes.recoveryScore.toFixed(1) : '—');

      const finalAvgText = termRes.average !== null
        ? `${termRes.average.toFixed(1)}${termRes.isSubstituted ? ' *' : ''}`
        : '—';
      row.push(finalAvgText);

      const isApproved = termRes.average !== null && termRes.average >= currentClass.passingGrade;
      row.push(
        termRes.average !== null
          ? isApproved
            ? termRes.isSubstituted
              ? 'Aprovado (Rec)'
              : 'Aprovado'
            : 'Recuperação'
          : 'Pendente'
      );

      return row;
    });
  } else {
    // Annual View with Recuperação Final
    const termHeaders = Array.from({ length: numTerms }).map(
      (_, i) => getTermLabel(currentClass.termType, i + 1)
    );
    head = [
      [
        'Nº',
        'Matrícula',
        'Nome do Estudante',
        ...termHeaders,
        'Total\nPontos',
        'Média\nAnual',
        'Rec.\nFinal',
        'Média\nDefinitiva',
        'Situação Final'
      ]
    ];

    body = activeStudents.map(student => {
      const row: any[] = [
        String(student.rollNumber).padStart(2, '0'),
        student.enrollmentNumber || '—',
        student.name
      ];

      const annualRes = calculateStudentOverallAverage(
        student.id,
        currentClass,
        assessments,
        gradeRecords,
        termRecoveries,
        finalRecoveries
      );

      annualRes.termsSummary.forEach(ts => {
        row.push(ts.average !== null ? ts.average.toFixed(1) : '—');
      });

      row.push(annualRes.termsWithGrades > 0 ? annualRes.totalPoints.toFixed(1) : '—');
      row.push(annualRes.annualAverage !== null ? annualRes.annualAverage.toFixed(1) : '—');
      row.push(annualRes.finalRecoveryScore !== null ? annualRes.finalRecoveryScore.toFixed(1) : '—');
      row.push(annualRes.definitiveAverage !== null ? annualRes.definitiveAverage.toFixed(1) : '—');

      let sitText = 'Pendente';
      if (annualRes.status === 'approved') sitText = 'Aprovado';
      else if (annualRes.status === 'approved_recovery') sitText = 'Aprovado (Rec. Final)';
      else if (annualRes.status === 'failed') sitText = 'Reprovado';
      else if (annualRes.status === 'recovery') sitText = 'Em Rec. Final';

      row.push(sitText);
      return row;
    });
  }

  autoTable(doc, {
    head,
    body,
    startY: 28,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      font: 'helvetica',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 24 },
      2: { cellWidth: 50 }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const text = String(data.cell.raw);
        if (text.startsWith('Aprovado')) {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (text === 'Recuperação' || text === 'Reprovado' || text === 'Em Rec. Final') {
          data.cell.styles.textColor = [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 14;
  if (finalY < 190) {
    doc.setDrawColor(180, 180, 180);
    doc.line(30, finalY, 110, finalY);
    doc.line(180, finalY, 260, finalY);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Professor(a) Responsável', 70, finalY + 4, { align: 'center' });
    doc.text('Coordenação Pedagógica / Direção', 220, finalY + 4, { align: 'center' });
  }

  const filename = `Mapa_Notas_${currentClass.name.replace(/\s+/g, '_')}_${viewMode === 'term' ? getTermLabel(currentClass.termType, selectedTerm) : 'Anual'}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads an Attendance Report PDF (Relatório Oficial de Frequência)
 */
export function generateAttendanceReportPDF(
  currentClass: ClassRoom,
  students: Student[],
  attendances: AttendanceRecord[],
  selectedTerm: number
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const activeStudents = students
    .filter(s => s.classId === currentClass.id && s.status === 'active')
    .sort((a, b) => a.rollNumber - b.rollNumber);

  // Top Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO OFICIAL DE FREQUÊNCIA E ASSIDUIDADE', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Turma: ${currentClass.name} | Disciplina: ${currentClass.subject} | ${getTermLabel(currentClass.termType, selectedTerm)} | Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
    14,
    19
  );

  const head = [['Nº', 'Matrícula', 'Nome do Estudante', 'Aulas', 'Pres.', 'Faltas', 'Just.', 'Freq. %', 'Situação Legal']];

  let totalStudents = activeStudents.length;
  let atRiskCount = 0;
  let sumRates = 0;

  const body = activeStudents.map(student => {
    const att = calculateStudentAttendance(student.id, currentClass.id, attendances, selectedTerm);
    const isRisk = att.totalClasses > 0 && att.attendanceRate < 75;
    if (isRisk) atRiskCount++;
    sumRates += att.attendanceRate;

    return [
      String(student.rollNumber).padStart(2, '0'),
      student.enrollmentNumber || '—',
      student.name,
      att.totalClasses,
      att.presents,
      att.absents,
      att.justified,
      `${att.attendanceRate}%`,
      isRisk ? 'Risco (<75%)' : 'Regular'
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 30,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      font: 'helvetica',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'center', cellWidth: 22 },
      2: { cellWidth: 62 },
      3: { halign: 'center', cellWidth: 14 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', cellWidth: 18, fontStyle: 'bold' },
      8: { halign: 'center', cellWidth: 24, fontStyle: 'bold' }
    },
    didParseCell: (data) => {
      if (data.section === 'body') {
        const text = String(data.cell.raw);
        if (text === 'Regular') {
          data.cell.styles.textColor = [16, 185, 129];
        } else if (text === 'Risco (<75%)') {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    }
  });

  // Summary box
  const avgClassRate = totalStudents > 0 ? Math.round(sumRates / totalStudents) : 100;
  const finalY = (doc as any).lastAutoTable.finalY + 8;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY, 182, 16, 2, 2, 'FD');

  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  doc.setFont('helvetica', 'bold');
  doc.text(`Média de Frequência da Sala: ${avgClassRate}%`, 18, finalY + 6);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Estudantes Regulares: ${totalStudents - atRiskCount} | Alunos em Risco Pedagógico (<75% de presença conforme LDB): ${atRiskCount}`,
    18,
    finalY + 12
  );

  // Signatures
  const signY = finalY + 34;
  if (signY < 275) {
    doc.setDrawColor(180, 180, 180);
    doc.line(20, signY, 90, signY);
    doc.line(120, signY, 190, signY);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Professor(a) Responsável', 55, signY + 4, { align: 'center' });
    doc.text('Visto da Coordenação Pedagógica', 155, signY + 4, { align: 'center' });
  }

  const filename = `Relatorio_Frequencia_${currentClass.name.replace(/\s+/g, '_')}_${getTermLabel(currentClass.termType, selectedTerm)}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads a Lesson Diary PDF (Relatório de Conteúdos Ministrados)
 */
export function generateLessonDiaryPDF(
  currentClass: ClassRoom,
  lessons: LessonContent[],
  selectedTerm: number
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const classLessons = lessons
    .filter(l => l.classId === currentClass.id && Number(l.term) === Number(selectedTerm))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const totalAulas = classLessons.reduce((acc, curr) => acc + (Number(curr.lessonCount) || 1), 0);

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('DIÁRIO DE CLASSE - CONTEÚDOS MINISTRADOS', 14, 12);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Turma: ${currentClass.name} | Disciplina: ${currentClass.subject} | ${getTermLabel(currentClass.termType, selectedTerm)} | Total: ${totalAulas} Aulas`,
    14,
    19
  );

  const head = [['Data / Aulas', 'Status', 'Tema & Conteúdo Ministrado', 'BNCC / Tarefa & Links']];

  const body = classLessons.map(lesson => {
    const dateFormatted = lesson.date ? lesson.date.split('-').reverse().join('/') : '—';
    const aulas = `${dateFormatted}\n(${lesson.lessonCount || 1} ${lesson.lessonCount > 1 ? 'aulas' : 'aula'})`;
    const statusText = lesson.status === 'previsto' ? 'Previsto' : 'Dado';

    const topicAndDesc = `${lesson.topic.toUpperCase()}\n\n${lesson.contentDescription}`;

    let extra = '';
    if (lesson.bnccSkills) extra += `BNCC: ${lesson.bnccSkills}\n`;
    if (lesson.homework) extra += `Tarefa: ${lesson.homework}\n`;
    if (lesson.externalLink) {
      const linkLabel = lesson.externalLinkTitle || 'Link de Apoio';
      extra += `Material: ${linkLabel}\n(${lesson.externalLink})`;
    }

    return [aulas, statusText, topicAndDesc, extra.trim() || '—'];
  });

  autoTable(doc, {
    head,
    body,
    startY: 30,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 3,
      font: 'helvetica',
      valign: 'top'
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 26, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      2: { cellWidth: 92 },
      3: { cellWidth: 45, fontSize: 8 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 18;
  if (finalY < 270) {
    doc.setDrawColor(180, 180, 180);
    doc.line(20, finalY, 90, finalY);
    doc.line(120, finalY, 190, finalY);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Assinatura do(a) Professor(a)', 55, finalY + 4, { align: 'center' });
    doc.text('Visto da Coordenação Pedagógica', 155, finalY + 4, { align: 'center' });
  }

  const filename = `Diario_Conteudos_${currentClass.name.replace(/\s+/g, '_')}_${getTermLabel(currentClass.termType, selectedTerm)}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads an Individual Student Bulletin PDF (Boletim Escolar)
 */
export function generateStudentBulletinPDF(
  currentClass: ClassRoom,
  student: Student,
  assessments: Assessment[],
  gradeRecords: GradeRecord[],
  attendances: AttendanceRecord[],
  observations: StudentObservation[],
  selectedTerm: number,
  termRecoveries: TermRecoveryRecord[] = [],
  finalRecoveries: FinalRecoveryRecord[] = []
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const annualRes = calculateStudentOverallAverage(
    student.id,
    currentClass,
    assessments,
    gradeRecords,
    termRecoveries,
    finalRecoveries
  );

  const attendance = calculateStudentAttendance(student.id, currentClass.id, attendances);

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('BOLETIM ESCOLAR E DESEMPENHO INDIVIDUAL', 14, 13);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Registro Acadêmico Oficial | Turma: ${currentClass.name} | Disciplina: ${currentClass.subject}`,
    14,
    20
  );

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 32, 182, 24, 2, 2, 'FD');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Aluno(a): ${student.name}`, 18, 39);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Nº de Chamada: ${String(student.rollNumber).padStart(2, '0')} | Matrícula: ${student.enrollmentNumber || '—'}`, 18, 45);
  doc.text(
    `Responsável: ${student.guardianName || 'Não informado'} ${student.guardianPhone ? `(${student.guardianPhone})` : ''}`,
    18,
    51
  );

  doc.setFont('helvetica', 'bold');
  let situacaoLabel = 'Em Avaliação';
  if (annualRes.status === 'approved') situacaoLabel = 'Aprovado';
  else if (annualRes.status === 'approved_recovery') situacaoLabel = 'Aprovado (após Rec. Final)';
  else if (annualRes.status === 'failed') situacaoLabel = 'Reprovado';
  else if (annualRes.status === 'recovery') situacaoLabel = 'Em Recuperação Final';

  doc.text(`Situação: ${situacaoLabel}`, 125, 39);
  doc.setFont('helvetica', 'normal');
  doc.text(`Média Mínima: ${currentClass.passingGrade.toFixed(1)}`, 125, 45);

  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 60, 182, 16, 2, 2, 'F');

  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('MÉDIA ANUAL', 22, 65);
  doc.text('REC. FINAL', 65, 65);
  doc.text('MÉDIA FINAL', 105, 65);
  doc.text('FREQUÊNCIA', 145, 65);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(annualRes.annualAverage !== null ? annualRes.annualAverage.toFixed(1) : '—', 22, 72);
  doc.text(annualRes.finalRecoveryScore !== null ? annualRes.finalRecoveryScore.toFixed(1) : '—', 65, 72);
  doc.text(annualRes.definitiveAverage !== null ? annualRes.definitiveAverage.toFixed(1) : '—', 105, 72);
  doc.text(`${attendance.attendanceRate}%`, 145, 72);

  const tableHead = [['Período', 'Avaliações do Período', 'Média Reg.', 'Rec. Paralela', 'Média Final', 'Situação']];
  const tableBody = annualRes.termsSummary.map(item => {
    const asmList = item.assessmentScores.length === 0
      ? 'Nenhuma avaliação realizada'
      : item.assessmentScores.map(a => `${a.assessmentName}: ${a.score !== null ? a.score.toFixed(1) : 'S/N'}`).join(' | ');

    const isTermApp = item.average !== null && item.average >= currentClass.passingGrade;

    return [
      getTermLabel(currentClass.termType, item.term),
      asmList,
      item.regularAverage !== null ? item.regularAverage.toFixed(1) : '—',
      item.recoveryScore !== null ? `${item.recoveryScore.toFixed(1)}${item.isSubstituted ? ' (Subst.)' : ''}` : '—',
      item.average !== null ? item.average.toFixed(1) : '—',
      item.average !== null ? (isTermApp ? 'Aprovado' : 'Recuperação') : 'Pendente'
    ];
  });

  autoTable(doc, {
    head: tableHead,
    body: tableBody,
    startY: 81,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2.5,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 28, fontStyle: 'bold' },
      1: { cellWidth: 70 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 22, halign: 'center', fontStyle: 'bold' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 8;
  const obs = observations.find(o => o.studentId === student.id && Number(o.term) === Number(selectedTerm));

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, finalY, 182, 34, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`PARECER DESCRITIVO DO PROFESSOR (${getTermLabel(currentClass.termType, selectedTerm)})`, 18, finalY + 7);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const parecerText = obs?.observation || 'Sem observações pedagógicas registradas para este período letivo.';
  const splitText = doc.splitTextToSize(parecerText, 174);
  doc.text(splitText, 18, finalY + 14);

  const signY = finalY + 48;
  if (signY < 275) {
    doc.setDrawColor(180, 180, 180);
    doc.line(20, signY, 90, signY);
    doc.line(120, signY, 190, signY);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Professor(a) Responsável', 55, signY + 4, { align: 'center' });
    doc.text('Visto da Coordenação Pedagógica', 155, signY + 4, { align: 'center' });
  }

  const filename = `Boletim_${student.name.replace(/\s+/g, '_')}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads Student List PDF (Lista de Alunos por Turma)
 */
export function generateStudentListPDF(
  currentClass: ClassRoom,
  students: Student[],
  mode: 'chamada' | 'assinatura' | 'cadastral' | 'desempenho' = 'chamada',
  options?: {
    customTitle?: string;
    blankColumnsCount?: number;
    showSignatures?: boolean;
    onlyActive?: boolean;
  }
): void {
  const isLandscape = mode === 'chamada' && (options?.blankColumnsCount || 10) > 8;
  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = isLandscape ? 297 : 210;

  const filteredStudents = students
    .filter(s => s.classId === currentClass.id && (options?.onlyActive !== false ? s.status === 'active' : true))
    .sort((a, b) => a.rollNumber - b.rollNumber);

  // Top Banner
  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, pageWidth, 24, 'F');

  const titleText = options?.customTitle || (
    mode === 'chamada' ? 'LISTA DE CHAMADA DA TURMA (DIÁRIO DE CLASSE)' :
    mode === 'assinatura' ? 'LISTA DE ASSINATURA / ENTREGA DE AVALIAÇÕES' :
    mode === 'cadastral' ? 'FICHA CADASTRAL E CONTATOS DA TURMA' :
    'RELAÇÃO GERAL DE ALUNOS DA TURMA'
  );

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(titleText, 14, 11);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Turma: ${currentClass.name} | Disciplina: ${currentClass.subject} | Turno: ${currentClass.shift} | Total: ${filteredStudents.length} Alunos | Emissão: ${new Date().toLocaleDateString('pt-BR')}`,
    14,
    18
  );

  let head: any[][] = [];
  let body: any[][] = [];

  if (mode === 'chamada') {
    const colCount = options?.blankColumnsCount || 10;
    const blankHeaders = Array.from({ length: colCount }, (_, i) => `__/__\n(${i + 1})`);
    head = [['Nº', 'Matrícula', 'Nome do Estudante', ...blankHeaders]];

    body = filteredStudents.map(student => [
      String(student.rollNumber).padStart(2, '0'),
      student.enrollmentNumber || '—',
      student.name,
      ...Array.from({ length: colCount }, () => '')
    ]);
  } else if (mode === 'assinatura') {
    head = [['Nº', 'Matrícula', 'Nome do Estudante', 'Data', 'Assinatura / Rubrica do Estudante ou Responsável']];
    body = filteredStudents.map(student => [
      String(student.rollNumber).padStart(2, '0'),
      student.enrollmentNumber || '—',
      student.name,
      '',
      ''
    ]);
  } else if (mode === 'cadastral') {
    head = [['Nº', 'Matrícula', 'Nome do Estudante', 'Responsável', 'Telefone de Contato', 'Situação']];
    body = filteredStudents.map(student => [
      String(student.rollNumber).padStart(2, '0'),
      student.enrollmentNumber || '—',
      student.name,
      student.guardianName || '—',
      student.guardianPhone || '—',
      student.status === 'active' ? 'Ativo' : student.status === 'transferred' ? 'Transferido' : 'Inativo'
    ]);
  } else {
    head = [['Nº', 'Matrícula', 'Nome do Estudante', 'Situação', 'Observações']];
    body = filteredStudents.map(student => [
      String(student.rollNumber).padStart(2, '0'),
      student.enrollmentNumber || '—',
      student.name,
      student.status === 'active' ? 'Ativo' : 'Transferido',
      student.notes || '—'
    ]);
  }

  autoTable(doc, {
    head,
    body,
    startY: 28,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: mode === 'chamada' ? 2 : 2.5,
      font: 'helvetica',
      valign: 'middle'
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 24, halign: 'center' },
      2: { cellWidth: mode === 'chamada' ? 55 : 65 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 14;
  const maxSafeY = isLandscape ? 180 : 265;

  if (options?.showSignatures !== false && finalY < maxSafeY) {
    const leftX = isLandscape ? 40 : 20;
    const rightX = isLandscape ? 180 : 120;
    const lineWidth = isLandscape ? 80 : 70;

    doc.setDrawColor(180, 180, 180);
    doc.line(leftX, finalY, leftX + lineWidth, finalY);
    doc.line(rightX, finalY, rightX + lineWidth, finalY);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Professor(a) Responsável', leftX + lineWidth / 2, finalY + 4, { align: 'center' });
    doc.text('Visto da Coordenação / Secretaria', rightX + lineWidth / 2, finalY + 4, { align: 'center' });
  }

  const filename = `Lista_Alunos_${currentClass.name.replace(/\s+/g, '_')}_${mode}.pdf`;
  doc.save(filename);
}

/**
 * Generates and downloads Occurrences PDF (Relatório de Ocorrências por Data / Turma)
 */
export function generateIncidentsPDF(
  currentClass: ClassRoom,
  students: Student[],
  incidents: StudentIncident[],
  filterDate?: string,
  incidentTypes?: IncidentTypeDefinition[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const classIncidents = incidents
    .filter(inc => inc.classId === currentClass.id && (!filterDate || inc.date === filterDate))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  doc.setFillColor(30, 41, 59);
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('LIVRO DE OCORRÊNCIAS DISCIPLINARES & PEDAGÓGICAS', 14, 12);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  const dateInfo = filterDate ? `Data: ${filterDate.split('-').reverse().join('/')}` : 'Todas as datas';
  doc.text(
    `Turma: ${currentClass.name} | Disciplina: ${currentClass.subject} | ${dateInfo} | Total: ${classIncidents.length} Registros`,
    14,
    19
  );

  const head = [['Data', 'Estudante', 'Tipo / Título', 'Descrição & Providências Adotadas', 'Família']];

  const defaultTypeLabels: Record<string, string> = {
    comportamento: 'Comportamento',
    pedagogica: 'Pedagógica',
    atraso: 'Atraso',
    tarefa: 'Falta Tarefa',
    material: 'Falta Material',
    elogio: 'Elogio',
    comunicacao_responsavel: 'Comunicação',
    outro: 'Outro'
  };

  const body = classIncidents.map(inc => {
    const student = students.find(s => s.id === inc.studentId);
    const studentName = student ? `Nº ${String(student.rollNumber).padStart(2, '0')} - ${student.name}` : 'Estudante não identificado';
    const dateFormatted = inc.date ? inc.date.split('-').reverse().join('/') : '—';
    const customDef = incidentTypes?.find(t => t.id === inc.type);
    const typeLabel = customDef?.label || defaultTypeLabels[inc.type] || inc.type;

    let descText = inc.description;
    if (inc.actionTaken) {
      descText += `\n\nProvidência: ${inc.actionTaken}`;
    }

    return [
      dateFormatted,
      studentName,
      `${typeLabel}\n\n${inc.title}`,
      descText,
      inc.notifiedGuardian ? 'Notificado' : 'Não'
    ];
  });

  autoTable(doc, {
    head,
    body,
    startY: 30,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
      font: 'helvetica',
      valign: 'top'
    },
    headStyles: {
      fillColor: [79, 70, 229],
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 42, fontStyle: 'bold' },
      2: { cellWidth: 32 },
      3: { cellWidth: 70 },
      4: { cellWidth: 18, halign: 'center' }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 16;
  if (finalY < 270) {
    doc.setDrawColor(180, 180, 180);
    doc.line(20, finalY, 90, finalY);
    doc.line(120, finalY, 190, finalY);

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Professor(a) Registrante', 55, finalY + 4, { align: 'center' });
    doc.text('Visto da Orientação / Direção', 155, finalY + 4, { align: 'center' });
  }

  const filename = `Ocorrencias_${currentClass.name.replace(/\s+/g, '_')}_${filterDate || 'Geral'}.pdf`;
  doc.save(filename);
}
