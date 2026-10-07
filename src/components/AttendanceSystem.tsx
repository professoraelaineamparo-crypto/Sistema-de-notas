import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Users,
  CheckCheck,
  History,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Trash2
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  AttendanceRecord,
  AttendanceStatus
} from '../types';
import {
  calculateStudentAttendance,
  getTermLabel
} from '../utils/calculations';
import { generateAttendanceReportPDF } from '../utils/pdfGenerator';
import { ConfirmModal } from './ConfirmModal';

interface AttendanceSystemProps {
  currentClass: ClassRoom;
  students: Student[];
  attendances: AttendanceRecord[];
  selectedTerm: number;
  onSaveAttendance: (records: AttendanceRecord[]) => void;
  onDeleteAttendanceDate: (date: string) => void;
}

export const AttendanceSystem: React.FC<AttendanceSystemProps> = ({
  currentClass,
  students,
  attendances,
  selectedTerm,
  onSaveAttendance,
  onDeleteAttendanceDate
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    // Check if there are existing dates, pick the latest or today
    const classDates = attendances
      .filter(a => a.classId === currentClass.id)
      .map(a => a.date)
      .sort();
    return classDates.length > 0 ? classDates[classDates.length - 1] : new Date().toISOString().split('T')[0];
  });

  const [activeTab, setActiveTab] = useState<'daily' | 'summary'>('daily');
  const [isDeleteDateOpen, setIsDeleteDateOpen] = useState(false);

  const activeStudents = students
    .filter(s => s.classId === currentClass.id && s.status === 'active')
    .sort((a, b) => a.rollNumber - b.rollNumber);

  // Distinct dates recorded for this class
  const classDates = Array.from(
    new Set(attendances.filter(a => a.classId === currentClass.id).map(a => a.date))
  ).sort().reverse();

  // Current records for selectedDate
  const currentDayRecords = attendances.filter(
    a => a.classId === currentClass.id && a.date === selectedDate
  );

  // Status mapping for current day
  const getStudentStatus = (studentId: string): AttendanceStatus => {
    const rec = currentDayRecords.find(r => r.studentId === studentId);
    return rec ? rec.status : 'present'; // Default to present
  };

  const getStudentNote = (studentId: string): string => {
    const rec = currentDayRecords.find(r => r.studentId === studentId);
    return rec?.note || '';
  };

  // Change single student status
  const handleSetStatus = (studentId: string, status: AttendanceStatus, note?: string) => {
    const existingIndex = attendances.findIndex(
      a => a.classId === currentClass.id && a.date === selectedDate && a.studentId === studentId
    );

    const updated = [...attendances];
    const newRecord: AttendanceRecord = {
      id: existingIndex >= 0 ? attendances[existingIndex].id : `att-${Date.now()}-${studentId}`,
      classId: currentClass.id,
      date: selectedDate,
      term: selectedTerm,
      studentId,
      status,
      note: note !== undefined ? note : getStudentNote(studentId)
    };

    if (existingIndex >= 0) {
      updated[existingIndex] = newRecord;
    } else {
      updated.push(newRecord);
    }

    onSaveAttendance(updated);
  };

  // Mark all present
  const handleMarkAllPresent = () => {
    const updated = [...attendances];
    activeStudents.forEach(student => {
      const existingIndex = updated.findIndex(
        a => a.classId === currentClass.id && a.date === selectedDate && a.studentId === student.id
      );

      const record: AttendanceRecord = {
        id: existingIndex >= 0 ? updated[existingIndex].id : `att-${Date.now()}-${student.id}`,
        classId: currentClass.id,
        date: selectedDate,
        term: selectedTerm,
        studentId: student.id,
        status: 'present',
        note: ''
      };

      if (existingIndex >= 0) {
        updated[existingIndex] = record;
      } else {
        updated.push(record);
      }
    });

    onSaveAttendance(updated);
  };

  // Quick stats for current date
  let dayPresentCount = 0;
  let dayAbsentCount = 0;
  let dayJustifiedCount = 0;

  activeStudents.forEach(student => {
    const status = getStudentStatus(student.id);
    if (status === 'present') dayPresentCount++;
    else if (status === 'absent') dayAbsentCount++;
    else if (status === 'justified') dayJustifiedCount++;
  });

  const dayRate = activeStudents.length > 0
    ? Math.round(((dayPresentCount + dayJustifiedCount) / activeStudents.length) * 100)
    : 100;

  // Export Attendance CSV
  const handleExportAttendanceCSV = () => {
    const headers = ['Nº', 'Matrícula', 'Estudante', 'Total Aulas', 'Presenças', 'Faltas', 'Justificadas', 'Frequência %', 'Situação'];
    const rows = activeStudents.map(student => {
      const att = calculateStudentAttendance(student.id, currentClass.id, attendances, selectedTerm);
      return [
        student.rollNumber,
        student.enrollmentNumber,
        `"${student.name}"`,
        att.totalClasses,
        att.presents,
        att.absents,
        att.justified,
        `${att.attendanceRate}%`,
        att.attendanceRate >= 75 ? 'Regular' : 'Risco de Infrequência'
      ].join(';');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Frequencia_${currentClass.name.replace(/\s+/g, '_')}_${getTermLabel(currentClass.termType, selectedTerm)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAttendancePDF = () => {
    generateAttendanceReportPDF(currentClass, students, attendances, selectedTerm);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">
              Registro de Chamada & Frequência
            </h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full">
              {currentClass.name} • {getTermLabel(currentClass.termType, selectedTerm)}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Controle diário de presenças, faltas e atestados com verificação do limite de 75% da LDB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-medium shrink-0 overflow-x-auto thin-scrollbar">
            <button
              onClick={() => setActiveTab('daily')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                activeTab === 'daily'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Chamada do Dia
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer ${
                activeTab === 'summary'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Relatório Acumulado
            </button>
          </div>

          <button
            onClick={handleExportAttendancePDF}
            title="Exportar Relatório Oficial de Frequência em PDF"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>Gerar PDF</span>
          </button>

          <button
            onClick={handleExportAttendanceCSV}
            title="Exportar frequência para CSV"
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </button>
        </div>
      </div>

      {activeTab === 'daily' ? (
        <div className="space-y-4">
          {/* Daily Control Toolbar */}
          <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Date Input */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-300 shadow-xs">
                <Calendar className="w-4 h-4 text-indigo-600" />
                <label className="text-xs font-semibold text-slate-600">Data:</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                />
              </div>

              {/* Quick Jump Buttons */}
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded bg-indigo-50 hover:bg-indigo-100 transition"
              >
                Hoje
              </button>

              {/* History dropdown */}
              {classDates.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <History className="w-3.5 h-3.5 text-slate-400" />
                  <span>Histórico ({classDates.length} dias):</span>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-white border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 focus:outline-none"
                  >
                    {classDates.map(d => (
                      <option key={d} value={d}>
                        {d.split('-').reverse().join('/')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Marcar Todos Presentes</span>
              </button>

              {currentDayRecords.length > 0 && (
                <button
                  onClick={() => setIsDeleteDateOpen(true)}
                  title="Excluir lançamentos de presença deste dia"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Limpar Dia</span>
                </button>
              )}
            </div>
          </div>

          {/* Daily Quick Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Presentes</span>
                <p className="text-xl font-black text-emerald-600">{dayPresentCount}</p>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Faltas</span>
                <p className="text-xl font-black text-rose-600">{dayAbsentCount}</p>
              </div>
              <XCircle className="w-5 h-5 text-rose-500" />
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Justificadas</span>
                <p className="text-xl font-black text-amber-600">{dayJustifiedCount}</p>
              </div>
              <AlertCircle className="w-5 h-5 text-amber-500" />
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase">Assiduidade do Dia</span>
                <p className="text-xl font-black text-indigo-600">{dayRate}%</p>
              </div>
              <Users className="w-5 h-5 text-indigo-500" />
            </div>
          </div>

          {/* Students Call List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="divide-y divide-slate-100">
              {activeStudents.map((student) => {
                const currentStatus = getStudentStatus(student.id);
                const currentNote = getStudentNote(student.id);

                return (
                  <div
                    key={student.id}
                    className="p-3.5 hover:bg-slate-50/80 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center text-xs font-bold">
                        {String(student.rollNumber).padStart(2, '0')}
                      </span>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-800">
                          {student.name}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          Matrícula: {student.enrollmentNumber}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Attendance Status Buttons */}
                      <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                        <button
                          onClick={() => handleSetStatus(student.id, 'present')}
                          className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition ${
                            currentStatus === 'present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-emerald-700'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Presente</span>
                        </button>

                        <button
                          onClick={() => handleSetStatus(student.id, 'absent')}
                          className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition ${
                            currentStatus === 'absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-rose-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Falta</span>
                        </button>

                        <button
                          onClick={() => handleSetStatus(student.id, 'justified')}
                          className={`flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-lg transition ${
                            currentStatus === 'justified'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'text-slate-600 hover:text-amber-700'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Justificada</span>
                        </button>
                      </div>

                      {/* Note / Justification Input */}
                      {(currentStatus === 'justified' || currentStatus === 'absent') && (
                        <input
                          type="text"
                          placeholder="Motivo / Atestado..."
                          value={currentNote}
                          onChange={(e) => handleSetStatus(student.id, currentStatus, e.target.value)}
                          className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg w-44 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Accumulated Summary View */
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Resumo Acumulado de Frequência - {getTermLabel(currentClass.termType, selectedTerm)}
              </h3>
              <p className="text-xs text-slate-500">
                Alunos com menos de 75% de frequência estão em risco de reprovação pela LDB.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center">Nº</th>
                  <th className="py-2.5 px-4">Estudante</th>
                  <th className="py-2.5 px-3 text-center">Aulas Registradas</th>
                  <th className="py-2.5 px-3 text-center text-emerald-700">Presenças</th>
                  <th className="py-2.5 px-3 text-center text-rose-700">Faltas</th>
                  <th className="py-2.5 px-3 text-center text-amber-700">Justificadas</th>
                  <th className="py-2.5 px-4 text-center">Frequência %</th>
                  <th className="py-2.5 px-4 text-center">Situação Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeStudents.map((student) => {
                  const att = calculateStudentAttendance(student.id, currentClass.id, attendances, selectedTerm);
                  const isRisk = att.totalClasses > 0 && att.attendanceRate < 75;

                  return (
                    <tr key={student.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 text-center font-bold text-slate-500">
                        {String(student.rollNumber).padStart(2, '0')}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800">
                        {student.name}
                      </td>
                      <td className="py-3 px-3 text-center text-slate-600 font-medium">
                        {att.totalClasses}
                      </td>
                      <td className="py-3 px-3 text-center text-emerald-700 font-bold">
                        {att.presents}
                      </td>
                      <td className="py-3 px-3 text-center text-rose-700 font-bold">
                        {att.absents}
                      </td>
                      <td className="py-3 px-3 text-center text-amber-700 font-bold">
                        {att.justified}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className={`font-black ${isRisk ? 'text-rose-600' : 'text-slate-800'}`}>
                            {att.attendanceRate}%
                          </span>
                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isRisk ? 'bg-rose-500' : 'bg-emerald-500'}`}
                              style={{ width: `${att.attendanceRate}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {isRisk ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3 h-3" />
                            Risco (&lt;75%)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Regular
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
      )}

      {/* Confirmation Modal to Delete/Clear Day Attendance */}
      <ConfirmModal
        isOpen={isDeleteDateOpen}
        title="Limpar Chamada do Dia"
        message={`Deseja excluir todos os lançamentos de frequência realizados no dia ${selectedDate.split('-').reverse().join('/')}? Esta ação apagará as presenças e faltas registradas nesta data.`}
        confirmLabel="Sim, Limpar Chamada"
        onConfirm={() => {
          onDeleteAttendanceDate(selectedDate);
          setIsDeleteDateOpen(false);
        }}
        onCancel={() => setIsDeleteDateOpen(false)}
      />
    </div>
  );
};
