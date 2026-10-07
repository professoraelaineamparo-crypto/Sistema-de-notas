import React, { useState } from 'react';
import {
  Printer,
  FileDown,
  Copy,
  Check,
  Users,
  Settings2,
  FileSpreadsheet,
  PenTool,
  Contact,
  BarChart,
  Search
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  Assessment,
  GradeRecord,
  AttendanceRecord
} from '../types';
import { generateStudentListPDF } from '../utils/pdfGenerator';
import { calculateStudentAttendance, calculateStudentOverallAverage } from '../utils/calculations';

interface StudentListGeneratorProps {
  currentClass: ClassRoom;
  students: Student[];
  assessments: Assessment[];
  gradeRecords: GradeRecord[];
  attendances: AttendanceRecord[];
  selectedTerm: number;
}

export type ListTemplateMode = 'chamada' | 'assinatura' | 'cadastral' | 'desempenho';

export const StudentListGenerator: React.FC<StudentListGeneratorProps> = ({
  currentClass,
  students,
  assessments,
  gradeRecords,
  attendances,
  selectedTerm
}) => {
  const [templateMode, setTemplateMode] = useState<ListTemplateMode>('chamada');
  const [blankColumnsCount, setBlankColumnsCount] = useState<number>(10);
  const [onlyActive, setOnlyActive] = useState<boolean>(true);
  const [showSignatures, setShowSignatures] = useState<boolean>(true);
  const [sortBy, setSortBy] = useState<'number' | 'name'>('number');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Filter students by class and status
  const classStudents = students
    .filter(s => s.classId === currentClass.id)
    .filter(s => (onlyActive ? s.status === 'active' : true))
    .filter(s => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.enrollmentNumber && s.enrollmentNumber.toLowerCase().includes(q)) ||
        String(s.rollNumber).includes(q)
      );
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'pt-BR');
      }
      return a.rollNumber - b.rollNumber;
    });

  const activeCount = students.filter(s => s.classId === currentClass.id && s.status === 'active').length;
  const transferredCount = students.filter(s => s.classId === currentClass.id && s.status === 'transferred').length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    generateStudentListPDF(currentClass, students, templateMode, {
      customTitle: customTitle.trim() || undefined,
      blankColumnsCount,
      showSignatures,
      onlyActive
    });
  };

  const handleCopyNames = () => {
    const text = classStudents
      .map(s => `${String(s.rollNumber).padStart(2, '0')}\t${s.name}\t${s.enrollmentNumber || ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const defaultTitles: Record<ListTemplateMode, string> = {
    chamada: `Lista de Chamada Diária — ${currentClass.name}`,
    assinatura: `Comprovante de Assinatura & Entrega — ${currentClass.name}`,
    cadastral: `Ficha Cadastral e Contatos dos Responsáveis — ${currentClass.name}`,
    desempenho: `Relação da Turma com Frequência & Médias — ${currentClass.name}`
  };

  const effectiveTitle = customTitle.trim() || defaultTitles[templateMode];

  return (
    <div className="space-y-6">
      {/* Top Controls Bar (hidden during print) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Lista de Alunos da Turma
            </h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full">
              {currentClass.name} • {currentClass.shift}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gere, visualize e imprima listas oficiais personalizadas da turma para chamada diária, reuniões ou assinaturas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy Names Button */}
          <button
            onClick={handleCopyNames}
            title="Copiar lista de alunos formatada para o Excel ou Word"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-2xs"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700">Copiado!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar Nomes</span>
              </>
            )}
          </button>

          {/* Export PDF Button */}
          <button
            onClick={handleExportPDF}
            title="Gerar e baixar arquivo PDF oficial da lista"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition shadow-xs"
          >
            <FileDown className="w-4 h-4 text-rose-600" />
            <span>Baixar PDF</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            title="Imprimir lista de alunos formatada para folha A4"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Lista</span>
          </button>
        </div>
      </div>

      {/* Configuration & Options Card (hidden during print) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 print:hidden">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <Settings2 className="w-4 h-4 text-indigo-600" />
            Modelo da Lista & Configurações
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
              {activeCount} Ativos
            </span>
            {transferredCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-semibold">
                {transferredCount} Transferidos
              </span>
            )}
          </div>
        </div>

        {/* Template Selector Tabs */}
        <div>
          <label className="text-xs font-bold text-slate-700 block mb-2">
            Selecione o Modelo da Lista:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => setTemplateMode('chamada')}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                templateMode === 'chamada'
                  ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <FileSpreadsheet className={`w-5 h-5 shrink-0 mt-0.5 ${templateMode === 'chamada' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="block text-xs font-bold">Chamada em Branco</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Colunas de datas para marcar presença à mão.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTemplateMode('assinatura')}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                templateMode === 'assinatura'
                  ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <PenTool className={`w-5 h-5 shrink-0 mt-0.5 ${templateMode === 'assinatura' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="block text-xs font-bold">Lista de Assinatura</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Espaço com linha para rubrica/assinatura.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTemplateMode('cadastral')}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                templateMode === 'cadastral'
                  ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <Contact className={`w-5 h-5 shrink-0 mt-0.5 ${templateMode === 'cadastral' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="block text-xs font-bold">Ficha de Contatos</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Matrícula, responsável e telefone celular.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setTemplateMode('desempenho')}
              className={`flex items-start gap-3 p-3 rounded-xl border text-left transition ${
                templateMode === 'desempenho'
                  ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-2 ring-indigo-500/20'
                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100/70'
              }`}
            >
              <BarChart className={`w-5 h-5 shrink-0 mt-0.5 ${templateMode === 'desempenho' ? 'text-indigo-600' : 'text-slate-400'}`} />
              <div>
                <span className="block text-xs font-bold">Resumo & Frequência</span>
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  Frequência % acumulada e médias.
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Customization Options Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {/* Custom Title Input */}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Título Personalizado da Lista (Opcional):
            </label>
            <input
              type="text"
              placeholder={defaultTitles[templateMode]}
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Blank Columns Count for Chamada */}
          {templateMode === 'chamada' && (
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Colunas de Chamada (Dias):
              </label>
              <select
                value={blankColumnsCount}
                onChange={(e) => setBlankColumnsCount(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={5}>5 dias (1 semana)</option>
                <option value={10}>10 dias (2 semanas)</option>
                <option value={15}>15 dias (3 semanas)</option>
                <option value={20}>20 dias (1 mês letivo)</option>
              </select>
            </div>
          )}

          {/* Sort By */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Ordenação:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'number' | 'name')}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="number">Por Número de Chamada (1, 2, 3...)</option>
              <option value="name">Por Ordem Alfabética (A-Z)</option>
            </select>
          </div>

          {/* Search filter */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Buscar Aluno na Lista:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filtrar por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
              </input>
            </div>
          </div>
        </div>

        {/* Checkbox Toggles */}
        <div className="flex flex-wrap items-center gap-5 pt-1 text-xs text-slate-600">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium">Apenas estudantes com matrícula ativa</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showSignatures}
              onChange={(e) => setShowSignatures(e.target.checked)}
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <span className="font-medium">Exibir campo para assinatura do professor e visto da coordenação</span>
          </label>
        </div>
      </div>

      {/* Printable Sheet View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 print:p-0 print:border-none print:shadow-none">
        {/* Printable Official Header */}
        <div className="border-b-2 border-slate-800 pb-4 mb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight uppercase">
                {effectiveTitle}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-700 font-medium">
                <span><strong>Turma:</strong> {currentClass.name}</span>
                <span>•</span>
                <span><strong>Disciplina:</strong> {currentClass.subject}</span>
                <span>•</span>
                <span><strong>Turno:</strong> {currentClass.shift}</span>
                <span>•</span>
                <span><strong>Segmento:</strong> {currentClass.gradeLevel}</span>
              </div>
            </div>
            <div className="text-right text-xs text-slate-500 shrink-0">
              <span className="block font-bold text-slate-700">Total: {classStudents.length} Estudantes</span>
              <span className="block text-[11px]">Emissão: {new Date().toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* The Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse border border-slate-300">
            <thead>
              <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300">
                <th className="py-2 px-2.5 text-center w-10 border-r border-slate-300">Nº</th>
                <th className="py-2 px-3 w-28 border-r border-slate-300">Matrícula</th>
                <th className="py-2 px-3 border-r border-slate-300 min-w-[200px]">Nome Completo do Estudante</th>

                {/* Chamada Template Columns */}
                {templateMode === 'chamada' && (
                  Array.from({ length: blankColumnsCount }).map((_, idx) => (
                    <th
                      key={idx}
                      className="py-1 px-1.5 text-center w-11 border-r border-slate-300 font-normal text-[10px]"
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-bold text-slate-700">__/__</span>
                        <span className="text-slate-400 text-[9px]">{idx + 1}</span>
                      </div>
                    </th>
                  ))
                )}

                {/* Assinatura Template Columns */}
                {templateMode === 'assinatura' && (
                  <>
                    <th className="py-2 px-3 text-center w-24 border-r border-slate-300">Data</th>
                    <th className="py-2 px-4 border-r border-slate-300">
                      Assinatura / Rubrica do Estudante ou Responsável
                    </th>
                  </>
                )}

                {/* Cadastral Template Columns */}
                {templateMode === 'cadastral' && (
                  <>
                    <th className="py-2 px-3 border-r border-slate-300">Nome do Responsável</th>
                    <th className="py-2 px-3 border-r border-slate-300 w-36">Telefone de Contato</th>
                    <th className="py-2 px-3 text-center w-24 border-r border-slate-300">Situação</th>
                  </>
                )}

                {/* Desempenho Template Columns */}
                {templateMode === 'desempenho' && (
                  <>
                    <th className="py-2 px-2.5 text-center w-24 border-r border-slate-300">Freq. (%)</th>
                    <th className="py-2 px-2.5 text-center w-24 border-r border-slate-300">Média Geral</th>
                    <th className="py-2 px-3 text-center w-28 border-r border-slate-300">Situação</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={16} className="py-8 text-center text-slate-400 italic">
                    Nenhum estudante encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                classStudents.map((student, idx) => {
                  let attPercent = 100;
                  let studentSummary: any = null;

                  if (templateMode === 'desempenho') {
                    const att = calculateStudentAttendance(student.id, currentClass.id, attendances);
                    attPercent = att.attendanceRate;
                    studentSummary = calculateStudentOverallAverage(
                      student.id,
                      currentClass,
                      assessments,
                      gradeRecords
                    );
                  }

                  return (
                    <tr
                      key={student.id}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50 print:bg-transparent'}
                    >
                      <td className="py-2 px-2 text-center font-bold text-slate-700 border-r border-slate-300">
                        {String(student.rollNumber).padStart(2, '0')}
                      </td>
                      <td className="py-2 px-3 font-mono text-[11px] text-slate-600 border-r border-slate-300">
                        {student.enrollmentNumber || '—'}
                      </td>
                      <td className="py-2 px-3 font-medium text-slate-900 border-r border-slate-300">
                        <span>{student.name}</span>
                        {!onlyActive && student.status === 'transferred' && (
                          <span className="ml-2 text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                            Transferido
                          </span>
                        )}
                      </td>

                      {/* Chamada Empty Cells */}
                      {templateMode === 'chamada' && (
                        Array.from({ length: blankColumnsCount }).map((_, cIdx) => (
                          <td
                            key={cIdx}
                            className="py-2 px-1 text-center border-r border-slate-300 h-8"
                          >
                            &nbsp;
                          </td>
                        ))
                      )}

                      {/* Assinatura Cells */}
                      {templateMode === 'assinatura' && (
                        <>
                          <td className="py-2 px-2 text-center border-r border-slate-300 text-slate-400">
                            ___/___/2026
                          </td>
                          <td className="py-2 px-4 border-r border-slate-300 h-9">
                            <div className="w-full border-b border-dotted border-slate-400 mt-4"></div>
                          </td>
                        </>
                      )}

                      {/* Cadastral Cells */}
                      {templateMode === 'cadastral' && (
                        <>
                          <td className="py-2 px-3 text-slate-700 border-r border-slate-300">
                            {student.guardianName || '—'}
                          </td>
                          <td className="py-2 px-3 text-slate-700 font-mono text-[11px] border-r border-slate-300">
                            {student.guardianPhone || '—'}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-300">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                              student.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-800'
                            }`}>
                              {student.status === 'active' ? 'Ativo' : 'Transferido'}
                            </span>
                          </td>
                        </>
                      )}

                      {/* Desempenho Cells */}
                      {templateMode === 'desempenho' && (
                        <>
                          <td className="py-2 px-2.5 text-center font-bold border-r border-slate-300">
                            <span className={attPercent < 75 ? 'text-rose-700 font-black' : 'text-slate-800'}>
                              {attPercent}%
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-center font-bold border-r border-slate-300 text-indigo-700">
                            {studentSummary?.definitiveAverage !== null
                              ? Number(studentSummary.definitiveAverage).toFixed(1)
                              : '—'}
                          </td>
                          <td className="py-2 px-3 text-center border-r border-slate-300">
                            <span className="text-[11px] font-semibold text-slate-700">
                              {studentSummary?.status === 'approved' ? 'Aprovado' :
                               studentSummary?.status === 'recovery' ? 'Recuperação' :
                               studentSummary?.status === 'failed' ? 'Reprovado' : 'Em curso'}
                            </span>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Footer with Signatures */}
        {showSignatures && (
          <div className="mt-12 pt-6 border-t border-slate-200 grid grid-cols-2 gap-10">
            <div className="text-center">
              <div className="w-56 mx-auto border-b border-slate-500 mb-2"></div>
              <p className="text-xs font-bold text-slate-800">Professor(a) Responsável</p>
              <p className="text-[10px] text-slate-500">{currentClass.subject}</p>
            </div>
            <div className="text-center">
              <div className="w-56 mx-auto border-b border-slate-500 mb-2"></div>
              <p className="text-xs font-bold text-slate-800">Coordenação Pedagógica / Direção</p>
              <p className="text-[10px] text-slate-500">Visto da Escola</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
