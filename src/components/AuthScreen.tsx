import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldAlert,
  Sparkles,
  HelpCircle,
  UserCheck
} from 'lucide-react';
import { User } from '../types';
import { loginUser, resetUserPassword } from '../utils/auth';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

type AuthMode = 'login' | 'forgot';

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('login');

  // Login form state
  const [loginEmail, setLoginEmail] = useState('professor@escola.com');
  const [loginPassword, setLoginPassword] = useState('123456');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);

  // Alert and feedback state
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Handle Login Submit
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const result = loginUser(loginEmail, loginPassword);
      if (result.success && result.user) {
        setSuccessMessage(`Bem-vindo(a), ${result.user.name}!`);
        setTimeout(() => {
          onLoginSuccess(result.user!);
        }, 300);
      } else {
        setErrorMessage(result.error || 'Falha ao autenticar.');
      }
    } catch (err) {
      setErrorMessage('Ocorreu um erro inesperado ao efetuar login.');
    } finally {
      setIsLoading(false);
    }
  };

  // Quick Demo Logins
  const handleDemoAdmin = () => {
    setLoginEmail('admin@escola.com');
    setLoginPassword('admin123');
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginUser('admin@escola.com', 'admin123');
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage('Usuário administrador não encontrado.');
      }
      setIsLoading(false);
    }, 200);
  };

  const handleDemoTeacher = () => {
    setLoginEmail('professor@escola.com');
    setLoginPassword('123456');
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = loginUser('professor@escola.com', '123456');
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage('Usuário professor não encontrado.');
      }
      setIsLoading(false);
    }, 200);
  };

  // Handle Forgot Password Submit
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (forgotNewPassword !== forgotConfirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    if (forgotNewPassword.length < 6) {
      setErrorMessage('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    try {
      const result = resetUserPassword(forgotEmail, forgotNewPassword);
      if (result.success) {
        setSuccessMessage('Senha redefinida com sucesso! Você já pode entrar com sua nova senha.');
        setLoginEmail(forgotEmail);
        setLoginPassword(forgotNewPassword);
        setTimeout(() => {
          setMode('login');
        }, 1500);
      } else {
        setErrorMessage(result.error || 'Não foi possível redefinir a senha.');
      }
    } catch (err) {
      setErrorMessage('Erro ao redefinir senha.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center px-4 py-8 relative overflow-hidden font-sans">
      {/* Background ambient glowing circles */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-blue-500 shadow-xl shadow-indigo-500/25 text-white mb-3 ring-4 ring-slate-800">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">
            Diário do Professor
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
            Acesso Restrito • Gestão Escolar, Avaliações, Frequência e Ocorrências
          </p>
        </div>

        {/* Card Box */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          {/* Card Top Notice: Cadastros restritos ao Administrador */}
          <div className="bg-slate-100/80 px-5 py-3 border-b border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              <span>Autenticação de Usuário</span>
            </div>
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200/60 px-2 py-0.5 rounded-full">
              Acesso Seguro
            </span>
          </div>

          <div className="p-6 sm:p-7">
            {/* Feedback Notifications */}
            {errorMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{errorMessage}</div>
                <button
                  type="button"
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-rose-700"
                >
                  ✕
                </button>
              </div>
            )}

            {successMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="flex-1 font-medium">{successMessage}</div>
              </div>
            )}

            {/* ======================= MODE: LOGIN ======================= */}
            {mode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    E-mail de Acesso
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="seu.email@escola.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 block">
                      Senha do Usuário
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage(null);
                        setSuccessMessage(null);
                        setMode('forgot');
                      }}
                      className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                    />
                    <span>Lembrar meu acesso</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <span>{isLoading ? 'Autenticando...' : 'Acessar o Sistema'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Administrative Registration Restriction Notice */}
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Cadastro restrito ao Administrador</strong>
                    O cadastro de novos usuários é realizado exclusivamente pelo Administrador escolar no painel interno.
                  </div>
                </div>

                {/* Quick Demo Access Buttons for Test */}
                <div className="pt-2 border-t border-slate-100 space-y-2">
                  <span className="text-[11px] text-slate-400 font-bold block text-center uppercase tracking-wider">
                    Acessos de Demonstração
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDemoAdmin}
                      title="Entrar com perfil completo de Administrador"
                      className="py-2 px-2 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>Administrador</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDemoTeacher}
                      title="Entrar com perfil de Professor"
                      className="py-2 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      <span>Professor</span>
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-400 text-center space-y-0.5">
                    <div>Admin: <span className="font-mono text-slate-600">admin@escola.com</span> / senha: <span className="font-mono text-slate-600">admin123</span></div>
                    <div>Professor: <span className="font-mono text-slate-600">professor@escola.com</span> / senha: <span className="font-mono text-slate-600">123456</span></div>
                  </div>
                </div>
              </form>
            ) : (
              /* ======================= MODE: FORGOT PASSWORD ======================= */
              <form onSubmit={handleForgotSubmit} className="space-y-4">
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-3 text-indigo-950 text-xs flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    Digite seu e-mail cadastrado e informe uma nova senha de no mínimo 6 caracteres.
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    E-mail do Usuário
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="seu.email@escola.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Nova Senha (mín. 6 dígitos)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showForgotPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Nova senha"
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotPass(!showForgotPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showForgotPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Confirmar Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type={showForgotPass ? 'text' : 'password'}
                      required
                      minLength={6}
                      placeholder="Repita a nova senha"
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-900"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage(null);
                      setSuccessMessage(null);
                      setMode('login');
                    }}
                    className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Voltar ao Login
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {isLoading ? 'Salvando...' : 'Redefinir e Salvar'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Security Notice Footer */}
        <div className="mt-6 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Acesso Seguro com Senha Criptografada • Diário Oficial do Professor</span>
        </div>
      </div>
    </div>
  );
};
