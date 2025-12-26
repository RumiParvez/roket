
import { RocketStage, SimulationState, Vector2, TelemetryData } from '../types';
import { 
  G, EARTH_MASS, EARTH_RADIUS, SEA_LEVEL_DENSITY, SCALE_HEIGHT, 
  DRAG_AREA, DRAG_COEFF_SUBSONIC, DRAG_COEFF_SUPERSONIC 
} from '../constants';

const magnitude = (v: Vector2) => Math.sqrt(v.x * v.x + v.y * v.y);
const normalize = (v: Vector2): Vector2 => {
  const m = magnitude(v);
  return m === 0 ? { x: 0, y: 0 } : { x: v.x / m, y: v.y / m };
};
const dot = (a: Vector2, b: Vector2) => a.x * b.x + a.y * b.y;

export const getDensity = (altitude: number): number => {
  if (altitude < 0) return SEA_LEVEL_DENSITY;
  if (altitude > 80000) return 0; 
  return SEA_LEVEL_DENSITY * Math.exp(-altitude / SCALE_HEIGHT);
};

const getCd = (mach: number): number => {
  if (mach < 0.8) return DRAG_COEFF_SUBSONIC;
  if (mach > 1.2) return DRAG_COEFF_SUPERSONIC;
  return DRAG_COEFF_SUBSONIC + (DRAG_COEFF_SUPERSONIC - DRAG_COEFF_SUBSONIC) * ((mach - 0.8) / 0.4);
};

export const updatePhysics = (state: SimulationState): { nextState: SimulationState, telemetry: TelemetryData } => {
  const { position, velocity, stages, currentStageIndex, throttle, dt, rotation } = state;

  const r = magnitude(position);
  const altitude = r - EARTH_RADIUS;
  const vMag = magnitude(velocity);
  
  // 1. Gravity
  const gMag = (G * EARTH_MASS) / (r * r);
  const gravityDir = normalize({ x: -position.x, y: -position.y });
  const fGravityTotal = { x: gravityDir.x * gMag, y: gravityDir.y * gMag };

  // 2. Atmosphere
  const density = getDensity(altitude);
  const mach = vMag / 340;
  const Cd = getCd(mach);
  const dynPressure = 0.5 * density * vMag * vMag;
  const dragForceMag = dynPressure * Cd * DRAG_AREA;
  const dragDir = vMag > 0.1 ? normalize({ x: -velocity.x, y: -velocity.y }) : { x: 0, y: 0 };
  const fDrag = { x: dragDir.x * dragForceMag, y: dragDir.y * dragForceMag };

  // 3. Mass & Thrust
  let currentMass = 0;
  stages.forEach(s => { if (!s.hasSeparated) currentMass += s.dryMass + s.fuelMass; });

  let thrustMag = 0;
  const activeStage = stages[currentStageIndex];
  if (activeStage && activeStage.isActive && !activeStage.hasSeparated && activeStage.fuelMass > 0) {
    const atmFactor = Math.min(1, Math.max(0, altitude / 50000));
    const currentIsp = activeStage.ispSL + (activeStage.ispVac - activeStage.ispSL) * atmFactor;
    thrustMag = activeStage.maxThrust * throttle;
    const massFlow = thrustMag / (currentIsp * 9.80665);
    
    if (!state.isPaused) {
      activeStage.fuelMass = Math.max(0, activeStage.fuelMass - massFlow * dt);
    }
  }

  // Orientation
  const localUp = normalize(position);
  const rad = rotation * (Math.PI / 180);
  const thrustDir = {
    x: localUp.x * Math.cos(rad) - localUp.y * Math.sin(rad),
    y: localUp.x * Math.sin(rad) + localUp.y * Math.cos(rad)
  };
  const fThrust = { x: thrustDir.x * thrustMag, y: thrustDir.y * thrustMag };

  // Net Forces
  const fNet = {
    x: (fGravityTotal.x * currentMass) + fDrag.x + fThrust.x,
    y: (fGravityTotal.y * currentMass) + fDrag.y + fThrust.y
  };

  const acceleration = { x: fNet.x / currentMass, y: fNet.y / currentMass };
  
  let nextPos = { ...position };
  let nextVel = { ...velocity };
  
  if (!state.isPaused) {
    nextVel.x += acceleration.x * dt;
    nextVel.y += acceleration.y * dt;
    nextPos.x += nextVel.x * dt;
    nextPos.y += nextVel.y * dt;
  }

  // Ground Collision
  if (magnitude(nextPos) < EARTH_RADIUS) {
    const surfaceNormal = normalize(nextPos);
    nextPos = { x: surfaceNormal.x * EARTH_RADIUS, y: surfaceNormal.y * EARTH_RADIUS };
    // Hard landing logic
    if (magnitude(velocity) > 10) {
        // Crash scenario could be added here
    }
    nextVel = { x: 0, y: 0 };
  }

  // Orbital Mechanics
  const mu = G * EARTH_MASS;
  const specificEnergy = (vMag * vMag) / 2 - mu / r;
  const semiMajorAxis = -mu / (2 * specificEnergy);
  const rDotV = dot(position, velocity);
  const eVec = {
    x: ((vMag*vMag - mu/r)*position.x - rDotV*velocity.x) / mu,
    y: ((vMag*vMag - mu/r)*position.y - rDotV*velocity.y) / mu
  };
  const eccentricity = magnitude(eVec);
  const periapsis = semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS;
  const apoapsis = semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS;

  // Autopilot Refinement
  let nextRotation = rotation;
  if (!state.isPaused) {
    if (state.autoPilotMode === 'GRAVITY_TURN' && altitude > 500) {
        const targetPitch = Math.min(90, (altitude - 500) / 700); 
        nextRotation += (targetPitch - rotation) * dt * 0.8;
    } else if (state.autoPilotMode === 'PROGRADE' && vMag > 20) {
        // Find angle of velocity relative to local up
        const velGlobal = Math.atan2(velocity.y, velocity.x);
        const posGlobal = Math.atan2(position.y, position.x);
        let targetRot = (velGlobal - posGlobal) * (180 / Math.PI) - 90;
        // Normalize angle
        while (targetRot > 180) targetRot -= 360;
        while (targetRot < -180) targetRot += 360;
        nextRotation += (targetRot - rotation) * dt * 2.0;
    }
  }

  const telemetry: TelemetryData = {
    altitude,
    velocityMag: vMag,
    accelMag: magnitude(acceleration),
    dynamicPressure: dynPressure,
    machNumber: mach,
    pitch: rotation,
    apoapsis: specificEnergy >= 0 ? Infinity : apoapsis,
    periapsis: specificEnergy >= 0 ? -Infinity : periapsis,
    drag: dragForceMag,
    thrust: thrustMag,
    gravity: gMag * currentMass,
    mass: currentMass,
    density,
    stageFuelPct: activeStage ? (activeStage.fuelMass / activeStage.maxFuel) * 100 : 0
  };

  return { 
    nextState: { ...state, position: nextPos, velocity: nextVel, acceleration, rotation: nextRotation, time: state.time + dt }, 
    telemetry 
  };
};
