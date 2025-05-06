"use client";
import { useEffect, useRef } from "react";

import { useRecordStore } from "@/context/store";
import { api } from "@/trpc/react";

type StatusProps = {
  targetLength: number;
  inputLength: number;
  mistakesInputed: number;
};

export default function StatusBar({
  targetLength,
  inputLength,
  mistakesInputed,
}: StatusProps) {
  const gameState = useRecordStore((state) => state.status);

  const setTime = useRecordStore((state) => state.setTime);
  const setMistakes = useRecordStore((state) => state.setMistakes);
  const setWPM = useRecordStore((state) => state.setWPM);
  const setAccuracy = useRecordStore((state) => state.setAccuracy);

  const startTimeRef = useRef<number | null>(null);
  const elaspedTimeRef = useRef<number | null>(null);
  const currentInputLengthRef = useRef<number | null>(null);
  const currentTargetLengthRef = useRef<number>(0);
  const currentMistakesRef = useRef<number>(0);

  const rafIdRef = useRef<number | null>(null);
  const isRunningRef = useRef<boolean>(false);

  const didSaveRef = useRef<boolean>(false);

  // stat refs
  const wpmRef = useRef<HTMLSpanElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const accuracyRef = useRef<HTMLSpanElement>(null);
  const mistakesRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    currentInputLengthRef.current = inputLength;
  }, [inputLength]);

  useEffect(() => {
    currentTargetLengthRef.current = targetLength;
  }, [targetLength]);

  useEffect(() => {
    if (gameState === "running") {
      currentMistakesRef.current = mistakesInputed; // animate creates a closue so .current is needed
    }
  }, [mistakesInputed, gameState]);

  const utils = api.useUtils();

  const { mutate } = api.typingEntry.add.useMutation({
    onSuccess: () => {
      utils.typingEntry.getAll.invalidate();
    },
  });

  useEffect(() => {
    if (gameState === "running" && !isRunningRef.current) {
      isRunningRef.current = true;
      startTimeRef.current = Date.now();
      elaspedTimeRef.current = 0;

      const animate = () => {
        elaspedTimeRef.current = Date.now() - startTimeRef.current!;
        const seconds = elaspedTimeRef.current / 1000;
        const words = (currentInputLengthRef.current ?? 0) / 5;
        const wpm = words / (seconds / 60);
        const mistakes = currentMistakesRef.current;

        const accuracy = currentInputLengthRef.current
          ? 100 - (mistakes / currentInputLengthRef.current) * 100
          : 100;

        const formattedSeconds = seconds.toFixed(2);
        const formattedWpm = wpm.toFixed(2);
        const formattedAccuracy = accuracy.toFixed(2);

        if (wpmRef.current) {
          wpmRef.current.textContent = formattedWpm.toString();
        }
        if (timeRef.current) {
          timeRef.current.textContent = formattedSeconds.toString();
        }
        if (accuracyRef.current) {
          accuracyRef.current.textContent = formattedAccuracy.toString();
        }
        if (mistakesRef.current) {
          mistakesRef.current.textContent = mistakes.toString();
        }

        rafIdRef.current = requestAnimationFrame(animate);
      };

      rafIdRef.current = requestAnimationFrame(animate);
    } else if (gameState === "stopped") {
      if (rafIdRef.current && !didSaveRef.current) {
        cancelAnimationFrame(rafIdRef.current);

        const secondsFinal = elaspedTimeRef.current! / 1000;
        const words = (currentInputLengthRef.current ?? 0) / 5;
        const wpmFinal = words / (secondsFinal / 60);

        const time = parseFloat(secondsFinal.toFixed(2));
        const wpm = parseFloat(wpmFinal.toFixed(2));
        const mistakes = currentMistakesRef.current;

        const accVal = currentInputLengthRef.current
          ? 100 - (mistakes / currentInputLengthRef.current) * 100
          : 100;

        const accuracy = parseFloat(accVal.toFixed(2));

        setTime(time);
        setWPM(wpm); // an extra frame is done so this needs to be added
        setMistakes(mistakes);
        setAccuracy(accuracy);

        mutate({
          wpm,
          time,
          mistakes,
          accuracy,
        });

        rafIdRef.current = null;
        didSaveRef.current = true;
        isRunningRef.current = false;
      }
    } else if (gameState === "idle") {
      rafIdRef.current = null;
      didSaveRef.current = false;
      isRunningRef.current = false;

      // Reset stats display to zero
      if (wpmRef.current) {
        wpmRef.current.textContent = "0.00";
      }
      if (timeRef.current) {
        timeRef.current.textContent = "0.00";
      }
      if (accuracyRef.current) {
        accuracyRef.current.textContent = "100";
      }
      if (mistakesRef.current) {
        mistakesRef.current.textContent = "0";
      }
    }

    // ideally no return, as when you complete the game it immediately needs to swap to another screen, so it doesn't capture the last input
  }, [gameState, mutate, setTime, setAccuracy, setMistakes, setWPM]);

  return (
    <div className="mx-auto grid max-w-md grid-cols-4 gap-2 text-center text-xs text-gray-500">
      <div>
        <span ref={wpmRef}>0.00</span>
        <span className="ml-1 text-gray-400">wpm</span>
      </div>
      <div>
        <span ref={timeRef}>0.00</span>
        <span className="ml-1 text-gray-400">s</span>
      </div>
      <div>
        <span ref={accuracyRef}>100</span>
        <span className="ml-1 text-gray-400">%</span>
      </div>
      <div>
        <span ref={mistakesRef}>0</span>
        <span className="ml-1 text-gray-400">errors</span>
      </div>
    </div>
  );
}
