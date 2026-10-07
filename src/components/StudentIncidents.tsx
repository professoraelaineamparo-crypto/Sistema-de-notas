import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  Calendar,
  Search,
  Filter,
  FileDown,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  BookOpen,
  Award,
  PhoneCall,
  User,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  FileText,
  Tag,
  SlidersHorizontal,
  X
} from 'lucide-react';
import {
  ClassRoom,
  Student,
  StudentIncident,
  IncidentTypeDefinition,
  IncidentColor
} from '../types';
import { generateIncidentsPDF } from '../utils/pdfGenerator';
import { ConfirmModal } from './ConfirmModal';

interface StudentIncidentsProps {
  currentClass: ClassRoom;
  students: Student[];
  incidents: StudentIncident[];
  incidentTypes: IncidentTypeDefinition[];
  selectedTerm: number;
  onAddIncident: (incident: Omit<StudentIncident, 'id' | 'createdAt'>) => void;
  onUpdateIncident: (incident: StudentIncident) => void;
  onDeleteIncident: (incidentId: string) => void;
  onAddIncidentType: (newType: Omit<IncidentTypeDefinition, 'id'>) => void;
  onDeleteIncidentType: (typeId: string) => void;
  isAdmin?: boolean;
}

export const colorConfigs: Record<IncidentColor, { bg: string; text: string; border: string; dot: string; icon: React.ReactNode }> = {
  rose: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', dot: 'bg-rose-500', icon: <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> },
  amber: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200', dot: 'bg-amber-500', icon: <FileText className="w-3.5 h-3.5 text-amber-600" /> },
  orange: { bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200', dot: 'bg-orange-500', icon: <Clock className="w-3.5 h-3.5 text-orange-600" /> },
  blue: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500', icon: <BookOpen className="w-3.5 h-3.5 text-blue-600" /> },
  purple: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500', icon: <ShieldAlert className="w-3.5 h-3.5 text-purple-600" /> },
  emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500', icon: <Award className="w-3.5 h-3.5 text-emerald-600" /> },
  indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', dot: 'bg-indigo-500', icon: <PhoneCall className="w-3.5 h-3.5 text-indigo-600" /> },
  teal: { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', dot: 'bg-teal-500', icon: <CheckCircle className="w-3.5 h-3.5 text-teal-600" /> },
  cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', dot: 'bg-cyan-500', icon: <CheckCircle className="w-3.5 h-3.5 text-cyan-600" /> },
  slate: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-500', icon: <HelpCircle className="w-3.5 h-3.5 text-slate-500" /> }
};

export const availableColors: { id: IncidentColor; name: string; bgClass: string }[] = [
  { id: 'rose', name: 'Vermelho / Rosa', bgClass: 'bg-rose-500' },
  { id: 'amber', name: 'Âmbar / Amarelo', bgClass: 'bg-amber-500' },
  { id: 'orange', name: 'Laranja', bgClass: 'bg-orange-500' },
  { id: 'blue', name: 'Azul', bgClass: 'bg-blue-500' },
  { id: 'purple', name: 'Roxo', bgClass: 'bg-purple-500' },
  { id: 'emerald', name: 'Verde Esmeralda', bgClass: 'bg-emerald-500' },
  { id: 'indigo', name: 'Índigo', bgClass: 'bg-indigo-500' },
  { id: 'teal', name: 'Azul Petróleo / Verde Água', bgClass: 'bg-teal-500' },
  { id: 'cyan', name: 'Ciano', bgClass: 'bg-cyan-500' },
  { id: 'slate', name: 'Cinza / Neutro', bgClass: 'bg-slate-500' }
];

export const StudentIncidents: React.FC<StudentIncidentsProps> = ({
  currentClass,
  students,
  incidents,
  incidentTypes,
  selectedTerm,
  onAddIncident,
  onUpdateIncident,
  onDeleteIncident,
  onAddIncidentType,
  onDeleteIncidentType,
  isAdmin = false
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Filters State
  const [selectedDate, setSelectedDate] = useState<string>(''); // empty string means "All dates"
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTypeManagerOpen, setIsTypeManagerOpen] = useState<boolean>(false);
  const [editingIncidentId, setEditingIncidentId] = useState<string | null>(null);
  const [incidentToDelete, setIncidentToDelete] = useState<StudentIncident | null>(null);
  const [typeToDelete, setTypeToDelete] = useState<IncidentTypeDefinition | null>(null);

  // Form State for Incident
  const [formDate, setFormDate] = useState<string>(todayStr);
  const [formStudentId, setFormStudentId] = useState<string>('');
  const [formType, setFormType] = useState<string>('comportamento');
  const [formTitle, setFormTitle] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formActionTaken, setFormActionTaken] = useState<string>('');
  const [formNotifiedGuardian, setFormNotifiedGuardian] = useState<boolean>(false);

  // Form State for New Incident Type
  const [newTypeName, setNewTypeName] = useState<string>('');
  const [newTypeColor, setNewTypeColor] = useState<IncidentColor>('rose');
  const [newTypeDesc, setNewTypeDesc] = useState<string>('');
  const [quickAddTypeMode, setQuickAddTypeMode] = useState<boolean>(false);

  // Active students of current class
  const classStudents = useMemo(() => {
    return students
      .filter(s => s.classId === currentClass.id && s.status === 'active')
      .sort((a, b) => a.rollNumber - b.rollNumber);
  }, [students, currentClass.id]);

  // Class incidents filtered
  const classIncidents = useMemo(() => {
    return incidents.filter(inc => inc.classId === currentClass.id);
  }, [incidents, currentClass.id]);

  // Unique dates with incidents in this class
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(classIncidents.map(i => i.date)));
    return dates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  }, [classIncidents]);

  // Helper to get type styling and label
  const getTypeInfo = (typeId: string) => {
    const found = incidentTypes.find(t => t.id === typeId);
    if (found) {
      const colorConf = colorConfigs[found.color] || colorConfigs.slate;
      return {
        label: found.label,
        color: found.color,
        ...colorConf
      };
    }
    return {
      label: typeId,
      color: 'slate' as IncidentColor,
      ...colorConfigs.slate
    };
  };

  // Filtered incidents
  const filteredIncidents = useMemo(() => {
    return classIncidents
      .filter(inc => {
        if (selectedDate && inc.date !== selectedDate) return false;
        if (selectedStudentFilter !== 'all' && inc.studentId !== selectedStudentFilter) return false;
        if (selectedTypeFilter !== 'all' && inc.type !== selectedTypeFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const student = students.find(s => s.id === inc.studentId);
          const studentMatch = student && student.name.toLowerCase().includes(q);
          const titleMatch = inc.title.toLowerCase().includes(q);
          const descMatch = inc.description.toLowerCase().includes(q);
          const actionMatch = inc.actionTaken && inc.actionTaken.toLowerCase().includes(q);
          if (!studentMatch && !titleMatch && !descMatch && !actionMatch) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [classIncidents, selectedDate, selectedStudentFilter, selectedTypeFilter, searchQuery, students]);

  // Grouped by Date for Timeline view
  const groupedByDate = useMemo(() => {
    const map = new Map<string, StudentIncident[]>();
    for (const inc of filteredIncidents) {
      const list = map.get(inc.date) || [];
      list.push(inc);
      map.set(inc.date, list);
    }
    return Array.from(map.entries());
  }, [filteredIncidents]);

  // Modal Handlers
  const handleOpenAdd = () => {
    setEditingIncidentId(null);
    setFormDate(selectedDate || todayStr);
    setFormStudentId(classStudents[0]?.id || '');
    setFormType(incidentTypes[0]?.id || 'comportamento');
    setFormTitle('');
    setFormDescription('');
    setFormActionTaken('');
    setFormNotifiedGuardian(false);
    setQuickAddTypeMode(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (inc: StudentIncident) => {
    setEditingIncidentId(inc.id);
    setFormDate(inc.date);
    setFormStudentId(inc.studentId);
    setFormType(inc.type);
    setFormTitle(inc.title);
    setFormDescription(inc.description);
    setFormActionTaken(inc.actionTaken || '');
    setFormNotifiedGuardian(!!inc.notifiedGuardian);
    setQuickAddTypeMode(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentId || !formTitle.trim() || !formDescription.trim()) return;

    if (editingIncidentId) {
      const existing = incidents.find(i => i.id === editingIncidentId);
      if (!existing) return;
      onUpdateIncident({
        ...existing,
        date: formDate,
        studentId: formStudentId,
        type: formType,
        title: formTitle.trim(),
        description: formDescription.trim(),
        actionTaken: formActionTaken.trim() || undefined,
        notifiedGuardian: formNotifiedGuardian
      });
    } else {
      onAddIncident({
        classId: currentClass.id,
        studentId: formStudentId,
        date: formDate,
        term: Number(selectedTerm),
        type: formType,
        title: formTitle.trim(),
        description: formDescription.trim(),
        actionTaken: formActionTaken.trim() || undefined,
        notifiedGuardian: formNotifiedGuardian
      });
    }

    setIsModalOpen(false);
  };

  const handleCreateNewType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    onAddIncidentType({
      label: newTypeName.trim(),
      color: newTypeColor,
      description: newTypeDesc.trim() || undefined
    });

    setNewTypeName('');
    setNewTypeDesc('');
    setQuickAddTypeMode(false);
  };

  const handleExportPDF = () => {
    generateIncidentsPDF(currentClass, students, incidents, selectedDate || undefined, incidentTypes);
  };

  const formatDateHeader = (dStr: string) => {
    try {
      const [year, month, day] = dStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-rose-600" />
              Livro de Ocorrências por Data
            </h2>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full">
              {currentClass.name} • {classIncidents.length} registros
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle disciplinar e pedagógico: filtre por data, acompanhe providências tomadas e registre notificações aos responsáveis.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Gerenciar Tipos Button */}
          <button
            type="button"
            onClick={() => setIsTypeManagerOpen(true)}
            title={isAdmin ? "Cadastrar e excluir tipos de ocorrências da escola" : "Consultar tipos de ocorrências disponíveis"}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition shadow-2xs cursor-pointer"
          >
            <Tag className="w-4 h-4 text-slate-500" />
            <span>{isAdmin ? `Gerenciar Tipos (${incidentTypes.length})` : `Tipos de Ocorrência (${incidentTypes.length})`}</span>
          </button>

          {/* Export PDF Button */}
          <button
            type="button"
            onClick={handleExportPDF}
            title="Exportar Relatório Oficial de Ocorrências em PDF"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition shadow-xs"
          >
            <FileDown className="w-4 h-4 text-rose-600" />
            <span>Baixar PDF</span>
          </button>

          {/* New Incident Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Ocorrência</span>
          </button>
        </div>
      </div>

      {/* Date Menu & Filters Ribbon */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Date Filter Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-4 h-4 text-indigo-600" />
              Menu de Ocorrência por Data:
            </label>
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 underline"
              >
                Ver todas as datas
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick date buttons */}
            <button
              type="button"
              onClick={() => setSelectedDate('')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                !selectedDate
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas as Datas ({classIncidents.length})
            </button>

            <button
              type="button"
              onClick={() => setSelectedDate(todayStr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                selectedDate === todayStr
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hoje ({classIncidents.filter(i => i.date === todayStr).length})
            </button>

            {/* Date Input Picker */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 rounded-xl px-2.5 py-1">
              <span className="text-[11px] font-semibold text-slate-500">Escolher data:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs bg-transparent border-none text-slate-800 font-bold focus:outline-none"
              />
            </div>

            {/* Quick buttons from existing recorded dates */}
            {availableDates.slice(0, 4).map(d => {
              if (d === todayStr) return null;
              const count = classIncidents.filter(i => i.date === d).length;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSelectedDate(d)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition ${
                    selectedDate === d
                      ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {d.split('-').reverse().join('/')} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Secondary Filters: Student, Type, and Search */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          {/* Filter by Student */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Filtrar por Estudante:
            </label>
            <select
              value={selectedStudentFilter}
              onChange={(e) => setSelectedStudentFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos os estudantes da turma</option>
              {classStudents.map(s => (
                <option key={s.id} value={s.id}>
                  {String(s.rollNumber).padStart(2, '0')} - {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Type */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Tipo de Ocorrência:
            </label>
            <select
              value={selectedTypeFilter}
              onChange={(e) => setSelectedTypeFilter(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos os tipos ({incidentTypes.length})</option>
              {incidentTypes.map(t => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          {/* Text Search */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Buscar por Palavra-chave:
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar em título, relato ou ação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Incidents List (Timeline View grouped by Date) */}
      {groupedByDate.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-xs">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-700">Nenhuma ocorrência encontrada</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
            {selectedDate
              ? `Não há registros de ocorrência para a data ${selectedDate.split('-').reverse().join('/')}.`
              : 'Nenhum registro encontrado para os filtros selecionados. Utilize o botão acima para registrar uma ocorrência.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedByDate.map(([dateKey, items]) => (
            <div key={dateKey} className="space-y-3">
              {/* Date Group Header */}
              <div className="flex items-center gap-2.5 px-1">
                <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-white text-xs font-bold shadow-2xs">
                  <Calendar className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="capitalize">{formatDateHeader(dateKey)}</span>
                </span>
                <span className="text-xs text-slate-500 font-semibold">
                  {items.length} {items.length === 1 ? 'ocorrência registrada' : 'ocorrências registradas'}
                </span>
                <div className="flex-1 border-b border-slate-200 ml-2"></div>
              </div>

              {/* Day Cards */}
              <div className="grid grid-cols-1 gap-3.5">
                {items.map((inc) => {
                  const student = students.find(s => s.id === inc.studentId);
                  const conf = getTypeInfo(inc.type);

                  return (
                    <div
                      key={inc.id}
                      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
                        {/* Student and Type Badge */}
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs flex flex-col items-center justify-center shrink-0">
                            <span>{student ? String(student.rollNumber).padStart(2, '0') : '—'}</span>
                            <span className="text-[9px] text-indigo-400 uppercase font-semibold">Nº</span>
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-900">
                                {student ? student.name : 'Estudante não encontrado'}
                              </h4>
                              {student?.enrollmentNumber && (
                                <span className="text-[11px] text-slate-400 font-mono">
                                  Mat: {student.enrollmentNumber}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              {/* Type Badge */}
                              <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${conf.bg} ${conf.text} ${conf.border}`}>
                                {conf.icon}
                                {conf.label}
                              </span>

                              {/* Guardian Notification Badge */}
                              {inc.notifiedGuardian ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                                  Família Notificada
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                  Família não notificada
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 self-end sm:self-start">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(inc)}
                            title="Editar ocorrência"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setIncidentToDelete(inc)}
                            title="Excluir ocorrência"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="mt-2">
                        <h5 className="text-xs font-bold text-slate-800 mb-1">
                          {inc.title}
                        </h5>
                        <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3 rounded-xl border border-slate-100 whitespace-pre-line">
                          {inc.description}
                        </p>
                      </div>

                      {/* Action Taken (Providência) */}
                      {inc.actionTaken && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-start gap-2 text-xs">
                          <span className="font-bold text-indigo-900 shrink-0">
                            Providência / Ação Adotada:
                          </span>
                          <span className="text-slate-700 italic">
                            {inc.actionTaken}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Incident Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingIncidentId ? 'Editar Ocorrência Escolar' : 'Registrar Nova Ocorrência'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {currentClass.name} • Registro oficial no prontuário do estudante
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Date & Student */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Data da Ocorrência *
                  </label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Estudante Envolvido *
                  </label>
                  <select
                    required
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Selecione um estudante...</option>
                    {classStudents.map(s => (
                      <option key={s.id} value={s.id}>
                        {String(s.rollNumber).padStart(2, '0')} - {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Type Selection with "+ Novo Tipo" action */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Tipo da Ocorrência *
                  </label>
                  {isAdmin ? (
                    <button
                      type="button"
                      onClick={() => setQuickAddTypeMode(!quickAddTypeMode)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{quickAddTypeMode ? 'Ocultar cadastro rápido' : 'Cadastrar novo tipo'}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-slate-400 font-medium">Categorias definidas pela direção</span>
                  )}
                </div>

                {/* Quick Add Type Inline Form */}
                {quickAddTypeMode && (
                  <div className="mb-3 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-900">Novo Tipo de Ocorrência</span>
                      <button
                        type="button"
                        onClick={() => setQuickAddTypeMode(false)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          placeholder="Nome do tipo (ex: Sem Uniforme, Fone de Ouvido...)"
                          value={newTypeName}
                          onChange={(e) => setNewTypeName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <select
                          value={newTypeColor}
                          onChange={(e) => setNewTypeColor(e.target.value as IncidentColor)}
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                        >
                          {availableColors.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickAddTypeMode(false)}
                        className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-700 font-semibold"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          handleCreateNewType(e);
                          if (newTypeName.trim()) {
                            // Find or predict id
                            const newId = `type-${Date.now()}`;
                            setFormType(newId);
                          }
                        }}
                        disabled={!newTypeName.trim()}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-[11px] font-bold rounded-lg shadow-2xs"
                      >
                        Salvar Tipo
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {incidentTypes.map((typeDef) => {
                    const conf = getTypeInfo(typeDef.id);
                    const isSelected = formType === typeDef.id;

                    return (
                      <button
                        key={typeDef.id}
                        type="button"
                        onClick={() => setFormType(typeDef.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-left text-xs font-semibold transition ${
                          isSelected
                            ? `${conf.bg} ${conf.text} ${conf.border} ring-2 ring-indigo-500/20 font-bold shadow-2xs`
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {conf.icon}
                        <span className="truncate">{typeDef.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título Resumido do Fato *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Não realizou a tarefa de casa / Conversa durante explicação"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Relato Detalhado do Fato *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Descreva com clareza e objetividade o ocorrido em sala ou no ambiente escolar..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Action Taken */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Providência / Ação Adotada pelo Professor (Opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Advertência verbal, conversa individual, encaminhado à orientação..."
                  value={formActionTaken}
                  onChange={(e) => setFormActionTaken(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Guardian Notified Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formNotifiedGuardian}
                    onChange={(e) => setFormNotifiedGuardian(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="font-semibold">Os responsáveis / pais foram comunicados desta ocorrência</span>
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-600 hover:text-slate-800 font-semibold rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs text-white bg-rose-600 hover:bg-rose-700 font-bold rounded-lg shadow-xs"
                >
                  Salvar Ocorrência
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gerenciar Tipos de Ocorrência Modal */}
      {isTypeManagerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Gerenciar Tipos de Ocorrência
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTypeManagerOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cadastro de Novo Tipo (Exclusivo Administrador) */}
            {isAdmin ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-600" />
                  Cadastrar Novo Tipo de Ocorrência
                </h4>

                <form onSubmit={handleCreateNewType} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Nome / Rótulo do Tipo *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Sem uniforme, Uso de celular, Briga..."
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">
                        Cor de Destaque
                      </label>
                      <select
                        value={newTypeColor}
                        onChange={(e) => setNewTypeColor(e.target.value as IncidentColor)}
                        className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                      >
                        {availableColors.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Color preview buttons */}
                  <div>
                    <span className="text-[10px] text-slate-500 font-semibold block mb-1.5">
                      Escolha rápida da cor:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {availableColors.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setNewTypeColor(c.id)}
                          className={`w-6 h-6 rounded-full ${c.bgClass} transition flex items-center justify-center ${
                            newTypeColor === c.id ? 'ring-3 ring-indigo-400 scale-110 shadow-xs' : 'opacity-70 hover:opacity-100'
                          }`}
                          title={c.name}
                        >
                          {newTypeColor === c.id && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      disabled={!newTypeName.trim()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Adicionar Tipo</span>
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Modo Somente Leitura</strong>
                  O cadastro e a exclusão de tipos de ocorrências são permitidos exclusivamente ao Administrador.
                </div>
              </div>
            )}

            {/* Lista dos Tipos Existentes com Opção de Excluir */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Tipos Cadastrados no Sistema ({incidentTypes.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Clique no ícone de lixeira para excluir
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                {incidentTypes.map((typeDef) => {
                  const conf = getTypeInfo(typeDef.id);
                  const usageCount = classIncidents.filter(i => i.type === typeDef.id).length;

                  return (
                    <div
                      key={typeDef.id}
                      className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-3 h-3 rounded-full ${conf.dot} shrink-0`}></span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">{typeDef.label}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${conf.bg} ${conf.text} ${conf.border}`}>
                              {conf.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {usageCount === 1 ? '1 ocorrência registrada nesta turma' : `${usageCount} ocorrências nesta turma`}
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setTypeToDelete(typeDef)}
                            title={`Excluir tipo "${typeDef.label}"`}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsTypeManagerOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Incident Confirmation Modal */}
      <ConfirmModal
        isOpen={!!incidentToDelete}
        title="Excluir Ocorrência"
        message={`Deseja realmente excluir a ocorrência "${incidentToDelete?.title}" do estudante?`}
        confirmLabel="Sim, Excluir"
        isDestructive={true}
        onConfirm={() => {
          if (incidentToDelete) {
            onDeleteIncident(incidentToDelete.id);
            setIncidentToDelete(null);
          }
        }}
        onCancel={() => setIncidentToDelete(null)}
      />

      {/* Delete Incident Type Confirmation Modal */}
      <ConfirmModal
        isOpen={!!typeToDelete}
        title="Excluir Tipo de Ocorrência"
        message={`Deseja realmente excluir o tipo de ocorrência "${typeToDelete?.label}"? Novas ocorrências não poderão utilizar esta categoria.`}
        confirmLabel="Sim, Excluir Tipo"
        isDestructive={true}
        onConfirm={() => {
          if (typeToDelete) {
            onDeleteIncidentType(typeToDelete.id);
            // If current form type was deleted, switch to first available
            if (formType === typeToDelete.id) {
              const remaining = incidentTypes.filter(t => t.id !== typeToDelete.id);
              if (remaining.length > 0) {
                setFormType(remaining[0].id);
              }
            }
            setTypeToDelete(null);
          }
        }}
        onCancel={() => setTypeToDelete(null)}
      />
    </div>
  );
};
