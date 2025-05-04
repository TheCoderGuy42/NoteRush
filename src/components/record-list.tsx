// components/RecordList.tsx
"use client";
import React from "react";
import { api } from "@/trpc/react";
import { useRecordStore, type GameStatus } from "@/context/store";

export default function RecordList() {
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
    <section className="mx-auto max-w-md space-y-3">
      <ul className="divide-y divide-gray-200">
        {data.map(({ id, wpm, time, mistakes, accuracy }) => (
          <li
            key={id}
            className="flex justify-between py-2 text-sm text-gray-600"
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
