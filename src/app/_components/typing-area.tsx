"use client";
import { useRecordStore } from "@/context/store";
import { useEffect, useRef, useState } from "react";
import StatusBar from "./status-bar";

interface TypingAreaInt {
  target: string;
  input: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

// --- useRenderer hook remains the same ---
function useRenderer(
  target: string,
  input: string,
): {
  output: React.ReactNode;
  mistakes: number;
} {
  let mistakes = 0;
  const chars = target.split("");
  let outputElements: React.ReactNode[] = [];

  chars.forEach((char, index) => {
    let color = "text-gray-500";
    let spanId = index === input.length ? "cursor" : undefined;
    let cursorClass = "";

    if (index === input.length) {
      cursorClass = "border-l-2 border-blue-500 -ml-[2px]"; // Use border, adjust margin
    }

    if (index < input.length) {
      if (char === input[index]) {
        color = "text-emerald-600"; // Correctly typed color
      } else {
        color = "text-red-500 bg-red-100"; // Incorrectly typed color + background
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

function TypingArea(props: TypingAreaInt) {
  const { target, input, inputRef } = props;
  const containerRef = useRef<HTMLDivElement>(null); // Outer viewport
  const textContainerRef = useRef<HTMLDivElement>(null); // Inner scrollable text

  const [scrollOffset, setScrollOffset] = useState(0);

  const { output: display, mistakes } = useRenderer(target, input);

  useEffect(() => {
    if (!textContainerRef.current) return;

    const cursorEl = document.getElementById("cursor");
    if (!cursorEl) return;

    // 1. measure line height
    const style = getComputedStyle(textContainerRef.current);
    const fontSize = parseFloat(style.fontSize);
    const lineHeight = parseFloat(style.lineHeight) || fontSize * 1.5;

    // 2. figure out where the cursor is vertically
    const cursorTop = cursorEl.offsetTop;

    // 3. if cursor is still at line one then don't put an offset
    if (cursorTop <= lineHeight) {
      if (scrollOffset !== 0) {
        setScrollOffset(0);
      }
      return;
    }

    // 4. compute offset so the cursor’s line sits at the top of the second line slot
    const desiredOffset = lineHeight - cursorTop;

    if (desiredOffset !== scrollOffset) {
      setScrollOffset(desiredOffset);
    }
  }, [input, scrollOffset]);

  return (
    <>
      <div
        ref={containerRef}
        className="mx-auto my-8 max-w-3xl rounded-lg border-2 border-gray-300 p-4 focus-within:border-blue-500" // Style adjustments
        onClick={() => inputRef.current?.focus()}
      >
        {/* Fixed height viewport (3 lines high) that clips content */}
        <div
          className="overflow-hidden text-left font-mono text-2xl leading-normal" // Adjust text size/leading as needed
          style={{ height: `calc(3 * 1.5em)` }} // Explicitly 3 lines * line-height
        >
          {/* Inner container that holds all text and gets translated */}
          <div
            ref={textContainerRef}
            style={{
              // Apply the calculated vertical offset
              transform: `translateY(${scrollOffset}px)`,
              // Add a transition for smooth scrolling
              transition: "transform 0.1s linear", // Faster, linear might feel more responsive
              // Ensure wrapping works correctly
              whiteSpace: "pre-wrap", // Handles spaces and line breaks
              wordBreak: "break-word", // Breaks long words if needed
            }}
          >
            {display}
          </div>
        </div>
      </div>

      {/* Pass potentially updated mistakes count */}
      <StatusBar
        targetLength={target.length}
        inputLength={input.length}
        mistakesInputed={mistakes} // Pass the ref's current value
      />
    </>
  );
}

export default TypingArea;
