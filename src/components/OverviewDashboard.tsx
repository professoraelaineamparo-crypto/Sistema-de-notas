import React from 'react';
import {
  TrendingUp,
  Award,
  AlertTriangle,
  Users,
  CheckCircle2,
  BookOpen,
  CalendarDays,
  ArrowRight
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  Assessment,
  GradeRecord,
  AttendanceRecord,
  LessonContent,
  TermRecoveryRecord,
  FinalRecoveryRecord
} from '../types';
import {
  calculateClassStats,
  calculateStudentTermAverage,
  calculateStudentAttendance,
  getTermLabel
} from '../utils/calculations';

interface OverviewDashboardProps {
  currentClass: ClassRoom;
  students: Student[];
  assessments: Assessment[];
  gradeRecords: GradeRecord[];
  termRecoveries?: TermRecoveryRecord[];
  finalRecoveries?: FinalRecoveryRecord[];
  attendances: AttendanceRecord[];
  lessons: LessonContent[];
  selectedTerm: number;
  onNavigateToStudent: (studentId: string) => void;
  onNavigateToTab: (tab: 'grade-map' | 'attendance' | 'lessons' | 'reports') => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  currentClass,
  students,
  assessments,
  gradeRecords,
  termRecoveries = [],
  finalRecoveries = [],
  attendances,
  lessons,
  selectedTerm,
  onNavigateToStudent,
  onNavigateToTab
}) => {
  const activeStudents = students.filter(s => s.classId === currentClass.id && s.status === 'active');
  const stats = calculateClassStats(
    currentClass,
    students,
    assessments,
    gradeRecords,
    attendances,
    selectedTerm,
    termRecoveries,
    finalRecoveries
  );

  // Term lessons and assessments
  const termLessons = lessons.filter(l => l.classId === currentClass.id && l.term === selectedTerm);
  const termAssessments = assessments.filter(a => a.classId === currentClass.id && a.term === selectedTerm);

  // Calculate list of at-risk students
  const atRiskStudents = activeStudents
    .map(student => {
      const { average } = calculateStudentTermAverage(
        student.id,
        currentClass.id,
        selectedTerm,
        assessments,
        gradeRecords,
        currentClass.gradeCalculationType,
        termRecoveries
      );
      const att = calculateStudentAttendance(student.id, currentClass.id, attendances, selectedTerm);
      const isGradeRisk = average !== null && average < currentClass.passingGrade;
      const isAttendanceRisk = att.totalClasses > 0 && att.attendanceRate < 75;

      return {
        student,
        average,
        attendance: att,
        isGradeRisk,
        isAttendanceRisk
      };
    })
    .filter(item => item.isGradeRisk || item.isAttendanceRisk);

  // SVG Chart Dimensions
  const chartHeight = 160;
  const chartWidth = 400;

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome context */}
      <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 text-xs font-semibold mb-2 border border-indigo-400/20">
              <span>{currentClass.name}</span>
              <span>•</span>
              <span>{currentClass.subject}</span>
              <span>•</span>
              <span>{getTermLabel(currentClass.termType, selectedTerm)}</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Painel de Desempenho e Evolução
            </h2>
            <p className="text-sm text-indigo-200/90 max-w-2xl mt-1">
              Acompanhamento centralizado do rendimento escolar, assiduidade da turma e indicadores pedagógicos em tempo real.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigateToTab('grade-map')}
              className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 text-xs font-bold rounded-xl shadow-sm transition flex items-center gap-1.5"
            >
              <span>Lançar / Ver Notas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigateToTab('attendance')}
              className="px-4 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold rounded-xl border border-indigo-400/30 shadow-sm transition flex items-center gap-1.5"
            >
              <span>Fazer Chamada</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Decorative background shape */}
        <div className="absolute -right-8 -bottom-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Média Atual */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Média do {getTermLabel(currentClass.termType, selectedTerm)}
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">
              {stats.classAverageCurrentTerm !== null ? stats.classAverageCurrentTerm.toFixed(1) : '—'}
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              {stats.classAverageCurrentTerm !== null ? (
                stats.classAverageCurrentTerm >= currentClass.passingGrade ? (
                  <span className="text-emerald-600 font-medium flex items-center gap-0.5">
                    Acima da meta mínima ({currentClass.passingGrade.toFixed(1)})
                  </span>
                ) : (
                  <span className="text-rose-600 font-medium flex items-center gap-0.5">
                    Abaixo da meta mínima ({currentClass.passingGrade.toFixed(1)})
                  </span>
                )
              ) : (
                <span className="text-slate-400">Nenhuma avaliação computada</span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Média Geral Anual */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Média Acumulada Anual
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-slate-900">
              {stats.overallClassAverage !== null ? stats.overallClassAverage.toFixed(1) : '—'}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Consolidação de todos os períodos letivos
            </p>
          </div>
        </div>

        {/* Card 3: Aproveitamento & Aprovação */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Aproveitamento no Período
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-emerald-600">
                {stats.approvedCount}
              </span>
              <span className="text-xs text-slate-400">
                de {stats.totalStudents} alunos ({stats.totalStudents > 0 ? Math.round((stats.approvedCount / stats.totalStudents) * 100) : 0}%)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.recoveryCount} aluno(s) com nota &lt; {currentClass.passingGrade.toFixed(1)}
            </p>
          </div>
        </div>

        {/* Card 4: Alunos em Risco ou Alerta */}
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase">
              Alunos em Atenção
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-600">
              {atRiskStudents.length}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats.atRiskAttendanceCount} com risco de falta (&lt;75% presenças)
            </p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Evolução Acadêmica da Sala */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Evolução Acadêmica da Sala
              </h3>
              <p className="text-xs text-slate-500">
                Comparativo da média da turma por período com a meta de aprovação ({currentClass.passingGrade.toFixed(1)})
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-slate-100 text-slate-600">
              Meta: {currentClass.passingGrade.toFixed(1)}
            </span>
          </div>

          {/* SVG Line / Bar Graphic */}
          <div className="w-full bg-slate-50/70 p-4 rounded-xl border border-slate-100 relative">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-44 overflow-visible"
            >
              {/* Reference Grid lines */}
              {[0, 2.5, 5.0, 7.5, 10.0].map((val) => {
                const y = chartHeight - (val / 10) * (chartHeight - 30) - 15;
                return (
                  <g key={val}>
                    <line
                      x1="30"
                      y1={y}
                      x2={chartWidth - 10}
                      y2={y}
                      stroke="#e2e8f0"
                      strokeDasharray={val === currentClass.passingGrade ? "4 3" : undefined}
                      strokeWidth={val === currentClass.passingGrade ? "1.5" : "1"}
                    />
                    <text x="5" y={y + 3} fontSize="9" fill="#94a3b8" textAnchor="start">
                      {val.toFixed(1)}
                    </text>
                  </g>
                );
              })}

              {/* Passing Grade dashed line highlight */}
              {(() => {
                const passingY = chartHeight - (currentClass.passingGrade / 10) * (chartHeight - 30) - 15;
                return (
                  <g>
                    <line
                      x1="30"
                      y1={passingY}
                      x2={chartWidth - 10}
                      y2={passingY}
                      stroke="#f59e0b"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    />
                    <text
                      x={chartWidth - 15}
                      y={passingY - 4}
                      fontSize="9"
                      fill="#d97706"
                      fontWeight="bold"
                      textAnchor="end"
                    >
                      Corte {currentClass.passingGrade.toFixed(1)}
                    </text>
                  </g>
                );
              })()}

              {/* Bars and points for each term */}
              {stats.termAverages.map((item, idx) => {
                const step = (chartWidth - 60) / stats.termAverages.length;
                const x = 50 + idx * step + step / 2 - 15;
                const value = item.average !== null ? item.average : 0;
                const barHeight = item.average !== null ? (value / 10) * (chartHeight - 30) : 0;
                const y = chartHeight - barHeight - 15;
                const isSelected = item.term === selectedTerm;

                return (
                  <g key={item.term} className="transition-all duration-300">
                    {/* Bar background */}
                    <rect
                      x={x - 12}
                      y={15}
                      width="36"
                      height={chartHeight - 30}
                      fill={isSelected ? '#e0e7ff' : '#f8fafc'}
                      rx="4"
                      opacity="0.4"
                    />

                    {/* Value Bar */}
                    {item.average !== null && (
                      <rect
                        x={x - 8}
                        y={y}
                        width="28"
                        height={barHeight}
                        fill={item.average >= currentClass.passingGrade ? '#4f46e5' : '#f43f5e'}
                        rx="5"
                        opacity={isSelected ? "1" : "0.75"}
                      />
                    )}

                    {/* Value Label */}
                    <text
                      x={x + 6}
                      y={item.average !== null ? y - 6 : chartHeight - 20}
                      fontSize="11"
                      fontWeight="bold"
                      fill={item.average !== null ? '#1e293b' : '#94a3b8'}
                      textAnchor="middle"
                    >
                      {item.average !== null ? item.average.toFixed(1) : 'S/N'}
                    </text>

                    {/* Term Label */}
                    <text
                      x={x + 6}
                      y={chartHeight + 10}
                      fontSize="10"
                      fontWeight={isSelected ? 'bold' : 'normal'}
                      fill={isSelected ? '#4338ca' : '#64748b'}
                      textAnchor="middle"
                    >
                      {item.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-indigo-600 inline-block" />
              Na média ou superior
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-rose-500 inline-block" />
              Abaixo da meta
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1 bg-amber-500 border border-amber-500 border-dashed inline-block" />
              Corte ({currentClass.passingGrade.toFixed(1)})
            </span>
          </div>
        </div>

        {/* Chart 2: Distribuição de Desempenho (Histograma) */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-600" />
                Distribuição de Notas da Turma
              </h3>
              <p className="text-xs text-slate-500">
                Segmentação por faixas de rendimento no {getTermLabel(currentClass.termType, selectedTerm)}
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Total: {stats.totalStudents} alunos
            </span>
          </div>

          {/* Histogram distribution */}
          <div className="space-y-3.5 py-1">
            {stats.distribution.map((dist) => {
              const pct = stats.totalStudents > 0 ? Math.round((dist.count / stats.totalStudents) * 100) : 0;
              return (
                <div key={dist.range} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-700">{dist.range}</span>
                    <span className="font-bold text-slate-800">
                      {dist.count} alunos ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: dist.color
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
            <div className="text-xs text-indigo-900">
              <span className="font-bold">Maior nota:</span>{' '}
              {stats.highestGrade !== null ? stats.highestGrade.toFixed(1) : '—'} |{' '}
              <span className="font-bold">Menor nota:</span>{' '}
              {stats.lowestGrade !== null ? stats.lowestGrade.toFixed(1) : '—'}
            </div>
            <button
              onClick={() => onNavigateToTab('grade-map')}
              className="text-xs text-indigo-700 hover:text-indigo-900 font-bold flex items-center gap-1"
            >
              Ver mapa completo
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Lower Row: Alunos em Risco & Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* At-Risk Students Card (2 Cols on lg) */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Estudantes em Alerta Pedagógico
              </h3>
              <p className="text-xs text-slate-500">
                Alunos com média abaixo de {currentClass.passingGrade.toFixed(1)} ou faltas superiores a 25%
              </p>
            </div>
            <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2.5 py-1 rounded-full">
              {atRiskStudents.length} necessitam reforço
            </span>
          </div>

          {atRiskStudents.length === 0 ? (
            <div className="text-center py-8 bg-emerald-50/50 rounded-xl border border-emerald-100">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-800">
                Parabéns! Todos os alunos estão dentro das metas de rendimento e assiduidade.
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                Nenhum estudante em risco identificado neste período letivo.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-400 font-medium">
                    <th className="py-2 pr-3">Nº</th>
                    <th className="py-2 px-3">Estudante</th>
                    <th className="py-2 px-3">Média Atual</th>
                    <th className="py-2 px-3">Frequência</th>
                    <th className="py-2 px-3">Diagnóstico</th>
                    <th className="py-2 pl-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {atRiskStudents.map(({ student, average, attendance, isGradeRisk, isAttendanceRisk }) => (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 pr-3 font-semibold text-slate-500">
                        {String(student.rollNumber).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800">
                        {student.name}
                        {student.guardianName && (
                          <div className="text-[11px] text-slate-400">
                            Resp: {student.guardianName}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block font-bold px-2 py-0.5 rounded ${
                          average !== null && average < currentClass.passingGrade
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {average !== null ? average.toFixed(1) : 'S/N'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`inline-block font-bold px-2 py-0.5 rounded ${
                          attendance.attendanceRate < 75
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {attendance.attendanceRate}% ({attendance.absents} faltas)
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col gap-0.5">
                          {isGradeRisk && (
                            <span className="text-[10px] text-rose-600 font-medium">
                              • Nota abaixo da média ({currentClass.passingGrade.toFixed(1)})
                            </span>
                          )}
                          {isAttendanceRisk && (
                            <span className="text-[10px] text-amber-700 font-medium">
                              • Risco de infrequência (&lt;75%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 pl-3 text-right">
                        <button
                          onClick={() => onNavigateToStudent(student.id)}
                          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg transition"
                        >
                          Ver Boletim
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Class Diary & Assessments Activity */}
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                Diário & Avaliações
              </h3>
              <span className="text-xs text-slate-400">
                {getTermLabel(currentClass.termType, selectedTerm)}
              </span>
            </div>

            <div className="space-y-4">
              {/* Avaliações do período */}
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Avaliações Cadastradas ({termAssessments.length})
                </span>
                {termAssessments.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nenhuma avaliação cadastrada para este período.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {termAssessments.slice(0, 3).map((asm) => (
                      <div
                        key={asm.id}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between text-xs"
                      >
                        <div className="overflow-hidden">
                          <p className="font-semibold text-slate-800 truncate">{asm.name}</p>
                          <p className="text-[11px] text-slate-500">
                            Peso: {asm.weight} | Máx: {asm.maxScore} | {asm.date}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-medium rounded capitalize text-[10px]">
                          {asm.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Aulas ministradas do período */}
              <div className="pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Aulas Registradas ({termLessons.length})
                </span>
                {termLessons.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Nenhuma aula registrada ainda no diário deste período.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {termLessons.slice(0, 2).map((les) => (
                      <div
                        key={les.id}
                        className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-xs"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-700 truncate max-w-[170px]">{les.topic}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {les.date}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2">
                          {les.contentDescription}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('lessons')}
            className="w-full mt-4 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition text-center"
          >
            Abrir Diário de Classe Completo
          </button>
        </div>
      </div>
    </div>
  );
};
