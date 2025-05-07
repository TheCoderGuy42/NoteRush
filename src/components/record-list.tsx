// components/RecordList.tsx
"use client";
import React from "react";
import { api } from "@/trpc/react";
import { useRecordStore } from "@/context/store";

interface RecordListProps {
  resetGame: () => void;
}

export default function RecordList({ resetGame }: RecordListProps) {
  const gameState = useRecordStore((state) => state.status);

  const { data, isLoading } = api.typingEntry.getAll.useQuery(undefined, {
    enabled: gameState === "stopped",
  });

  if (isLoading) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">Loading records…</p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">No data yet.</p>
    );
  }

  let totalWpm = 0;
  let totalTime = 0;
  let totalMistakes = 0;
  let totalAccuracy = 0;

  data.forEach(({ wpm, time, mistakes, accuracy }) => {
    totalWpm += wpm;
    totalTime += time;
    totalMistakes += mistakes;
    totalAccuracy += accuracy;
  });

  const avgWPM = totalWpm / data.length;
  const avgTime = totalTime / data.length;
  const avgMistakes = totalMistakes / data.length;
  const avgAccuracy = totalAccuracy / data.length;

  return (
    // This outer div helps in structuring, but centering is handled by mx-auto on the record list container
    <div className="w-full py-4">
      {" "}
      {/* Added padding for overall spacing */}
      {/* Container for the record list, this is what gets centered */}
      {/* On md screens, 'relative' is crucial for positioning the absolute summary card */}
      <div className="relative mx-auto w-[23rem]">
        {/* Main Record List Section */}
        <section className="w-full">
          {" "}
          {/* w-full to take width of its parent w-[23rem] */}
          <div className="flex justify-center">
            <button
              onClick={resetGame}
              className={`w-full cursor-pointer border border-gray-300 text-center font-mono text-xs text-gray-300 transition-colors hover:text-gray-500 dark:border-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200`}
            >
              reset
            </button>
          </div>
          <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
            {data.map(({ id, wpm, time, mistakes, accuracy }) => (
              <li
                key={id}
                className="grid grid-cols-[6rem_5rem_4rem_5rem] gap-x-4 py-2 text-sm text-gray-600 dark:text-gray-300"
              >
                <span>{wpm.toFixed(2)} WPM</span>
                <span>{time.toFixed(2)} s</span>
                <span>{mistakes} err</span>
                <span>{accuracy.toFixed(2)} %</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6 w-full max-w-[23rem] flex-col gap-2 rounded-lg border border-gray-200 bg-white p-5 font-mono text-sm text-gray-700 shadow-md md:absolute md:top-0 md:left-full md:mt-0 md:ml-8 md:w-64 md:max-w-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200">
          <h3 className="mb-2 text-base font-semibold text-gray-900 dark:text-gray-100">
            Averages
          </h3>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>WPM:</span>
              <span>{avgWPM.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Time:</span>
              <span>{avgTime.toFixed(2)} s</span>
            </div>
            <div className="flex justify-between">
              <span>Mistakes:</span>
              <span>{avgMistakes.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Accuracy:</span>
              <span>{avgAccuracy.toFixed(2)} %</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
