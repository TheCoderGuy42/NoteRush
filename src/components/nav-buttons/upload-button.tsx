import { Tooltip } from "react-tooltip";

interface UploadButtonProps {
  uploadShouldBeDisabled: boolean;
  handleOpenUppyModal: () => void;
  uploadButtonText: string;
  uploadButtonIsDisabled: boolean;
}

export function UploadButton({
  uploadShouldBeDisabled,
  handleOpenUppyModal,
  uploadButtonText,
  uploadButtonIsDisabled,
}: UploadButtonProps) {
  const uploadButtonTooltipContent =
    "Free users can upload up to 5 PDFs. Upgrade to Pro for up to 50 PDFs!";

  return (
    <>
      {uploadShouldBeDisabled ? (
        <>
          <button
            data-tooltip-id="upload-limit-tooltip"
            data-tooltip-content={uploadButtonTooltipContent}
            className={
              "text-s cursor-not-allowed cursor-pointer font-mono text-gray-500 transition-colors"
            }
            aria-disabled="true"
            onClick={handleOpenUppyModal}
          >
            upload pdf
          </button>
          <Tooltip
            id="upload-limit-tooltip"
            place="bottom"
            style={{
              backgroundColor: "rgb(55 65 81)",
              color: "white",
              maxWidth: "250px",
              fontSize: "0.875rem", // text-sm
              padding: "0.5rem", // p-2
              borderRadius: "0.375rem", // rounded-md
              textAlign: "center",
              zIndex: 50, // Ensure tooltip is on top
            }}
          />
        </>
      ) : (
        <button
          className={`text-s cursor-pointer font-mono text-gray-300 transition-colors hover:text-gray-500 ${
            uploadButtonIsDisabled ? "cursor-wait opacity-70" : ""
          }`}
          disabled={uploadButtonIsDisabled}
          onClick={handleOpenUppyModal}
        >
          {uploadButtonText}
        </button>
      )}
    </>
  );
}
