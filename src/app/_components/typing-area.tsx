"use client";
import { useRecordStore } from "@/context/store";
import { useEffect, useRef } from "react";
import StatusBar from "./status-bar";

interface TypingAreaInt {
  target: string;
  input: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

function useRenderer(
  target: string,
  input: string,
): {
  output: React.ReactNode;
  mistakes: number;
} {
  let mistakes = 0;
  let outputElements = target.split("").map((value: string, index: number) => {
    let color = "bg-gray-300";

    if (index === input.length) {
      color = "bg-blue-500";
    }

    if (index < input.length) {
      color = value === input[index] ? "bg-emerald-400" : "bg-red-400";
      if (value !== input[index]) {
        mistakes++;
      }
    }

    return (
      <span key={index} className={`${color} my-30`}>
        {value}
      </span>
    );
  });

  return { output: outputElements, mistakes };
}

function TypingArea(props: TypingAreaInt) {
  const { target, input, inputRef } = props;
  const mistakesRef = useRef<number>(0);

  const { output: display, mistakes } = useRenderer(target, input);

  const gameState = useRecordStore((state) => state.status);
  if (gameState === "running") {
    mistakesRef.current = mistakes;
  }

  return (
    <>
      <div
        className="mx-50 rounded-lg border-3 p-8"
        onClick={() => inputRef.current?.focus()}
      >
        <p className={`text-center font-mono text-3xl`}>{display}</p>
      </div>

      <StatusBar
        targetLength={target.length}
        inputLength={input.length}
        mistakesInputed={mistakesRef.current}
      />
    </>
  );
}

export default TypingArea;
