"use client";
import { useEffect, useState } from "react";
import { uploadBenchImages } from "@/lib/storage";
import { createBrowserClient } from "@supabase/ssr";
import { Database } from "@/lib/types";
import { AlertCircleIcon, ImageIcon, UploadIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatBytes, useFileUpload } from "@/hooks/use-file-upload";

type Uploadable = { id: string; file: File; preview?: string };

interface UploadDialogProps {
  benchId: string;
  open: boolean;
  onClose: () => void;
  onUploaded?: (uploaded: { path: string; publicUrl: string }[]) => void;
}

export default function UploadDialog({ benchId, open, onClose, onUploaded }: UploadDialogProps) {
  const [files, setFiles] = useState<Uploadable[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (!open) return null;

  const doUpload = async () => {
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const { uploaded, errors } = await uploadBenchImages(supabase, benchId, files);
      if (errors.length) {
        setError(errors.map((e) => e.message).join("; "));
      }
      onUploaded?.(uploaded);
      onClose();
    } catch (e: any) {
      setError(e?.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-black/40 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full relative">
        <button
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className="text-lg font-semibold mb-3">Add images</h2>
        <UploadArea onFilesChange={setFiles} />
        <button
          className="mt-4 w-full text-white bg-blue-700 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
          disabled={uploading}
          onClick={doUpload}
        >
          {uploading ? "Uploading..." : "Upload Images"}
        </button>
        {error && <div className="text-red-500 mt-2 text-sm">{error}</div>}
      </div>
    </div>
  );
}

// Local upload area component
function UploadArea({ onFilesChange }: { onFilesChange?: (files: any[]) => void }) {
  const maxSizeMB = 5;
  const maxSize = maxSizeMB * 1024 * 1024;
  const maxFiles = 6;

  const [state, actions] = useFileUpload({
    accept: "image/svg+xml,image/png,image/jpeg,image/jpg,image/gif",
    maxSize,
    multiple: true,
    maxFiles,
  });

  const { files, isDragging, errors } = state as unknown as {
    files: any[];
    isDragging: boolean;
    errors: string[];
  };
  const { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, openFileDialog, removeFile, clearFiles, getInputProps } = actions as any;

  useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  return (
    <div className="flex flex-col gap-2">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        data-dragging={isDragging || undefined}
        data-files={files.length > 0 || undefined}
        className="border-input data-[dragging=true]:bg-accent/50 has-[input:focus]:border-ring has-[input:focus]:ring-ring/50 relative flex min-h-52 flex-col items-center overflow-hidden rounded-xl border border-dashed p-4 transition-colors not-data-[files]:justify-center has-[input:focus]:ring-[3px]"
      >
        <input {...getInputProps()} className="sr-only" aria-label="Upload image file" />
        <div className="flex flex-col items-center justify-center px-4 py-3 text-center">
          <div className="bg-background mb-2 flex size-11 shrink-0 items-center justify-center rounded-full border" aria-hidden="true">
            <ImageIcon className="size-4 opacity-60" />
          </div>
          <p className="mb-1.5 text-sm font-medium">Drop your images here</p>
          <p className="text-muted-foreground text-xs">SVG, PNG, JPG or GIF (max. {maxSizeMB}MB)</p>
          <Button variant="outline" className="mt-4" onClick={openFileDialog}>
            <UploadIcon className="-ms-1 opacity-60" aria-hidden="true" />
            Select images
          </Button>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="text-destructive flex items-center gap-1 text-xs" role="alert">
          <AlertCircleIcon className="size-3 shrink-0" />
          <span>{errors[0]}</span>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file: any) => (
            <div key={file.id} className="bg-background flex items-center justify-between gap-2 rounded-lg border p-2 pe-3">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="bg-accent aspect-square shrink-0 rounded">
                  <img src={file.preview} alt={file.file.name} className="size-10 rounded-[inherit] object-cover" />
                </div>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <p className="truncate text-[13px] font-medium">{file.file.name}</p>
                  <p className="text-muted-foreground text-xs">{formatBytes(file.file.size)}</p>
                </div>
              </div>
              <Button size="icon" variant="ghost" className="text-muted-foreground/80 hover:text-foreground -me-2 size-8 hover:bg-transparent" onClick={() => removeFile(file.id)} aria-label="Remove file">
                <XIcon aria-hidden="true" />
              </Button>
            </div>
          ))}

          {files.length > 1 && (
            <div>
              <Button size="sm" variant="outline" onClick={clearFiles}>
                Remove all files
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
