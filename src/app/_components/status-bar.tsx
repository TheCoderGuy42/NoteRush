"use client";
import { useEffect, useRef, useState } from "react";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRecordStore } from "@/context/store";
import { font } from "@/context/data_types";
import { api } from "@/trpc/react";

type StatusProps = {
  targetLength: number;
  inputLength: number;
  mistakesInputed: number;
};

function StatusBar({
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

  let dispalyTimerRef = useRef<HTMLDivElement>(null);
  let displayWPMRef = useRef<HTMLDivElement>(null);
  let displayMistakesRef = useRef<HTMLDivElement>(null);
  let displayAccuracyRef = useRef<HTMLDivElement>(null);

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

  const { mutate, isPending } = api.typingEntry.add.useMutation({
    onSuccess: (data) => {
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

        if (dispalyTimerRef.current) {
          dispalyTimerRef.current.textContent = `TIME: ${formattedSeconds}`;
        }
        if (displayWPMRef.current) {
          displayWPMRef.current.textContent = `WPM: ${formattedWpm}`;
        }
        if (displayMistakesRef.current) {
          displayMistakesRef.current.textContent = `MISTAKES: ${mistakes}`;
        }
        if (displayAccuracyRef.current) {
          displayAccuracyRef.current.textContent = `ACCURACY: ${formattedAccuracy}`;
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

        // if (isPending) return;
        setTime(time);
        setWPM(wpm); // an extra frame is done so this needs to be added
        setMistakes(mistakes);
        setAccuracy(accuracy);

        if (!isPending) {
          mutate({ wpm, time, mistakes, accuracy });
        }

        rafIdRef.current = null;
        didSaveRef.current = true;
        isRunningRef.current = false;
      }
    } else if (gameState === "idle") {
      rafIdRef.current = null;
      didSaveRef.current = false;
      isRunningRef.current = false;

      if (dispalyTimerRef.current) {
        dispalyTimerRef.current.textContent = `TIME: 0.00`;
      }
      if (displayWPMRef.current) {
        displayWPMRef.current.textContent = `WPM: 0.00`;
      }
      if (displayMistakesRef.current) {
        displayMistakesRef.current.textContent = `MISTAKES: 0`;
      }
      if (displayAccuracyRef.current) {
        displayAccuracyRef.current.textContent = `ACCURACY: 100`;
      }
    }

    // ideally no return, as when you complete the game it immediately needs to swap to another screen, so it doesn't capture the last input
  }, [gameState]);

  return (
    <>
      <div ref={dispalyTimerRef} className={`text-center ${font} text-xl`}>
        TIME: 0.00
      </div>
      <div ref={displayWPMRef} className={`text-center ${font} text-xl`}>
        WPM: 0.00
      </div>
      <div ref={displayMistakesRef} className={`text-center ${font} text-xl`}>
        MISTAKES: 0
      </div>
      <div ref={displayAccuracyRef} className={`text-center ${font} text-xl`}>
        ACCURACY: 100
      </div>
    </>
  );
}

export default StatusBar;
