import React, { useState, useEffect } from 'react';
import {
  loadStoredData,
  saveStoredData,
  resetToSampleData,
  AppDataState
} from './utils/storage';
import { Header } from './components/Header';
import { Navigation, TabId } from './components/Navigation';
import { OverviewDashboard } from './components/OverviewDashboard';
import { GradeMap } from './components/GradeMap';
import { AttendanceSystem } from './components/AttendanceSystem';
import { LessonDiary } from './components/LessonDiary';
import { StudentListGenerator } from './components/StudentListGenerator';
import { StudentIncidents } from './components/StudentIncidents';
import { StudentReport } from './components/StudentReport';
import { ManagementModal } from './components/ManagementModal';
import { GoogleDriveModal } from './components/GoogleDriveModal';
import { AuthScreen } from './components/AuthScreen';
import { getCurrentUser, logoutUser } from './utils/auth';
import {
  AcademicYear,
  ClassRoom,
  Student,
  Assessment,
  GradeRecord,
  AttendanceRecord,
  LessonContent,
  StudentIncident,
  IncidentTypeDefinition,
  User
} from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => getCurrentUser());
  const [data, setData] = useState<AppDataState>(() => loadStoredData());
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState(false);

  // Persist changes whenever data changes
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  // Current selected year and classes
  const currentYear = data.academicYears.find(y => y.id === data.selectedYearId) || data.academicYears[0];
  const yearClasses = data.classes.filter(c => c.academicYearId === (currentYear?.id || ''));
  const currentClass = data.classes.find(c => c.id === data.selectedClassId) || yearClasses[0] || data.classes[0];

  // If selected student is not in current class, update it
  useEffect(() => {
    if (currentClass) {
      const classStudents = data.students.filter(s => s.classId === currentClass.id && s.status === 'active');
      if (classStudents.length > 0) {
        if (!classStudents.some(s => s.id === selectedStudentId)) {
          setSelectedStudentId(classStudents[0].id);
        }
      }
    }
  }, [currentClass?.id, data.students, selectedStudentId]);

  // Handler: Select Year
  const handleSelectYear = (yearId: string) => {
    const classesInYear = data.classes.filter(c => c.academicYearId === yearId);
    const newClassId = classesInYear.length > 0 ? classesInYear[0].id : data.selectedClassId;
    setData(prev => ({
      ...prev,
      selectedYearId: yearId,
      selectedClassId: newClassId
    }));
  };

  // Handler: Select Class
  const handleSelectClass = (classId: string) => {
    setData(prev => ({
      ...prev,
      selectedClassId: classId
    }));
  };

  // Handler: Select Term
  const handleSelectTerm = (term: number) => {
    setData(prev => ({
      ...prev,
      selectedTerm: term
    }));
  };

  // Handler: Reset to sample (Admin only)
  const handleResetData = () => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso restrito: Apenas o administrador pode restaurar os dados padrão da escola.');
      return;
    }
    const reset = resetToSampleData();
    setData(reset);
    setActiveTab('overview');
  };

  // Handler: Export JSON
  const handleExportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `backup_diario_professor_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Handler: Import JSON (Admin only)
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso restrito: Apenas o administrador pode importar backups da base de dados.');
      e.target.value = '';
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.academicYears && json.classes && json.students) {
          setData(json);
          alert('Dados importados com sucesso!');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        alert('Erro ao processar arquivo JSON: ' + String(err));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Handler: Print
  const handlePrint = () => {
    window.print();
  };

  // --- Grade Map Handlers ---
  const handleUpdateGrade = (assessmentId: string, studentId: string, score: number | null) => {
    setData(prev => {
      const existingIdx = prev.gradeRecords.findIndex(
        gr => gr.assessmentId === assessmentId && gr.studentId === studentId
      );

      const records = [...prev.gradeRecords];
      if (existingIdx >= 0) {
        if (score === null) {
          records.splice(existingIdx, 1);
        } else {
          records[existingIdx] = {
            ...records[existingIdx],
            score
          };
        }
      } else if (score !== null) {
        records.push({
          id: `gr-${Date.now()}-${studentId}`,
          assessmentId,
          studentId,
          score
        });
      }

      return {
        ...prev,
        gradeRecords: records
      };
    });
  };

  const handleUpdateTermRecovery = (term: number, studentId: string, score: number | null) => {
    if (!currentClass) return;
    setData(prev => {
      const records = [...(prev.termRecoveries || [])];
      const existingIdx = records.findIndex(
        r => r.classId === currentClass.id && Number(r.term) === Number(term) && r.studentId === studentId
      );

      if (existingIdx >= 0) {
        if (score === null) {
          records.splice(existingIdx, 1);
        } else {
          records[existingIdx] = {
            ...records[existingIdx],
            score
          };
        }
      } else if (score !== null) {
        records.push({
          id: `rec-t-${Date.now()}-${studentId}`,
          classId: currentClass.id,
          term: Number(term),
          studentId,
          score
        });
      }

      return {
        ...prev,
        termRecoveries: records
      };
    });
  };

  const handleUpdateFinalRecovery = (studentId: string, score: number | null) => {
    if (!currentClass) return;
    setData(prev => {
      const records = [...(prev.finalRecoveries || [])];
      const existingIdx = records.findIndex(
        r => r.classId === currentClass.id && r.studentId === studentId
      );

      if (existingIdx >= 0) {
        if (score === null) {
          records.splice(existingIdx, 1);
        } else {
          records[existingIdx] = {
            ...records[existingIdx],
            score
          };
        }
      } else if (score !== null) {
        records.push({
          id: `rec-f-${Date.now()}-${studentId}`,
          classId: currentClass.id,
          studentId,
          score
        });
      }

      return {
        ...prev,
        finalRecoveries: records
      };
    });
  };

  const handleAddAssessment = (newAsm: Omit<Assessment, 'id'>) => {
    const id = `asm-${Date.now()}`;
    setData(prev => ({
      ...prev,
      assessments: [...prev.assessments, { ...newAsm, id }]
    }));
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    setData(prev => ({
      ...prev,
      assessments: prev.assessments.filter(a => a.id !== assessmentId),
      gradeRecords: prev.gradeRecords.filter(gr => gr.assessmentId !== assessmentId)
    }));
  };

  // --- Attendance Handlers ---
  const handleSaveAttendance = (records: AttendanceRecord[]) => {
    setData(prev => ({
      ...prev,
      attendances: records
    }));
  };

  const handleDeleteAttendanceDate = (date: string) => {
    if (!currentClass) return;
    setData(prev => ({
      ...prev,
      attendances: prev.attendances.filter(a => !(a.classId === currentClass.id && a.date === date))
    }));
  };

  // --- Lesson Diary Handlers ---
  const handleAddLesson = (newLesson: Omit<LessonContent, 'id'>) => {
    const id = `les-${Date.now()}`;
    setData(prev => ({
      ...prev,
      lessons: [...prev.lessons, { ...newLesson, id }]
    }));
  };

  const handleUpdateLesson = (updatedLesson: LessonContent) => {
    setData(prev => ({
      ...prev,
      lessons: prev.lessons.map(l => (l.id === updatedLesson.id ? updatedLesson : l))
    }));
  };

  const handleDeleteLesson = (lessonId: string) => {
    setData(prev => ({
      ...prev,
      lessons: prev.lessons.filter(l => l.id !== lessonId)
    }));
  };

  // --- Student Observation Handlers ---
  const handleSaveObservation = (studentId: string, term: number, text: string) => {
    setData(prev => {
      const existingIdx = prev.observations.findIndex(
        o => o.studentId === studentId && o.term === term
      );
      const updated = [...prev.observations];
      if (existingIdx >= 0) {
        updated[existingIdx] = {
          ...updated[existingIdx],
          observation: text,
          updatedAt: new Date().toISOString()
        };
      } else {
        updated.push({
          id: `obs-${Date.now()}`,
          studentId,
          term,
          observation: text,
          updatedAt: new Date().toISOString()
        });
      }
      return {
        ...prev,
        observations: updated
      };
    });
  };

  // --- Student Incidents Handlers ---
  const handleAddIncident = (newIncident: Omit<StudentIncident, 'id' | 'createdAt'>) => {
    const id = `inc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    setData(prev => ({
      ...prev,
      incidents: [
        ...(prev.incidents || []),
        {
          ...newIncident,
          id,
          createdAt: new Date().toISOString()
        }
      ]
    }));
  };

  const handleUpdateIncident = (updatedIncident: StudentIncident) => {
    setData(prev => ({
      ...prev,
      incidents: (prev.incidents || []).map(inc => (inc.id === updatedIncident.id ? updatedIncident : inc))
    }));
  };

  const handleDeleteIncident = (incidentId: string) => {
    setData(prev => ({
      ...prev,
      incidents: (prev.incidents || []).filter(inc => inc.id !== incidentId)
    }));
  };

  const handleAddIncidentType = (newType: Omit<IncidentTypeDefinition, 'id'>) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode cadastrar novos tipos de ocorrência.');
      return;
    }
    const id = `type-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    setData(prev => ({
      ...prev,
      incidentTypes: [...(prev.incidentTypes || []), { ...newType, id }]
    }));
  };

  const handleDeleteIncidentType = (typeId: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode excluir tipos de ocorrência.');
      return;
    }
    setData(prev => ({
      ...prev,
      incidentTypes: (prev.incidentTypes || []).filter(t => t.id !== typeId)
    }));
  };

  // --- Management Handlers (Years, Classes, Students) - SOMENTE ADMINISTRADOR ---
  const handleAddYear = (newYear: Omit<AcademicYear, 'id'>) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode cadastrar anos letivos.');
      return;
    }
    const id = `year-${Date.now()}`;
    setData(prev => ({
      ...prev,
      academicYears: [...prev.academicYears, { ...newYear, id }],
      selectedYearId: id
    }));
  };

  const handleUpdateYear = (year: AcademicYear) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode alterar anos letivos.');
      return;
    }
    setData(prev => ({
      ...prev,
      academicYears: prev.academicYears.map(y => (y.id === year.id ? year : y))
    }));
  };

  const handleDeleteYear = (yearId: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode excluir anos letivos.');
      return;
    }
    setData(prev => {
      const remainingYears = prev.academicYears.filter(y => y.id !== yearId);
      const nextYear = remainingYears[0];
      return {
        ...prev,
        academicYears: remainingYears,
        selectedYearId: nextYear?.id || '',
        classes: prev.classes.filter(c => c.academicYearId !== yearId)
      };
    });
  };

  const handleAddClass = (newClass: Omit<ClassRoom, 'id'>) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode cadastrar novas turmas.');
      return;
    }
    const id = `class-${Date.now()}`;
    setData(prev => ({
      ...prev,
      classes: [...prev.classes, { ...newClass, id }],
      selectedClassId: id
    }));
  };

  const handleUpdateClass = (updatedClass: ClassRoom) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode alterar turmas.');
      return;
    }
    setData(prev => ({
      ...prev,
      classes: prev.classes.map(c => (c.id === updatedClass.id ? updatedClass : c))
    }));
  };

  const handleDeleteClass = (classId: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode excluir turmas.');
      return;
    }
    setData(prev => {
      const remainingClasses = prev.classes.filter(c => c.id !== classId);
      const nextClass = remainingClasses.find(c => c.academicYearId === prev.selectedYearId) || remainingClasses[0];
      return {
        ...prev,
        classes: remainingClasses,
        selectedClassId: nextClass?.id || '',
        students: prev.students.filter(s => s.classId !== classId),
        assessments: prev.assessments.filter(a => a.classId !== classId),
        attendances: prev.attendances.filter(a => a.classId !== classId),
        lessons: prev.lessons.filter(l => l.classId !== classId)
      };
    });
  };

  const handleAddStudent = (newStudent: Omit<Student, 'id'>) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode cadastrar estudantes.');
      return;
    }
    const id = `std-${Date.now()}`;
    setData(prev => ({
      ...prev,
      students: [...prev.students, { ...newStudent, id }]
    }));
  };

  const handleImportStudentsBatch = (newStudentsList: Omit<Student, 'id'>[], replaceExisting: boolean) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode importar estudantes.');
      return;
    }
    setData(prev => {
      let updatedStudents = [...prev.students];
      if (replaceExisting) {
        updatedStudents = updatedStudents.filter(s => s.classId !== currentClass.id);
      }
      const added: Student[] = newStudentsList.map((s, idx) => ({
        ...s,
        id: `std-${Date.now()}-${idx}`
      }));
      return {
        ...prev,
        students: [...updatedStudents, ...added]
      };
    });
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode editar cadastro de estudantes.');
      return;
    }
    setData(prev => ({
      ...prev,
      students: prev.students.map(s => (s.id === updatedStudent.id ? updatedStudent : s))
    }));
  };

  const handleDeleteStudent = (studentId: string) => {
    if (currentUser?.role !== 'admin') {
      alert('Acesso negado: Somente o administrador pode excluir estudantes.');
      return;
    }
    setData(prev => ({
      ...prev,
      students: prev.students.filter(s => s.id !== studentId),
      gradeRecords: prev.gradeRecords.filter(gr => gr.studentId !== studentId),
      attendances: prev.attendances.filter(a => a.studentId !== studentId),
      observations: prev.observations.filter(o => o.studentId !== studentId)
    }));
  };

  const activeStudentsCount = currentClass
    ? data.students.filter(s => s.classId === currentClass.id && s.status === 'active').length
    : 0;

  // Protect system: require authenticated user
  if (!currentUser) {
    return (
      <AuthScreen
        onLoginSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* Sticky Header & Navigation Unified Bar - Eliminates any vertical clipping or cutting off */}
      <div className="sticky top-0 z-30 shadow-xs print:hidden">
        <Header
          academicYears={data.academicYears}
          selectedYearId={data.selectedYearId}
          onSelectYear={handleSelectYear}
          classes={data.classes}
          selectedClassId={data.selectedClassId}
          onSelectClass={handleSelectClass}
          selectedTerm={data.selectedTerm}
          onSelectTerm={handleSelectTerm}
          onResetData={handleResetData}
          onExportData={handleExportData}
          onImportData={handleImportData}
          currentUser={currentUser}
          onLogout={handleLogout}
          onUserUpdated={(updatedUser) => setCurrentUser(updatedUser)}
          onOpenGoogleDrive={() => setIsGoogleDriveOpen(true)}
        />

        {/* Main Tabs Navigation */}
        <Navigation
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          studentCount={activeStudentsCount}
          incidentCount={currentClass ? (data.incidents || []).filter(i => i.classId === currentClass.id).length : 0}
          isAdmin={currentUser?.role === 'admin'}
        />
      </div>

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!currentClass ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800">Nenhuma turma cadastrada</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Comece cadastrando sua primeira turma na aba de configurações.
            </p>
            <button
              onClick={() => setActiveTab('management')}
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Ir para Cadastros
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && (
              <OverviewDashboard
                currentClass={currentClass}
                students={data.students}
                assessments={data.assessments}
                gradeRecords={data.gradeRecords}
                termRecoveries={data.termRecoveries || []}
                finalRecoveries={data.finalRecoveries || []}
                attendances={data.attendances}
                lessons={data.lessons}
                selectedTerm={data.selectedTerm}
                onNavigateToStudent={(studentId) => {
                  setSelectedStudentId(studentId);
                  setActiveTab('reports');
                }}
                onNavigateToTab={(tab) => setActiveTab(tab)}
              />
            )}

            {activeTab === 'grade-map' && (
              <GradeMap
                currentClass={currentClass}
                students={data.students}
                assessments={data.assessments}
                gradeRecords={data.gradeRecords}
                termRecoveries={data.termRecoveries || []}
                finalRecoveries={data.finalRecoveries || []}
                selectedTerm={data.selectedTerm}
                onUpdateGrade={handleUpdateGrade}
                onUpdateTermRecovery={handleUpdateTermRecovery}
                onUpdateFinalRecovery={handleUpdateFinalRecovery}
                onAddAssessment={handleAddAssessment}
                onDeleteAssessment={handleDeleteAssessment}
                onSelectStudent={(studentId) => {
                  setSelectedStudentId(studentId);
                  setActiveTab('reports');
                }}
                onUpdateCalculationType={(calcType) => {
                  handleUpdateClass({
                    ...currentClass,
                    gradeCalculationType: calcType
                  });
                }}
                onUpdateRecoveryFormula={(formula) => {
                  handleUpdateClass({
                    ...currentClass,
                    annualRecoveryFormula: formula
                  });
                }}
              />
            )}

            {activeTab === 'attendance' && (
              <AttendanceSystem
                currentClass={currentClass}
                students={data.students}
                attendances={data.attendances}
                selectedTerm={data.selectedTerm}
                onSaveAttendance={handleSaveAttendance}
                onDeleteAttendanceDate={handleDeleteAttendanceDate}
              />
            )}

            {activeTab === 'lessons' && (
              <LessonDiary
                currentClass={currentClass}
                lessons={data.lessons}
                selectedTerm={data.selectedTerm}
                onAddLesson={handleAddLesson}
                onUpdateLesson={handleUpdateLesson}
                onDeleteLesson={handleDeleteLesson}
              />
            )}

            {activeTab === 'student-list' && (
              <StudentListGenerator
                currentClass={currentClass}
                students={data.students}
                assessments={data.assessments}
                gradeRecords={data.gradeRecords}
                attendances={data.attendances}
                selectedTerm={data.selectedTerm}
              />
            )}

            {activeTab === 'incidents' && (
              <StudentIncidents
                currentClass={currentClass}
                students={data.students}
                incidents={data.incidents || []}
                incidentTypes={data.incidentTypes || []}
                selectedTerm={data.selectedTerm}
                onAddIncident={handleAddIncident}
                onUpdateIncident={handleUpdateIncident}
                onDeleteIncident={handleDeleteIncident}
                onAddIncidentType={handleAddIncidentType}
                onDeleteIncidentType={handleDeleteIncidentType}
                isAdmin={currentUser?.role === 'admin'}
              />
            )}

            {activeTab === 'reports' && (
              <StudentReport
                currentClass={currentClass}
                students={data.students}
                assessments={data.assessments}
                gradeRecords={data.gradeRecords}
                termRecoveries={data.termRecoveries || []}
                finalRecoveries={data.finalRecoveries || []}
                attendances={data.attendances}
                observations={data.observations}
                selectedStudentId={selectedStudentId}
                onSelectStudentId={setSelectedStudentId}
                onSaveObservation={handleSaveObservation}
                selectedTerm={data.selectedTerm}
              />
            )}

            {activeTab === 'management' && (
              <ManagementModal
                academicYears={data.academicYears}
                classes={data.classes}
                students={data.students}
                selectedYearId={data.selectedYearId}
                selectedClassId={data.selectedClassId}
                onAddYear={handleAddYear}
                onUpdateYear={handleUpdateYear}
                onDeleteYear={handleDeleteYear}
                onAddClass={handleAddClass}
                onUpdateClass={handleUpdateClass}
                onDeleteClass={handleDeleteClass}
                onAddStudent={handleAddStudent}
                onUpdateStudent={handleUpdateStudent}
                onDeleteStudent={handleDeleteStudent}
                onImportStudentsBatch={handleImportStudentsBatch}
                currentUser={currentUser}
              />
            )}
          </>
        )}
      </main>

      {/* Footer (hidden in print) */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 print:hidden mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Diário do Professor • Controle Escolar & Pedagógico</span>
          <span className="text-slate-400">
            Conforme diretrizes da BNCC e LDB • Dados salvos localmente
          </span>
        </div>
      </footer>

      {/* Google Drive Integration Modal */}
      <GoogleDriveModal
        isOpen={isGoogleDriveOpen}
        onClose={() => setIsGoogleDriveOpen(false)}
        appData={data}
        onRestoreData={(restoredData) => setData(restoredData)}
        currentUser={currentUser}
      />
    </div>
  );
}
