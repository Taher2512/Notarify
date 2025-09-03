"use client";

import { useState, useRef } from "react";
import { api } from "../api";
import { Notary, UploadResponse, SignResponse, AuditEntry } from "../types";

interface DashboardProps {
  notary: Notary;
  onLogout: () => void;
}

export default function Dashboard({ notary, onLogout }: DashboardProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadResponse | null>(null);
  const [signedDocument, setSignedDocument] = useState<SignResponse | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [auditTrail, setAuditTrail] = useState<AuditEntry[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please select a PDF file");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await api.uploadPdf(file);
      setUploadedFile(response);
      setSignedDocument(null);
    } catch (err) {
      setError("Failed to upload file");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleSign = async () => {
    if (!uploadedFile) return;

    setLoading(true);
    setError("");

    try {
      const response = await api.signDocument(
        uploadedFile.documentId,
        uploadedFile.filename
      );
      setSignedDocument(response);
    } catch (err) {
      setError("Failed to sign document");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!signedDocument) return;

    try {
      const blob = await api.downloadDocument(signedDocument.signedFilename);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = signedDocument.signedFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError("Failed to download document");
    }
  };

  const loadAuditTrail = async () => {
    try {
      const trail = await api.getAuditTrail();
      setAuditTrail(trail);
      setShowAudit(true);
    } catch (err) {
      setError("Failed to load audit trail");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("notary");
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notarify</h1>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={loadAuditTrail}
                className="bg-slate-500 text-white px-3 py-1 rounded-md hover:bg-slate-600 transition-colors"
              >
                View Audit Trail
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-1 rounded-md hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            1. Upload PDF Document
          </h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Click <span className="underline">here</span> to upload a
                    PDF
                  </span>
                  <input
                    ref={fileInputRef}
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    className="sr-only"
                    accept=".pdf"
                    onChange={handleFileSelect}
                  />
                </label>
                <p className="mt-1 text-xs text-gray-500">PDF up to 10MB</p>
              </div>
            </div>
          </div>
          {uploadedFile && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-green-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="ml-2 text-sm text-green-700">
                  {uploadedFile.originalname} uploaded successfully (
                  {(uploadedFile.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            2. Sign Document
          </h2>
          <button
            onClick={handleSign}
            disabled={!uploadedFile || loading || !!signedDocument}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Signing..." : "Apply Notary Signature & Stamp"}
          </button>
          {signedDocument && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-blue-900">
                    Document Signed Successfully
                  </h3>
                  <p className="text-sm text-blue-700">
                    Document ID: {signedDocument.documentId}
                  </p>
                  <p className="text-sm text-blue-700">
                    Hash: {signedDocument.hash.substring(0, 16)}...
                  </p>
                  <p className="text-sm text-blue-700">
                    Signed at:{" "}
                    {new Date(
                      signedDocument.auditEntry.timestamp
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            3. Download Signed Document
          </h2>
          <button
            onClick={handleDownload}
            disabled={!signedDocument}
            className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Download Signed PDF
          </button>
        </div>
      </div>

      {showAudit && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Audit Trail
                </h3>
                <button
                  onClick={() => setShowAudit(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {auditTrail.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">
                    No audit entries found
                  </p>
                ) : (
                  <div className="space-y-4">
                    {auditTrail.map((entry) => (
                      <div
                        key={entry.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Document ID:</span>{" "}
                            {entry.id}
                          </div>
                          <div>
                            <span className="font-medium">Notary ID:</span>{" "}
                            {entry.notaryId}
                          </div>
                          <div>
                            <span className="font-medium">Original File:</span>{" "}
                            {entry.originalFile}
                          </div>
                          <div>
                            <span className="font-medium">Signed File:</span>{" "}
                            {entry.signedFile}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Timestamp:</span>{" "}
                            {new Date(entry.timestamp).toLocaleString()}
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium">Hash:</span>
                            <span className="font-mono text-xs break-all ml-2">
                              {entry.hash}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
