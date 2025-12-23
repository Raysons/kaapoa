import React, { useMemo, useRef, useState } from 'react';
import { X, Upload, Download, FileSpreadsheet, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded?: () => void;
}
export function BulkUploadModal({
  isOpen,
  onClose,
  onUploaded,
}: BulkUploadModalProps) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const requiredHeaders = useMemo(() => ["name", "category", "costprice", "sellingprice", "quantity"], []);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const headers = [
      "name",
      "category",
      "costprice",
      "sellingprice",
      "quantity",
      "sku",
      "barcode",
      "unit",
      "low_stock_threshold",
      "image_url",
      "description",
    ];

    const exampleRow = [
      "Coca-Cola 500ml",
      "Soft Drinks",
      "40",
      "60",
      "24",
      "SKU-COCA-500",
      "0123456789012",
      "pcs",
      "5",
      "https://example.com/image.jpg",
      "Sample description",
    ];

    const csv = `${headers.join(",")}
${exampleRow.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")}
`;

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "products_template.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const parseCsv = (text: string) => {
    const lines = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split("\n")
      .filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
      return { headers: [], data: [], errors: ["File is empty"] };
    }

    const parseLine = (line: string) => {
      const out: string[] = [];
      let cur = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            cur += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
          continue;
        }
        if (ch === "," && !inQuotes) {
          out.push(cur);
          cur = "";
          continue;
        }
        cur += ch;
      }
      out.push(cur);
      return out.map((v) => v.trim());
    };

    const headers = parseLine(lines[0]).map((h) => h.trim().toLowerCase());
    const errors: string[] = [];

    for (const req of requiredHeaders) {
      if (!headers.includes(req)) {
        errors.push(`Missing required header: ${req}`);
      }
    }

    const data: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
      const row: any = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] ?? "";
      });
      data.push(row);
    }

    data.forEach((r, idx) => {
      const lineNo = idx + 2;
      if (!String(r.name || "").trim()) errors.push(`Line ${lineNo}: name is required`);
      if (!String(r.category || "").trim()) errors.push(`Line ${lineNo}: category is required`);
      if (String(r.costprice || "").trim() === "" || Number.isNaN(Number(r.costprice))) errors.push(`Line ${lineNo}: costprice must be a number`);
      if (String(r.sellingprice || "").trim() === "" || Number.isNaN(Number(r.sellingprice))) errors.push(`Line ${lineNo}: sellingprice must be a number`);
      if (String(r.quantity || "").trim() === "" || Number.isNaN(Number(r.quantity))) errors.push(`Line ${lineNo}: quantity must be a number`);
    });

    return { headers, data, errors };
  };

  const handleFile = async (file: File) => {
    setFileName(file.name);
    const text = await file.text();
    const parsed = parseCsv(text);
    setRows(parsed.data);
    setParseErrors(parsed.errors);
    setStep(2);
  };

  const startImport = async () => {
    if (parseErrors.length > 0) {
      toast({ title: "Fix errors", description: "Please fix CSV errors before importing.", variant: "destructive" });
      return;
    }
    if (rows.length === 0) {
      toast({ title: "No data", description: "No rows found to import.", variant: "destructive" });
      return;
    }

    setImporting(true);
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) throw new Error("Not authenticated");

      const payload = rows.map((r) => {
        const sku = String(r.sku || "").trim() || `SKU-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return {
          name: String(r.name || "").trim(),
          category: String(r.category || "").trim(),
          sku,
          barcode: String(r.barcode || "").trim() || null,
          description: String(r.description || "").trim() || null,
          buying_price: Number(r.costprice),
          selling_price: Number(r.sellingprice),
          quantity: Number(r.quantity),
          unit: String(r.unit || "").trim() || "pcs",
          low_stock_threshold:
            String(r.low_stock_threshold || "").trim() === "" ? 5 : Number(r.low_stock_threshold),
          image_url: String(r.image_url || "").trim() || null,
          user_id: userData.user.id,
        };
      });

      const chunkSize = 200;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase.from("products").insert(chunk);
        if (error) throw error;
      }

      toast({ title: "Success", description: `Imported ${payload.length} products` });
      setStep(3);
      onUploaded?.();
    } catch (e: any) {
      console.error("Bulk upload failed:", e);
      toast({ title: "Error", description: e?.message || "Bulk upload failed", variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const resetState = () => {
    setStep(1);
    setFileName(null);
    setRows([]);
    setParseErrors([]);
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-blue-700 p-6 text-white relative">
          <button onClick={onClose} className="absolute top-6 right-6 text-blue-100 hover:text-white hover:bg-blue-600 rounded-full p-1 transition-colors">
            <X className="h-5 w-5" />
          </button>
          <h2 className="text-xl font-bold mb-1">Bulk Upload Products</h2>
          <p className="text-blue-100 text-sm mb-6">
            Upload multiple products from CSV or Excel file
          </p>

          {/* Steps */}
          <div className="flex items-center text-sm">
            <div className="flex items-center">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${step >= 1 ? 'bg-white text-blue-700' : 'bg-blue-800 text-blue-300'} font-bold mr-2`}>
                1
              </span>
              <span className={step >= 1 ? 'text-white font-medium' : 'text-blue-300'}>
                Upload File
              </span>
            </div>
            <div className="h-px bg-blue-500 w-16 mx-4"></div>
            <div className="flex items-center">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${step >= 2 ? 'bg-white text-blue-700' : 'bg-blue-800 text-blue-300'} font-bold mr-2`}>
                2
              </span>
              <span className={step >= 2 ? 'text-white font-medium' : 'text-blue-300'}>
                Preview & Validate
              </span>
            </div>
            <div className="h-px bg-blue-500 w-16 mx-4"></div>
            <div className="flex items-center">
              <span className={`flex items-center justify-center w-6 h-6 rounded-full ${step >= 3 ? 'bg-white text-blue-700' : 'bg-blue-800 text-blue-300'} font-bold mr-2`}>
                3
              </span>
              <span className={step >= 3 ? 'text-white font-medium' : 'text-blue-300'}>
                Upload
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Template Download */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="h-5 w-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-blue-900 mb-1">
                  Download Template First
                </h4>
                <p className="text-sm text-blue-700 mb-3">
                  Download our CSV template with sample data and required column
                  headers.
                </p>
                <Button variant="outline" size="sm" className="bg-white text-blue-600 border-blue-200 hover:bg-blue-50" onClick={downloadTemplate}>
                  <Download className="h-4 w-4" />
                  Download Template
                </Button>
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
            <h4 className="text-sm font-bold text-yellow-800 mb-2">
              CSV Format Requirements
            </h4>
            <p className="text-xs text-yellow-700 mb-2">
              Your CSV file must have these exact headers (first row):
            </p>
            <code className="block bg-yellow-100 text-yellow-900 px-2 py-1 rounded text-xs font-mono mb-3">
              name,category,costprice,sellingprice,quantity
            </code>
            <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
              <li>Headers must be lowercase</li>
              <li>No spaces in header names</li>
              <li>Use comma (,) as separator</li>
              <li>Save as .csv format</li>
            </ul>
          </div>

          {/* Dropzone */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-12 flex flex-col items-center justify-center text-center hover:border-blue-400 hover:bg-blue-50/30 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
              }}
            />
            <div className="bg-gray-100 p-3 rounded-full mb-4">
              <Upload className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              {fileName ? `Selected: ${fileName}` : 'Drop your CSV file here'}
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              or <span className="text-blue-600 font-medium hover:underline">browse to choose a file</span>
            </p>
            <p className="text-xs text-gray-400">
              Supports CSV files (Max 10MB)
            </p>
          </div>

          {step >= 2 && (
            <div className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900">Preview</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={resetState} disabled={importing}>
                    Choose Different File
                  </Button>
                  <Button size="sm" onClick={startImport} disabled={importing || parseErrors.length > 0 || rows.length === 0}>
                    {importing ? 'Importing...' : 'Start Import'}
                  </Button>
                </div>
              </div>

              {parseErrors.length > 0 ? (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <div className="font-bold mb-2">Errors</div>
                  <ul className="list-disc list-inside space-y-1">
                    {parseErrors.slice(0, 10).map((e, idx) => (
                      <li key={idx}>{e}</li>
                    ))}
                  </ul>
                  {parseErrors.length > 10 && (
                    <div className="mt-2 text-xs">+ {parseErrors.length - 10} more...</div>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
                  Ready to import {rows.length} rows.
                </div>
              )}

              {rows.length > 0 && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="py-2 pr-4">name</th>
                        <th className="py-2 pr-4">category</th>
                        <th className="py-2 pr-4">costprice</th>
                        <th className="py-2 pr-4">sellingprice</th>
                        <th className="py-2 pr-4">quantity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.slice(0, 5).map((r, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="py-2 pr-4">{r.name}</td>
                          <td className="py-2 pr-4">{r.category}</td>
                          <td className="py-2 pr-4">{r.costprice}</td>
                          <td className="py-2 pr-4">{r.sellingprice}</td>
                          <td className="py-2 pr-4">{r.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 5 && (
                    <div className="mt-2 text-xs text-gray-500">Showing first 5 rows.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Required Columns List */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">
              Required Columns
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-600">
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                  name
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                  sellingprice
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                  category
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                  quantity
                </li>
              </ul>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                  costprice
                </li>
                <li className="flex items-center">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                  optional columns
                </li>
              </ul>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center text-xs text-orange-600">
              <Info className="h-3 w-3 mr-1.5" />
              Column headers must be lowercase (e.g., costprice, not costPrice)
            </div>
          </div>
        </div>
      </div>
    </div>;
}