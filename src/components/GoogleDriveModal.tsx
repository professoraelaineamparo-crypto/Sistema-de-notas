import React, { useState, useEffect } from 'react';
import {
  Cloud,
  X,
  UploadCloud,
  DownloadCloud,
  Trash2,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
  FolderOpen,
  Calendar,
  HardDrive,
  LogOut,
  RefreshCw,
  Clock
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import {
  signInWithGoogleDrive,
  signOutGoogleDrive,
  saveBackupToGoogleDrive,
  listDriveBackups,
  downloadBackupFromGoogleDrive,
  deleteFileFromGoogleDrive,
  isGoogleDriveConnected,
  DriveFileItem
} from '../utils/googleDrive';
import { ConfirmModal } from './ConfirmModal';
import { User } from '../types';

interface GoogleDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  appData: any;
  onRestoreData: (restoredData: any) => void;
  currentUser: User | null;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({
  isOpen,
  onClose,
  appData,
  onRestoreData,
  currentUser
}) => {
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(() => isGoogleDriveConnected());
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Confirmation modals
  const [fileToDelete, setFileToDelete] = useState<DriveFileItem | null>(null);
  const [fileToRestore, setFileToRestore] = useState<DriveFileItem | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  // Load backups when modal opens and connected
  const refreshFileList = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const items = await listDriveBackups();
      setFiles(items);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao carregar arquivos do Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setIsConnected(isGoogleDriveConnected());
      if (isGoogleDriveConnected()) {
        refreshFileList();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Google Drive Connect
  const handleConnect = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const { user } = await signInWithGoogleDrive();
      setGoogleUser(user);
      setIsConnected(true);
      setSuccessMessage(`Conectado ao Google Drive com sucesso (${user.email})!`);
      await refreshFileList();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Falha ao autenticar com o Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Drive Disconnect
  const handleDisconnect = async () => {
    await signOutGoogleDrive();
    setGoogleUser(null);
    setIsConnected(false);
    setFiles([]);
    setSuccessMessage('Desconectado do Google Drive.');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle Backup Now
  const handleSaveBackup = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const saved = await saveBackupToGoogleDrive(appData);
      setSuccessMessage(`Backup "${saved.name}" salvo com sucesso no seu Google Drive!`);
      await refreshFileList();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar backup no Google Drive.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Restore
  const handleConfirmRestore = async () => {
    if (!fileToRestore) return;

    if (!isAdmin) {
      setErrorMessage('Apenas administradores podem restaurar a base escolar de dados.');
      setFileToRestore(null);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const downloadedData = await downloadBackupFromGoogleDrive(fileToRestore.id);
      if (downloadedData.academicYears && downloadedData.classes && downloadedData.students) {
        onRestoreData(downloadedData);
        setSuccessMessage('Base de dados restaurada com sucesso a partir do Google Drive!');
        setFileToRestore(null);
        setTimeout(() => {
          setSuccessMessage(null);
          onClose();
        }, 1500);
      } else {
        setErrorMessage('O arquivo selecionado não contém uma estrutura de backup válida.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao restaurar backup do Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Delete File
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await deleteFileFromGoogleDrive(fileToDelete.id);
      setSuccessMessage(`Arquivo "${fileToDelete.name}" excluído do Google Drive.`);
      setFileToDelete(null);
      await refreshFileList();
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao excluir arquivo do Google Drive.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes?: string) => {
    if (!bytes) return 'N/A';
    const num = parseInt(bytes, 10);
    if (isNaN(num)) return 'N/A';
    if (num < 1024) return `${num} B`;
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
    return `${(num / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-900 text-white p-5 sm:p-6 relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold">Google Drive</h3>
                <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full border border-white/20">
                  Nuvem do Professor
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Armazene e sincronize backups e relatórios escolares com segurança na sua conta Google
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Notifications */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
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
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium">{successMessage}</div>
            </div>
          )}

          {/* Connection Status Card */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3.5 h-3.5 rounded-full ${isConnected ? 'bg-emerald-500 ring-4 ring-emerald-100' : 'bg-slate-400'}`} />
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  {isConnected ? 'Conta Google Conectada' : 'Não conectado ao Google Drive'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {isConnected
                    ? (googleUser?.email || 'Acesso liberado para salvar backups e consultar arquivos')
                    : 'Conecte sua conta para salvar backups com 1 clique direto no Google Drive'}
                </span>
              </div>
            </div>

            <div>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-slate-500" />
                    <span>Desconectar</span>
                  </button>
                </div>
              ) : (
                /* Official Google Sign-In button styling per guidelines */
                <button
                  type="button"
                  onClick={handleConnect}
                  disabled={isLoading}
                  className="flex items-center gap-2.5 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 shadow-xs transition hover:shadow cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                  </svg>
                  <span>{isLoading ? 'Conectando...' : 'Conectar com Google Drive'}</span>
                </button>
              )}
            </div>
          </div>

          {/* Quick Action: Backup Now */}
          {isConnected && (
            <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/60 rounded-2xl p-4 border border-indigo-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-indigo-600" />
                  Salvar Cópia Atual no Drive
                </span>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Gera um backup completo em JSON e guarda automaticamente na pasta <strong>Diário do Professor - Backups</strong> do seu Drive.
                </p>
              </div>

              <button
                type="button"
                onClick={handleSaveBackup}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer disabled:opacity-50 shrink-0"
              >
                <UploadCloud className="w-4 h-4" />
                <span>{isSaving ? 'Salvando no Drive...' : 'Fazer Backup no Drive'}</span>
              </button>
            </div>
          )}

          {/* File Explorer in Google Drive */}
          {isConnected ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <FolderOpen className="w-4 h-4 text-indigo-600" />
                  Backups no Google Drive ({files.length})
                </span>

                <button
                  type="button"
                  onClick={refreshFileList}
                  disabled={isLoading}
                  title="Atualizar lista de arquivos"
                  className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {files.length === 0 ? (
                <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-slate-200">
                  <Cloud className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">Nenhum backup encontrado no Google Drive.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Clique em &quot;Fazer Backup no Drive&quot; acima para criar sua primeira cópia de segurança.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between gap-3 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-800 block truncate" title={file.name}>
                            {file.name}
                          </span>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              {formatDate(file.modifiedTime)}
                            </span>
                            <span>•</span>
                            <span>{formatFileSize(file.size)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Open in Drive */}
                        {file.webViewLink && (
                          <a
                            href={file.webViewLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir no Google Drive"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}

                        {/* Restore Button (Admin only) */}
                        {isAdmin ? (
                          <button
                            type="button"
                            onClick={() => setFileToRestore(file)}
                            title="Restaurar este backup do Google Drive"
                            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Restaurar</span>
                          </button>
                        ) : null}

                        {/* Delete Button (Explicit confirmation required) */}
                        <button
                          type="button"
                          onClick={() => setFileToDelete(file)}
                          title="Excluir arquivo do Google Drive"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 text-center space-y-2">
              <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-xs font-bold text-slate-700">Conexão Segura com a Nuvem</h4>
              <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                Ao conectar sua conta Google, o Diário do Professor poderá salvar cópias dos seus dados escolares em uma pasta protegida no seu próprio Google Drive pessoal ou institucional.
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-blue-500" />
            <span>Google Drive API v3 • Criptografia ponta a ponta</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog for Deleting from Google Drive */}
      <ConfirmModal
        isOpen={!!fileToDelete}
        title="Excluir Arquivo do Google Drive?"
        message={`Atenção: Tem certeza que deseja excluir permanentemente o arquivo "${fileToDelete?.name}" do seu Google Drive? Esta ação não pode ser desfeita.`}
        confirmLabel="Sim, Excluir do Drive"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmDelete}
        onCancel={() => setFileToDelete(null)}
      />

      {/* Mandatory User Confirmation Dialog for Restoring from Google Drive */}
      <ConfirmModal
        isOpen={!!fileToRestore}
        title="Restaurar Backup do Google Drive?"
        message={`Atenção: Ao restaurar o backup "${fileToRestore?.name}", todos os registros atuais da escola serão substituídos pelos dados contidos neste arquivo. Deseja continuar?`}
        confirmLabel="Sim, Restaurar Dados"
        cancelLabel="Cancelar"
        isDestructive={true}
        onConfirm={handleConfirmRestore}
        onCancel={() => setFileToRestore(null)}
      />
    </div>
  );
};
