import { useRecordStore } from "@/context/store";
import { useEffect } from "react";

export default function useGameStateMachine(input: string, target: string) {
  const gameState = useRecordStore((state) => state.status);
  const setGameState = useRecordStore((state) => state.setStatus);
  useEffect(() => {
    let newState = gameState;

    if (gameState === "idle" && input.length > 0 && target.length > 0) {
      // when a person types text then start running
      newState = "running";
    } else if (
      gameState === "running" &&
      target.length > 0 &&
      input.length === target.length
    ) {
      // when the person is finished typing transition from running to stopping
      newState = "stopped";
    }

    if (newState !== gameState) {
      setGameState(newState);
    }
  }, [target, input, gameState, setGameState]);
}
