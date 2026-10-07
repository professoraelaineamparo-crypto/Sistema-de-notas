import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  FileSpreadsheet,
  FileText,
  Search,
  CheckCircle,
  Calculator,
  RotateCcw,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  Assessment,
  GradeRecord,
  AssessmentType,
  GradeCalculationType,
  AnnualRecoveryFormula,
  TermRecoveryRecord,
  FinalRecoveryRecord
} from '../types';
import {
  calculateStudentTermAverage,
  calculateStudentOverallAverage,
  getTermLabel,
  getTermCount
} from '../utils/calculations';
import { generateGradeMapPDF } from '../utils/pdfGenerator';
import { ConfirmModal } from './ConfirmModal';

interface GradeMapProps {
  currentClass: ClassRoom;
  students: Student[];
  assessments: Assessment[];
  gradeRecords: GradeRecord[];
  termRecoveries: TermRecoveryRecord[];
  finalRecoveries: FinalRecoveryRecord[];
  selectedTerm: number;
  onUpdateGrade: (assessmentId: string, studentId: string, score: number | null) => void;
  onUpdateTermRecovery: (term: number, studentId: string, score: number | null) => void;
  onUpdateFinalRecovery: (studentId: string, score: number | null) => void;
  onAddAssessment: (newAssessment: Omit<Assessment, 'id'>) => void;
  onDeleteAssessment: (assessmentId: string) => void;
  onSelectStudent: (studentId: string) => void;
  onUpdateCalculationType?: (calcType: GradeCalculationType) => void;
  onUpdateRecoveryFormula?: (formula: AnnualRecoveryFormula) => void;
}

