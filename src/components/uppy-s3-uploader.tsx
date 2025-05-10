"use client";

import Uppy from "@uppy/core";
import Dashboard from "@uppy/dashboard";
import RemoteSources from "@uppy/google-drive";
import AwsS3 from "@uppy/aws-s3";
import { headers } from "next/headers";

function UppyS3Uploader() {
  const uppy = new Uppy({
    autoProceed: false,
    debug: true,
    restrictions: {
      maxFileSize: 10 * 1024 * 1024,
    },
  })
    .use(Dashboard, {
      inline: true,
      height: 400,
    })
    .use(AwsS3, {
      // This function MUST be async and return a Promise that resolves
      // to the PresignedUrlParameters structure.
      getUploadParameters(file) {
        axios.get('/api/aws/signUrl/put', {
            params: {
                fileName: file.name,
                contentType: file.type,
                directory: 'test'
            }
        })
            .then((result) => {
                console.log(result.data)
                return {
                    url: result.data.url,
                    method: result.data.method,
                    fields: result.data.fields,
                    headers: {}
                }
            })
            .catch((err) => {
                console.log(err.response)
            })
    }
    }

}
