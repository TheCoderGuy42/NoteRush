"use client";
import { useRef, useEffect, useState } from "react";
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
import { UploadButton } from "./nav-buttons/upload-button";

function getRandomInt(max: number) {
  return Math.floor(Math.random() * max);
}

function App() {
  const session = useSession();
  const utils = api.useUtils();
  const gameState = useRecordStore((state) => state.status);
  const setGameState = useRecordStore((state) => state.setStatus);

  const {
    data: isAboveLimit,
    isLoading: isLoadingLimit,
    error: limitError,
  } = api.limits.isAbovePdfLimit.useQuery(undefined, {
    enabled: !!session.data,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });

  const uploadShouldBeDisabled =
    !session.data || // No session, no uploads
    isLoadingLimit || // Still checking the limit
    isAboveLimit === true || // Explicitly above limit (true means limit is hit)
    !!limitError; // An error occurred fetching limit, safer to disable

  const [input, setInput] = useState("");
  const [target, setTarget] = useState("");

  const [selectedPdf, setSelectedPdf] = useState<number | null>(null);
  const pdfsQuery = api.pdfProcessor.get.useQuery(undefined, {
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    enabled: !!session.data,
  });

  const selectPdf = (pdfId: number) => {
    setSelectedPdf(pdfId);
    setInput("");
    setGameState("idle");
  };

  useEffect(() => {
    if (selectedPdf && pdfsQuery.data && pdfsQuery.status === "success") {
      const pdf = pdfsQuery.data.find((p) => p.id === selectedPdf);
      if (pdf?.paragraphs?.length) {
        const random_paragraph_id = getRandomInt(pdf.paragraphs.length);
        const random_paragraph = pdf.paragraphs[random_paragraph_id];
        if (random_paragraph) {
          setTarget(random_paragraph.text);
        } else {
          setTarget("Error: Could not get random paragraph.");
        }
      } else {
        setTarget("Selected PDF has no paragraphs / not found by ID.");
      }
    } else if (!selectedPdf && target === "") {
      const index = getRandomInt(boilerplateText.prod.length);
      setTarget(boilerplateText.prod[index]!);
    }
    // Dependencies:
    // - selectedPdf: When this changes, we want to load a new PDF.
    // - pdfsQuery.data, pdfsQuery.status: When PDF data/status changes, re-evaluate.
    // - `target` is INTENTIONALLY OMITTED to break the loop of this effect setting target and then re-running because target changed.
    //   The conditions inside should handle not re-setting target unnecessarily.
  }, [selectedPdf, pdfsQuery.data, pdfsQuery.status]);

  useGameStateMachine(input, target);

  const resetGame = () => {
    setGameState("idle");
    setInput("");

    if (selectedPdf && pdfsQuery.data && pdfsQuery.status === "success") {
      const pdf = pdfsQuery.data.find((p) => p.id === selectedPdf);
      if (pdf?.paragraphs?.length) {
        const random_paragraph_id = getRandomInt(pdf.paragraphs.length);
        const random_paragraph = pdf.paragraphs[random_paragraph_id];
        if (random_paragraph) {
          setTarget(random_paragraph.text);
        } else {
          setTarget("Error in resetGame - PDF para undefined.");
        }
      } else {
        setTarget("Error in resetGame - PDF no paras.");
      }
    } else {
      const index = getRandomInt(boilerplateText.prod.length);
      setTarget(boilerplateText.prod[index]!);
    }
    inputRef.current?.focus();
  };
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!(gameState == "stopped")) {
      setInput(e.target.value);
    }
  };

  const { mutate: addPdfToProcess, isPending: isBackendProcessing } =
    api.pdfProcessor.add.useMutation({
      onMutate: (variables) => {
        toast.loading(
          `Processing PDF: ${variables.filename}... This may take a moment.`,
          {
            id: "pdf-backend-process", // unique ID for this toast
          },
        );
        setUppyOpen(false);
      },
      onSuccess: (data, variables) => {
        toast.success(`"${variables.filename}" processed and added!`);
        void utils.pdfProcessor.get.invalidate();
        void utils.limits.isAbovePdfLimit.invalidate();
      },
      onError: (error, variables) => {
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

  const uploadButtonText = isBackendProcessing ? "processing..." : "upload pdf";

  const uploadButtonIsDisabled = uploadShouldBeDisabled || isBackendProcessing;

  const handleOpenUppyModal = () => {
    if (uploadShouldBeDisabled) {
      toast.error("Cannot upload PDF. Check limits or login status.");
      return;
    }
    if (isBackendProcessing) {
      toast("A PDF is already being processed. Please wait.", { icon: "⏳" });
      return;
    }
    setUppyOpen(true);
  };

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

  useEffect(() => {
    if (gameState === "stopped") {
      if (!session.data) {
        useRecordStore.getState().addLocalRecord({
          wpm: useRecordStore.getState().wpm,
          time: useRecordStore.getState().time,
          mistakes: useRecordStore.getState().mistakes,
          accuracy: useRecordStore.getState().accuracy,
        });
      }
    }
  }, [gameState, session.data]);

  useEffect(() => {
    if (!session.data) {
      useRecordStore.getState().loadInitialLocalRecords();
    }
  }, [session.data]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter" && gameState === "stopped") {
        console.log("Enter pressed while game was stopped. Resetting game.");
        event.preventDefault();
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [gameState, resetGame]);

  return (
    <>
      <Toaster position="top-right" />

      <Modal isOpen={isUppyOpen} onClose={() => setUppyOpen(false)}>
        <UppyS3Uploader
          onS3UploadSuccess={(data: { filename: string; s3Key: string }) => {
            addPdfToProcess(data);
          }}
          onUppyDone={() => setUppyOpen(false)}
        />
      </Modal>

      <div className="m-4 flex items-center space-x-4">
        <AuthButton />
        <ContactButton />

        {session.data && (
          <>
            <UploadButton
              uploadShouldBeDisabled={uploadShouldBeDisabled}
              handleOpenUppyModal={handleOpenUppyModal}
              uploadButtonText={uploadButtonText}
              uploadButtonIsDisabled={uploadButtonIsDisabled}
            />

            <PickButton selectPdf={selectPdf} />

            <SubscriptonButton />
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
