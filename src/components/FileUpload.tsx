"use client";

import React, { useState, useRef } from "react";
import { Upload, X, FileText, Image, Check, AlertCircle } from "lucide-react";

interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxSize?: number; // in MB
  onUpload: (files: File[]) => Promise<string[]>;
  onRemove?: (url: string) => void;
  existingFiles?: string[];
  label?: string;
  className?: string;
}

interface UploadedFile {
  file: File;
  url?: string;
  uploading: boolean;
  error?: string;
}

export default function FileUpload({
  accept = "image/*,.pdf,.doc,.docx",
  multiple = false,
  maxSize = 5,
  onUpload,
  onRemove,
  existingFiles = [],
  label = "Upload Files",
  className = "",
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList) => {
    const newFiles: UploadedFile[] = [];

    Array.from(files).forEach((file) => {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        newFiles.push({
          file,
          uploading: false,
          error: `File size exceeds ${maxSize}MB`,
        });
        return;
      }

      // Validate file type
      if (
        accept &&
        !accept.split(",").some((type) => {
          if (type.startsWith(".")) {
            return file.name.toLowerCase().endsWith(type.toLowerCase());
          }
          return file.type.match(type.trim());
        })
      ) {
        newFiles.push({
          file,
          uploading: false,
          error: "Invalid file type",
        });
        return;
      }

      newFiles.push({
        file,
        uploading: true,
      });
    });

    if (!multiple) {
      setUploadedFiles(newFiles);
    } else {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }

    // Upload valid files
    const validFiles = newFiles.filter((f) => !f.error).map((f) => f.file);
    if (validFiles.length > 0) {
      uploadFiles(validFiles);
    }
  };

  const uploadFiles = async (files: File[]) => {
    try {
      const uploadedUrls = await onUpload(files);

      setUploadedFiles((prev) =>
        prev.map((uploadedFile) => {
          const fileIndex = files.findIndex((f) => f === uploadedFile.file);
          if (fileIndex !== -1) {
            return {
              ...uploadedFile,
              uploading: false,
              url: uploadedUrls[fileIndex],
            };
          }
          return uploadedFile;
        })
      );
    } catch (error) {
      console.error("Upload error:", error);
      setUploadedFiles((prev) =>
        prev.map((uploadedFile) => {
          if (files.includes(uploadedFile.file)) {
            return {
              ...uploadedFile,
              uploading: false,
              error: "Upload failed",
            };
          }
          return uploadedFile;
        })
      );
    }
  };

  const removeFile = (index: number) => {
    const file = uploadedFiles[index];
    if (file.url && onRemove) {
      onRemove(file.url);
    }
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = (url: string) => {
    if (onRemove) {
      onRemove(url);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const getFileIcon = (file: File | string) => {
    const fileName = typeof file === "string" ? file : file.name;
    const extension = fileName.split(".").pop()?.toLowerCase();

    if (["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "")) {
      return <Image className="w-4 h-4" aria-hidden="true" />;
    }
    return <FileText className="w-4 h-4" aria-hidden="true" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${
            dragOver
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
        `}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-600">
          {label} - Drag & drop or click to browse
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Max size: {maxSize}MB • Accepted: {accept}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
            }
          }}
          className="hidden"
        />
      </div>

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Existing Files:</h4>
          {existingFiles.map((url, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200"
            >
              <div className="flex items-center space-x-2">
                {getFileIcon(url)}
                <span className="text-sm text-gray-700 truncate">
                  {url.split("/").pop()}
                </span>
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <button
                onClick={() => removeExistingFile(url)}
                className="p-1 text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
          {uploadedFiles.map((uploadedFile, index) => (
            <div
              key={index}
              className={`
              flex items-center justify-between p-2 rounded border
              ${
                uploadedFile.error
                  ? "bg-red-50 border-red-200"
                  : uploadedFile.url
                  ? "bg-green-50 border-green-200"
                  : "bg-blue-50 border-blue-200"
              }
            `}
            >
              <div className="flex items-center space-x-2">
                {getFileIcon(uploadedFile.file)}
                <span className="text-sm text-gray-700 truncate">
                  {uploadedFile.file.name}
                </span>
                {uploadedFile.uploading && (
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                )}
                {uploadedFile.url && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
                {uploadedFile.error && (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                {uploadedFile.error && (
                  <span className="text-xs text-red-600">
                    {uploadedFile.error}
                  </span>
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="p-1 text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
