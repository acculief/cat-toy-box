import { BugState } from "./bugStateMachine";

export interface Vec2 {
  x: number;
  y: number;
}

export interface BugPhysics {
  position: Vec2;
  velocity: Vec2;
  angle: number; // radians, direction of movement
  targetAngle: number;
  curveRate: number; // radians per second for wander curve
}

const SPEED_NORMAL = 300;
const SPEED_FAST = 700;
const TURN_SPEED = 8; // radians/s for angle interpolation
const WALL_MARGIN = 30;
const WALL_DETECT = 60;

function normalizeAngle(a: number): number {
  while (a > Math.PI) a -= 2 * Math.PI;
  while (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

function randomAngle(): number {
  return Math.random() * Math.PI * 2 - Math.PI;
}

export function createBugPhysics(screenW: number, screenH: number): BugPhysics {
  return {
    position: {
      x: screenW * 0.3 + Math.random() * screenW * 0.4,
      y: screenH * 0.3 + Math.random() * screenH * 0.4,
    },
    velocity: { x: 0, y: 0 },
    angle: randomAngle(),
    targetAngle: randomAngle(),
    curveRate: (Math.random() - 0.5) * 2,
  };
}

export function isNearWall(
  pos: Vec2,
  screenW: number,
  screenH: number
): boolean {
  return (
    pos.x < WALL_DETECT ||
    pos.x > screenW - WALL_DETECT ||
    pos.y < WALL_DETECT ||
    pos.y > screenH - WALL_DETECT
  );
}

export function isAwayFromWall(
  pos: Vec2,
  screenW: number,
  screenH: number
): boolean {
  return (
    pos.x > WALL_DETECT * 2 &&
    pos.x < screenW - WALL_DETECT * 2 &&
    pos.y > WALL_DETECT * 2 &&
    pos.y < screenH - WALL_DETECT * 2
  );
}

function getWallFollowAngle(
  pos: Vec2,
  screenW: number,
  screenH: number
): number {
  // Follow wall clockwise
  if (pos.y < WALL_DETECT) return 0; // top wall → go right
  if (pos.x > screenW - WALL_DETECT) return Math.PI / 2; // right wall → go down
  if (pos.y > screenH - WALL_DETECT) return Math.PI; // bottom wall → go left
  if (pos.x < WALL_DETECT) return -Math.PI / 2; // left wall → go up
  return 0;
}

function clampPosition(
  pos: Vec2,
  screenW: number,
  screenH: number
): Vec2 {
  return {
    x: Math.max(WALL_MARGIN, Math.min(screenW - WALL_MARGIN, pos.x)),
    y: Math.max(WALL_MARGIN, Math.min(screenH - WALL_MARGIN, pos.y)),
  };
}

export interface UpdateResult {
  physics: BugPhysics;
  nearWall: boolean;
  leftWall: boolean;
}

export function updateMovement(
  physics: BugPhysics,
  state: BugState,
  dt: number,
  screenW: number,
  screenH: number,
  stateJustChanged: boolean
): UpdateResult {
  const p = { ...physics };

  if (stateJustChanged) {
    switch (state) {
      case "wander":
        p.targetAngle = randomAngle();
        p.curveRate = (Math.random() - 0.5) * 2;
        break;
      case "panic":
        // Pick random direction away from current position edges
        p.targetAngle = randomAngle();
        p.angle = p.targetAngle; // instant turn on panic
        p.curveRate = (Math.random() - 0.5) * 4;
        break;
      case "wall_follow":
        p.targetAngle = getWallFollowAngle(p.position, screenW, screenH);
        p.curveRate = 0;
        break;
      case "pause":
        p.curveRate = 0;
        break;
    }
  }

  let speed = 0;
  switch (state) {
    case "wander":
      speed = SPEED_NORMAL;
      // Slight curve: slowly drift the target angle
      p.targetAngle += p.curveRate * dt;
      // Occasionally jitter
      if (Math.random() < 0.02) {
        p.curveRate = (Math.random() - 0.5) * 2;
      }
      break;
    case "pause":
      speed = 0;
      break;
    case "panic":
      speed = SPEED_FAST;
      // Erratic direction changes
      if (Math.random() < 0.08) {
        p.targetAngle += (Math.random() - 0.5) * Math.PI;
      }
      break;
    case "wall_follow":
      speed = SPEED_NORMAL * 0.8;
      p.targetAngle = getWallFollowAngle(p.position, screenW, screenH);
      break;
  }

  // Smoothly interpolate angle toward target
  const angleDiff = normalizeAngle(p.targetAngle - p.angle);
  const maxTurn = TURN_SPEED * dt;
  if (Math.abs(angleDiff) < maxTurn) {
    p.angle = p.targetAngle;
  } else {
    p.angle += Math.sign(angleDiff) * maxTurn;
  }
  p.angle = normalizeAngle(p.angle);

  // Apply velocity
  p.velocity = {
    x: Math.cos(p.angle) * speed,
    y: Math.sin(p.angle) * speed,
  };

  p.position = {
    x: p.position.x + p.velocity.x * dt,
    y: p.position.y + p.velocity.y * dt,
  };

  // Bounce off walls
  const clamped = clampPosition(p.position, screenW, screenH);
  if (clamped.x !== p.position.x) {
    p.velocity.x *= -1;
    p.angle = Math.atan2(p.velocity.y, p.velocity.x);
    p.targetAngle = p.angle;
  }
  if (clamped.y !== p.position.y) {
    p.velocity.y *= -1;
    p.angle = Math.atan2(p.velocity.y, p.velocity.x);
    p.targetAngle = p.angle;
  }
  p.position = clamped;

  const nearWall = isNearWall(p.position, screenW, screenH);
  const leftWall = isAwayFromWall(p.position, screenW, screenH);

  return { physics: p, nearWall, leftWall };
}
