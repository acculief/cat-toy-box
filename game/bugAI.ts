import {
  StateMachineState,
  createInitialState,
  transition,
} from "./bugStateMachine";
import {
  BugPhysics,
  createBugPhysics,
  updateMovement,
  UpdateResult,
} from "./bugMovement";

export interface BugAIState {
  machine: StateMachineState;
  physics: BugPhysics;
  prevState: string;
}

export function createBugAI(screenW: number, screenH: number): BugAIState {
  return {
    machine: createInitialState(),
    physics: createBugPhysics(screenW, screenH),
    prevState: "wander",
  };
}

export function tickBugAI(
  ai: BugAIState,
  dt: number,
  screenW: number,
  screenH: number
): BugAIState {
  let machine = ai.machine;

  // Check timer-based transitions
  machine = transition(machine, { type: "TIMER" });

  // Update movement
  const stateJustChanged = machine.current !== ai.prevState;
  const result: UpdateResult = updateMovement(
    ai.physics,
    machine.current,
    dt,
    screenW,
    screenH,
    stateJustChanged
  );

  // Check wall proximity events
  if (result.nearWall && machine.current === "wander") {
    machine = transition(machine, { type: "NEAR_WALL" });
  }
  if (result.leftWall && machine.current === "wall_follow") {
    machine = transition(machine, { type: "LEFT_WALL" });
  }

  return {
    machine,
    physics: result.physics,
    prevState: machine.current,
  };
}

export function tapBugAI(ai: BugAIState): BugAIState {
  const machine = transition(ai.machine, { type: "TAP" });
  return {
    ...ai,
    machine,
    prevState: ai.machine.current, // previous state before panic
  };
}
