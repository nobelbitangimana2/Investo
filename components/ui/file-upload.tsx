"use client";

import { useCallback, useRef, useState } from "react";
import { Upload, Camera, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  label?: string;
  onChange: (file: File | null) => void;
  error?: string;
  accept?: string;
}

export function FileUpload({ label, onChange, error, accept = "image/*" }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (file: File | null) => {
      if (!file) { setPreview(null); onChange(null); return; }
      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange(file);
    },
    [onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      )}

      {preview ? (
        <div className="relative rounded-xl border-2 border-navy-200 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Receipt preview" className="w-full max-h-48 object-contain bg-gray-50" />
          <button
            type="button"
            onClick={() => { setPreview(null); onChange(null); }}
            className="absolute top-2 right-2 rounded-full bg-white/90 p-1 shadow hover:bg-red-50 transition-colors"
            aria-label="Remove file"
          >
            <X className="h-4 w-4 text-red-500" />
          </button>
        </div>
      ) : (
        <div
          className={cn(
            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer",
            dragging ? "border-navy-500 bg-navy-50" : "border-gray-300 hover:border-navy-400 hover:bg-gray-50",
            error && "border-red-400"
          )}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
          aria-label="Upload receipt"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-50 mb-3">
            <FileImage className="h-6 w-6 text-navy-600" />
          </div>
          <p className="text-sm font-medium text-gray-700">
            Drag & drop your receipt here
          </p>
          <p className="text-xs text-gray-400 mt-1">or click to browse</p>

          <div className="flex gap-3 mt-4">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Upload className="h-3.5 w-3.5" />
              Browse
            </button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); cameraRef.current?.click(); }}
              className="flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Camera className="h-3.5 w-3.5" />
              Camera
            </button>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        aria-hidden="true"
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
        aria-hidden="true"
      />

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
