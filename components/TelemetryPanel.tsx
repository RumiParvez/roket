import React from 'react';
import { TelemetryData, RocketStage } from '../types';

interface TelemetryPanelProps {
  data: TelemetryData;
  activeStage: RocketStage | undefined;
}

const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ data, activeStage }) => {
  const formatNum = (n: number, d: number = 2) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

  return (
    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800 rounded-lg border border-slate-700 font-mono text-sm text-cyan-400">
      <div className="col-span-2 text-white border-b border-slate-600 pb-2 mb-2 font-bold uppercase tracking-wider">
        Flight Telemetry
      </div>
      
      <div>
        <div className="text-slate-400 text-xs">Altitude</div>
        <div className="text-xl">{(data.altitude / 1000).toFixed(2)} <span className="text-xs">km</span></div>
      </div>
      
      <div>
        <div className="text-slate-400 text-xs">Velocity</div>
        <div className="text-xl">{formatNum(data.velocityMag)} <span className="text-xs">m/s</span></div>
      </div>

      <div>
        <div className="text-slate-400 text-xs">Acceleration</div>
        <div className="text-lg">{formatNum(data.accelMag / 9.81)} <span className="text-xs">G</span></div>
      </div>

      <div>
        <div className="text-slate-400 text-xs">Dyn Pressure (Q)</div>
        <div className="text-lg">{formatNum(data.dynamicPressure / 1000)} <span className="text-xs">kPa</span></div>
      </div>

      <div className="col-span-2 grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700">
        <div>
           <div className="text-slate-400 text-xs">Apoapsis</div>
           <div className="text-yellow-400">{(data.apoapsis / 1000).toFixed(1)} km</div>
        </div>
        <div>
           <div className="text-slate-400 text-xs">Periapsis</div>
           <div className="text-yellow-400">{(data.periapsis / 1000).toFixed(1)} km</div>
        </div>
      </div>

      <div className="col-span-2 mt-2">
        <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Fuel ({activeStage?.name})</span>
            <span>{data.stageFuelPct.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-slate-900 rounded-full h-2.5 border border-slate-600">
          <div 
            className={`h-full rounded-full ${data.stageFuelPct < 20 ? 'bg-red-500' : 'bg-green-500'}`} 
            style={{ width: `${data.stageFuelPct}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default TelemetryPanel;
