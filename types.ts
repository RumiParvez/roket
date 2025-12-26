export interface Vector2 {
  x: number;
  y: number;
}

export interface RocketStage {
  id: number;
  name: string;
  dryMass: number; // kg
  fuelMass: number; // kg
  maxFuel: number; // kg
  maxThrust: number; // N
  ispSL: number; // seconds
  ispVac: number; // seconds
  isActive: boolean;
  hasSeparated: boolean;
  color: string;
}

export interface SimulationState {
  position: Vector2; // meters, relative to Earth center
  velocity: Vector2; // m/s
  acceleration: Vector2; // m/s^2
  rotation: number; // degrees, 0 is up (radial out from launch)
  angularVelocity: number; // deg/s
  throttle: number; // 0 to 1
  stages: RocketStage[];
  currentStageIndex: number;
  time: number; // mission time in seconds
  dt: number; // physics timestep
  scale: number; // time scale
  isPaused: boolean;
  autoPilotMode: 'OFF' | 'GRAVITY_TURN' | 'PROGRADE' | 'RETROGRADE';
}

export interface TelemetryData {
  altitude: number; // m
  velocityMag: number; // m/s
  accelMag: number; // m/s^2
  dynamicPressure: number; // Pa
  machNumber: number;
  pitch: number;
  apoapsis: number;
  periapsis: number;
  drag: number;
  thrust: number;
  gravity: number;
  mass: number;
  density: number;
  stageFuelPct: number;
}
