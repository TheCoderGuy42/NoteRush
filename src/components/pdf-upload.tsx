"use client";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { api } from "@/trpc/react";
import type { TRPCClientErrorLike } from "@trpc/client";

interface PdfUploadProps {
  onPdfProcessed: (text: string) => void;
}

// Define the expected output type
interface PdfProcessOutput {
  success: boolean;
  message: string;
  text: string | null;
  filename?: string;
}

export default function PdfUpload({ onPdfProcessed }: PdfUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processPdf = api.pdfProcessor.process.useMutation({
    onSuccess: (data) => {
      setIsUploading(false);
      if (data.text) {
        onPdfProcessed(data.text);
      } else {
        setError("Failed to extract text from PDF");
      }
    },
    onError: (error) => {
      setIsUploading(false);
      setError(error.message);
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setIsUploading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer || typeof arrayBuffer === "string") {
          setIsUploading(false);
          setError("Failed to read file");
          return;
        }

        // Convert ArrayBuffer to Base64
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        );

        processPdf.mutate({ pdfBase64: base64, filename: file.name });
      };

      reader.readAsArrayBuffer(file);
    },
    [processPdf],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
  });

  return <></>;
}
