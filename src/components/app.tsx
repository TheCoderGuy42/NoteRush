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

function App() {
  const router = useRouter();

  function goToSignIn() {
    router.push("/signin");
  }
  const session = useSession();

  const [input, setInput] = useState("");

  const [targetText, setTargetText] = useState("");

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
      prompt: "prompt",
    },
    {
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // enabled: gameState === "idle", // so it only fetches on specific states
    },
  );

  //no point to a useMemo here
  // when the reset button is pressed transition from idle to running
  const resetGame = () => {
    geminiPrompt.refetch();
    setGameState("idle");
    setInput("");
    inputRef.current?.focus();
  };

  // no point in use Call back
  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    // if not stopped
    if (!(gameState == "stopped")) {
      setInput(e.target.value);
    }
  };

  // if its not loading and dat and data doesn't equal the text set and you're playing the game then don't set the target text
  useEffect(() => {
    if (
      geminiPrompt.data?.generatedText &&
      geminiPrompt.data.generatedText != targetText
    ) {
      setTargetText(geminiPrompt.data.generatedText);
    }
  }, [geminiPrompt.data?.generatedText, targetText, setTargetText]);

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
  }, [gameState, records.refetch]);

  const isActive = (s: GameStatus) => {
    return s === "running" || s === "idle";
  };

  return (
    <>
      {/* The input box */}
      <div className="flex">
        <div>
          {!session.data && (
            <>
              <button
                className="cursor-pointer rounded-xl border bg-black px-4 py-2 text-white"
                onClick={async () => {
                  await goToSignIn();
                }}
              >
                Sign In
              </button>
            </>
          )}
          {session.isPending && <p>Wait a while for auth to load</p>}
          {session.data && (
            <>
              <button
                className="cursor-pointer rounded-xl border bg-black px-4 py-2 text-white"
                onClick={async () => {
                  await signOut();
                }}
              >
                Sign out
              </button>
            </>
          )}
        </div>
        <input
          className="opacity-0"
          type="text"
          value={input}
          ref={inputRef}
          onChange={handleInput}
        />
      </div>

      {geminiPrompt.isLoading && (
        <p className={`mt-50 text-center text-2xl`}>
          Ai is still loading, cut it some slack *_*
        </p>
      )}
      {geminiPrompt.isError && (
        <p>there's an error a foot here it is {geminiPrompt.error.message}</p>
      )}
      {!geminiPrompt.isLoading && !geminiPrompt.isError && (
        <>
          <div className={isActive(gameState) ? "" : "hidden"}>
            <TypingArea target={targetText} input={input} inputRef={inputRef} />
          </div>
        </>
      )}
      {gameState === "stopped" && (
        <>
          <div className="mx-130 flex flex-col justify-center">
            <button
              onClick={resetGame}
              className={`rounded-xl border-1 text-center font-mono text-2xl`}
            >
              {" "}
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
