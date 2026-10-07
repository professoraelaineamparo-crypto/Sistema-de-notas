import React, { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  KeyRound,
  ShieldCheck,
  UserCheck,
  Search,
  Mail,
  School,
  BookOpen,
  Phone,
  CheckCircle2,
  AlertCircle,
  X,
  Lock,
  Calendar
} from 'lucide-react';
import { User, UserRole } from '../types';
import {
  getRegisteredUsers,
  registerUserByAdmin,
  deleteUserByAdmin,
  resetUserPassword,
  updateUserProfile
} from '../utils/auth';
import { ConfirmModal } from './ConfirmModal';

interface UserManagementProps {
  currentUser: User;
  onUsersChange?: () => void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  currentUser,
  onUsersChange
}) => {
  const [users, setUsers] = useState<User[]>(() => getRegisteredUsers());
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'professor'>('all');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [userToResetPass, setUserToResetPass] = useState<User | null>(null);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);

  // Form: New User
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('professor');
  const [newRoleLabel, setNewRoleLabel] = useState('Professor(a) de ');
  const [newSchool, setNewSchool] = useState('Escola Municipal Santos Dumont');
  const [newPhone, setNewPhone] = useState('');
  const [newPassword, setNewPassword] = useState('123456');

  // Form: Reset Password
  const [newPassInput, setNewPassInput] = useState('123456');

  // Notification banners
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshUsers = () => {
    const list = getRegisteredUsers();
    setUsers(list);
    if (onUsersChange) onUsersChange();
  };

  const handleOpenAdd = () => {
    setNewName('');
    setNewEmail('');
    setNewRole('professor');
    setNewRoleLabel('Professor(a) de ');
    setNewSchool(currentUser.schoolName || 'Escola Municipal');
    setNewPhone('');
    setNewPassword('123456');
    setErrorMsg(null);
    setIsAddModalOpen(true);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const result = registerUserByAdmin({
      name: newName,
      email: newEmail,
      password: newPassword,
      role: newRole,
      roleLabel: newRoleLabel,
      schoolName: newSchool,
      phone: newPhone
    });

    if (result.success && result.user) {
      setSuccessMsg(`Usuário "${result.user.name}" cadastrado com sucesso!`);
      setIsAddModalOpen(false);
      refreshUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(result.error || 'Falha ao cadastrar usuário.');
    }
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    const res = deleteUserByAdmin(userToDelete.id, currentUser.id);
    if (res.success) {
      setSuccessMsg(`Usuário "${userToDelete.name}" foi removido do sistema.`);
      setUserToDelete(null);
      refreshUsers();
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || 'Não foi possível excluir o usuário.');
      setUserToDelete(null);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userToResetPass) return;
    const res = resetUserPassword(userToResetPass.email, newPassInput);
    if (res.success) {
      setSuccessMsg(`Senha do usuário "${userToResetPass.name}" redefinida para "${newPassInput}".`);
      setUserToResetPass(null);
      setTimeout(() => setSuccessMsg(null), 4000);
    } else {
      setErrorMsg(res.error || 'Erro ao redefinir senha.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.name.toLowerCase().includes(q);
      const matchEmail = u.email.toLowerCase().includes(q);
      const matchRole = (u.roleLabel || u.role).toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchRole) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600" />
              Gestão de Usuários & Professores
            </h3>
            <span className="text-xs bg-indigo-100 text-indigo-700 font-bold px-2.5 py-0.5 rounded-full">
              {users.length} cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Controle de acessos exclusivo do Administrador: cadastre novos professores, defina permissões e redefina senhas.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Usuário</span>
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou disciplina..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-semibold mr-1">Filtrar:</span>
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              roleFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              roleFilter === 'admin'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Administradores ({users.filter((u) => u.role === 'admin').length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('professor')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
              roleFilter === 'professor'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Professores ({users.filter((u) => u.role === 'professor').length})
          </button>
        </div>
      </div>

      {/* Users List Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredUsers.map((u) => {
          const isCurrent = u.id === currentUser.id;
          const isAdminUser = u.role === 'admin';

          return (
            <div
              key={u.id}
              className={`bg-white rounded-2xl p-4 border transition shadow-xs flex flex-col justify-between ${
                isCurrent ? 'border-indigo-300 ring-2 ring-indigo-500/10' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                        isAdminUser
                          ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 leading-tight">
                          {u.name}
                        </h4>
                        {isCurrent && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded-md">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span className="font-mono text-[11px]">{u.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <span
                    className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isAdminUser
                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    {isAdminUser ? (
                      <ShieldCheck className="w-3.5 h-3.5" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{isAdminUser ? 'Administrador' : 'Professor'}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100 mb-3">
                  <div className="flex items-center gap-1.5 truncate">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{u.roleLabel || u.role}</span>
                  </div>
                  {u.schoolName && (
                    <div className="flex items-center gap-1.5 truncate">
                      <School className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.schoolName}</span>
                    </div>
                  )}
                  {u.phone && (
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{u.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Cadastrado em {new Date(u.createdAt).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUserToResetPass(u);
                    setNewPassInput('123456');
                  }}
                  className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold p-1"
                  title="Redefinir senha de acesso deste usuário"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Redefinir Senha</span>
                </button>

                {!isCurrent && (
                  <button
                    type="button"
                    onClick={() => setUserToDelete(u)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title={`Excluir usuário ${u.name}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Cadastrar Novo Usuário */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Cadastrar Novo Usuário no Sistema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Prof. Roberto Miranda"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  E-mail de Acesso (Login) *
                </label>
                <input
                  type="email"
                  required
                  placeholder="roberto.miranda@escola.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Tipo de Perfil *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => {
                      const r = e.target.value as UserRole;
                      setNewRole(r);
                      if (r === 'admin') {
                        setNewRoleLabel('Administrador(a) Escolar');
                      } else {
                        setNewRoleLabel('Professor(a) de ');
                      }
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                  >
                    <option value="professor">Professor(a)</option>
                    <option value="admin">Administrador(a)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Disciplina / Função *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Geografia, Coordenação..."
                    value={newRoleLabel}
                    onChange={(e) => setNewRoleLabel(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Escola / Unidade
                  </label>
                  <input
                    type="text"
                    placeholder="Nome da escola"
                    value={newSchool}
                    onChange={(e) => setNewSchool(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Telefone (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="(00) 00000-0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Senha Provisória de Acesso * (mín. 6 dígitos)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  O usuário poderá alterar esta senha a qualquer momento através do seu perfil.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  Cadastrar Usuário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Redefinir Senha */}
      {userToResetPass && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Redefinir Senha de Acesso
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Informe a nova senha para o usuário <strong>{userToResetPass.name}</strong> ({userToResetPass.email}):
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nova Senha *
                </label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassInput}
                  onChange={(e) => setNewPassInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUserToResetPass(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Salvar Nova Senha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Excluir Usuário */}
      <ConfirmModal
        isOpen={!!userToDelete}
        title="Excluir Usuário do Sistema?"
        message={`Deseja realmente remover o acesso de "${userToDelete?.name}" (${userToDelete?.email})? Este usuário não poderá mais acessar o diário.`}
        confirmLabel="Sim, Excluir Usuário"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleDeleteUser}
        onCancel={() => setUserToDelete(null)}
      />
    </div>
  );
};
