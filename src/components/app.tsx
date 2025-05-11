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
  console.log(
    "--- APP RENDER START --- selectedPdf:",
    selectedPdf,
    "target:",
    target.substring(0, 10),
    "gameState:",
    gameState,
    "input:",
    input,
  );

  const selectPdf = (pdfId: number) => {
    console.log("SELECT_PDF_HANDLER: Called with pdfId:", pdfId);
    // Only update selectedPdf. Let the effect handle the rest.
    setSelectedPdf(pdfId);
    // Also, reset input when a new PDF is selected.
    // And set game state to idle, assuming new text means new game.
    setInput("");
    setGameState("idle");
  };

  useEffect(() => {
    console.log(
      "MASTER TARGET EFFECT: Triggered. selectedPdf:",
      selectedPdf,
      "pdfsQuery.status:",
      pdfsQuery.status,
      "current target empty:",
      target === "",
    );

    if (selectedPdf && pdfsQuery.data && pdfsQuery.status === "success") {
      // A PDF is selected and data is ready
      console.log(
        "MASTER TARGET EFFECT: Condition for PDF met. selectedPdf ID:",
        selectedPdf,
      );
      const pdf = pdfsQuery.data.find((p) => p.id === selectedPdf);
      if (pdf?.paragraphs?.length) {
        const random_paragraph_id = getRandomInt(pdf.paragraphs.length);
        const random_paragraph = pdf.paragraphs[random_paragraph_id];
        if (random_paragraph) {
          console.log("1. MASTER TARGET EFFECT: Setting target from PDF.");
          // Check if target is already set to this specific paragraph to avoid loop if possible,
          // though random nature makes this hard. For now, just set it.
          setTarget(random_paragraph.text);
          // setInput(""); // Moved to selectPdf and resetGame
        } else {
          console.error(
            "MASTER TARGET EFFECT: PDF has paragraphs, but random_paragraph is undefined!",
          );
          setTarget("Error: Could not get random paragraph.");
        }
      } else {
        console.warn(
          "MASTER TARGET EFFECT: Selected PDF found but has no paragraphs, or PDF not found by ID.",
        );
        setTarget("Selected PDF has no paragraphs / not found by ID.");
      }
    } else if (!selectedPdf && target === "") {
      // No PDF selected, target is empty, and query is not in initial pending state
      // (to avoid setting boilerplate before pdfsQuery might load and a selectedPdf from localStorage/previous state is applied)
      console.log("2. MASTER TARGET EFFECT: Setting boilerplate.");
      const index = getRandomInt(boilerplateText.prod.length);
      setTarget(boilerplateText.prod[index]!);
      // setInput(""); // Moved to selectPdf and resetGame
    } else {
      console.log(
        "MASTER TARGET EFFECT: No action taken (e.g., PDF deselected but target not empty, or query pending).",
      );
    }
    // Dependencies:
    // - selectedPdf: When this changes, we want to load a new PDF.
    // - pdfsQuery.data, pdfsQuery.status: When PDF data/status changes, re-evaluate.
    // - `target` is INTENTIONALLY OMITTED to break the loop of this effect setting target and then re-running because target changed.
    //   The conditions inside should handle not re-setting target unnecessarily.
  }, [selectedPdf, pdfsQuery.data, pdfsQuery.status]); // CRITICAL: NO `target` HERE!

  useGameStateMachine(input, target);

  const resetGame = () => {
    console.log("!!!! RESET_GAME CALLED !!!!");
    setGameState("idle");
    setInput("");

    // resetGame always provides a new target
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
          setTarget("Error in resetGame - PDF para undefined.");
        }
      } else {
        setTarget("Error in resetGame - PDF no paras.");
      }
    } else {
      console.log("4. RESET_GAME: Setting target from boilerplate.");
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
