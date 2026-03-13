export type BugState = "wander" | "pause" | "panic" | "wall_follow";

export type BugEvent =
  | { type: "TIMER" }
  | { type: "TAP" }
  | { type: "NEAR_WALL" }
  | { type: "LEFT_WALL" };

export interface StateConfig {
  minDuration: number;
  maxDuration: number;
}

const STATE_DURATIONS: Record<BugState, StateConfig> = {
  wander: { minDuration: 1000, maxDuration: 3000 },
  pause: { minDuration: 300, maxDuration: 1500 },
  panic: { minDuration: 800, maxDuration: 1500 },
  wall_follow: { minDuration: 1500, maxDuration: 3000 },
};

function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export interface StateMachineState {
  current: BugState;
  stateStartTime: number;
  stateDuration: number;
}

export function createInitialState(): StateMachineState {
  const config = STATE_DURATIONS.wander;
  return {
    current: "wander",
    stateStartTime: Date.now(),
    stateDuration: randomInRange(config.minDuration, config.maxDuration),
  };
}

function transitionTo(state: BugState): StateMachineState {
  const config = STATE_DURATIONS[state];
  return {
    current: state,
    stateStartTime: Date.now(),
    stateDuration: randomInRange(config.minDuration, config.maxDuration),
  };
}

export function transition(
  machine: StateMachineState,
  event: BugEvent
): StateMachineState {
  if (event.type === "TAP") {
    return transitionTo("panic");
  }

  const elapsed = Date.now() - machine.stateStartTime;
  const expired = elapsed >= machine.stateDuration;

  switch (machine.current) {
    case "wander":
      if (event.type === "NEAR_WALL") return transitionTo("wall_follow");
      if (expired) return transitionTo(Math.random() < 0.7 ? "pause" : "wander");
      return machine;

    case "pause":
      if (event.type === "NEAR_WALL") return transitionTo("wall_follow");
      if (expired) return transitionTo("wander");
      return machine;

    case "panic":
      if (expired) return transitionTo("wander");
      return machine;

    case "wall_follow":
      if (event.type === "LEFT_WALL") return transitionTo("wander");
      if (expired) return transitionTo("wander");
      return machine;
  }
}
