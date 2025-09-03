import {
  LoginResponse,
  UploadResponse,
  SignResponse,
  AuditEntry,
  VerifyResponse,
} from "./types";

const API_BASE_URL = "http://localhost:3001";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  async login(username: string, password: string): Promise<LoginResponse> {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, "Invalid credentials");
    }

    return response.json();
  },

  async uploadPdf(file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("pdf", file);

    const response = await fetch(`${API_BASE_URL}/api/upload`, {
      method: "POST",
      headers: {
        ...getAuthHeaders(),
      },
      body: formData,
    });

    if (!response.ok) {
      throw new ApiError(response.status, "Upload failed");
    }

    return response.json();
  },

  async signDocument(
    documentId: string,
    filename: string
  ): Promise<SignResponse> {
    const response = await fetch(`${API_BASE_URL}/api/sign/${documentId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ filename }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, "Signing failed");
    }

    return response.json();
  },

  async downloadDocument(filename: string): Promise<Blob> {
    const response = await fetch(`${API_BASE_URL}/api/download/${filename}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, "Download failed");
    }

    return response.blob();
  },

  async getAuditTrail(): Promise<AuditEntry[]> {
    const response = await fetch(`${API_BASE_URL}/api/audit`, {
      headers: {
        ...getAuthHeaders(),
      },
    });

    if (!response.ok) {
      throw new ApiError(response.status, "Failed to fetch audit trail");
    }

    return response.json();
  },

  async verifyDocument(
    filename: string,
    expectedHash: string
  ): Promise<VerifyResponse> {
    const response = await fetch(`${API_BASE_URL}/api/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ filename, expectedHash }),
    });

    if (!response.ok) {
      throw new ApiError(response.status, "Verification failed");
    }

    return response.json();
  },
};
