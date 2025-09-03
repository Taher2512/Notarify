export interface Notary {
  id: number;
  username: string;
  name: string;
}

export interface LoginResponse {
  token: string;
  notary: Notary;
}

export interface UploadResponse {
  documentId: string;
  filename: string;
  originalname: string;
  size: number;
  uploadPath: string;
}

export interface SignResponse {
  documentId: string;
  signedFilename: string;
  hash: string;
  auditEntry: AuditEntry;
}

export interface AuditEntry {
  id: string;
  notaryId: number;
  timestamp: string;
  originalFile: string;
  signedFile: string;
  hash: string;
}

export interface VerifyResponse {
  filename: string;
  expectedHash: string;
  actualHash: string;
  isValid: boolean;
  status: string;
}
