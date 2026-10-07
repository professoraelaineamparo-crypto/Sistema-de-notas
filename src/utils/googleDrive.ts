import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.metadata'
];

const provider = new GoogleAuthProvider();
DRIVE_SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({
  prompt: 'consent',
  access_type: 'offline'
});

// In-memory token cache (Do NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export interface DriveFileItem {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
}

/**
 * Initialize Google Auth state listener
 */
export const initGoogleDriveAuth = (
  onAuthChange: (user: FirebaseUser | null, token: string | null) => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user && cachedAccessToken) {
      onAuthChange(user, cachedAccessToken);
    } else {
      if (!isSigningIn) {
        cachedAccessToken = null;
      }
      onAuthChange(user, cachedAccessToken);
    }
  });
};

/**
 * Sign in with Google to get Drive access token
 */
export const signInWithGoogleDrive = async (): Promise<{
  user: FirebaseUser;
  accessToken: string;
}> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Não foi possível obter o token de acesso do Google Drive.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Erro ao conectar Google Drive:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Get cached access token or request sign in if missing
 */
export const getDriveAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;

  if (auth.currentUser) {
    try {
      const res = await signInWithGoogleDrive();
      return res.accessToken;
    } catch {
      return null;
    }
  }

  return null;
};

/**
 * Sign out from Google
 */
export const signOutGoogleDrive = async () => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
};

/**
 * Check if currently connected with Google Drive token
 */
export const isGoogleDriveConnected = (): boolean => {
  return !!cachedAccessToken && !!auth.currentUser;
};

/**
 * Find or create a specific folder in Google Drive (e.g. 'Diário do Professor - Backups')
 */
export const getOrCreateFolder = async (folderName: string): Promise<string> => {
  const token = await getDriveAccessToken();
  if (!token) throw new Error('Não conectado ao Google Drive');

  // Search for folder
  const query = encodeURIComponent(
    `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
  );
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  if (!searchRes.ok) {
    throw new Error('Falha ao buscar pastas no Google Drive');
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create folder if not found
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    })
  });

  if (!createRes.ok) {
    throw new Error('Falha ao criar pasta no Google Drive');
  }

  const created = await createRes.json();
  return created.id;
};

/**
 * Upload a file to Google Drive (supports JSON, PDF, CSV, etc.)
 */
export const uploadFileToDrive = async (
  fileName: string,
  mimeType: string,
  content: string | Blob,
  folderName: string = 'Diário do Professor - Arquivos'
): Promise<DriveFileItem> => {
  const token = await getDriveAccessToken();
  if (!token) throw new Error('Não conectado ao Google Drive');

  const folderId = await getOrCreateFolder(folderName);

  const metadata = {
    name: fileName,
    parents: [folderId],
    mimeType: mimeType
  };

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  let contentData: Blob;
  if (typeof content === 'string') {
    contentData = new Blob([content], { type: mimeType });
  } else {
    contentData = content;
  }

  // Convert Blob to array buffer for multipart body construction
  const contentArrayBuffer = await contentData.arrayBuffer();

  const metadataPart = new Blob(
    [
      delimiter,
      'Content-Type: application/json; charset=UTF-8\r\n\r\n',
      JSON.stringify(metadata),
      delimiter,
      `Content-Type: ${mimeType}\r\n\r\n`
    ],
    { type: 'text/plain' }
  );

  const closePart = new Blob([closeDelimiter], { type: 'text/plain' });

  const multipartBody = new Blob([metadataPart, contentArrayBuffer, closePart], {
    type: `multipart/related; boundary=${boundary}`
  });

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink,webContentLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: multipartBody
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Erro ao enviar arquivo para o Google Drive: ${errText}`);
  }

  return await res.json();
};

/**
 * Save complete application state backup to Google Drive
 */
export const saveBackupToGoogleDrive = async (appData: any): Promise<DriveFileItem> => {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `backup_diario_professor_${dateStr}.json`;
  const jsonContent = JSON.stringify(appData, null, 2);

  return await uploadFileToDrive(
    fileName,
    'application/json',
    jsonContent,
    'Diário do Professor - Backups'
  );
};

/**
 * List files in the 'Diário do Professor' folders in Google Drive
 */
export const listDriveBackups = async (
  folderName: string = 'Diário do Professor - Backups'
): Promise<DriveFileItem[]> => {
  const token = await getDriveAccessToken();
  if (!token) return [];

  try {
    const folderId = await getOrCreateFolder(folderName);
    const query = encodeURIComponent(`'${folderId}' in parents and trashed = false`);
    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink,webContentLink,iconLink)&orderBy=modifiedTime desc`,
      {
        headers: { Authorization: `Bearer ${token}` }
      }
    );

    if (!res.ok) return [];
    const data = await res.json();
    return data.files || [];
  } catch (err) {
    console.error('Erro ao listar arquivos do Drive:', err);
    return [];
  }
};

/**
 * Download file content (e.g. JSON backup) from Google Drive
 */
export const downloadBackupFromGoogleDrive = async (fileId: string): Promise<any> => {
  const token = await getDriveAccessToken();
  if (!token) throw new Error('Não conectado ao Google Drive');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error('Falha ao baixar arquivo do Google Drive');
  }

  return await res.json();
};

/**
 * Delete a file from Google Drive (MUST be called ONLY after explicit user confirmation)
 */
export const deleteFileFromGoogleDrive = async (fileId: string): Promise<boolean> => {
  const token = await getDriveAccessToken();
  if (!token) throw new Error('Não conectado ao Google Drive');

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    throw new Error('Falha ao excluir arquivo do Google Drive');
  }

  return true;
};
