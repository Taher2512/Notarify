import express from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import multer from "multer";
import { PDFDocument, rgb, StandardFonts, degrees } from "pdf-lib";
import { createHash } from "crypto";
import { promises as fs } from "fs";
import path from "path";

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "secret";

app.use(express.json());
app.use(cors());

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10mb limit
  },
});

const notaries = [
  { id: 1, username: "notary1", password: "password123", name: "User 1" },
  { id: 2, username: "notary2", password: "password456", name: "User 2" },
];

const auditTrail: Array<{
  id: string;
  notaryId: number;
  timestamp: string;
  originalFile: string;
  signedFile: string;
  hash: string;
}> = [];

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.sendStatus(401);
  }

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.get("/", (req, res) => {
  res.json({ message: "Notary API Server", version: "1.0.0" });
});

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  const notary = notaries.find(
    (n) => n.username === username && n.password === password
  );

  if (!notary) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    { id: notary.id, username: notary.username, name: notary.name },
    JWT_SECRET,
    { expiresIn: "24h" }
  );

  res.json({
    token,
    notary: {
      id: notary.id,
      username: notary.username,
      name: notary.name,
    },
  });
});

app.post(
  "/api/upload",
  authenticateToken,
  upload.single("pdf"),
  async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
      }

      const documentId = Date.now().toString();
      const uploadPath = req.file.path;

      res.json({
        documentId,
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        uploadPath,
      });
    } catch (error) {
      res.status(500).json({ error: "Upload failed", details: error });
    }
  }
);

app.post("/api/sign/:documentId", authenticateToken, async (req: any, res) => {
  try {
    const { documentId } = req.params;
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: "Filename is required" });
    }

    const inputPath = path.join(process.cwd(), "uploads", filename);
    const outputFilename = `signed-${documentId}-${filename}`;
    const outputPath = path.join(process.cwd(), "uploads", outputFilename);

    const existingPdfBytes = await fs.readFile(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const pages = pdfDoc.getPages();
    if (pages.length === 0) {
      return res.status(400).json({ error: "PDF has no pages" });
    }
    const firstPage = pages[0]!;
    const { width, height } = firstPage.getSize();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const signatureText = `Digitally signed by: ${req.user.name}`;
    const timestamp = new Date().toISOString();
    const timestampText = `Date: ${new Date(timestamp).toLocaleDateString()}`;
    const notaryText = `Notary ID: ${req.user.id}`;

    const margin = 50;
    const signatureX = margin + 30;
    const stampX = width - 200;
    const bottomY = margin;

    try {
      const signatureImagePath = path.join(
        process.cwd(),
        "assets",
        "sample-signature.png"
      );
      await fs.access(signatureImagePath);

      const signatureImageBytes = await fs.readFile(signatureImagePath);
      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      const signatureImageDims = signatureImage.scale(0.08);

      firstPage.drawImage(signatureImage, {
        x: signatureX,
        y: bottomY + 40,
        width: signatureImageDims.width,
        height: signatureImageDims.height,
        opacity: 0.9,
      });

      firstPage.drawText(signatureText, {
        x: signatureX,
        y: bottomY + 25,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(timestampText, {
        x: signatureX,
        y: bottomY + 10,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(notaryText, {
        x: signatureX,
        y: bottomY - 5,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });
    } catch (error) {
      console.log("No signature image found, using text signature only");

      firstPage.drawRectangle({
        x: signatureX,
        y: bottomY,
        width: 180,
        height: 60,
        borderColor: rgb(0, 0, 0),
        borderWidth: 1,
      });

      firstPage.drawText(signatureText, {
        x: signatureX + 10,
        y: bottomY + 40,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(timestampText, {
        x: signatureX + 10,
        y: bottomY + 25,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });

      firstPage.drawText(notaryText, {
        x: signatureX + 10,
        y: bottomY + 10,
        size: 8,
        font: font,
        color: rgb(0, 0, 0),
      });
    }

    try {
      const stampImagePath = path.join(
        process.cwd(),
        "assets",
        "sample-stamp.png"
      );
      await fs.access(stampImagePath);

      const stampImageBytes = await fs.readFile(stampImagePath);
      const stampImage = await pdfDoc.embedPng(stampImageBytes);
      const stampImageDims = stampImage.scale(0.25);

      firstPage.drawImage(stampImage, {
        x: stampX,
        y: bottomY + 50,
        width: stampImageDims.width,
        height: stampImageDims.height,
        rotate: degrees(-45),
        opacity: 0.8,
      });
    } catch (error) {
      console.log("No stamp image found, using text stamp only");

      firstPage.drawRectangle({
        x: stampX,
        y: bottomY,
        width: 150,
        height: 80,
        borderColor: rgb(0.8, 0.2, 0.2),
        borderWidth: 2,
      });

      firstPage.drawText("NOTARY STAMP", {
        x: stampX + 10,
        y: bottomY + 50,
        size: 14,
        font: fontBold,
        color: rgb(0.8, 0.2, 0.2),
      });

      firstPage.drawText(`State Certified`, {
        x: stampX + 10,
        y: bottomY + 30,
        size: 10,
        font: font,
        color: rgb(0.8, 0.2, 0.2),
      });

      firstPage.drawText(`License: ${req.user.id}`, {
        x: stampX + 10,
        y: bottomY + 15,
        size: 8,
        font: font,
        color: rgb(0.8, 0.2, 0.2),
      });
    }

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);

    const hash = createHash("sha256").update(pdfBytes).digest("hex");

    const auditEntry = {
      id: documentId,
      notaryId: req.user.id,
      timestamp,
      originalFile: filename,
      signedFile: outputFilename,
      hash,
    };
    auditTrail.push(auditEntry);

    res.json({
      documentId,
      signedFilename: outputFilename,
      hash,
      auditEntry,
    });
  } catch (error) {
    console.error("Signing error:", error);
    res.status(500).json({ error: "PDF signing failed", details: error });
  }
});

app.get("/api/download/:filename", authenticateToken, async (req: any, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(process.cwd(), "uploads", filename);

    await fs.access(filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
  } catch (error) {
    res.status(404).json({ error: "File not found" });
  }
});

app.get("/api/audit", authenticateToken, (req: any, res) => {
  res.json(auditTrail);
});

app.post("/api/verify", authenticateToken, async (req: any, res) => {
  try {
    const { filename, expectedHash } = req.body;

    if (!filename || !expectedHash) {
      return res
        .status(400)
        .json({ error: "Filename and expectedHash are required" });
    }

    const filePath = path.join(process.cwd(), "uploads", filename);
    const fileBuffer = await fs.readFile(filePath);
    const actualHash = createHash("sha256").update(fileBuffer).digest("hex");

    const isValid = actualHash === expectedHash;

    res.json({
      filename,
      expectedHash,
      actualHash,
      isValid,
      status: isValid
        ? "Document is authentic"
        : "Document has been tampered with",
    });
  } catch (error) {
    res.status(500).json({ error: "Verification failed", details: error });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Notary API Server is running on port ${PORT}`);
});
