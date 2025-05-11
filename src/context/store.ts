import { create } from "zustand";
import type { ActualRecord } from "@/context/data_types";

export type GameStatus = "idle" | "running" | "stopped";

interface RecordState {
  wpm: number;
  time: number;
  mistakes: number;
  accuracy: number;
  status: GameStatus;
  localRecords: ActualRecord[];
  setTime: (time: number) => void;
  setWPM: (wpm: number) => void;
  setMistakes: (mistakes: number) => void;
  setAccuracy: (accuracy: number) => void;
  setStatus: (status: GameStatus) => void;
  loadInitialLocalRecords: () => void;
  addLocalRecord: (stats: {
    wpm: number;
    time: number;
    mistakes: number;
    accuracy: number;
  }) => void;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  wpm: 0,
  time: 0,
  mistakes: 0,
  accuracy: 0,
  status: "idle",
  localRecords: [],
  setTime: (time: number) => set({ time: time }),
  setWPM: (wpm: number) => set({ wpm: wpm }),
  setMistakes: (mistakes: number) => set({ mistakes: mistakes }),
  setAccuracy: (accuracy: number) => set({ accuracy: accuracy }),
  setStatus: (status: GameStatus) =>
    set((state) => {
      if (state.status === status) return state;
      return { status };
    }),
  loadInitialLocalRecords: () => {
    try {
      const storedRecords = localStorage.getItem("typingRecords");
      if (storedRecords) {
        const parsedRecords: ActualRecord[] = JSON.parse(storedRecords);
        set({ localRecords: parsedRecords });
        console.log(
          "Store: Initial local records loaded",
          parsedRecords.length,
        );
      }
    } catch (error) {
      console.error("Store: Error loading records from localStorage:", error);
      set({ localRecords: [] });
    }
  },
  addLocalRecord: (stats) => {
    const { wpm, time, mistakes, accuracy } = stats;
    const freshRecord: ActualRecord = {
      id: Date.now(),
      wpm,
      time,
      mistakes,
      accuracy,
    };

    try {
      const existingRecords = get().localRecords;
      const updatedRecords = [freshRecord, ...existingRecords].slice(0, 50);

      localStorage.setItem("typingRecords", JSON.stringify(updatedRecords));
      set({ localRecords: updatedRecords });
      console.log(
        "Store: Added new record to localStorage and store",
        freshRecord,
      );
    } catch (error) {
      console.error("Store: Error saving record:", error);
    }
  },
}));
