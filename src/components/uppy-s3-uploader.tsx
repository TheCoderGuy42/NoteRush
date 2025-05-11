// components/UppyS3Uploader.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import Uppy, { type UppyFile, type Meta, type Body } from "@uppy/core";
import AwsS3 from "@uppy/aws-s3";
import { Dashboard as UppyReactDashboard } from "@uppy/react";
import GoogleDrive from "@uppy/google-drive";
import { api } from "@/trpc/react"; // Only for getPresignedUrlAsync
import toast from "react-hot-toast";

import "@uppy/core/dist/style.min.css";
import "@uppy/dashboard/dist/style.min.css";

interface UppyS3UploaderProps {
  onS3UploadSuccess: (data: { filename: string; s3Key: string }) => void;
  onUppyDone: () => void;
}

function UppyS3Uploader({
  onS3UploadSuccess,
  onUppyDone,
}: UppyS3UploaderProps) {
  const uppyRef = useRef<Uppy | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const { mutateAsync: getPresignedUrlAsync } =
    api.s3Upload.getPresignedUrl.useMutation();

  useEffect(() => {
    console.log("UppyS3Uploader useEffect: Initializing or re-evaluating.");

    if (!uppyRef.current) {
      console.log("UppyS3Uploader: Creating new Uppy instance.");
      const uppy = new Uppy({
        autoProceed: true,
        debug: process.env.NODE_ENV === "development",
        restrictions: {
          maxFileSize: 10 * 1024 * 1024, // 10MB
          maxNumberOfFiles: 1,
          // allowedFileTypes: ['.pdf'], // Be specific if only PDFs are allowed
        },
      });

      uppy.use(AwsS3, {
        getUploadParameters: async (file: UppyFile<Meta, Body>) => {
          console.log("getUploadParameters called for:", file.name);
          if (!file.name || !file.type) {
            const errorMsg = "File name or type missing.";
            toast.error(errorMsg);
            console.error("getUploadParameters error:", errorMsg, file);
            throw new Error(errorMsg);
          }

          try {
            const result = await getPresignedUrlAsync({
              filename: file.name,
              contentType: file.type,
            });

            if (!result.signedUrl) {
              const errorMsg = "Invalid or missing pre-signed URL from server.";
              toast.error(errorMsg);
              console.error(
                "getUploadParameters error: Invalid presigned URL response",
                result,
              );
              throw new Error(errorMsg);
            }
            console.log(
              "getUploadParameters: Received signed URL data:",
              result,
            );

            if (result.key) {
              uppy.setFileMeta(file.id, { s3Key: result.key });
            } else {
              console.warn(
                "getUploadParameters: S3 key missing in presigned URL response. File processing might fail later.",
              );
              // You might want to decide if this is a fatal error for your use case
            }

            return {
              method: result.method || "PUT",
              url: result.signedUrl, // This must be a valid URL string
              headers: result.headers || { "Content-Type": file.type },
              fields: result.fields || {},
            };
          } catch (error: unknown) {
            const message =
              error instanceof Error
                ? error.message
                : "Failed to get upload URL";
            // If it's a credential error, show a more helpful message
            if (
              message.includes("credential") ||
              message.includes("Resolved credential")
            ) {
              toast.error(
                "AWS credential issue. Please try again in a moment.",
              );
              console.error("getUploadParameters caught error:", error);
              // Wait 2 seconds and try again once automatically
              await new Promise((resolve) => setTimeout(resolve, 2000));
              try {
                toast.loading("Retrying upload...");
                const retryResult = await getPresignedUrlAsync({
                  filename: file.name,
                  contentType: file.type,
                });

                if (retryResult.signedUrl) {
                  toast.success("Retry successful, continuing upload...");
                  if (retryResult.key) {
                    uppy.setFileMeta(file.id, { s3Key: retryResult.key });
                  }
                  return {
                    method: retryResult.method || "PUT",
                    url: retryResult.signedUrl,
                    headers: retryResult.headers || {
                      "Content-Type": file.type,
                    },
                    fields: retryResult.fields || {},
                  };
                }
              } catch (retryError) {
                toast.error("Retry failed. Please try again manually.");
                console.error("Retry error:", retryError);
              }
            } else {
              toast.error(`Error preparing upload: ${message}`);
            }
            console.error("getUploadParameters caught error:", error);
            throw error; // Re-throw to Uppy
          }
        },
      } as any); // Removed 'as any' - ensure your tRPC type for getPresignedUrl matches expected return

      // Add Google Drive plugin using Uppy's hosted companion
      uppy.use(GoogleDrive, {
        companionUrl: "https://companion.uppy.io",
      });

      uppy.on("upload-success", (file) => {
        if (!file?.name) return;
        const s3Key = file.meta.s3Key as string;
        console.log("Uppy event: upload-success", file.name, "Key:", s3Key);

        if (!s3Key) {
          toast.error(
            `S3 key missing for ${file.name}. Cannot proceed with server processing.`,
          );
          console.error("upload-success: S3 key missing in file.meta", file);
          return;
        }
        onS3UploadSuccess({ filename: file.name, s3Key });
        toast.success(`"${file.name}" uploaded. Starting server processing.`);
      });

      uppy.on("upload-error", (file, error, response) => {
        const fileName = file?.name ?? "file";
        const errorMessage = error?.message ?? "Unknown upload error";
        toast.error(`Upload Error for ${fileName}: ${errorMessage}`);
        console.error("Uppy event: upload-error", { file, error, response });
      });

      uppy.on("complete", (result) => {
        console.log("Uppy event: complete", result);
        if (result.failed && result.failed.length > 0) {
          toast.error(`${result.failed.length} file(s) failed to upload.`);
        }

        if (onUppyDone) {
          onUppyDone();
        }
      });

      uppyRef.current = uppy;
      setIsInitialized(true);
    }

    return () => {
      if (uppyRef.current) {
        console.log("UppyS3Uploader: Cleaning up Uppy instance.");
        uppyRef.current.clear();
        uppyRef.current = null;
        setIsInitialized(false);
      }
    };
  }, [getPresignedUrlAsync, onS3UploadSuccess, onUppyDone]);

  if (!isInitialized || !uppyRef.current) {
    console.log("UppyS3Uploader: Rendering loading state.");
    return <p>Loading Uploader...</p>;
  }

  console.log("UppyS3Uploader: Rendering UppyReactDashboard.");
  return (
    <UppyReactDashboard
      uppy={uppyRef.current}
      proudlyDisplayPoweredByUppy={false}
      plugins={["GoogleDrive"]}
    />
  );
}

export default UppyS3Uploader;
