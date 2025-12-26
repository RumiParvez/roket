import React from 'react';
import { SimulationState } from '../types';

interface ControlPanelProps {
  state: SimulationState;
  onThrottle: (val: number) => void;
  onStage: () => void;
  onPitch: (val: number) => void;
  onTogglePause: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ state, onThrottle, onStage, onPitch, onTogglePause }) => {
  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-4">
      <div className="flex justify-between items-center border-b border-slate-600 pb-2">
        <span className="font-bold text-white uppercase tracking-widest">Flight Control</span>
        <button 
            onClick={onTogglePause}
            className={`px-3 py-1 rounded text-xs font-bold ${state.isPaused ? 'bg-yellow-600' : 'bg-slate-600'} hover:opacity-80`}
        >
            {state.isPaused ? 'RESUME' : 'PAUSE'}
        </button>
      </div>

      {/* Throttle */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-300">
            <span>Throttle</span>
            <span>{(state.throttle * 100).toFixed(0)}%</span>
        </div>
        <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.01" 
            value={state.throttle}
            onChange={(e) => onThrottle(parseFloat(e.target.value))}
            className="w-full h-8 accent-orange-500 cursor-pointer"
        />
        <div className="flex justify-between">
            <button onClick={() => onThrottle(0)} className="text-xs bg-red-900/50 text-red-200 px-2 py-1 rounded border border-red-800 hover:bg-red-800">CUT</button>
            <button onClick={() => onThrottle(1)} className="text-xs bg-orange-900/50 text-orange-200 px-2 py-1 rounded border border-orange-800 hover:bg-orange-800">MAX</button>
        </div>
      </div>

      {/* Attitude */}
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-xs text-slate-300">
            <span>Pitch (Right)</span>
            <span>{state.rotation.toFixed(1)}°</span>
        </div>
        <div className="flex items-center gap-2">
            <button 
                onClick={() => onPitch(state.rotation - 5)}
                className="bg-slate-700 hover:bg-slate-600 text-white w-8 h-8 rounded flex items-center justify-center"
            >
                <i className="fas fa-chevron-left"></i>
            </button>
            <div className="flex-1 text-center bg-slate-900 py-1 rounded font-mono text-cyan-400">
                {state.rotation.toFixed(0)}°
            </div>
            <button 
                onClick={() => onPitch(state.rotation + 5)}
                className="bg-slate-700 hover:bg-slate-600 text-white w-8 h-8 rounded flex items-center justify-center"
            >
                <i className="fas fa-chevron-right"></i>
            </button>
        </div>
      </div>

      {/* Staging */}
      <div className="mt-2">
        <button 
            onClick={onStage}
            className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-black uppercase tracking-widest rounded shadow-lg active:translate-y-1 transition-all border-b-4 border-red-800"
        >
            SEPARATE STAGE
        </button>
      </div>

    </div>
  );
};

export default ControlPanel;
