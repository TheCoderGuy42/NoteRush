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
    // 1. Set the new PDF ID
    setSelectedPdf(pdfId);
    // 2. Reset the game state to idle, so it's ready for the new text
    setGameState("idle");
    // 3. Clear the input field immediately
    setInput("");
    // The useEffect dependent on [selectedPdf, pdfsQuery.data] will handle setting the new target.
    // DO NOT call resetGame() here.
  };

  // This useEffect is ONLY for loading the initial boilerplate text ONCE
  // when the app loads and no PDF is selected, and target is empty.
  useEffect(() => {
    if (
      !selectedPdf &&
      target === "" &&
      !pdfsQuery.isLoading &&
      pdfsQuery.status !== "pending"
    ) {
      console.log(
        "INITIAL BOILERPLATE EFFECT: No PDF selected, target is empty, query not loading. Setting boilerplate.",
      );
      const index = getRandomInt(boilerplateText.database.length);
      setTarget(boilerplateText.database[index]!);
      setInput(""); // Also clear input with boilerplate
    }
  }, [selectedPdf, target, pdfsQuery.isLoading, pdfsQuery.status]); // `target` is okay here due to strict `target === ""` condition

  // This useEffect handles setting target text WHEN selectedPdf changes AND pdfsQuery.data is available
  useEffect(() => {
    console.log(
      "PDF SELECTION EFFECT: Triggered. selectedPdf:",
      selectedPdf,
      "pdfsQuery.data available:",
      !!pdfsQuery.data,
      "pdfsQuery status:",
      pdfsQuery.status,
    );

    if (selectedPdf && pdfsQuery.data && pdfsQuery.status === "success") {
      // Ensure query is success
      const pdf = pdfsQuery.data.find((p) => p.id === selectedPdf);
      if (pdf?.paragraphs?.length) {
        const random_paragraph_id = getRandomInt(pdf.paragraphs.length);
        const random_paragraph = pdf.paragraphs[random_paragraph_id];
        if (random_paragraph) {
          // Only set target if it's different, or if we explicitly want a new random one
          // For now, let's assume we always want a new random one on PDF selection
          console.log(
            "1. PDF_SELECTION_EFFECT: Setting target from NEWLY selected PDF.",
          );
          setTarget(random_paragraph.text);
          // setInput(""); // Input is already cleared in selectPdf handler or resetGame
        } else {
          console.warn(
            "1. PDF_SELECTION_EFFECT: Selected PDF has paragraphs, but random_paragraph was undefined.",
          );
          setTarget("Selected PDF - error finding paragraph.");
        }
      } else {
        console.warn(
          "1. PDF_SELECTION_EFFECT: Selected PDF has no paragraphs or PDF not found.",
        );
        setTarget("Selected PDF has no paragraphs / not found.");
      }
    } else if (!selectedPdf && pdfsQuery.status === "success") {
      // Handle case where PDF is deselected (selectedPdf becomes null)
      // If you want to go back to boilerplate when a PDF is deselected:
      // For now, let's assume the "INITIAL BOILERPLATE EFFECT" handles this if target becomes ""
      console.log(
        "PDF_SELECTION_EFFECT: No PDF selected (or query not ready). Target will be handled by boilerplate effect or resetGame.",
      );
    }
  }, [selectedPdf, pdfsQuery.data, pdfsQuery.status]); // Dependencies: selectedPdf and the data/status of the query

  // useGameStateMachine(input, target);

  const resetGame = () => {
    console.log("RESET_GAME: Called. Current selectedPdf:", selectedPdf);
    setGameState("idle");
    setInput(""); // Clear input

    if (selectedPdf && pdfsQuery.data && pdfsQuery.status === "success") {
      const pdf = pdfsQuery.data.find((p) => p.id === selectedPdf);
      if (pdf?.paragraphs?.length) {
        const random_paragraph_id = getRandomInt(pdf.paragraphs.length);
        const random_paragraph = pdf.paragraphs[random_paragraph_id];
        if (random_paragraph) {
          console.log(
            "3. RESET_GAME: Setting target from currently selected PDF.",
          );
          setTarget(random_paragraph.text);
        } else {
          setTarget("Error: PDF selected but no paragraph in resetGame.");
        }
      } else {
        setTarget("Error: PDF selected but no paragraphs array in resetGame.");
      }
    } else {
      const index = getRandomInt(boilerplateText.database.length);
      console.log("4. RESET_GAME: Setting target from boilerplate.");
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