export const GradeMap: React.FC<GradeMapProps> = ({
  currentClass,
  students,
  assessments,
  gradeRecords,
  termRecoveries,
  finalRecoveries,
  selectedTerm,
  onUpdateGrade,
  onUpdateTermRecovery,
  onUpdateFinalRecovery,
  onAddAssessment,
  onDeleteAssessment,
  onSelectStudent,
  onUpdateCalculationType,
  onUpdateRecoveryFormula
}) => {
  const [viewMode, setViewMode] = useState<'term' | 'annual'>('term');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingAssessment, setIsAddingAssessment] = useState(false);
  const [assessmentToDelete, setAssessmentToDelete] = useState<Assessment | null>(null);

  // New Assessment Form State
  const [newAsmName, setNewAsmName] = useState('');
  const [newAsmType, setNewAsmType] = useState<AssessmentType>('prova');
  const [newAsmWeight, setNewAsmWeight] = useState(1);
  const [newAsmMaxScore, setNewAsmMaxScore] = useState(10);
  const [newAsmDate, setNewAsmDate] = useState(() => new Date().toISOString().split('T')[0]);

  const calcType = currentClass.gradeCalculationType || 'aritmetica';

  // Filter students
  const activeStudents = students
    .filter(s => s.classId === currentClass.id && s.status === 'active')
    .sort((a, b) => a.rollNumber - b.rollNumber)
    .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Term assessments (ensuring numeric comparison)
  const termAssessments = assessments.filter(
    a => a.classId === currentClass.id && Number(a.term) === Number(selectedTerm)
  );

  const numTerms = getTermCount(currentClass.termType);

  // Helper to handle grade change with immediate calculation
  const handleScoreInput = (assessmentId: string, studentId: string, rawVal: string) => {
    if (rawVal.trim() === '') {
      onUpdateGrade(assessmentId, studentId, null);
      return;
    }
    const val = parseFloat(rawVal.replace(',', '.'));
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(10, val));
      onUpdateGrade(assessmentId, studentId, clamped);
    }
  };

  // Helper for Term Recovery Input (Recuperação Paralela)
  const handleTermRecoveryInput = (term: number, studentId: string, rawVal: string) => {
    if (rawVal.trim() === '') {
      onUpdateTermRecovery(term, studentId, null);
      return;
    }
    const val = parseFloat(rawVal.replace(',', '.'));
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(10, val));
      onUpdateTermRecovery(term, studentId, clamped);
    }
  };

  // Helper for Final Recovery Input (Recuperação Final)
  const handleFinalRecoveryInput = (studentId: string, rawVal: string) => {
    if (rawVal.trim() === '') {
      onUpdateFinalRecovery(studentId, null);
      return;
    }
    const val = parseFloat(rawVal.replace(',', '.'));
    if (!isNaN(val)) {
      const clamped = Math.max(0, Math.min(10, val));
      onUpdateFinalRecovery(studentId, clamped);
    }
  };

  const handleCreateAssessment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAsmName.trim()) return;

    onAddAssessment({
      classId: currentClass.id,
      term: Number(selectedTerm),
      name: newAsmName.trim(),
      type: newAsmType,
      weight: Number(newAsmWeight) > 0 ? Number(newAsmWeight) : 1,
      maxScore: Number(newAsmMaxScore) > 0 ? Number(newAsmMaxScore) : 10,
      date: newAsmDate
    });

    setNewAsmName('');
    setIsAddingAssessment(false);
  };

  // Export PDF
  const handleExportPDF = () => {
    generateGradeMapPDF(
      currentClass,
      activeStudents,
      assessments,
      gradeRecords,
      selectedTerm,
      viewMode,
      termRecoveries,
      finalRecoveries
    );
  };

  // Export CSV
  const handleExportCSV = () => {
    let headers: string[] = ['Nº', 'Matrícula', 'Estudante'];
    if (viewMode === 'term') {
      termAssessments.forEach(a => headers.push(`"${a.name} (P:${a.weight || 1})"`));
      headers.push('Média Regular');
      headers.push('Rec. Paralela');
      headers.push(`Média Final (${getTermLabel(currentClass.termType, selectedTerm)})`);
      headers.push('Situação');
    } else {
      for (let t = 1; t <= numTerms; t++) {
        headers.push(`${getTermLabel(currentClass.termType, t)}`);
      }
      headers.push('Média Anual');
      headers.push('Rec. Final');
      headers.push('Média Definitiva');
      headers.push('Situação Final');
    }

    const rows = activeStudents.map(student => {
      const rowData: (string | number)[] = [
        student.rollNumber,
        student.enrollmentNumber,
        `"${student.name}"`
      ];

      if (viewMode === 'term') {
        termAssessments.forEach(asm => {
          const g = gradeRecords.find(gr => gr.assessmentId === asm.id && gr.studentId === student.id);
          rowData.push(g && g.score !== null ? Number(g.score).toFixed(1) : '');
        });
        const termRes = calculateStudentTermAverage(
          student.id,
          currentClass.id,
          selectedTerm,
          assessments,
          gradeRecords,
          calcType,
          termRecoveries
        );
        rowData.push(termRes.regularAverage !== null ? termRes.regularAverage.toFixed(1) : '');
        rowData.push(termRes.recoveryScore !== null ? termRes.recoveryScore.toFixed(1) : '');
        rowData.push(termRes.average !== null ? termRes.average.toFixed(1) : '');
        const isApproved = termRes.average !== null && termRes.average >= currentClass.passingGrade;
        rowData.push(termRes.average !== null ? (isApproved ? (termRes.isSubstituted ? 'Aprovado (Rec)' : 'Aprovado') : 'Recuperação') : 'Pendente');
      } else {
        const annualRes = calculateStudentOverallAverage(
          student.id,
          currentClass,
          assessments,
          gradeRecords,
          termRecoveries,
          finalRecoveries
        );
        annualRes.termsSummary.forEach(ts => {
          rowData.push(ts.average !== null ? ts.average.toFixed(1) : '');
        });
        rowData.push(annualRes.annualAverage !== null ? annualRes.annualAverage.toFixed(1) : '');
        rowData.push(annualRes.finalRecoveryScore !== null ? annualRes.finalRecoveryScore.toFixed(1) : '');
        rowData.push(annualRes.definitiveAverage !== null ? annualRes.definitiveAverage.toFixed(1) : '');
        rowData.push(annualRes.status);
      }

      return rowData.join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Mapa_Notas_${currentClass.name.replace(/\s+/g, '_')}_${viewMode === 'term' ? getTermLabel(currentClass.termType, selectedTerm) : 'Anual'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Mapa de Notas da Turma
            </h2>
            <span className="text-xs bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-full">
              {currentClass.name} • {currentClass.subject}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Média de aprovação: <strong className="text-slate-700">{currentClass.passingGrade.toFixed(1)}</strong>. Recuperação paralela substitui a média se maior; recuperação final recalcula o resultado anual.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle: Período Atual vs Anual Consolidado */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium shrink-0 overflow-x-auto thin-scrollbar">
            <button
              onClick={() => setViewMode('term')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                viewMode === 'term'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {getTermLabel(currentClass.termType, selectedTerm)}
            </button>
            <button
              onClick={() => setViewMode('annual')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                viewMode === 'annual'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Consolidado Anual & Rec. Final
            </button>
          </div>

          {/* Add Assessment Button (only in term mode) */}
          {viewMode === 'term' && (
            <button
              onClick={() => setIsAddingAssessment(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Avaliação</span>
            </button>
          )}

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            title="Exportar mapa de notas oficial em PDF"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Gerar PDF</span>
          </button>

          {/* Export CSV */}
          <button
            onClick={handleExportCSV}
            title="Exportar planilha CSV"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">CSV</span>
          </button>
        </div>
      </div>

      {/* Settings Ribbon: Calculation Mode, Recovery Rules, Search */}
      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {viewMode === 'term' ? (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                  Cálculo do Bimestre:
                </span>
                <select
                  value={calcType}
                  onChange={(e) => onUpdateCalculationType?.(e.target.value as GradeCalculationType)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs"
                >
                  <option value="aritmetica">Média Aritmética (Soma ÷ Qtd)</option>
                  <option value="ponderada">Média Ponderada (com Pesos)</option>
                  <option value="somatoria">Somatória de Pontos</option>
                </select>
              </div>

              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-indigo-700 font-semibold bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                Recuperação Paralela substitui a média bimestral caso a nota seja superior
              </span>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5 text-indigo-600" />
                  Fórmula da Recuperação Final:
                </span>
                <select
                  value={currentClass.annualRecoveryFormula || 'rec_final_direta'}
                  onChange={(e) => onUpdateRecoveryFormula?.(e.target.value as AnnualRecoveryFormula)}
                  className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-indigo-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer shadow-xs max-w-xs sm:max-w-md truncate"
                >
                  <option value="rec_final_direta">Repetir Nota da Rec. Final como Média Definitiva (Padrão)</option>
                  <option value="substituicao">Substituição se Maior: max(Média Anual, Rec. Final)</option>
                  <option value="media_aritmetica">Média Aritmética: (Média Anual + Rec. Final) ÷ 2</option>
                  <option value="media_ponderada">Média Ponderada: (Média Anual × 6 + Rec. Final × 4) ÷ 10</option>
                  <option value="substitui_menor_bimestre">Substituição da Menor Nota Bimestral</option>
                </select>
              </div>

              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-amber-800 font-semibold bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <Sparkles className="w-3 h-3 text-amber-600" />
                Média Definitiva recalculada automaticamente conforme regimento escolar
              </span>
            </>
          )}
        </div>

        <div className="relative w-full sm:w-64 self-end sm:self-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar aluno por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Modal / Form to add new assessment */}
      {isAddingAssessment && (
        <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-indigo-600" />
              Cadastrar Nova Avaliação no {getTermLabel(currentClass.termType, selectedTerm)}
            </h4>
            <button
              onClick={() => setIsAddingAssessment(false)}
              className="text-xs text-slate-400 hover:text-slate-600 font-bold"
            >
              Cancelar
            </button>
          </div>

          <form onSubmit={handleCreateAssessment} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            <div className="md:col-span-2">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Nome da Avaliação *
              </label>
              <input
                type="text"
                required
                placeholder="Ex: Prova Mensal de Álgebra"
                value={newAsmName}
                onChange={(e) => setNewAsmName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Tipo
              </label>
              <select
                value={newAsmType}
                onChange={(e) => setNewAsmType(e.target.value as AssessmentType)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="prova">Prova</option>
                <option value="trabalho">Trabalho</option>
                <option value="simulado">Simulado</option>
                <option value="participacao">Participação</option>
                <option value="recuperacao">Recuperação</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Peso na Média
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={newAsmWeight}
                onChange={(e) => setNewAsmWeight(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Data de Aplicação
              </label>
              <input
                type="date"
                value={newAsmDate}
                onChange={(e) => setNewAsmDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-5 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddingAssessment(false)}
                className="px-4 py-1.5 text-xs text-slate-600 hover:text-slate-800 bg-white border border-slate-200 rounded-lg font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg font-bold shadow-xs"
              >
                Salvar Avaliação
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grade Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/90 text-slate-600 border-b border-slate-200">
                <th className="py-3 px-3 w-12 font-bold text-center">Nº</th>
                <th className="py-3 px-4 min-w-[200px] font-bold">Nome do Estudante</th>

                {viewMode === 'term' ? (
                  <>
                    {/* Assessment Columns */}
                    {termAssessments.map((asm) => (
                      <th
                        key={asm.id}
                        className="py-3 px-2 text-center min-w-[110px] border-l border-slate-200 bg-slate-50/50"
                      >
                        <div className="flex flex-col items-center group relative">
                          <span className="font-bold text-slate-800 truncate max-w-[100px]" title={asm.name}>
                            {asm.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-normal">
                            {calcType === 'ponderada' ? `Peso: ${asm.weight}` : `Tipo: ${asm.type}`} • Máx: {asm.maxScore}
                          </span>

                          <button
                            onClick={() => setAssessmentToDelete(asm)}
                            title="Excluir avaliação"
                            className="opacity-0 group-hover:opacity-100 absolute -top-1 -right-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}

                    {/* Média Regular */}
                    <th className="py-3 px-3 text-center min-w-[95px] border-l border-slate-200 font-bold text-slate-700 bg-slate-100/50">
                      Média Regular
                    </th>

                    {/* Recuperação Paralela Column */}
                    <th className="py-3 px-3 text-center min-w-[110px] border-l border-slate-200 bg-amber-50/70 font-bold text-amber-900">
                      <div className="flex flex-col items-center">
                        <span>Rec. Paralela</span>
                        <span className="text-[9px] text-amber-700 font-normal">
                          (Substitui se &gt; média)
                        </span>
                      </div>
                    </th>

                    {/* Média Final do Período */}
                    <th className="py-3 px-3 text-center min-w-[110px] border-l border-slate-200 bg-indigo-50/60 font-black text-indigo-900">
                      Média Final
                    </th>

                    <th className="py-3 px-3 text-center min-w-[110px] border-l border-slate-200 font-bold">
                      Situação
                    </th>
                  </>
                ) : (
                  <>
                    {/* Annual View */}
                    {Array.from({ length: numTerms }).map((_, idx) => (
                      <th
                        key={idx}
                        className="py-3 px-3 text-center min-w-[95px] border-l border-slate-200 font-bold"
                      >
                        {getTermLabel(currentClass.termType, idx + 1)}
                      </th>
                    ))}

                    {/* Total de Pontos Column */}
                    <th className="py-3 px-3 text-center min-w-[110px] border-l border-slate-200 bg-sky-50/80 font-bold text-sky-950">
                      <div className="flex flex-col items-center">
                        <span className="text-xs">Total de Pontos</span>
                        <span className="text-[9px] text-sky-700 font-normal">
                          (Soma das Médias)
                        </span>
                      </div>
                    </th>

                    <th className="py-3 px-3 text-center min-w-[100px] border-l border-slate-200 bg-slate-100/60 font-bold text-slate-800">
                      Média Anual
                    </th>

                    {/* Recuperação Final Column */}
                    <th className="py-3 px-3 text-center min-w-[110px] border-l border-slate-200 bg-amber-50/70 font-bold text-amber-900">
                      <div className="flex flex-col items-center">
                        <span>Rec. Final</span>
                        <span className="text-[9px] text-amber-700 font-normal">
                          (Exame Anual)
                        </span>
                      </div>
                    </th>

                    <th className="py-3 px-3 text-center min-w-[110px] border-l border-slate-200 bg-indigo-50/60 font-black text-indigo-900">
                      Média Definitiva
                    </th>

                    <th className="py-3 px-3 text-center min-w-[125px] border-l border-slate-200 font-bold">
                      Situação Final
                    </th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {activeStudents.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-8 text-center text-slate-400 italic">
                    Nenhum estudante encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                activeStudents.map((student) => {
                  if (viewMode === 'term') {
                    const termRes = calculateStudentTermAverage(
                      student.id,
                      currentClass.id,
                      selectedTerm,
                      assessments,
                      gradeRecords,
                      calcType,
                      termRecoveries
                    );
                    const isApproved = termRes.average !== null && termRes.average >= currentClass.passingGrade;

                    return (
                      <tr key={student.id} className="hover:bg-indigo-50/30 transition">
                        {/* Roll Number */}
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                          {String(student.rollNumber).padStart(2, '0')}
                        </td>

                        {/* Student Name */}
                        <td className="py-2.5 px-4">
                          <button
                            onClick={() => onSelectStudent(student.id)}
                            className="font-semibold text-slate-800 hover:text-indigo-600 text-left transition"
                            title="Ver boletim individual"
                          >
                            {student.name}
                          </button>
                          <div className="text-[10px] text-slate-400">
                            Mat: {student.enrollmentNumber}
                          </div>
                        </td>

                        {/* Term Assessment Grade Inputs */}
                        {termAssessments.map((asm) => {
                          const record = gradeRecords.find(
                            gr => gr.assessmentId === asm.id && gr.studentId === student.id
                          );
                          const scoreVal = record?.score ?? null;
                          const isLow = scoreVal !== null && scoreVal < currentClass.passingGrade;

                          return (
                            <td
                              key={asm.id}
                              className="py-1.5 px-2 text-center border-l border-slate-100"
                            >
                              <input
                                key={`score-${asm.id}-${student.id}`}
                                type="text"
                                inputMode="decimal"
                                placeholder="—"
                                defaultValue={scoreVal !== null ? Number(scoreVal).toFixed(1) : ''}
                                onBlur={(e) => handleScoreInput(asm.id, student.id, e.target.value)}
                                onChange={(e) => {
                                  const text = e.target.value.trim();
                                  if (text === '') {
                                    handleScoreInput(asm.id, student.id, '');
                                  } else {
                                    const parsed = parseFloat(text.replace(',', '.'));
                                    if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                                      handleScoreInput(asm.id, student.id, text);
                                    }
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    (e.target as HTMLInputElement).blur();
                                  }
                                }}
                                className={`w-16 text-center py-1 rounded text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                                  scoreVal === null
                                    ? 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                                    : isLow
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}
                              />
                            </td>
                          );
                        })}

                        {/* Média Regular */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-200 bg-slate-50/50 font-bold text-slate-700">
                          {termRes.regularAverage !== null ? termRes.regularAverage.toFixed(1) : '—'}
                        </td>

                        {/* Recuperação Paralela Input Column */}
                        <td className="py-1.5 px-2 text-center border-l border-slate-200 bg-amber-50/30">
                          <input
                            key={`rec-${currentClass.id}-term-${selectedTerm}-${student.id}`}
                            type="text"
                            inputMode="decimal"
                            placeholder="Rec."
                            defaultValue={termRes.recoveryScore !== null ? Number(termRes.recoveryScore).toFixed(1) : ''}
                            onBlur={(e) => handleTermRecoveryInput(selectedTerm, student.id, e.target.value)}
                            onChange={(e) => {
                              const text = e.target.value.trim();
                              if (text === '') {
                                handleTermRecoveryInput(selectedTerm, student.id, '');
                              } else {
                                const parsed = parseFloat(text.replace(',', '.'));
                                if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                                  handleTermRecoveryInput(selectedTerm, student.id, text);
                                }
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                            }}
                            title="Nota da Recuperação Paralela deste período (substitui a média se for superior)"
                            className={`w-16 text-center py-1 rounded text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              termRes.recoveryScore === null
                                ? 'bg-amber-50/40 text-amber-900 hover:bg-amber-100/60 border border-amber-200/50'
                                : 'bg-amber-100 text-amber-900 border border-amber-300'
                            }`}
                          />
                        </td>

                        {/* Média Final do Período */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-200 bg-indigo-50/30">
                          <div className="flex flex-col items-center">
                            <span
                              className={`font-black text-sm px-2.5 py-0.5 rounded-md inline-block ${
                                termRes.average === null
                                  ? 'text-slate-400'
                                  : isApproved
                                  ? 'text-emerald-700 bg-emerald-100'
                                  : 'text-rose-700 bg-rose-100'
                              }`}
                            >
                              {termRes.average !== null ? termRes.average.toFixed(1) : '—'}
                            </span>
                            {termRes.isSubstituted && (
                              <span className="text-[9px] font-bold text-amber-700 mt-0.5 flex items-center gap-0.5" title="Média substituída pela nota da Recuperação Paralela">
                                <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                                Substituída
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Term Status */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-100">
                          {termRes.average === null ? (
                            <span className="text-slate-400 text-[11px]">Sem notas</span>
                          ) : isApproved ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              <CheckCircle className="w-3 h-3" />
                              {termRes.isSubstituted ? 'Aprovado (Rec)' : 'Aprovado'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Recuperação
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  } else {
                    // Consolidated Annual Mode with Recuperação Final
                    const annualRes = calculateStudentOverallAverage(
                      student.id,
                      currentClass,
                      assessments,
                      gradeRecords,
                      termRecoveries,
                      finalRecoveries
                    );

                    const needsFinalRecovery = annualRes.annualAverage !== null && annualRes.annualAverage < currentClass.passingGrade;

                    return (
                      <tr key={student.id} className="hover:bg-indigo-50/30 transition">
                        <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                          {String(student.rollNumber).padStart(2, '0')}
                        </td>
                        <td className="py-2.5 px-4">
                          <button
                            onClick={() => onSelectStudent(student.id)}
                            className="font-semibold text-slate-800 hover:text-indigo-600 text-left transition"
                          >
                            {student.name}
                          </button>
                        </td>

                        {annualRes.termsSummary.map((ts) => {
                          const isLow = ts.average !== null && ts.average < currentClass.passingGrade;
                          return (
                            <td
                              key={ts.term}
                              className="py-2.5 px-3 text-center border-l border-slate-100 font-bold"
                            >
                              <span
                                className={`px-2 py-0.5 rounded ${
                                  ts.average === null
                                    ? 'text-slate-400 font-normal'
                                    : isLow
                                    ? 'text-rose-700 bg-rose-50 font-bold'
                                    : 'text-slate-800'
                                }`}
                              >
                                {ts.average !== null ? ts.average.toFixed(1) : '—'}
                              </span>
                            </td>
                          );
                        })}

                        {/* Total de Pontos (Soma das Médias) */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-200 bg-sky-50/30 font-bold">
                          <span
                            className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                              annualRes.termsWithGrades === 0
                                ? 'text-slate-400 font-normal'
                                : annualRes.totalPoints >= currentClass.passingGrade * numTerms
                                ? 'text-sky-900 bg-sky-100/80 font-black'
                                : 'text-slate-700 bg-slate-100'
                            }`}
                            title={`Soma das médias obtidas nas etapas: ${annualRes.totalPoints.toFixed(1)} pontos`}
                          >
                            {annualRes.termsWithGrades > 0 ? annualRes.totalPoints.toFixed(1) : '—'}
                          </span>
                        </td>

                        {/* Annual Average */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-200 bg-slate-50 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded ${
                              annualRes.annualAverage === null
                                ? 'text-slate-400'
                                : annualRes.annualAverage >= currentClass.passingGrade
                                ? 'text-emerald-700 font-bold'
                                : 'text-rose-700 font-bold'
                            }`}
                          >
                            {annualRes.annualAverage !== null ? annualRes.annualAverage.toFixed(1) : '—'}
                          </span>
                        </td>

                        {/* Recuperação Final Input Column */}
                        <td className="py-1.5 px-2 text-center border-l border-slate-200 bg-amber-50/30">
                          {needsFinalRecovery || annualRes.finalRecoveryScore !== null ? (
                            <input
                              key={`rec-final-${currentClass.id}-${student.id}`}
                              type="text"
                              inputMode="decimal"
                              placeholder="Rec. Final"
                              defaultValue={annualRes.finalRecoveryScore !== null ? Number(annualRes.finalRecoveryScore).toFixed(1) : ''}
                              onBlur={(e) => handleFinalRecoveryInput(student.id, e.target.value)}
                              onChange={(e) => {
                                const text = e.target.value.trim();
                                if (text === '') {
                                  handleFinalRecoveryInput(student.id, '');
                                } else {
                                  const parsed = parseFloat(text.replace(',', '.'));
                                  if (!isNaN(parsed) && parsed >= 0 && parsed <= 10) {
                                    handleFinalRecoveryInput(student.id, text);
                                  }
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              title="Nota do Exame / Recuperação Final"
                              className="w-16 text-center py-1 rounded text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-amber-500 bg-amber-100 text-amber-900 border border-amber-300"
                            />
                          ) : (
                            <span className="text-[11px] text-slate-300 italic" title="Disponível quando média anual for menor que a média de aprovação">—</span>
                          )}
                        </td>

                        {/* Definitive Average */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-200 bg-indigo-50/50">
                          <div className="flex flex-col items-center">
                            <span
                              className={`font-black text-sm px-2.5 py-0.5 rounded-md inline-block ${
                                annualRes.definitiveAverage === null
                                  ? 'text-slate-400'
                                  : annualRes.status === 'approved' || annualRes.status === 'approved_recovery'
                                  ? 'text-emerald-700 bg-emerald-100'
                                  : annualRes.status === 'pending'
                                  ? 'text-slate-700 bg-slate-100'
                                  : 'text-rose-700 bg-rose-100'
                              }`}
                            >
                              {annualRes.definitiveAverage !== null ? annualRes.definitiveAverage.toFixed(1) : '—'}
                            </span>
                            {annualRes.finalRecoveryScore !== null && (
                              <span
                                className="text-[10px] text-indigo-700 font-semibold mt-0.5 max-w-[130px] truncate"
                                title={`Cálculo da Média Definitiva: ${annualRes.formulaUsed}`}
                              >
                                {annualRes.formulaUsed}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Annual Final Status */}
                        <td className="py-2.5 px-3 text-center border-l border-slate-100">
                          {annualRes.status === 'pending' && (
                            <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full text-[11px] font-medium" title={annualRes.formulaUsed}>
                              Em andamento ({annualRes.termsWithGrades}/{numTerms})
                            </span>
                          )}
                          {annualRes.status === 'approved' && (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Aprovado Direto
                            </span>
                          )}
                          {annualRes.status === 'approved_recovery' && (
                            <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200" title={`Aprovado após Recuperação Final: ${annualRes.formulaUsed}`}>
                              Aprovado (Rec. Final)
                            </span>
                          )}
                          {annualRes.status === 'recovery' && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center justify-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-500" />
                              Em Rec. Final
                            </span>
                          )}
                          {annualRes.status === 'failed' && (
                            <span className="text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                              Reprovado
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  }
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Assessment Deletion */}
      <ConfirmModal
        isOpen={!!assessmentToDelete}
        title="Excluir Avaliação"
        message={`Tem certeza que deseja excluir a avaliação "${assessmentToDelete?.name}"? Todas as notas vinculadas serão apagadas permanentemente.`}
        confirmLabel="Sim, Excluir Avaliação"
        onConfirm={() => {
          if (assessmentToDelete) {
            onDeleteAssessment(assessmentToDelete.id);
            setAssessmentToDelete(null);
          }
        }}
        onCancel={() => setAssessmentToDelete(null)}
      />
    </div>
  );
};
