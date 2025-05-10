// components/UppyS3Uploader.tsx
"use client";

import React, { useEffect, useRef } from "react";
import Uppy, { type UppyFile, type Meta, type Body } from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import { Dashboard as UppyReactDashboard } from "@uppy/react";
import { api } from "@/trpc/react"; // Only for getPresignedUrlAsync
import toast from "react-hot-toast";

// Import Uppy's CSS
import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

interface UppyS3UploaderProps {
  // Callback when a file is successfully uploaded to S3
  onS3UploadSuccess: (data: { filename: string; s3Key: string }) => void;
  // Callback for when Uppy's 'complete' event fires (all files processed by Uppy)
  onUppyDone: () => void;
}

function UppyS3Uploader({
  onS3UploadSuccess,
  onUppyDone,
}: UppyS3UploaderProps) {
  const uppyRef = useRef<Uppy | null>(null);

  // Only this mutation is needed here now
  const { mutateAsync: getPresignedUrlAsync } =
    api.s3Upload.getPresignedUrl.useMutation();

  useEffect(() => {
    let uppyInstanceToCleanUp: Uppy | null = null;

    if (!uppyRef.current) {
      const uppy = new Uppy({
        autoProceed: true, // Consider autoProceed true if modal is just for Uppy
        debug: process.env.NODE_ENV === "development",
        restrictions: {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxNumberOfFiles: 1, // If you only want one PDF at a time for processing
        },
      });

      uppy.use(AwsS3, {
        getUploadParameters: async (file: UppyFile<Meta, Body>) => {
          if (!file.name || !file.type) {
            toast.error("File name or type missing.");
            throw new Error("File name or type missing.");
          }

          try {
            const result = await getPresignedUrlAsync({
              filename: file.name,
              contentType: file.type,
            });

            if (result?.signedUrl) {
              throw new Error("Invalid pre-signed URL response.");
            }

            if (result.key) {
              uppy.setFileMeta(file.id, { s3Key: result.key });
            }
            return {
              method: result.method || "PUT",
              url: result.signedUrl,
              headers: result.headers || { "Content-Type": file.type },
              fields: result.fields || {},
            };
          } catch (error: unknown) {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to get upload URL";
            toast.error(message);
            console.error("getUploadParameters error:", error);
            throw error;
          }
        },
      } as any);

      uppy.on("upload-success", (file, response) => {
        if (!file || !file.name) return;
        const s3Key = file.meta.s3Key as string;

        if (!s3Key) {
          toast.error(
            `S3 key missing for ${file.name}. Cannot proceed with processing.`,
          );
          console.error("S3 key missing in file.meta for upload-success", file);
          return;
        }
        // Call the prop to trigger backend processing in App.tsx
        onS3UploadSuccess({ filename: file.name, s3Key });
        toast.success(`"${file.name}" uploaded to S3. Processing will start.`);
      });

      uppy.on("upload-error", (file, error, response) => {
        toast.error(
          `S3 Upload Error for ${file?.name ?? "file"}: ${error.message}`,
        );
        console.error("Uppy S3 Upload Error:", { file, error, response });
      });

      uppy.on("complete", (result) => {
        console.log("Uppy batch complete:", result);
        // Call onUppyDone to allow parent to close modal or perform other actions
        if (onUppyDone) {
          onUppyDone();
        }
      });

      uppyRef.current = uppy;
      uppyInstanceToCleanUp = uppy;
    }

    return () => {
      if (uppyInstanceToCleanUp) {
        uppyInstanceToCleanUp.clear();
      }
    };
  }, [getPresignedUrlAsync, onS3UploadSuccess, onUppyDone]);

  if (!uppyRef.current) {
    return <p>Loading Uploader...</p>;
  }

  return (
    // Toaster should ideally be at a higher level in App.tsx or _app.tsx
    <UppyReactDashboard
      uppy={uppyRef.current}
      proudlyDisplayPoweredByUppy={false} // Your choice
      // You might want to hide the "Done" button if onUppyDone handles modal closing
      // or configure what happens when Uppy's internal "Done" is clicked.
    />
  );
}

export default UppyS3Uploader;
