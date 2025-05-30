"use client";
import React from "react";
import { api } from "@/trpc/react";
import { useRecordStore } from "@/context/store";
import { useSession } from "@/server/auth/react-client";
import type { ActualRecord } from "@/context/data_types";

interface RecordListProps {
  resetGame: () => void;
}

export default function RecordList({ resetGame }: RecordListProps) {
  const gameState = useRecordStore((state) => state.status);
  const localRecords = useRecordStore((state) => state.localRecords);
  const session = useSession();

  const { data: dbRecords, isLoading: isLoadingDbRecords } =
    api.typingEntry.getAll.useQuery(undefined, {
      enabled: gameState === "stopped" && !!session.data,
    });

  const recordsToDisplay = session.data ? dbRecords : localRecords;

  if (session.data && isLoadingDbRecords) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">Loading records…</p>
    );
  }

  const isAddingRecord =
    gameState === "stopped" &&
    ((session.data && isLoadingDbRecords) ||
      (!session.data && (recordsToDisplay || []).length === 0));

  if (!recordsToDisplay || recordsToDisplay.length === 0) {
    if (isAddingRecord) {
      return (
        <p className="py-4 text-center text-sm text-gray-500">
          Processing record...
        </p>
      );
    }
    return (
      <p className="py-4 text-center text-sm text-gray-500">No data yet.</p>
    );
  }

  const records = recordsToDisplay;

  let totalWpm = 0;
  let totalTime = 0;
  let totalMistakes = 0;
  let totalAccuracy = 0;

  records.forEach(({ wpm, time, mistakes, accuracy }) => {
    totalWpm += wpm;
    totalTime += time;
    totalMistakes += mistakes;
    totalAccuracy += accuracy;
  });

  const numRecords = records.length;
  const avgWPM = totalWpm / numRecords;
  const avgTime = totalTime / numRecords;
  const avgMistakes = totalMistakes / numRecords;
  const avgAccuracy = totalAccuracy / numRecords;

  return (
    <div className="w-full py-4">
      <div className="relative mx-auto w-[23rem]">
        <section className="w-full">
          <button
            onClick={resetGame}
            className="w-full cursor-pointer border border-gray-300 text-center font-mono text-xs text-gray-300 transition-colors hover:text-gray-500"
          >
            reset
          </button>
          <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
            {isAddingRecord && (
              <li className="grid animate-pulse grid-cols-[6rem_5rem_4rem_5rem] gap-x-4 bg-gray-50 py-2 dark:bg-zinc-800">
                <span className="h-4 w-16 rounded bg-gray-300 dark:bg-zinc-600"></span>
                <span className="h-4 w-10 rounded bg-gray-300 dark:bg-zinc-600"></span>
                <span className="h-4 w-8 rounded bg-gray-300 dark:bg-zinc-600"></span>
                <span className="h-4 w-12 rounded bg-gray-300 dark:bg-zinc-600"></span>
              </li>
            )}
            {records.map(({ id, wpm, time, mistakes, accuracy }) => (
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

        <div className="mt-6 w-full max-w-[23rem] flex-col gap-2 rounded-lg font-mono text-sm md:absolute md:top-0 md:left-full md:mt-0 md:ml-8 md:w-64 md:max-w-none">
          <h3 className="mb-2 font-mono text-base text-gray-900 dark:text-gray-100">
            averages
          </h3>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span>{numRecords}</span>
            </div>
            <div className="flex justify-between">
              <span>{avgWPM.toFixed(2)} wpm</span>
            </div>
            <div className="flex justify-between">
              <span>{avgTime.toFixed(2)} s</span>
            </div>
            <div className="flex justify-between">
              <span>{avgMistakes.toFixed(2)} err</span>
            </div>
            <div className="flex justify-between">
              <span>{avgAccuracy.toFixed(2)} %</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
