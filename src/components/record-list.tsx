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

  if (!data) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">No data yet.</p>
    );
  }
  let totalWpm = 0;
  let totalTime = 0;
  let totalMistakes = 0;
  let totalAccuracy = 0;
  data.map(({ wpm, time, mistakes, accuracy }) => {
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
    <>
      {/* Main Record List Section */}
      <section className="mx-auto w-[23rem]">
        <div className="flex justify-center">
          <button
            onClick={resetGame}
            className={`w-[23rem] cursor-pointer border border-gray-300 text-center font-mono text-xs text-gray-300 transition-colors hover:text-gray-500`}
          >
            reset
          </button>
        </div>
        <ul className="divide-y divide-gray-200">
          {data.map(({ id, wpm, time, mistakes, accuracy, createdAt }) => (
            <li
              key={id}
              className="grid grid-cols-[6rem_5rem_4rem_5rem] gap-x-4 py-2 text-sm text-gray-600"
            >
              <span>{wpm.toFixed(2)} WPM</span>
              <span>{time.toFixed(2)} s</span>
              <span>{mistakes} err</span>
              <span>{accuracy.toFixed(2)} %</span>
            </li>
          ))}
        </ul>
      </section>
      {/* Averages Summary Card */}
      <aside className="flex w-full flex-col gap-2 rounded-lg border border-gray-200 bg-white p-5 font-mono text-sm text-gray-700 shadow-md md:w-64 dark:border-zinc-700 dark:bg-zinc-900 dark:text-gray-200">
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
      </aside>
    </>
  );
}
