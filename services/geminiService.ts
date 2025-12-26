
import { GoogleGenAI } from "@google/genai";
import { TelemetryData, RocketStage } from '../types';

export const getFlightAnalysis = async (telemetry: TelemetryData, activeStage: RocketStage | undefined): Promise<string> => {
  // Always initialize fresh to ensure latest API key context
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const prompt = `
    You are a Lead Flight Director at Mission Control. Analyze this high-fidelity telemetry:
    - Altitude: ${(telemetry.altitude / 1000).toFixed(2)} km
    - Velocity: ${telemetry.velocityMag.toFixed(1)} m/s
    - G-Force: ${(telemetry.accelMag / 9.81).toFixed(2)} G
    - Dyn Pressure (Q): ${(telemetry.dynamicPressure / 1000).toFixed(2)} kPa
    - Orbit: Apoapsis ${(telemetry.apoapsis / 1000).toFixed(1)}km, Periapsis ${(telemetry.periapsis / 1000).toFixed(1)}km
    - Current Stage: ${activeStage?.name || 'N/A'} (${telemetry.stageFuelPct.toFixed(1)}% fuel)
    
    Status: ${telemetry.altitude < 1000 ? 'Launch Pad' : telemetry.altitude > 100000 ? 'Orbit/Space' : 'Atmospheric Flight'}

    Provide a professional, concise 2-sentence update. 
    1. Acknowledge current flight phase (e.g., Max-Q, MECO, Orbital Insertion).
    2. Provide a specific technical recommendation (e.g., "Begin gravity turn," "Prepare for staging," "Watch your periapsis").
    Tone: Calm, professional, expert.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Communication stable. Systems nominal.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Telemetry link degraded. Maintain current flight path.";
  }
};
