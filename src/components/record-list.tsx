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

  return (
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
  );
}
