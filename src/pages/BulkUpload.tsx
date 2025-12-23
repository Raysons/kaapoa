import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Upload, FileSpreadsheet, Download, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { cn } from "@/lib/utils";

const BulkUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      setUploadedFile(file.name);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 opacity-0 animate-fade-up">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card transition-colors hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Bulk Upload</h1>
            <p className="text-muted-foreground">
              Import multiple products at once using a CSV or Excel file
            </p>
          </div>
        </div>

        {/* Instructions */}
        <div className="rounded-xl border border-border bg-card p-6 opacity-0 animate-fade-up" style={{ animationDelay: "50ms" }}>
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            How it works
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                step: "1",
                title: "Download Template",
                description: "Get our CSV template with the correct format",
              },
              {
                step: "2",
                title: "Fill in Data",
                description: "Add your product data to the spreadsheet",
              },
              {
                step: "3",
                title: "Upload & Import",
                description: "Upload the file and we'll import everything",
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className="flex gap-3 opacity-0 animate-slide-in-right"
                style={{ animationDelay: `${100 + index * 50}ms` }}
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-medium text-foreground">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6">
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Template
            </Button>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={cn(
            "rounded-xl border-2 border-dashed p-12 transition-all duration-200 opacity-0 animate-fade-up",
            isDragging
              ? "border-accent bg-accent/5"
              : "border-border bg-card hover:border-accent/50",
            uploadedFile && "border-success bg-success/5"
          )}
          style={{ animationDelay: "150ms" }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center text-center">
            {uploadedFile ? (
              <>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-success/20">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  File Ready
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  {uploadedFile}
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setUploadedFile(null)}
                  >
                    Choose Different File
                  </Button>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
                    <Upload className="mr-2 h-4 w-4" />
                    Start Import
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-muted">
                  <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-foreground">
                  Drop your file here
                </h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Supports CSV, XLS, and XLSX files up to 10MB
                </p>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Browse Files
                </Button>
              </>
            )}
          </div>
        </div>

        {/* File Requirements */}
        <div className="rounded-xl border border-border bg-muted/30 p-4 opacity-0 animate-fade-up" style={{ animationDelay: "200ms" }}>
          <h3 className="mb-2 font-medium text-foreground">File Requirements</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>• Maximum file size: 10MB</li>
            <li>• Required columns: name, sku, price, stock</li>
            <li>• Optional columns: category, description, supplier, threshold</li>
            <li>• Use the downloaded template for best results</li>
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BulkUpload;
