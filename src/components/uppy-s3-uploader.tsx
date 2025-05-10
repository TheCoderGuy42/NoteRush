"use client";

import { useRef, useEffect } from "react";
import Uppy, { type UppyFile, type Meta, type Body } from "@uppy/core";
import DashboardPlugin from "@uppy/dashboard";
import AwsS3 from "@uppy/aws-s3";
import { api } from "@/trpc/react";
import toast, { Toaster } from "react-hot-toast";
import { Dashboard as UppyReactDashboard } from "@uppy/react"; // Import the React component

function UppyS3Uploader() {
  const uppyRef = useRef<Uppy | null>(null);

  const { mutateAsync: getPresignedUrlAsync } =
    api.s3Upload.getPresignedUrl.useMutation();

  const { mutate: addAndProcessFile } = api.pdfProcessor.add.useMutation();

  useEffect(() => {
    if (!uppyRef.current) {
      const uppy = new Uppy({
        autoProceed: false,
        debug: true,
        restrictions: {
          maxFileSize: 10 * 1024 * 1024,
        },
      });
      uppyRef.current = uppy;
    }

    uppyRef.current.use(AwsS3, {
      getUploadParameters: async (file: UppyFile<Meta, Body>) => {
        if (!file.name || !file.type) {
          return;
        }

        const result = await getPresignedUrlAsync({
          filename: file.name,
          contentType: file.type,
        });

        if (result.key) {
          uppyRef.current?.setFileMeta(file.id, { s3Key: result.key });
        }

        return {
          method: result.method,
          url: result.signedUrl,
          headers: result.headers,
          fields: result.fields,
        };
      },
    } as any);

    uppyRef.current.on("upload-success", (file, response) => {
      if (!file || !file.name) return;

      const s3Key = file.meta.s3Key as string;

      if (!s3Key) {
        toast.error(`Could not upload as the s3Key was missing`);
        return;
      }

      addAndProcessFile({
        filename: file?.name,
        s3Key: s3Key,
      });
    });
  }, [getPresignedUrlAsync, addAndProcessFile]);

  if (!uppyRef.current) {
    toast.error("uppy instance not created");
    return;
  }

  return (
    <>
      <Toaster />
      <UppyReactDashboard uppy={uppyRef.current} />;
    </>
  );

  // const uppyRef = useRef<Uppy | null>(null);
  // const { mutateAsync: getPresignedUrl } =
  //   api.s3Upload.getPresignedUrl.useMutation();

  // useEffect(() => {
  //   if (!uppyRef.current) {
  //     uppyRef.current = new Uppy({
  //       autoProceed: false,
  //       debug: true,
  //       restrictions: {
  //         maxFileSize: 10 * 1024 * 1024, // 10MB
  //       },
  //     });

  //     uppyRef.current.use(AwsS3, {
  //       getUploadParameters: async (file: UppyFile<Meta, Body>) => {
  //         if (!file.name || !file.type) {
  //           toast.error("uppy aint workin");
  //           return;
  //         }

  //         const { signedUrl } = await getPresignedUrl({
  //           filename: file.name,
  //           contentType: file.type,
  //         });

  //         return {
  //           method: "PUT",
  //           url: signedUrl,
  //         };
  //       },
  //     } as any);
  //   }

  //   return () => {
  //     if (uppyRef.current) {
  //       uppyRef.current.cancelAll();
  //     }
  //   };
  // }, [getPresignedUrl]);

  // if (!uppyRef.current) {
  //   return <p>Loading Uploader...</p>; // Or some loading state
  // }

  // return (
  //   <div>
  //     <UppyReactDashboard uppy={uppyRef.current} height={400} />
  //     <Toaster />
  //   </div>
  // );
}

export default UppyS3Uploader;
