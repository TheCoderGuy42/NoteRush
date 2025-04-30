"use client";
import { useRef, useEffect, useState } from "react";

import TypingArea from "./typing-area";
import { useRecordStore, type GameStatus } from "@/context/store";
import type { ActualRecord } from "@/context/data_types";
import { api } from "@/trpc/react";
import SignIn from "./sign-in";
import { signOut } from "@/server/auth/react-client";
import { useSession } from "@/server/auth/react-client";
import { useRouter } from "next/navigation";
import RecordList from "./record-list";
import PdfUpload from "./pdf-upload";

function App() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function goToSignIn() {
    router.push("/signin");
  }
  const session = useSession();

  const [input, setInput] = useState("");
  const [targetText, setTargetText] = useState("");
  const [useCustomText, setUseCustomText] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const gameState = useRecordStore((state) => state.status);
  const setGameState = useRecordStore((state) => state.setStatus);
  useEffect(() => {
    let newState = gameState;

    if (gameState === "idle" && input.length > 0 && targetText.length > 0) {
      // when a person types text then start running
      newState = "running";
    } else if (
      gameState === "running" &&
      targetText.length > 0 &&
      input.length === targetText.length
    ) {
      // when the person is finished typing transition from running to stopping
      newState = "stopped";
    }

    if (newState !== gameState) {
      setGameState(newState);
    }
  }, [targetText, input, gameState, setGameState]);

  const geminiPrompt = api.geminiPrompt.generate.useQuery(
    {
      model: "gemini-2.0-flash",
      prompt: pdfContent || "prompt",
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: !useCustomText, // Only fetch if not using PDF content directly
    },
  );

  // Process PDF using tRPC mutation
  const processPdf = api.pdfProcessor.process.useMutation({
    onSuccess: (data) => {
      setIsLoading(false);
      if (data.text) {
        handlePdfProcessed(data.text);
      } else {
        setError("Failed to extract text from PDF");
      }
    },
    onError: (error) => {
      setIsLoading(false);
      setError(error.message);
    },
  });

  //no point to a useMemo here
  // when the reset button is pressed transition from idle to running
  const resetGame = () => {
    if (useCustomText && pdfContent) {
      // If using PDF content directly, just reset the game
      setGameState("idle");
      setInput("");
      inputRef.current?.focus();
    } else {
      // Otherwise fetch new content from Gemini
      geminiPrompt.refetch();
      setGameState("idle");
      setInput("");
      inputRef.current?.focus();
    }
  };

  // no point in use Call back
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // if not stopped
    if (!(gameState == "stopped")) {
      setInput(e.target.value);
    }
  };

  // Handle PDF content
  const handlePdfProcessed = (text: string) => {
    setPdfContent(text);
    setUseCustomText(true);
    setTargetText(text);
    setGameState("idle");
    setInput("");
    inputRef.current?.focus();
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer || typeof arrayBuffer === "string") {
          setIsLoading(false);
          setError("Failed to read file");
          return;
        }

        // Convert ArrayBuffer to Base64
        const base64 = btoa(
          new Uint8Array(arrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            "",
          ),
        );

        // Process the PDF using our tRPC mutation
        processPdf.mutate({ pdfBase64: base64, filename: file.name });
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error processing PDF:", error);
      setIsLoading(false);
      setError(
        error instanceof Error ? error.message : "Unknown error processing PDF",
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Trigger file input click
  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  // if its not loading and dat and data doesn't equal the text set and you're playing the game then don't set the target text
  useEffect(() => {
    if (
      !useCustomText &&
      geminiPrompt.data?.generatedText &&
      geminiPrompt.data.generatedText != targetText
    ) {
      setTargetText(geminiPrompt.data.generatedText);
    }
  }, [
    geminiPrompt.data?.generatedText,
    targetText,
    setTargetText,
    useCustomText,
  ]);

  // on page load focus on the input box
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // // fetch all records
  const records = api.typingEntry.getAll.useQuery();

  useEffect(() => {
    if (gameState === "stopped") {
      records.refetch();
    }
  }, [gameState, records]);

  const isActive = (s: GameStatus) => {
    return s === "running" || s === "idle";
  };

  const toggleTextSource = () => {
    setUseCustomText(!useCustomText);
    setPdfContent(null);
    if (!useCustomText) {
      setTargetText(""); // Clear target text when switching to PDF
    } else {
      geminiPrompt.refetch(); // Refetch gemini when switching back
    }
  };

  // Common button style
  const buttonStyle =
    "text-xs text-gray-300 transition-colors hover:text-gray-500 cursor-pointer mx-2";

  return (
    <>
      {/* The input box */}
      <div className="m-4 flex">
        <div className="text-s mr-5 font-mono text-gray-300 transition-colors hover:text-gray-500">
          {!session.data && (
            <>
              <button
                className="text-s font-mono text-gray-300 transition-colors hover:text-gray-500"
                onClick={async () => {
                  await goToSignIn();
                }}
              >
                sign in
              </button>
            </>
          )}
          {session.isPending && (
            <p className="text-xs text-gray-400">
              Wait a while for auth to load
            </p>
          )}
          {session.data && (
            <>
              <button
                className="text-s font-mono text-gray-300 transition-colors hover:text-gray-500"
                onClick={async () => {
                  await signOut();
                }}
              >
                sign out
              </button>
            </>
          )}
        </div>
        <div className="">
          <button
            className={
              "text-s font-mono text-gray-300 transition-colors hover:text-gray-500"
            }
            onClick={triggerFileUpload}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "upload pdf"}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <input
          className="opacity-0"
          type="text"
          value={input}
          ref={inputRef}
          onChange={handleInput}
        />
      </div>

      {error && (
        <div className="mb-2 text-center text-sm text-red-500">{error}</div>
      )}

      {useCustomText ? (
        <div className="mb-6">
          <PdfUpload onPdfProcessed={handlePdfProcessed} />
        </div>
      ) : (
        <>
          {geminiPrompt.isLoading && (
            <p className={`mt-50 text-center text-2xl`}>
              AI is still loading, cut it some slack *_*
            </p>
          )}
          {geminiPrompt.isError && (
            <p>
              there's an error a foot here it is {geminiPrompt.error.message}
            </p>
          )}
        </>
      )}

      {targetText && isActive(gameState) && (
        <div>
          <TypingArea target={targetText} input={input} inputRef={inputRef} />
        </div>
      )}

      {gameState === "stopped" && (
        <>
          <div className="mx-130 flex flex-col justify-center">
            <button
              onClick={resetGame}
              className={`${buttonStyle} border-1 text-center font-mono text-2xl`}
            >
              reset
            </button>
          </div>
          <RecordList
            records={records.data ?? []}
            isLoading={records.isPending}
          />
        </>
      )}
    </>
  );
}

export default App;
