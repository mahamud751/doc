import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";
import { verifyAuthToken } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const type = formData.get("type") as string; // 'medicine', 'doctor', 'general'

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadDir = join(
      process.cwd(),
      "public",
      "uploads",
      type || "general"
    );

    // Create directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 5MB limit` },
          { status: 400 }
        );
      }

      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];

      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `File type ${file.type} not allowed` },
          { status: 400 }
        );
      }

      // Generate unique filename
      const extension = file.name.split(".").pop();
      const filename = `${uuidv4()}.${extension}`;
      const filepath = join(uploadDir, filename);

      // Convert file to buffer and write
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filepath, buffer);

      // Return relative URL path
      uploadedFiles.push(`/uploads/${type || "general"}/${filename}`);
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      {
        error: "Failed to upload files",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const authResult = await verifyAuthToken(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
      return NextResponse.json(
        { error: "File path not provided" },
        { status: 400 }
      );
    }

    // Security check - only allow deletion from uploads directory
    if (!filePath.startsWith("/uploads/")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    const fullPath = join(process.cwd(), "public", filePath);

    try {
      const fs = require("fs").promises;
      await fs.unlink(fullPath);
      return NextResponse.json({
        success: true,
        message: "File deleted successfully",
      });
    } catch (error) {
      return NextResponse.json(
        { error: "File not found or already deleted" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("File deletion error:", error);
    return NextResponse.json(
      {
        error: "Failed to delete file",
      },
      { status: 500 }
    );
  }
}
