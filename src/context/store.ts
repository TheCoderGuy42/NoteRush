import { create } from "zustand";
export type GameStatus = "idle" | "running" | "stopped"; // Renamed for clarity

interface RecordState {
  wpm: number;
  time: number;
  mistakes: number;
  accuracy: number;
  status: GameStatus;
  setTime: (time: number) => void;
  setWPM: (wpm: number) => void;
  setMistakes: (mistakes: number) => void;
  setAccuracy: (accuracy: number) => void;
  setStatus: (status: GameStatus) => void;
}

// Create the store
export const useRecordStore = create<RecordState>((set) => ({
  // Initial state
  wpm: 0,
  time: 0,
  mistakes: 0,
  accuracy: 0,
  status: "idle",
  setTime: (time: number) => set({ time: time }),
  setWPM: (wpm: number) => set({ wpm: wpm }),
  setMistakes: (mistakes: number) => set({ mistakes: mistakes }),
  setAccuracy: (accuracy: number) => set({ accuracy: accuracy }),
  setStatus: (status: GameStatus) =>
    set((state) => {
      if (state.status === status) return state;
      return { status };
    }),
}));
