# Notarify - Digital Notary System

A minimal digital notary system built with Next.js, Express.js, and pdf-lib. This system allows notaries to upload PDF documents, apply digital signatures and stamps, and download the signed documents with audit trails.

## Features

- **JWT Authentication**: Secure notary login system
- **PDF Upload**: Upload PDF documents for notarization
- **Digital Signing**: Apply notary signatures and stamps to documents
- **Audit Trail**: Track all notarization activities with tamper-proof hashes (SHA256)
- **Document Verification**: Verify document authenticity using cryptographic hashes
- **Download**: Download signed and stamped PDF documents

## Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS
- **Backend**: Express.js, Node.js
- **PDF Processing**: pdf-lib
- **Authentication**: JWT (jsonwebtoken)
- **File Upload**: Multer
- **Build System**: Turborepo
- **Package Manager**: Bun

## Project Structure

This Turborepo includes the following packages/apps:

### Apps and Packages

- `apps/web`: Next.js frontend application
- `apps/backend`: Express.js API server
- `@repo/ui`: Shared React component library
- `@repo/eslint-config`: ESLint configurations
- `@repo/typescript-config`: TypeScript configurations

Each package/app is 100% [TypeScript](https://www.typescriptlang.org/).

## Prerequisites

Before running the application, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (latest version recommended)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd notarify
```

2. Install dependencies:

```bash
bun install
```

## Running the Application

### Method 1: Using Turbo (Recommended)

Run both frontend and backend simultaneously:

```bash
npx turbo run dev
```

This will start:

- Frontend (Next.js) on `http://localhost:3000`
- Backend (Express.js) on `http://localhost:3001`

### Method 2: Running Individually

#### Start the Backend:

```bash
cd apps/backend
bun index.ts
```

The backend API will be available at `http://localhost:3001`

#### Start the Frontend (in a new terminal):

```bash
cd apps/web
bun dev
```

The frontend will be available at `http://localhost:3000`

## Demo Credentials

The system includes demo notary accounts for testing:

- **Notary 1**
  - Username: `notary1`
  - Password: `password123`
  - Name: User 1

- **Notary 2**
  - Username: `notary2`
  - Password: `password456`
  - Name: User 2

## Usage

1. **Login**: Use one of the demo credentials to access the notary dashboard
2. **Upload PDF**: Select and upload a PDF document (max 10MB)
3. **Sign Document**: Apply your notary signature and stamp to the document
4. **Download**: Download the signed PDF with embedded signature and stamp
5. **Audit Trail**: View the complete audit trail of all notarization activities

## API Endpoints

### Authentication

- `POST /api/login` - Notary authentication

### Document Management

- `POST /api/upload` - Upload PDF document
- `POST /api/sign/:documentId` - Sign uploaded document
- `GET /api/download/:filename` - Download signed document
- `POST /api/verify` - Verify document authenticity

### Audit

- `GET /api/audit` - Get audit trail

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **File Validation**: Only PDF files are accepted
- **Tamper-Proof Hashing**: SHA256 hashes for document verification
- **Audit Trail**: Complete logging of all notarization activities
- **Authorization**: Only authenticated notaries can sign documents

## Custom Signature and Stamp Images

To use custom signature and stamp images:

1. Create an `assets` folder in the backend directory:

```bash
mkdir apps/backend/assets
```

2. Add your images:
   - `sample-signature.png` - Notary signature image
   - `sample-stamp.png` - Notary stamp image

The system will automatically use these images if available, otherwise it will fall back to text-based signatures and stamps.
