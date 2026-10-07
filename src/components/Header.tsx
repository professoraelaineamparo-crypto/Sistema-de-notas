import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  Layers,
  BookOpen,
  RotateCcw,
  Download,
  Upload,
  Clock,
  Award,
  Cloud
} from 'lucide-react';
import { AcademicYear, ClassRoom, User } from '../types';
import { getTermCount, getTermLabel } from '../utils/calculations';
import { ConfirmModal } from './ConfirmModal';
import { UserProfileModal } from './UserProfileModal';
import { User as UserIcon, LogOut, ChevronDown } from 'lucide-react';

interface HeaderProps {
  academicYears: AcademicYear[];
  selectedYearId: string;
  onSelectYear: (yearId: string) => void;
  classes: ClassRoom[];
  selectedClassId: string;
  onSelectClass: (classId: string) => void;
  selectedTerm: number;
  onSelectTerm: (term: number) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  currentUser?: User | null;
  onLogout?: () => void;
  onUserUpdated?: (user: User) => void;
  onOpenGoogleDrive?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  academicYears,
  selectedYearId,
  onSelectYear,
  classes,
  selectedClassId,
  onSelectClass,
  selectedTerm,
  onSelectTerm,
  onResetData,
  onExportData,
  onImportData,
  currentUser,
  onLogout,
  onUserUpdated,
  onOpenGoogleDrive
}) => {
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const currentYear = academicYears.find(y => y.id === selectedYearId) || academicYears[0];
  const filteredClasses = classes.filter(c => c.academicYearId === selectedYearId);
  const currentClass = classes.find(c => c.id === selectedClassId) || filteredClasses[0];
  const isAdmin = currentUser?.role === 'admin';

  const termCount = currentClass ? getTermCount(currentClass.termType) : 4;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">Diário do Professor</h1>
                <span className="text-xs bg-indigo-500/20 text-indigo-300 font-medium px-2 py-0.5 rounded-full border border-indigo-500/30">
                  Gestão Escolar
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Acompanhamento pedagógico, notas, frequência e BNCC
              </p>
            </div>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {/* Logged User Chip */}
            {currentUser && (
              <div className="flex items-center gap-1.5 bg-slate-800/90 pl-1.5 pr-2 py-1 rounded-xl border border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(true)}
                  className="flex items-center gap-2 text-left hover:opacity-90 transition cursor-pointer"
                  title="Ver perfil e dados do usuário"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black text-xs shrink-0">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block leading-tight">
                    <span className="font-bold text-white text-xs block max-w-[120px] truncate">
                      {currentUser.name}
                    </span>
                    <span className="text-[10px] text-indigo-300 block truncate max-w-[120px]">
                      {currentUser.role}
                    </span>
                  </div>
                </button>

                {onLogout && (
                  <button
                    type="button"
                    onClick={() => setIsLogoutConfirmOpen(true)}
                    title="Encerrar sessão (Sair)"
                    className="ml-1 p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            <button
              onClick={onExportData}
              title="Exportar backup dos dados em JSON"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Backup</span>
              <span className="sm:hidden">JSON</span>
            </button>

            {onOpenGoogleDrive && (
              <button
                type="button"
                onClick={onOpenGoogleDrive}
                title="Sincronizar e salvar backups no Google Drive"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/70 hover:bg-indigo-900/90 text-indigo-200 border border-indigo-700/80 transition cursor-pointer shrink-0"
              >
                <Cloud className="w-3.5 h-3.5 text-blue-400" />
                <span className="hidden sm:inline">Google Drive</span>
                <span className="sm:hidden">Drive</span>
              </button>
            )}

            {isAdmin && (
              <>
                <label
                  title="Importar backup em JSON (Acesso do Administrador)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-purple-400" />
                  <span>Importar</span>
                  <input type="file" accept=".json" onChange={onImportData} className="hidden" />
                </label>

                <button
                  onClick={() => setIsResetConfirmOpen(true)}
                  title="Restaurar dados de exemplo da escola (Administrador)"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-800 transition cursor-pointer shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restaurar Padrão</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Global Selectors Bar (Year, Class, Term) */}
        <div className="mt-3 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 min-w-0">
            {/* Year Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-700/80 shrink-0">
              <Calendar className="w-4 h-4 text-indigo-400 shrink-0" />
              <label htmlFor="year-select" className="text-xs text-slate-400 font-medium">Ano:</label>
              <select
                id="year-select"
                value={selectedYearId}
                onChange={(e) => onSelectYear(e.target.value)}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer"
              >
                {academicYears.map(year => (
                  <option key={year.id} value={year.id} className="bg-slate-900 text-white">
                    {year.title} {year.isActive ? '(Ativo)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Class Selector */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 px-2.5 py-1.5 rounded-lg border border-slate-700/80 min-w-0">
              <Layers className="w-4 h-4 text-blue-400 shrink-0" />
              <label htmlFor="class-select" className="text-xs text-slate-400 font-medium shrink-0">Turma:</label>
              <select
                id="class-select"
                value={selectedClassId}
                onChange={(e) => onSelectClass(e.target.value)}
                className="bg-transparent text-sm font-semibold text-white focus:outline-none cursor-pointer max-w-[180px] sm:max-w-[260px] md:max-w-xs truncate"
              >
                {filteredClasses.length === 0 && (
                  <option value="" className="bg-slate-900 text-white">Nenhuma turma cadastrada</option>
                )}
                {filteredClasses.map(c => (
                  <option key={c.id} value={c.id} className="bg-slate-900 text-white">
                    {c.name} - {c.subject} ({c.shift})
                  </option>
                ))}
              </select>
            </div>

            {/* Class Details Pill */}
            {currentClass && (
              <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800 shrink-0">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                  {currentClass.gradeLevel}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Turno {currentClass.shift}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Award className="w-3.5 h-3.5" />
                  Média: {currentClass.passingGrade.toFixed(1)}
                </span>
              </div>
            )}
          </div>

          {/* Period (Bimestre / Trimestre) Pills */}
          {currentClass && (
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl border border-slate-700/80 overflow-x-auto thin-scrollbar shrink-0 max-w-full">
              {Array.from({ length: termCount }).map((_, idx) => {
                const termNum = idx + 1;
                const isSelected = selectedTerm === termNum;
                return (
                  <button
                    key={termNum}
                    onClick={() => onSelectTerm(termNum)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/60'
                    }`}
                  >
                    {getTermLabel(currentClass.termType, termNum)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        title="Restaurar Dados Originais de Exemplo?"
        message="Atenção: Todas as notas, turmas, alunos e registros atuais serão substituídos pelo modelo inicial padrão. Esta ação não pode ser desfeita."
        confirmLabel="Sim, Restaurar Dados"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={() => {
          onResetData();
          setIsResetConfirmOpen(false);
        }}
        onCancel={() => setIsResetConfirmOpen(false)}
      />

      {/* Logout Confirmation Dialog */}
      <ConfirmModal
        isOpen={isLogoutConfirmOpen}
        title="Encerrar Sessão?"
        message="Deseja realmente sair do sistema? Seus dados estão salvos e você precisará digitar sua senha novamente para acessar."
        confirmLabel="Sim, Sair"
        cancelLabel="Continuar no Sistema"
        isDestructive={true}
        onConfirm={() => {
          setIsLogoutConfirmOpen(false);
          if (onLogout) onLogout();
        }}
        onCancel={() => setIsLogoutConfirmOpen(false)}
      />

      {/* User Profile & Password Modal */}
      {currentUser && (
        <UserProfileModal
          isOpen={isProfileModalOpen}
          user={currentUser}
          onClose={() => setIsProfileModalOpen(false)}
          onLogout={() => {
            setIsProfileModalOpen(false);
            if (onLogout) onLogout();
          }}
          onUserUpdated={(u) => {
            if (onUserUpdated) onUserUpdated(u);
          }}
        />
      )}
    </header>
  );
};
