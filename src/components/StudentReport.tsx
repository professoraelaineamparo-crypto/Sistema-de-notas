import React, { useState } from 'react';
import {
  Printer,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Save,
  CheckCircle2,
  FileCheck2,
  FileText,
  Phone,
  GraduationCap,
  Sparkles
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  Assessment,
  GradeRecord,
  AttendanceRecord,
  StudentObservation,
  TermRecoveryRecord,
  FinalRecoveryRecord
} from '../types';
import {
  calculateStudentOverallAverage,
  calculateStudentAttendance,
  calculateStudentTermAverage,
  getTermLabel,
  getTermCount
} from '../utils/calculations';
import { generateStudentBulletinPDF } from '../utils/pdfGenerator';

interface StudentReportProps {
  currentClass: ClassRoom;
  students: Student[];
  assessments: Assessment[];
  gradeRecords: GradeRecord[];
  termRecoveries?: TermRecoveryRecord[];
  finalRecoveries?: FinalRecoveryRecord[];
  attendances: AttendanceRecord[];
  observations: StudentObservation[];
  selectedStudentId: string;
  onSelectStudentId: (studentId: string) => void;
  onSaveObservation: (studentId: string, term: number, text: string) => void;
  selectedTerm: number;
}

export const StudentReport: React.FC<StudentReportProps> = ({
  currentClass,
  students,
  assessments,
  gradeRecords,
  termRecoveries = [],
  finalRecoveries = [],
  attendances,
  observations,
  selectedStudentId,
  onSelectStudentId,
  onSaveObservation,
  selectedTerm
}) => {
  const activeStudents = students
    .filter(s => s.classId === currentClass.id && s.status === 'active')
    .sort((a, b) => a.rollNumber - b.rollNumber);

  const student = activeStudents.find(s => s.id === selectedStudentId) || activeStudents[0];

  const currentIndex = activeStudents.findIndex(s => s.id === (student?.id || ''));

  const currentObs = observations.find(
    o => o.studentId === student?.id && Number(o.term) === Number(selectedTerm)
  );
  const [obsText, setObsText] = useState(currentObs?.observation || '');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  React.useEffect(() => {
    const obs = observations.find(o => o.studentId === student?.id && Number(o.term) === Number(selectedTerm));
    setObsText(obs?.observation || '');
    setIsSavedNotice(false);
  }, [student?.id, selectedTerm, observations]);

  if (!student) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <p className="text-slate-500 text-sm">Nenhum estudante matriculado nesta turma.</p>
      </div>
    );
  }

  const annualRes = calculateStudentOverallAverage(
    student.id,
    currentClass,
    assessments,
    gradeRecords,
    termRecoveries,
    finalRecoveries
  );

  const attendance = calculateStudentAttendance(student.id, currentClass.id, attendances);
  const isApproved = annualRes.definitiveAverage !== null && annualRes.definitiveAverage >= currentClass.passingGrade;
  const numTerms = getTermCount(currentClass.termType);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectStudentId(activeStudents[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < activeStudents.length - 1) {
      onSelectStudentId(activeStudents[currentIndex + 1].id);
    }
  };

  const handleSaveObservation = () => {
    onSaveObservation(student.id, selectedTerm, obsText);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    generateStudentBulletinPDF(
      currentClass,
      student,
      assessments,
      gradeRecords,
      attendances,
      observations,
      selectedTerm,
      termRecoveries,
      finalRecoveries
    );
  };

  const chartHeight = 120;
  const chartWidth = 360;

  return (
    <div className="space-y-6">
      {/* Student Navigation Bar (hidden in print) */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <label htmlFor="student-selector" className="text-xs font-bold text-slate-500 uppercase">Aluno:</label>
          <select
            id="student-selector"
            value={student.id}
            onChange={(e) => onSelectStudentId(e.target.value)}
            className="text-sm font-bold text-slate-800 bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 max-w-[220px] sm:max-w-xs md:max-w-sm truncate cursor-pointer"
          >
            {activeStudents.map(s => (
              <option key={s.id} value={s.id}>
                Nº {String(s.rollNumber).padStart(2, '0')} - {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handlePrev}
            disabled={currentIndex <= 0}
            className="p-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition"
            title="Aluno anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-slate-500 font-medium px-2">
            {currentIndex + 1} de {activeStudents.length}
          </span>
          <button
            onClick={handleNext}
            disabled={currentIndex >= activeStudents.length - 1}
            className="p-1.5 text-xs text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg disabled:opacity-40 transition"
            title="Próximo aluno"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleDownloadPDF}
            className="ml-3 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
            title="Baixar arquivo PDF timbrado para salvar no computador, enviar por e-mail ou WhatsApp"
          >
            <FileText className="w-3.5 h-3.5 text-rose-600" />
            <span>Gerar PDF (Arquivo)</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition cursor-pointer"
            title="Imprimir direto na impressora física via diálogo do navegador (folha A4) para reuniões de pais ou conselho"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir (Papel)</span>
          </button>
        </div>
      </div>

      {/* Official Bulletin Card (Printable) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print:p-0 print:border-none print:shadow-none space-y-6">
        {/* Official Header */}
        <div className="border-b-2 border-slate-900 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-bold print:border print:border-slate-800">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
                Boletim Escolar & Parecer Pedagógico
              </h2>
              <p className="text-xs text-slate-600">
                Registro de Desempenho Acadêmico e Assiduidade Individual
              </p>
            </div>
          </div>

          <div className="text-right text-xs text-slate-600">
            <p className="font-bold text-slate-800">{currentClass.gradeLevel}</p>
            <p>{currentClass.name} • {currentClass.subject} ({currentClass.shift})</p>
            <p className="text-[11px] text-slate-500">Média de Aprovação: {currentClass.passingGrade.toFixed(1)}</p>
          </div>
        </div>

        {/* Student Identification Profile */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nome do Aluno</span>
            <p className="text-sm font-bold text-slate-900 mt-0.5">{student.name}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Nº de Chamada & Matrícula</span>
            <p className="font-semibold text-slate-800 mt-0.5">
              Nº {String(student.rollNumber).padStart(2, '0')} • Matrícula {student.enrollmentNumber}
            </p>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Responsável Legal</span>
            <p className="font-medium text-slate-700 mt-0.5 flex items-center gap-1">
              {student.guardianName || 'Não informado'}
            </p>
            {student.guardianPhone && (
              <span className="text-[10px] text-slate-500 flex items-center gap-0.5 mt-0.5">
                <Phone className="w-3 h-3 text-slate-400" />
                {student.guardianPhone}
              </span>
            )}
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Situação Geral</span>
            <div className="mt-0.5">
              {annualRes.status === 'pending' && (
                <span className="text-xs font-semibold text-slate-500">Em Avaliação</span>
              )}
              {annualRes.status === 'approved' && (
                <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovado Direto
                </span>
              )}
              {annualRes.status === 'approved_recovery' && (
                <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Aprovado (após Rec. Final)
                </span>
              )}
              {annualRes.status === 'recovery' && (
                <span className="inline-flex items-center gap-1 font-bold text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full text-xs">
                  Em Recuperação Final
                </span>
              )}
              {annualRes.status === 'failed' && (
                <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full text-xs">
                  Reprovado
                </span>
              )}
            </div>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Média Anual</span>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {annualRes.annualAverage !== null ? annualRes.annualAverage.toFixed(1) : '—'}
            </p>
            <span className="text-[11px] text-slate-500">
              Meta: {currentClass.passingGrade.toFixed(1)}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Rec. Final</span>
            <p className="text-2xl font-black text-amber-700 mt-1">
              {annualRes.finalRecoveryScore !== null ? annualRes.finalRecoveryScore.toFixed(1) : '—'}
            </p>
            <span className="text-[11px] text-slate-500">
              {annualRes.finalRecoveryScore !== null ? 'Exame Realizado' : 'Não necessária'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Média Definitiva</span>
            <p className="text-2xl font-black text-indigo-700 mt-1">
              {annualRes.definitiveAverage !== null ? annualRes.definitiveAverage.toFixed(1) : '—'}
            </p>
            <span className="text-[11px] text-slate-500 truncate block" title={annualRes.formulaUsed}>
              {annualRes.finalRecoveryScore !== null ? annualRes.formulaUsed : 'Resultado oficial'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <span className="text-[10px] font-bold text-slate-400 uppercase block">Frequência Total</span>
            <p className="text-2xl font-black text-slate-800 mt-1">
              {attendance.attendanceRate}%
            </p>
            <span className="text-[11px] text-slate-500">
              {attendance.absents} faltas ({attendance.totalClasses} aulas)
            </span>
          </div>
        </div>

        {/* Detailed Breakdown of Grades by Term */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            Detalhamento de Notas, Recuperação Paralela e Avaliações
          </h3>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Período Letivo</th>
                  <th className="py-2.5 px-4">Avaliações Realizadas</th>
                  <th className="py-2.5 px-3 text-center">Média Regular</th>
                  <th className="py-2.5 px-3 text-center bg-amber-50/50 text-amber-900">Rec. Paralela</th>
                  <th className="py-2.5 px-4 text-center bg-indigo-50/50 text-indigo-900">Média Final</th>
                  <th className="py-2.5 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {annualRes.termsSummary.map((item) => {
                  const isTermApproved = item.average !== null && item.average >= currentClass.passingGrade;

                  return (
                    <tr key={item.term} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {getTermLabel(currentClass.termType, item.term)}
                      </td>

                      <td className="py-3 px-4">
                        {item.assessmentScores.length === 0 ? (
                          <span className="text-slate-400 italic">Nenhuma avaliação realizada</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {item.assessmentScores.map((asm) => (
                              <span
                                key={asm.assessmentId}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px]"
                              >
                                <span className="font-medium text-slate-700">{asm.assessmentName}:</span>
                                <strong className={`font-bold ${
                                  asm.score !== null
                                    ? asm.score < currentClass.passingGrade
                                      ? 'text-rose-600'
                                      : 'text-emerald-700'
                                    : 'text-slate-400'
                                }`}>
                                  {asm.score !== null ? asm.score.toFixed(1) : 'S/N'}
                                </strong>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-slate-600">
                        {item.regularAverage !== null ? item.regularAverage.toFixed(1) : '—'}
                      </td>

                      <td className="py-3 px-3 text-center bg-amber-50/20 font-bold text-amber-900">
                        {item.recoveryScore !== null ? (
                          <div className="flex flex-col items-center">
                            <span>{item.recoveryScore.toFixed(1)}</span>
                            {item.isSubstituted && (
                              <span className="text-[9px] text-amber-700 font-bold flex items-center gap-0.5">
                                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                Substituiu média
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center bg-indigo-50/20">
                        <span className={`text-sm font-black px-2.5 py-0.5 rounded-md inline-block ${
                          item.average === null
                            ? 'text-slate-400'
                            : isTermApproved
                            ? 'text-emerald-700 bg-emerald-50'
                            : 'text-rose-700 bg-rose-50'
                        }`}>
                          {item.average !== null ? item.average.toFixed(1) : '—'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-center">
                        {item.average === null ? (
                          <span className="text-slate-400 text-[11px]">Pendente</span>
                        ) : isTermApproved ? (
                          <span className="text-[11px] font-bold text-emerald-700">
                            {item.isSubstituted ? 'Aprovado (Rec)' : 'Aprovado'}
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-rose-700">
                            Recuperação
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Visual Evolution Graphic: Student vs Class Average */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Comparativo de Evolução: Aluno vs Média da Sala
            </h4>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1 text-indigo-700 font-bold">
                <span className="w-3 h-3 bg-indigo-600 rounded-full inline-block" />
                {student.name.split(' ')[0]}
              </span>
              <span className="flex items-center gap-1 text-slate-500 font-medium">
                <span className="w-3 h-3 bg-slate-300 rounded inline-block" />
                Média da Turma
              </span>
            </div>
          </div>

          <div className="w-full bg-white p-3 rounded-lg border border-slate-200">
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32 overflow-visible">
              {(() => {
                const passingY = chartHeight - (currentClass.passingGrade / 10) * (chartHeight - 20) - 10;
                return (
                  <line
                    x1="20"
                    y1={passingY}
                    x2={chartWidth - 20}
                    y2={passingY}
                    stroke="#f59e0b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                );
              })()}

              {annualRes.termsSummary.map((item, idx) => {
                const step = (chartWidth - 60) / numTerms;
                const x = 30 + idx * step + step / 2;

                const studentVal = item.average !== null ? item.average : 0;
                const studentH = (studentVal / 10) * (chartHeight - 30);
                const studentY = chartHeight - studentH - 10;

                let cSum = 0;
                let cCount = 0;
                activeStudents.forEach(s => {
                  const res = calculateStudentTermAverage(s.id, currentClass.id, item.term, assessments, gradeRecords, currentClass.gradeCalculationType, termRecoveries);
                  if (res.average !== null) {
                    cSum += res.average;
                    cCount++;
                  }
                });
                const classAvg = cCount > 0 ? cSum / cCount : null;
                const classH = classAvg !== null ? (classAvg / 10) * (chartHeight - 30) : 0;
                const classY = chartHeight - classH - 10;

                return (
                  <g key={item.term}>
                    {classAvg !== null && (
                      <rect
                        x={x - 16}
                        y={classY}
                        width="14"
                        height={classH}
                        fill="#cbd5e1"
                        rx="3"
                      />
                    )}

                    {item.average !== null && (
                      <rect
                        x={x + 2}
                        y={studentY}
                        width="14"
                        height={studentH}
                        fill={item.average >= currentClass.passingGrade ? '#4f46e5' : '#e11d48'}
                        rx="3"
                      />
                    )}

                    {item.average !== null && (
                      <text
                        x={x + 9}
                        y={studentY - 4}
                        fontSize="9"
                        fontWeight="bold"
                        fill="#1e293b"
                        textAnchor="middle"
                      >
                        {item.average.toFixed(1)}
                      </text>
                    )}

                    <text
                      x={x}
                      y={chartHeight + 4}
                      fontSize="9"
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      {getTermLabel(currentClass.termType, item.term)}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Qualitative Diagnostic / Parecer Descritivo do Professor */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Parecer Descritivo do Professor ({getTermLabel(currentClass.termType, selectedTerm)})
            </h4>
            {isSavedNotice && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Parecer salvo com sucesso!
              </span>
            )}
          </div>

          <div className="relative">
            <textarea
              rows={3}
              placeholder="Descreva o desenvolvimento socioemocional, participação, avanços conceituais e recomendações de estudo para a família..."
              value={obsText}
              onChange={(e) => setObsText(e.target.value)}
              className="w-full text-xs p-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed print:border-slate-400 print:bg-transparent"
            />
            <div className="flex justify-end mt-2 print:hidden">
              <button
                onClick={handleSaveObservation}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5 text-indigo-400" />
                <span>Salvar Parecer</span>
              </button>
            </div>
          </div>
        </div>

        {/* Signatures Area for Formal Print */}
        <div className="pt-10 border-t border-slate-300 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <div className="w-48 border-b border-slate-400 mx-auto mb-1" />
            <p className="font-bold text-slate-800">Professor(a) Responsável</p>
            <p className="text-[10px] text-slate-500">{currentClass.subject}</p>
          </div>

          <div>
            <div className="w-48 border-b border-slate-400 mx-auto mb-1" />
            <p className="font-bold text-slate-800">Coordenação Pedagógica / Direção</p>
            <p className="text-[10px] text-slate-500">Visto da Escola</p>
          </div>
        </div>
      </div>
    </div>
  );
};
