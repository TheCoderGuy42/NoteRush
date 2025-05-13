"use client";
import { useEffect, useRef, useState } from "react";
import StatusBar from "./status-bar";
import { useRecordStore } from "@/context/store";

interface TypingAreaInt {
  target: string;
  input: string;
}

function useRenderer(
  target: string,
  input: string,
): {
  output: React.ReactNode;
  mistakes: number;
} {
  let mistakes = 0;
  const chars = target.split("");
  const outputElements: React.ReactNode[] = [];

  chars.forEach((char, index) => {
    let color = "text-gray-500";
    const spanId = index === input.length ? "cursor" : undefined;
    let cursorClass = "";

    if (index === input.length) {
      cursorClass = "border-l-2 border-blue-500 -ml-[2px]";
    }

    if (index < input.length) {
      if (char === input[index]) {
        color = "text-emerald-600 dark:text-emerald-400";
      } else {
        color = "text-red-500 bg-red-100 dark:text-red-400 dark:bg-red-900/30";
        mistakes++;
      }
    }

    const classes = `${color} ${cursorClass}`;

    outputElements.push(
      <span id={spanId} key={index} className={classes}>
        {/* this gives consistent width */}
        {char === " " ? "\u00A0" : char}
      </span>,
    );
  });

  return { output: outputElements, mistakes };
}
// ... (useRenderer remains the same)

function TypingArea(props: TypingAreaInt) {
  const { target, input } = props;
  const gameState = useRecordStore((state) => state.status);

  const textContainerRef = useRef<HTMLDivElement>(null);
  const [scrollOffset, setScrollOffset] = useState(0);
  // State to control if the CSS transition should be applied
  const [allowScrollTransition, setAllowScrollTransition] = useState(false);

  const { output: display, mistakes } = useRenderer(target, input);

  // Effect 1: Handle scroll reset and transition state based on gameState and input
  useEffect(() => {
    console.log(
      `TYPING_AREA Effect1: gameState=${gameState}, input="${input}", scrollOffset=${scrollOffset}`,
    );
    const scroller = textContainerRef.current;
    if (!scroller) return;

    if (gameState === "idle" && input === "") {
      // This is the primary "new game" or "reset" condition.
      // Target has likely changed, input is cleared, game is idle.
      console.log(
        "TYPING_AREA Effect1: New game/reset. Setting scroll to 0 instantly.",
      );
      if (scroller.style.transition !== "none") {
        scroller.style.transition = "none"; // Turn off transition
      }
      if (scrollOffset !== 0) {
        setScrollOffset(0);
      }
      setAllowScrollTransition(false); // Keep transition off for this render
    } else if (
      gameState === "running" &&
      !allowScrollTransition &&
      input !== ""
    ) {
      // Game is running, input has started, but transition was off (from a reset).
      // Time to turn transition on for smooth typing scroll.
      console.log(
        "TYPING_AREA Effect1: Typing started after reset. Enabling transition.",
      );
      // Force reflow might be good practice before re-enabling transition
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      scroller.offsetHeight;
      scroller.style.transition = "transform 0.1s linear";
      setAllowScrollTransition(true);
    } else if (gameState === "stopped") {
      // Game has just finished.
      // We want the scroll to be 0 for the *next* time TypingArea is active.
      // The "idle" && input === "" condition above will handle the actual reset
      // when App.tsx changes target/input and sets gameState to "idle".
      // If TypingArea stays mounted but hidden, and you want its *state* to be 0:
      if (scrollOffset !== 0) {
        console.log(
          "TYPING_AREA Effect1: Game stopped. Preparing scrollOffset state to 0 for next round (if not already).",
        );
        // No visual change here if hidden, but sets state for next active phase.
        // Transition state doesn't matter much here if it's hidden.
        setScrollOffset(0);
      }
      setAllowScrollTransition(false); // Next round should start with instant scroll
    }
  }, [gameState, input, scrollOffset, target]); // `target` is included because a new target also implies a reset

  // Effect 2: Calculate scroll offset during active typing
  useEffect(() => {
    // Only run if game is running, input exists, and transition is (or should be) active
    if (
      gameState !== "running" ||
      input === "" ||
      !textContainerRef.current ||
      !allowScrollTransition
    ) {
      return;
    }
    console.log("TYPING_AREA Effect2: Active typing scroll calculation.");

    const scroller = textContainerRef.current;
    const cursorEl = document.getElementById("cursor");
    if (!cursorEl) return;

    const style = getComputedStyle(scroller);
    const fontSize = parseFloat(style.fontSize);
    let lineHeight = parseFloat(style.lineHeight);
    if (isNaN(lineHeight) || style.lineHeight === "normal") {
      lineHeight = fontSize * 1.5;
    }

    const cursorTop = cursorEl.offsetTop;

    if (cursorTop <= lineHeight) {
      // On first line
      if (scrollOffset !== 0) {
        // If scrolled, smoothly return to 0
        setScrollOffset(0);
      }
      return;
    }

    const targetLineForCursor = 1; // Aim to keep cursor on the second line slot
    const desiredCursorYPositionInView = lineHeight * targetLineForCursor;
    let desiredOffset = desiredCursorYPositionInView - cursorTop;
    if (desiredOffset > 0) desiredOffset = 0; // Don't scroll content down

    if (Math.abs(desiredOffset - scrollOffset) > 0.5) {
      setScrollOffset(desiredOffset);
    }
  }, [input, scrollOffset, gameState, allowScrollTransition]); // Dependencies for active scrolling

  return (
    <>
      <div className="flex flex-col justify-center">
        <StatusBar
          targetLength={target.length}
          inputLength={input.length}
          mistakesInputed={mistakes}
        />
        <div className="mx-auto max-w-6xl rounded-lg border-gray-300 p-4 focus-within:border-blue-500">
          <div
            className="overflow-hidden text-left font-mono text-4xl leading-normal"
            style={{ height: `calc(3 * 1.5em)` }}
          >
            <div
              ref={textContainerRef}
              style={{
                transform: `translateY(${scrollOffset}px)`,
                transition: allowScrollTransition
                  ? "transform 0.1s linear"
                  : "none",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {display}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default TypingArea;
