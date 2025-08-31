import { useRef, useState } from "react";

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

type FileUploadOptions = {
  accept?: string;
  maxSize?: number;
  multiple?: boolean;
  maxFiles?: number;
  initialFiles?: any[];
};

export function useFileUpload(options: FileUploadOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<any[]>(options.initialFiles || []);
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateFile = (file: File) => {
    if (options.accept && !file.type.match(options.accept.replace(/,/g, "|"))) {
      return "Invalid file type";
    }
    if (options.maxSize && file.size > options.maxSize) {
      return "File is too large";
    }
    return null;
  };

  const handleFiles = (selectedFiles: FileList | File[]) => {
    let newFiles: any[] = [];
    let errorList: string[] = [];
    const filesArr = Array.from(selectedFiles);

    if (options.maxFiles && files.length + filesArr.length > options.maxFiles) {
      errorList.push(`Maximum ${options.maxFiles} files allowed`);
      setErrors(errorList);
      return;
    }

    filesArr.forEach((file) => {
      const error = validateFile(file);
      if (error) {
        errorList.push(error);
      } else {
        newFiles.push({
          id: Math.random().toString(36).slice(2),
          file,
          preview: URL.createObjectURL(file),
        });
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);
    setErrors(errorList);
  };

  const handleDragEnter = () => setIsDragging(true);
  const handleDragLeave = () => setIsDragging(false);
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const openFileDialog = () => {
    inputRef.current?.click();
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

const clearFiles = () => {
    setFiles([]);
  };

  const getInputProps = () => ({
    ref: inputRef,
    type: "file",
    accept: options.accept,
    multiple: options.multiple,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) handleFiles(e.target.files);
    },
    tabIndex: -1,
  });

  return [
    { files, isDragging, errors },
    {
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      removeFile,
      clearFiles,
      getInputProps,
    },
  ] as const;
}