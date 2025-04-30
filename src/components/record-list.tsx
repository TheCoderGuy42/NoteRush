// components/RecordList.tsx
"use client";
import React from "react";
import type { ActualRecord } from "@/context/data_types";

interface RecordListProps {
  records: ActualRecord[];
  isLoading: boolean;
}

export default function RecordList({ records, isLoading }: RecordListProps) {
  if (isLoading) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">Loading records…</p>
    );
  }

  if (records.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-gray-500">No records yet.</p>
    );
  }

  return (
    <section className="mx-auto max-w-md space-y-3">
      <ul className="divide-y divide-gray-200">
        {records.map(({ id, wpm, time, mistakes, accuracy }) => (
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
