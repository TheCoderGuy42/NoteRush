"use client";
import { useRef, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip"; // Import the Tooltip component

import TypingArea from "./typing-area";
import { useRecordStore, type GameStatus } from "@/context/store";
import { api } from "@/trpc/react";
import RecordList from "./record-list";
import AuthButton from "./nav-buttons/auth-button";
import useGameStateMachine from "./use-game-state-machine";
import toast, { Toaster } from "react-hot-toast";
import PickButton from "./nav-buttons/pick-button";
import { useSession, authClient } from "@/server/auth/react-client";
import UppyS3Uploader from "./uppy-s3-uploader";
import Modal from "./uppy-model";
import { SubscriptonButton } from "./nav-buttons/subscription-button";
import { ContactButton } from "./nav-buttons/contact-button";
import { boilerplateText } from "./boilerplate-text";

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const session = useSession();
  const utils = api.useUtils();

  const {
    data: isAboveLimit,
    isLoading: isLoadingLimit,
    error: limitError,
  } = api.limits.isAbovePdfLimit.useQuery(undefined, {
    enabled: !!session.data,
    refetchOnWindowFocus: true,
  });

  const { data: hasActiveSubscription } =
    api.limits.hasActiveSubscription.useQuery(undefined, {
      enabled: !!session.data,
      refetchOnWindowFocus: true,
    });

  const uploadShouldBeDisabled =
    !session.data || // No session, no uploads
    isLoadingLimit || // Still checking the limit
    isAboveLimit === true || // Explicitly above limit (true means limit is hit)
    !!limitError; // An error occurred fetching limit, safer to disable

  const uploadButtonTooltipContent =
    "Free users can upload up to 5 PDFs. Upgrade to Pro for up to 50 PDFs!";

  const [input, setInput] = useState("");
  const [target, setTarget] = useState("");
  const [boilerplate, setBoilerplate] = useState(
    getRandomInt(boilerplateText.database.length),
  );

  const [selectedPdf, setSelectedPdf] = useState<number | null>(null);
  const pdfsQuery = api.pdfProcessor.get.useQuery(undefined, {
    enabled: !!session.data,
  });

  const selectPdf = (pdfId: number) => {
    setSelectedPdf(pdfId);
    resetGame();
    if (pdfsQuery.data) {
      console.log(pdfsQuery.data.find((pdf) => pdf.id === pdfId));
    }
  };

  useEffect(() => {
    if (!pdfsQuery.data || !selectedPdf) return; // check for selectedPdf
    const pdf = pdfsQuery.data.find((pdf) => pdf.id === selectedPdf);
    if (!pdf || !pdf.paragraphs || pdf.paragraphs.length === 0) return; // check for paragraphs
    const rand_para_id = getRandomInt(pdf.paragraphs.length);
    const rand_para = pdf.paragraphs[rand_para_id];
    if (!rand_para) return;
    setTarget(rand_para.text);
  }, [pdfsQuery.data, selectedPdf]);

  const gameState = useRecordStore((state) => state.status);
  const setGameState = useRecordStore((state) => state.setStatus);
  useGameStateMachine(input, target);

  const boilerPlate = boilerplateText.database[boilerplate];

  const resetGame = () => {
    setGameState("idle");
    setInput("");
    setTarget("");
    inputRef.current?.focus();
    if (!selectedPdf) {
      setBoilerplate(() => getRandomInt(boilerplateText.database.length));
    } else {
      if (!pdfsQuery.data) return;
      const pdf = pdfsQuery.data.find((pdf) => pdf.id === selectedPdf);
      if (!pdf || !pdf.paragraphs || pdf.paragraphs.length === 0) return;
      const rand_para_id = getRandomInt(pdf.paragraphs.length);
      const rand_para = pdf.paragraphs[rand_para_id];
      if (!rand_para) return;
      setTarget(rand_para.text);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!(gameState == "stopped")) {
      setInput(e.target.value);
    }
  };

  const {
    mutate: addPdfToProcess,
    isPending: isBackendProcessing,
  } = // Renamed isPending for clarity
    api.pdfProcessor.add.useMutation({
      onMutate: (variables) => {
        toast.loading(
          `Processing PDF: ${variables.filename}... This may take a moment.`,
          {
            id: "pdf-backend-process", // Unique ID for this toast
          },
        );
        setUppyOpen(false); // Optionally close Uppy modal when backend processing starts
      },
      onSuccess: (data, variables) => {
        console.log("Successfully processed PDF:", data);
        toast.success(`"${variables.filename}" processed and added!`);
        void utils.pdfProcessor.get.invalidate();
        void utils.limits.isAbovePdfLimit.invalidate();
      },
      onError: (error, variables) => {
        console.error("Error processing PDF:", error);
        toast.error(
          `Failed to process "${variables.filename}": ${error.message}`,
        );
        void utils.limits.isAbovePdfLimit.invalidate();
      },
      onSettled: () => {
        toast.dismiss("pdf-backend-process");
      },
    });

  const [isUppyOpen, setUppyOpen] = useState(false);

  const uploadActionShouldBeDisabled =
    !session.data ||
    isLoadingLimit || // Still checking the limit
    isAboveLimit === true ||
    !!limitError; // Error fetching limit

  const uploadButtonText = isBackendProcessing ? "processing..." : "upload pdf";
  const uploadButtonIsDisabled =
    uploadActionShouldBeDisabled || isBackendProcessing;

  const handleOpenUppyModal = () => {
    if (uploadActionShouldBeDisabled) {
      toast.error("Cannot upload PDF. Check limits or login status.");
      return;
    }
    if (isBackendProcessing) {
      toast("A PDF is already being processed. Please wait.", { icon: "⏳" });
      return;
    }
    setUppyOpen(true);
  };

  useEffect(() => {
    if (!boilerPlate && !selectedPdf) {
      setTarget("Select a PDF or one will be chosen for you.");
      return;
    }
    if (!selectedPdf && boilerPlate) {
      setTarget(boilerPlate);
    }
  }, [boilerPlate, selectedPdf, setTarget]);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const focus = () => {
    inputRef.current?.focus();
  };

  const isActive = (s: GameStatus) => {
    return s === "running" || s === "idle";
  };

  return (
    <>
      <Toaster position="top-right" />

      <Modal isOpen={isUppyOpen} onClose={() => setUppyOpen(false)}>
        <UppyS3Uploader
          onS3UploadSuccess={(data: { filename: string; s3Key: string }) => {
            addPdfToProcess(data);
          }}
          onUppyDone={() => setUppyOpen(false)} // Prop to close modal when Uppy is "done"
        />
      </Modal>

      <div className="m-4 flex items-center space-x-4">
        <AuthButton />
        <ContactButton />

        {session.data && (
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

            <PickButton selectPdf={selectPdf} />

            <SubscriptonButton hasActiveSubscription={hasActiveSubscription} />
          </>
        )}

        <input
          className="absolute -left-full h-0 w-0 opacity-0"
          type="text"
          value={input}
          ref={inputRef}
          onChange={handleInput}
          aria-hidden="true"
        />
      </div>

      {target && (
        <div className={isActive(gameState) ? "" : "hidden"} onClick={focus}>
          <TypingArea target={target} input={input} />
        </div>
      )}

      {gameState === "stopped" && (
        <>
          <RecordList resetGame={resetGame} />
        </>
      )}
    </>
  );
}

export default App;
