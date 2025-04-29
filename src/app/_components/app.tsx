"use client";
import { useRef, useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";

import TypingArea from "./typing-area";
import StatusBar from "./status-bar";
import { useRecordStore, type GameStatus } from "@/context/store";
import type { ActualRecord } from "@/context/data_types";
import { api } from "@/trpc/react";

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
    const text =
      await "The Portland spy ring was an espionage group active in the UK between 1953 and 1961. It comprised five people who obtained classified research documents from the Admiralty Underwater Weapons Establishment (AUWE) on the Isle of Portland, Dorset, and passed them to the Soviet Union.Two of the group's members, Harry Houghton and Ethel Gee, were British. They worked at the AUWE and had access to the areas where the research was stored. After they obtained the information it was passed to their handler, Konon Molody—who was acting under the name Gordon Lonsdale. He was a KGB agent acting in the UK under a Canadian passport. Lonsdale would pass the documents in microdot format to Lona and Morris Cohen, two American communists who had moved to the UK using New Zealand passports in the names Helen and Peter Kroger. The Krogers would get the information to Moscow, often by using the cover of an antiquarian book dealer. The ring was exposed in 1960 following a tip-off from the Polish spy Michael Goleniewski about a mole in the Admiralty. The information he supplied was enough to identify Houghton. Surveillance by MI5—the UK's domestic counter-intelligence service—established the connection between Houghton and Gee, and then between them and Lonsdale and finally the Krogers. All five were arrested in January 1961 and put on trial that March. Sentences for the group ranged from fifteen years (for Houghton and Gee) to twenty years (for the Krogers) to twenty-five years (for Lonsdale).Lonsdale was released in 1964 in a spy swap for the British businessman Greville Wynne. The Krogers were exchanged in October 1969 as part of a swap with Gerald Brooke, a British national held on largely falsified claims. The last to be freed were Houghton and Gee, who were given early release in May 1970.";
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
  const records = api.typingEntry.getAll.useQuery();

  useEffect(() => {
    if (gameState === "stopped") {
      records.refetch();
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
