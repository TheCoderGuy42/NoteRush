"use client";
import React, { useEffect, useState } from "react";
import { api } from "@/trpc/react";
import { useRecordStore } from "@/context/store";
import { useSession } from "@/server/auth/react-client"; // Assuming this is your custom hook
import type { ActualRecord } from "@/context/data_types";

interface RecordListProps {
  resetGame: () => void;
}

export default function RecordList({ resetGame }: RecordListProps) {
  const gameState = useRecordStore((state) => state.status);
  const session = useSession();

  // 1. Use useState for localRecords
  const [localRecords, setLocalRecords] = useState<ActualRecord[]>([]);

  // 2. useEffect to load/update localRecords from localStorage
  useEffect(() => {
    // Only try to load from localStorage if the user is not signed in
    if (!session.data) {
      try {
        const storedRecords = localStorage.getItem("typingRecords");
        console.log(
          "RecordList: Reading from localStorage. Stored:",
          storedRecords,
        );
        if (storedRecords) {
          const parsedRecords: ActualRecord[] = JSON.parse(storedRecords);
          setLocalRecords(parsedRecords); // <--- Update React state
        } else {
          setLocalRecords([]); // No records found, set to empty array
        }
      } catch (error) {
        console.error("Error loading records from local storage:", error);
        setLocalRecords([]); // On error, clear records or handle appropriately
      }
    } else {
      // If user signs in, clear local records as we'll use DB records
      setLocalRecords([]);
    }
    // Dependencies:
    // - session.data: If user logs in/out, re-evaluate.
    // - gameState: If game state changes (especially to "stopped" after a game),
    //              it means localStorage MIGHT have been updated by App.tsx,
    //              so we need to re-read it.
  }, [session.data, gameState]);

  const { data: dbRecords, isLoading: isLoadingDbRecords } =
    api.typingEntry.getAll.useQuery(undefined, {
      enabled: gameState === "stopped" && !!session.data, // Fetch DB records only if stopped and logged in
    });

  // Use database records if signed in, otherwise use local records
  // Ensure localRecords is used if session.data is null/undefined
  const recordsToDisplay = session.data ? dbRecords : localRecords;

  if (session.data && isLoadingDbRecords) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">Loading records…</p>
    );
  }

  // Check recordsToDisplay specifically
  if (!recordsToDisplay || recordsToDisplay.length === 0) {
    if (session.data && gameState !== "stopped") {
      // If logged in but game not stopped, it's fine not to show records yet
      // or show a different message. For now, we'll let it fall through or handle later.
    } else {
      return (
        <p className="py-4 text-center text-sm text-gray-500">No data yet.</p>
      );
    }
  }

  // If recordsToDisplay is still undefined or empty after checks, and we expect data,
  // this could be a fallback or an early return.
  // For now, let's assume if it gets here and recordsToDisplay is empty, calculations will yield NaN/0.
  const records = recordsToDisplay || []; // Ensure records is always an array for .forEach and .length

  let totalWpm = 0;
  let totalTime = 0;
  let totalMistakes = 0;
  let totalAccuracy = 0;

  // Only calculate if there are records to avoid division by zero
  if (records.length > 0) {
    records.forEach(({ wpm, time, mistakes, accuracy }) => {
      totalWpm += wpm;
      totalTime += time;
      totalMistakes += mistakes;
      totalAccuracy += accuracy;
    });
  }

  const numRecords = records.length;
  const avgWPM = numRecords > 0 ? totalWpm / numRecords : 0;
  const avgTime = numRecords > 0 ? totalTime / numRecords : 0;
  const avgMistakes = numRecords > 0 ? totalMistakes / numRecords : 0;
  const avgAccuracy = numRecords > 0 ? totalAccuracy / numRecords : 0;

  return (
    <div className="w-full py-4">
      {" "}
      <div className="relative mx-auto w-[23rem]">
        <section className="w-full">
          {" "}
          <div className="flex justify-center">
            <button
              onClick={resetGame}
              className={`w-full cursor-pointer border border-gray-300 text-center font-mono text-xs text-gray-300 transition-colors hover:text-gray-500 dark:border-zinc-600 dark:text-zinc-400 dark:hover:text-zinc-200`}
            >
              reset
            </button>
          </div>
          {/* Only render list if records exist */}
          {records.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-zinc-700">
              {records.map(({ id, wpm, time, mistakes, accuracy }) => (
                <li
                  key={id} // Ensure 'id' is unique. Date.now() can collide if games end too quickly. Consider crypto.randomUUID()
                  className="grid grid-cols-[6rem_5rem_4rem_5rem] gap-x-4 py-2 text-sm text-gray-600 dark:text-gray-300"
                >
                  <span>{wpm.toFixed(2)} WPM</span>
                  <span>{time.toFixed(2)} s</span>
                  <span>{mistakes} err</span>
                  <span>{accuracy.toFixed(2)} %</span>
                </li>
              ))}
            </ul>
          ) : (
            !session.data && (
              <p className="py-4 text-center text-sm text-gray-500">
                No local records yet.
              </p>
            )
            // You might want a different message if session.data is true but dbRecords is empty
          )}
        </section>

        {/* Averages section */}
        {numRecords > 0 && (
          <div className="mt-6 w-full max-w-[23rem] flex-col gap-2 rounded-lg font-mono text-sm md:absolute md:top-0 md:left-full md:mt-0 md:ml-8 md:w-64 md:max-w-none">
            <h3 className="mb-2 font-mono text-base text-gray-900 dark:text-gray-100">
              averages
            </h3>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between">
                <span>Records: {numRecords}</span>
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
        )}
      </div>
    </div>
  );
}
