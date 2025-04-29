"use client";
import { useRef, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import TypingArea from "./typing-area";
import StatusBar from "./status-bar";
import { useRecordStore, type GameStatus } from "@/context/store";
import type { ActualRecord } from "@/context/data_types";

// import myRawTextContent from "./assets/snowpark.txt?raw";

// const ai = new GoogleGenAI({
//   apiKey: "AIzaSyD-ays22lTA5268eKtCFg_1cgs_dwsTnRk",
// });

async function fetchFromGemini() {
  try {
    // const response = await ai.models.generateContent({
    //   model: "gemini-2.0-flash",
    //   contents: "Write a paragraph about AI",
    // });
    // const text = response.text;
    const text = await "filler text to type";
    console.log(text);
    return text;
  } catch (err) {
    return "error loading txt ";
  }
}

function App() {
  const [input, setInput] = useState("");

  const [targetText, setTargetText] = useState("");
  const { isLoading, isError, error, data, refetch } = useQuery({
    queryKey: ["test"],
    queryFn: fetchFromGemini,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const gameState = useRecordStore((state) => state.status);
  const setGameState = useRecordStore((state) => state.setStatus);
  console.log("Old Game State " + gameState);
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
    console.log("New Game State " + newState);
  }, [targetText, input, gameState, setGameState]);

  //no point to a useMemo here
  // when the reset button is pressed transition from idle to running
  const resetGame = () => {
    refetch();
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
    if (data && data != targetText) {
      setTargetText(data);
    }
  }, [data, targetText, setTargetText]);

  // on page load focus on the input box
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // // fetch all records

  const records = useQuery({
    queryKey: ["testing"],
    queryFn: getAllRecords,
    // refetchOnMount: false,
    // refetchOnWindowFocus: false,
    // refetchOnReconnect: false,
  });

  console.log("8. Records retrieved ");
  console.log(records);

  useEffect(() => {
    if (gameState === "stopped") {
      records.refetch();
      console.log("9. Refetching the query Records: " + records.data);
    }
  }, [gameState, records.refetch]);

  // calculating word count
  const isActive = (s: GameStatus) => {
    return s === "running" || s === "idle";
  };

  return (
    <>
      <div className={`mt-5 flex justify-center text-6xl`}>
        Mindless Typing{" "}
      </div>

      <div className="my-5 flex items-center justify-center opacity-0">
        <input
          type="text"
          value={input}
          ref={inputRef}
          onChange={handleInput}
        />
      </div>
      {isLoading && (
        <p className={`mt-50 flex justify-center text-2xl`}>
          Ai is still loading, cut it some slack *_*
        </p>
      )}
      {isError && <p>there's an error a foot here it is {error.message}</p>}
      {!isLoading && !isError && (
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
