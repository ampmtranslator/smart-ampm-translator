import { initializeApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Google Workspace scopes
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive');

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Track current user and token
export const initAuthListener = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedAccessToken) {
        onSuccess(user, cachedAccessToken);
      } else {
        // Since we are client-side only and firebase doesn't persist access_token inside auth session natively,
        // we might trigger signIn or let them sign in on button click.
        onFailure();
      }
    } else {
      cachedAccessToken = null;
      onFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses dari Google.');
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

export const getCachedToken = () => cachedAccessToken;

/**
 * Drive API Helpers
 */

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
}

// List PDF / Image files from Google Drive
export const listDriveFiles = async (token: string): Promise<DriveFile[]> => {
  const query = encodeURIComponent("mimeType = 'application/pdf' or mimeType = 'image/jpeg' or mimeType = 'image/png'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,size)&pageSize=30&orderBy=createdTime desc`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gagal memuat file dari Google Drive');
  }
  const data = await res.json();
  return data.files || [];
};

// List only Google Spreadsheets from Google Drive
export const listSpreadsheets = async (token: string): Promise<DriveFile[]> => {
  const query = encodeURIComponent("mimeType = 'application/vnd.google-apps.spreadsheet'");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)&pageSize=50&orderBy=name`;
  
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gagal memuat spreadsheet dari Google Drive');
  }
  const data = await res.json();
  return data.files || [];
};

// Download Drive file and convert to DataURL Base64
export const downloadDriveFileAsBase64 = async (token: string, fileId: string): Promise<string> => {
  const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });
  
  if (!res.ok) {
    throw new Error('Gagal men-download dokumen dari Google Drive.');
  }
  
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(new Error('Gagal melakukan ekstraksi data base64'));
    reader.readAsDataURL(blob);
  });
};

/**
 * Sheets API Helpers
 */

// Create a new Google Spreadsheet
export const createNewSpreadsheet = async (token: string, title: string): Promise<string> => {
  const url = 'https://sheets.googleapis.com/v4/spreadsheets';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: { title }
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gagal membuat Google Sheet baru');
  }

  const data = await res.json();
  const spreadsheetId = data.spreadsheetId;

  // Let's create headers next
  await appendRowToSpreadsheet(token, spreadsheetId, 'Sheet1', [
    'ID Lead', 'Waktu', 'Nama Pelanggan', 'No WhatsApp', 'Email', 
    'Bahasa Asal', 'Bahasa Tujuan', 'Tipe Penerjemahan', 'Nama File', 
    'Kategori Dokumen', 'Jenis Dokumen', 'Jumlah Kata', 'Jumlah Karakter', 
    'Halaman Prediksi', 'Kecepatan', 'Harga Per Halaman', 'Biaya Terjemah', 
    'Apostille', 'Legalisasi', 'SKCK', 'Biaya Tambahan', 'Total Biaya', 'Status'
  ]);

  return spreadsheetId;
};

// Append data row to a Spreadsheet
export const appendRowToSpreadsheet = async (
  token: string,
  spreadsheetId: string,
  sheetName: string,
  rowValues: any[]
): Promise<void> => {
  const range = encodeURIComponent(`${sheetName}!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      range: `${sheetName}!A1`,
      majorDimension: 'ROWS',
      values: [rowValues]
    })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Gagal menambahkan baris data ke Google Sheet.');
  }
};
