"use client";
import { useRef, useEffect, useState } from "react";

import TypingArea from "./typing-area";
import { useRecordStore, type GameStatus } from "@/context/store";
import type { ActualRecord } from "@/context/data_types";
import { api } from "@/trpc/react";
import RecordList from "./record-list";
import AuthStatus from "./auth-status";
import useGameStateMachine from "./use-game-state-machine";

function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [target, setTarget] = useState("");
  const [useCustomText, setUseCustomText] = useState(false);
  const [pdfContent, setPdfContent] = useState<string | null>(null);

  // gameState would need input and target, I like it being in app as you can clearly see the gameState
  const gameState = useRecordStore((state) => state.status);
  const setGameState = useRecordStore((state) => state.setStatus);
  useGameStateMachine(input, target);
  console.log("gamestate" + gameState);

  const geminiPrompt = api.geminiPrompt.generate.useQuery(
    {
      model: "gemini-2.0-flash",
      prompt: pdfContent || "prompt",
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      enabled: !useCustomText, // only fetch if not using PDF content directly
    },
  );

  // Process PDF using tRPC mutation
  const processPdf = api.pdfProcessor.process.useMutation({
    onSuccess: (data) => {
      if (data.text) {
        handlePdfProcessed(data.text);
      }
    },
  });

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

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!(gameState == "stopped")) {
      setInput(e.target.value);
    }
  };

  // Handle PDF content
  const handlePdfProcessed = (text: string) => {
    setPdfContent(text);
    setUseCustomText(true);
    setTarget(text);
    setGameState("idle");
    setInput("");
    inputRef.current?.focus();
  };

  // Handle file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result;
        if (!arrayBuffer || typeof arrayBuffer === "string") {
          console.log("Failed to read file");
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
      geminiPrompt.data.generatedText != target
    ) {
      setTarget(geminiPrompt.data.generatedText);
    }
  }, [geminiPrompt.data?.generatedText, target, setTarget, useCustomText]);

  // on page load focus on the input box
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // // fetch all records
  const records = api.typingEntry.getAll.useQuery(undefined, {
    enabled: gameState === "stopped",
  });

  const isActive = (s: GameStatus) => {
    return s === "running" || s === "idle";
  };

  // Common button style
  return (
    <>
      {/* The input box */}
      <div className="m-4 flex">
        <AuthStatus />
        <div className="">
          <button
            className={
              "text-s font-mono text-gray-300 transition-colors hover:text-gray-500"
            }
            onClick={triggerFileUpload}
          >
            upload pdf
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

      {
        <>
          {geminiPrompt.isLoading && (
            <p
              className={`mt-50 text-center font-mono text-3xl text-gray-300 transition-colors`}
            >
              AI is still loading, cut it some slack *_*
            </p>
          )}
          {geminiPrompt.isError && (
            <p>
              there's an error a foot here it is {geminiPrompt.error.message}
            </p>
          )}
        </>
      }

      {target && (
        <div className={isActive(gameState) ? "" : "hidden"}>
          <TypingArea target={target} input={input} inputRef={inputRef} />
        </div>
      )}

      {gameState === "stopped" && (
        <>
          <div className="mx-130 flex flex-col justify-center">
            <button
              onClick={resetGame}
              className={`mx-2 cursor-pointer border-1 text-center font-mono text-2xl text-xs text-gray-300 transition-colors hover:text-gray-500`}
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
