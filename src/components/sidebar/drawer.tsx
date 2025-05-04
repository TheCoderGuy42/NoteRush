"use client";

import { api } from "@/trpc/react";
import { Drawer } from "vaul";
import { X } from "lucide-react"; // Example using lucide-react for a close icon
import { useState } from "react";
import clsx from "clsx";

interface PdfDrawerProps {
  selectPdf: (pdfId: number) => void;
}

export default function PdfDrawer({ selectPdf }: PdfDrawerProps) {
  const pdfsQuery = api.pdfProcessor.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const [isSelected, setSelected] = useState(-1);

  return (
    <Drawer.Root direction="right" autoFocus={true}>
      <Drawer.Trigger className="text-s ml-4 font-mono text-gray-300 transition-colors hover:text-gray-500">
        pick pdf
      </Drawer.Trigger>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40" />

        <Drawer.Content
          className="fixed top-0 right-0 bottom-0 z-50 mt-0 flex h-full w-[85%] max-w-sm flex-col rounded-l-[10px] border-l bg-white outline-none sm:w-[400px] dark:border-zinc-800 dark:bg-zinc-900" // Adjusted styles
        >
          <div className="sticky top-0 flex items-center justify-between border-b bg-inherit p-4 dark:border-zinc-800">
            <Drawer.Title className="font-medium text-zinc-900 dark:text-zinc-100">
              My PDFs
            </Drawer.Title>
            <Drawer.Description className="mb-2 text-zinc-600"></Drawer.Description>
            <Drawer.Close asChild>
              <button className="rounded p-1 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                <X size={18} />
              </button>
            </Drawer.Close>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {pdfsQuery.isLoading && <p className="text-zinc-500">Loading...</p>}
            {pdfsQuery.isError && (
              <p className="text-red-500">Error loading PDFs.</p>
            )}
            {pdfsQuery.data && pdfsQuery.data.length === 0 && (
              <p className="text-zinc-500">No PDFs uploaded yet.</p>
            )}

            {pdfsQuery.data && pdfsQuery.data.length > 0 && (
              <ul className="space-y-3">
                {pdfsQuery.data.map(({ paragraphs, id }) => (
                  <li
                    key={id}
                    className={clsx(
                      "cursor-pointer rounded-md border p-3 text-sm transition-colors",
                      // Base text/border colors
                      "text-zinc-800 dark:border-zinc-700 dark:text-zinc-200",
                      // Conditional background and hover states
                      isSelected === id
                        ? "bg-zinc-200 dark:bg-gray-700" // Selected state background
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800", // Non-selected hover
                    )}
                    onClick={() => {
                      selectPdf(id);
                      setSelected(id);
                    }}
                  >
                    <div className="mb-1 flex justify-between font-medium">
                      <span>PDF ID {id}</span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        ({paragraphs.length} paras)
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-zinc-600 dark:text-zinc-400">
                      {paragraphs.slice(0, 2).map(
                        (
                          para,
                          para_id, // Show first 2 paras example
                        ) => (
                          <p key={para_id} className="truncate">
                            {" "}
                            {para.text}
                          </p>
                        ),
                      )}
                      {paragraphs.length > 2 && <p className="italic">...</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
