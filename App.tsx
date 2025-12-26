

import React, { useState, useEffect, useRef, useCallback } from 'react';
import SimulationView from './components/SimulationView';
import TelemetryPanel from './components/TelemetryPanel';
import ControlPanel from './components/ControlPanel';
import { SimulationState, TelemetryData } from './types';
import { updatePhysics } from './services/physics';
import { INITIAL_CONFIG, EARTH_RADIUS } from './constants';
import { getFlightAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const initialState: SimulationState = {
    position: { x: 0, y: EARTH_RADIUS },
    velocity: { x: 0, y: 0 },
    acceleration: { x: 0, y: 0 },
    rotation: 0,
    angularVelocity: 0,
    throttle: 0,
    stages: [
      { ...INITIAL_CONFIG.stage0, id: 0, name: "S-IC Booster", isActive: true, hasSeparated: false, maxFuel: INITIAL_CONFIG.stage0.fuelMass, color: "#cbd5e1" },
      { ...INITIAL_CONFIG.stage1, id: 1, name: "S-IVB Upper", isActive: false, hasSeparated: false, maxFuel: INITIAL_CONFIG.stage1.fuelMass, color: "#94a3b8" }
    ],
    currentStageIndex: 0,
    time: 0,
    dt: 1/60,
    scale: 1,
    isPaused: true,
    autoPilotMode: 'OFF'
  };

  const [simState, setSimState] = useState<SimulationState>(initialState);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    altitude: 0, velocityMag: 0, accelMag: 0, dynamicPressure: 0,
    machNumber: 0, pitch: 0, apoapsis: 0, periapsis: 0,
    drag: 0, thrust: 0, gravity: 0, mass: 0, density: 0, stageFuelPct: 100
  });
  
  const [aiMessage, setAiMessage] = useState<string>("All systems nominal. Awaiting ignition sequence.");
  const [isAiLoading, setIsAiLoading] = useState(false);
  const physicsRef = useRef<SimulationState>(initialState);
  // Fix: Added undefined as initial value to satisfy useRef type signature requiring 1 argument in strict mode
  const requestRef = useRef<number | undefined>(undefined);

  const tick = useCallback(() => {
    if (!physicsRef.current.isPaused) {
      const result = updatePhysics(physicsRef.current);
      physicsRef.current = result.nextState;
      setTelemetry(result.telemetry);
    }
    setSimState({ ...physicsRef.current });
    requestRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    requestRef.current = requestAnimationFrame(tick);
    return () => { if (requestRef.current) cancelAnimationFrame(requestRef.current); };
  }, [tick]);

  const handleThrottle = (val: number) => {
    physicsRef.current.throttle = Math.max(0, Math.min(1, val));
    if (physicsRef.current.isPaused && val > 0) physicsRef.current.isPaused = false;
  };

  const handlePitch = (val: number) => {
    physicsRef.current.rotation = val;
    physicsRef.current.autoPilotMode = 'OFF';
  };

  const handleStage = () => {
    const currentIdx = physicsRef.current.currentStageIndex;
    const stages = [...physicsRef.current.stages];
    if (currentIdx < stages.length - 1) {
      stages[currentIdx].isActive = false;
      stages[currentIdx].hasSeparated = true;
      stages[currentIdx+1].isActive = true;
      physicsRef.current.stages = stages;
      physicsRef.current.currentStageIndex = currentIdx + 1;
      physicsRef.current.throttle = 1;
    }
  };

  const handleAiAssist = async () => {
    if (isAiLoading) return;
    setIsAiLoading(true);
    const msg = await getFlightAnalysis(telemetry, physicsRef.current.stages[physicsRef.current.currentStageIndex]);
    setAiMessage(msg);
    setIsAiLoading(false);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space') handleStage();
      if (e.code === 'KeyZ') handleThrottle(1);
      if (e.code === 'KeyX') handleThrottle(0);
      if (e.code === 'ArrowLeft') handlePitch(physicsRef.current.rotation - 2);
      if (e.code === 'ArrowRight') handlePitch(physicsRef.current.rotation + 2);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* HUD Header */}
      <header className="h-16 border-b border-white/10 bg-black/40 backdrop-blur-md flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <i className="fas fa-satellite-dish text-white text-sm"></i>
          </div>
          <div>
            <h1 className="text-sm font-black tracking-[0.2em] uppercase">WebOrbit Command</h1>
            <div className="text-[10px] text-blue-400 font-mono">MISSION_ID: ARTEMIS_ALPHA_01</div>
          </div>
        </div>
        
        <div className="flex-1 max-w-2xl px-8">
           <div className={`flex items-start gap-3 p-2 rounded bg-white/5 border border-white/10 ${isAiLoading ? 'opacity-50' : ''}`}>
             <i className="fas fa-headset text-cyan-500 mt-1 text-xs"></i>
             <p className="text-xs font-mono leading-relaxed text-cyan-100/80">
               <span className="text-cyan-500 font-bold mr-2">FLIGHT_DIR:</span>
               {aiMessage}
             </p>
           </div>
        </div>

        <button 
          onClick={handleAiAssist}
          disabled={isAiLoading}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-700 text-white text-[10px] font-bold px-4 py-2 rounded-full transition-all flex items-center gap-2 uppercase tracking-wider"
        >
          {isAiLoading ? <i className="fas fa-spinner animate-spin"></i> : <i className="fas fa-bolt"></i>}
          Analyze
        </button>
      </header>

      {/* Main Mission View */}
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 relative">
          <SimulationView state={simState} />
          
          {/* On-Canvas Telemetry Overlay */}
          <div className="absolute top-6 left-6 flex flex-col gap-4 pointer-events-none font-mono">
             <div className="bg-black/60 border-l-2 border-green-500 p-3 backdrop-blur-sm">
                <div className="text-[10px] text-green-500/60 font-bold uppercase mb-1">Mission Clock</div>
                <div className="text-xl font-bold">T+ {simState.time.toFixed(1)}s</div>
             </div>
             
             <div className="bg-black/60 border-l-2 border-blue-500 p-3 backdrop-blur-sm">
                <div className="text-[10px] text-blue-500/60 font-bold uppercase mb-1">Autopilot Status</div>
                <div className={`text-sm font-bold ${simState.autoPilotMode !== 'OFF' ? 'text-blue-400' : 'text-white/40'}`}>
                  {simState.autoPilotMode}
                </div>
             </div>
          </div>
        </div>

        {/* Right Dashboard */}
        <aside className="w-[380px] border-l border-white/10 bg-slate-900/50 backdrop-blur-xl flex flex-col p-6 gap-6 overflow-y-auto z-20">
          <TelemetryPanel 
            data={telemetry} 
            activeStage={simState.stages[simState.currentStageIndex]} 
          />
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => { physicsRef.current.autoPilotMode = 'GRAVITY_TURN' }}
              className={`text-[10px] font-bold p-2 rounded border transition-all ${simState.autoPilotMode === 'GRAVITY_TURN' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
            >
              GRAVITY TURN
            </button>
            <button 
              onClick={() => { physicsRef.current.autoPilotMode = 'PROGRADE' }}
              className={`text-[10px] font-bold p-2 rounded border transition-all ${simState.autoPilotMode === 'PROGRADE' ? 'bg-blue-600 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
            >
              HOLD PROGRADE
            </button>
          </div>

          <ControlPanel 
            state={simState}
            onThrottle={handleThrottle}
            onStage={handleStage}
            onPitch={handlePitch}
            onTogglePause={() => { physicsRef.current.isPaused = !physicsRef.current.isPaused }}
          />

          <div className="mt-auto pt-6 border-t border-white/5">
             <div className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-3">Emergency Systems</div>
             <button 
               onClick={() => window.location.reload()}
               className="w-full bg-red-950/30 hover:bg-red-900/50 text-red-500 border border-red-900/50 py-2 rounded text-[10px] font-bold transition-colors"
             >
               ABORT MISSION / RESET
             </button>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default App;
