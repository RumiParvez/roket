export const G = 6.67430e-11;
export const EARTH_MASS = 5.972e24; // kg
export const EARTH_RADIUS = 6371000; // m
export const SEA_LEVEL_PRESSURE = 101325; // Pa
export const SEA_LEVEL_DENSITY = 1.225; // kg/m^3
export const SCALE_HEIGHT = 8500; // m (approximate)
export const DRAG_AREA = 1.2; // m^2 reference area
export const DRAG_COEFF_SUBSONIC = 0.35;
export const DRAG_COEFF_SUPERSONIC = 0.55;

export const INITIAL_CONFIG = {
  stage0: {
    dryMass: 2000,
    fuelMass: 8000,
    maxThrust: 800000,
    ispSL: 300,
    ispVac: 320
  },
  stage1: {
    dryMass: 1000,
    fuelMass: 3500,
    maxThrust: 200000,
    ispSL: 280,
    ispVac: 340
  }
};
