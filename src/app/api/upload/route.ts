import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";

import { checkAndRecordUpload } from "@/lib/upload-limiter";
import { detectFileTypeFromBuffer } from "@/lib/magic-bytes";

const UPLOAD_DIR = path.join(os.tmpdir(), "smm-uploads");

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // 1. Rate limiting check
  const rateLimitKey = session.user?.email || "anonymous";
  const rateLimitCheck = checkAndRecordUpload(rateLimitKey);
  if (!rateLimitCheck.allowed) {
    const waitSeconds = Math.ceil(((rateLimitCheck.resetTimeMs || Date.now()) - Date.now()) / 1000);
    return NextResponse.json(
      { error: `Límite de subidas excedido. Por favor, espera ${waitSeconds} segundos.` },
      { status: 429 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Enforce 50MB file size limit (DoS protection)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "El archivo supera el límite de 50MB" }, { status: 400 });
    }

    // Convert file to buffer to perform binary validation
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 2. Validate Magic Bytes (real file header content)
    const detected = detectFileTypeFromBuffer(buffer);
    if (!detected) {
      return NextResponse.json({ error: "El archivo cargado posee un formato binario inválido o alterado." }, { status: 400 });
    }

    // 3. Confirm target type is in the whitelist
    const allowedTypes = [
      "image/jpeg", "image/png", "image/gif", "image/webp",
      "video/mp4", "video/webm", "video/quicktime",
    ];
    if (!allowedTypes.includes(detected.mime)) {
      return NextResponse.json({ error: "Tipo de archivo no permitido." }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    await mkdir(UPLOAD_DIR, { recursive: true });

    // 4. Force extension normalization based on detected file signature (ignores client extension)
    const filename = `${randomUUID()}.${detected.ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);

    // Write file to disk securely
    await writeFile(filepath, buffer);

    // Determine media type
    const mediaType = detected.mime.startsWith("video/") ? "video" : "image";

    // Generate absolute URL for Meta API compatibility
    const baseUrl = process.env.NEXTAUTH_URL || `https://${req.headers.get("host")}`;
    const absoluteUrl = `${baseUrl}/uploads/${filename}`;

    return NextResponse.json({
      url: `/api/media/${filename}`,
      relativeUrl: `/api/media/${filename}`,
      mediaType,
      originalName: file.name,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Upload error:", error?.message);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
