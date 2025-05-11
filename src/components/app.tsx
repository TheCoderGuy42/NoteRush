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
    console.log("SELECT_PDF_HANDLER: Called with pdfId:", pdfId);
    setSelectedPdf(pdfId);
    setGameState("idle");
    setInput("");
  };

  // This useEffect is ONLY for loading the initial boilerplate text ONCE
  // or if all selection is cleared and we need to go back to boilerplate.
  useEffect(() => {
    if (!selectedPdf && !target && !pdfsQuery.isLoading) {
      // Check isLoading to avoid race with pdfsQuery
      console.log(
        "INITIAL/BOILERPLATE EFFECT: No PDF selected, target is empty. Setting boilerplate.",
      );
      const index = getRandomInt(boilerplateText.database.length);
      setTarget(boilerplateText.database[index]!);
      setInput("");
    }
  }, [selectedPdf, target, pdfsQuery.isLoading]); // Note: target is here, but condition prevents loop

  useEffect(() => {
    console.log(
      "PDF SELECTION EFFECT: Triggered. selectedPdf:",
      selectedPdf,
      "pdfsQuery.data available:",
      !!pdfsQuery.data,
    );
    if (selectedPdf && pdfsQuery.data) {
      const pdf = pdfsQuery.data.find((p) => p.id === selectedPdf);
      if (pdf?.paragraphs?.length) {
        const random_paragraph_id = getRandomInt(pdf.paragraphs.length);
        const random_paragraph = pdf.paragraphs[random_paragraph_id];
        if (random_paragraph) {
          console.log(
            "1. Setting target from NEWLY selected PDF's random paragraph.",
          );
          setTarget(random_paragraph.text);
          setInput(""); // Reset input when target changes from PDF
        } else {
          setTarget("Selected PDF has text but no random paragraph found.");
          setInput("");
        }
      } else {
        setTarget("Selected PDF has no paragraphs or was not found.");
        setInput("");
      }
    }
    // NO ELSE BRANCH HERE to set boilerplate, that's handled by the other useEffect or resetGame
  }, [selectedPdf, pdfsQuery.data]);

  useGameStateMachine(input, target);

  const resetGame = () => {
    console.log("RESET_GAME: Called. Current selectedPdf:", selectedPdf);
    setGameState("idle");
    setInput("");
    // Now, resetGame decides the target based on current selectedPdf
    if (selectedPdf && pdfsQuery.data) {
      const pdf = pdfsQuery.data.find((p) => p.id === selectedPdf);
      if (pdf?.paragraphs?.length) {
        const random_paragraph_id = getRandomInt(pdf.paragraphs.length);
        const random_paragraph = pdf.paragraphs[random_paragraph_id];
        if (random_paragraph) {
          console.log(
            "3. resetGame - Setting target from currently selected PDF.",
          );
          setTarget(random_paragraph.text);
        } else {
          setTarget("Error: PDF selected but no paragraph in resetGame.");
        }
      } else {
        setTarget("Error: PDF selected but no paragraphs array in resetGame.");
      }
    } else {
      // No PDF selected, or pdfsQuery.data not yet available
      const index = getRandomInt(boilerplateText.database.length);
      console.log("4. resetGame - Setting target from boilerplate.");
      setTarget(boilerplateText.database[index]!);
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
      // Only save record if not signed in (DB records are handled in StatusBar)
      if (!session.data) {
        // Use the Zustand action instead of direct localStorage manipulation
        useRecordStore.getState().addLocalRecord({
          wpm: useRecordStore.getState().wpm,
          time: useRecordStore.getState().time,
          mistakes: useRecordStore.getState().mistakes,
          accuracy: useRecordStore.getState().accuracy,
        });
      }
    }
  }, [gameState, session.data]);

  // Load initial records on mount
  useEffect(() => {
    if (!session.data) {
      useRecordStore.getState().loadInitialLocalRecords();
    }
  }, [session.data]);

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
