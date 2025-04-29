"use client";
import { useRef, useEffect, useState } from "react";

import TypingArea from "./typing-area";
import { useRecordStore, type GameStatus } from "@/context/store";
import type { ActualRecord } from "@/context/data_types";
import { api } from "@/trpc/react";

function App() {
  const [input, setInput] = useState("");

  const [targetText, setTargetText] = useState("");
  const geminiPrompt = api.geminiPrompt.generate.useQuery({
    model: "gemini-2.0-flash",
    prompt: "prompt",
  });

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
      <div className="my-5 flex items-center justify-center opacity-0">
        <input
          type="text"
          value={input}
          ref={inputRef}
          onChange={handleInput}
        />
      </div>
      {geminiPrompt.isLoading && (
        <p className={`mt-50 flex justify-center text-2xl`}>
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
              className={`flex justify-center border-1 text-center text-2xl`}
            >
              {" "}
              RESET BUTTON
            </button>
          </div>
        </>
      )}
      {records.isSuccess && !records.isPending && (
        <div>
          <p className={`flex justify-center text-center text-xl`}> Records </p>
          {records.isPending && <p> hey it's loading here </p>}
          {records.isSuccess && (
            <ul>
              {records.data.map((r: ActualRecord) => (
                <li
                  key={r.id}
                  className={`flex justify-center text-center text-xl`}
                >
                  WPM: {r.wpm} TIME: {r.time} MISTAKES: {r.mistakes} ACCURACY:
                  {r.accuracy}
                </li>
              ))}{" "}
            </ul>
          )}
        </div>
      )}
    </>
  );
}

export default App;
