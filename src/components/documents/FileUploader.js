"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function FileUploader({ subjectId, onUploadSuccess }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState(null);

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
      'application/vnd.ms-powerpoint': ['.ppt'],
      'text/plain': ['.txt'],
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    multiple: false
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("subjectId", subjectId);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Error en la subida del documento");
      }

      toast.success(`Documento procesado`);
      setFile(null);

      if (onUploadSuccess) {
        onUploadSuccess();
      }

      router.refresh(); // Actualiza la lista de documentos en el servidor
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-brand-steel/20 shadow-sm p-4">
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragActive ? "border-brand-teal bg-brand-teal/5" : "border-brand-steel/40 hover:bg-brand-blush/5"
            }`}
        >
          <input {...getInputProps()} />
          <div className={`h-10 w-10 rounded-full flex items-center justify-center mb-3 ${isDragActive ? "bg-brand-teal/20 text-brand-teal" : "bg-brand-steel/10 text-brand-steel"}`}>
            <UploadCloud className="h-5 w-5" />
          </div>
          <p className="font-medium text-brand-taupe text-sm mb-1">
            {isDragActive ? "Suelta el archivo aquí" : "Haz clic o arrastra"}
          </p>
          <p className="text-xs text-brand-steel">
            PDF, DOCX, PPT/X, TXT, Imágenes
          </p>
        </div>
      ) : (
        <div className="border border-brand-steel/30 rounded-xl p-3 bg-brand-blush/5">
          <div className="flex items-center gap-3 overflow-hidden mb-3">
            <div className="h-8 w-8 bg-white rounded flex items-center justify-center text-brand-teal shrink-0">
              <File className="h-4 w-4" />
            </div>
            <div className="truncate min-w-0">
              <p className="text-sm font-medium text-brand-taupe truncate">{file.name}</p>
              <p className="text-xs text-brand-steel">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button
              onClick={() => setFile(null)}
              disabled={isUploading}
              className="p-1.5 text-brand-steel hover:text-brand-taupe hover:bg-white rounded-md transition-colors disabled:opacity-50 shrink-0 ml-auto"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full bg-brand-teal hover:bg-[#0e4f5c] text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir archivo"}
          </button>
        </div>
      )}
    </div>
  );
}
