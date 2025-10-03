"use client";

import React from "react";
import { FileText, FileSpreadsheet } from "lucide-react";

interface ExportData {
  headers: string[];
  rows: string[][];
  filename: string;
}

interface ExportButtonProps {
  data: ExportData;
  className?: string;
  format?: "csv" | "pdf" | "both";
}

export default function ExportButton({
  data,
  className = "",
  format = "both",
}: ExportButtonProps) {
  const exportToCSV = () => {
    const csvContent = [
      data.headers.join(","),
      ...data.rows.map((row) =>
        row
          .map((cell) => {
            // Handle null/undefined values
            if (cell === null || cell === undefined) return "";
            // Escape quotes and wrap in quotes if contains comma, quote, or newline
            const cellStr = String(cell);
            if (
              cellStr.includes(",") ||
              cellStr.includes('"') ||
              cellStr.includes("\n")
            ) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          })
          .join(",")
      ),
    ].join("\n");

    downloadFile(csvContent, `${data.filename}.csv`, "text/csv");
  };

  const exportToPDF = () => {
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${data.filename}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 12px;
            }
            h1 { 
              color: #333; 
              border-bottom: 2px solid #667eea; 
              padding-bottom: 10px;
              margin-bottom: 20px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 20px 0;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left;
              word-wrap: break-word;
            }
            th { 
              background-color: #667eea; 
              color: white; 
              font-weight: bold;
            }
            tr:nth-child(even) { 
              background-color: #f9f9f9; 
            }
            tr:hover { 
              background-color: #f5f5f5; 
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              text-align: center;
              color: #666;
              font-size: 10px;
            }
          </style>
        </head>
        <body>
          <h1>${data.filename
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (str) => str.toUpperCase())}</h1>
          <table>
            <thead>
              <tr>
                ${data.headers.map((header) => `<th>${header}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data.rows
                .map(
                  (row) => `
                <tr>
                  ${row.map((cell) => `<td>${cell || ""}</td>`).join("")}
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
          <div class="footer">
            Generated on ${new Date().toLocaleString()} | Medical Management System
          </div>
        </body>
      </html>
    `;

    // Convert HTML to PDF using browser's print functionality
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      // Wait for content to load then print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  if (format === "csv") {
    return (
      <button
        onClick={exportToCSV}
        className={`
          inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 
          text-white rounded-lg transition-colors duration-200 font-medium
          ${className}
        `}
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        Export CSV
      </button>
    );
  }

  if (format === "pdf") {
    return (
      <button
        onClick={exportToPDF}
        className={`
          inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 
          text-white rounded-lg transition-colors duration-200 font-medium
          ${className}
        `}
      >
        <FileText className="w-4 h-4 mr-2" />
        Export PDF
      </button>
    );
  }

  return (
    <div className={`flex space-x-2 ${className}`}>
      <button
        onClick={exportToCSV}
        className="inline-flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-200 font-medium"
      >
        <FileSpreadsheet className="w-4 h-4 mr-2" />
        CSV
      </button>
      <button
        onClick={exportToPDF}
        className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 font-medium"
      >
        <FileText className="w-4 h-4 mr-2" />
        PDF
      </button>
    </div>
  );
}

// Utility function to prepare data for export
export const prepareExportData = <T extends Record<string, unknown>>(
  items: T[],
  columns: {
    key: keyof T;
    label: string;
    format?: (value: T[keyof T]) => string;
  }[],
  filename: string
): ExportData => {
  const headers = columns.map((col) => col.label);
  const rows = items.map((item) =>
    columns.map((col) => {
      const value = item[col.key];
      return col.format ? col.format(value) : String(value);
    })
  );

  return { headers, rows, filename };
};
