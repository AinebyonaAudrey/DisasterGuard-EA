import React from 'react';
import { AlertTriangle, Droplets, Flame, Mountain, Wind, Info } from 'lucide-react';
import { DisasterRisk, RiskLevel } from '../types';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const riskIcons = {
  Flood: Droplets,
  Drought: Flame,
  Landslide: Mountain,
  Storm: Wind,
  Heatwave: Flame,
  Other: Info,
};

const riskColors: Record<RiskLevel, string> = {
  Low: 'risk-low',
  Medium: 'risk-medium',
  High: 'risk-high',
  Critical: 'risk-critical',
};

interface RiskCardProps {
  risk: DisasterRisk;
}

export const RiskCard: React.FC<RiskCardProps> = ({ risk }) => {
  const Icon = riskIcons[risk.type] || Info;

  const levelStyles = {
    Low: 'border-green-200 text-green-700 bg-green-50',
    Medium: 'border-yellow-200 text-yellow-700 bg-yellow-50',
    High: 'border-orange-200 text-orange-700 bg-orange-50',
    Critical: 'border-red-200 text-red-700 bg-red-50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-6 rounded-3xl border-2 transition-all hover:scale-[1.02] duration-300",
        riskColors[risk.level]
      )}
    >
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className={cn("p-3 rounded-2xl", levelStyles[risk.level])}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-display font-bold text-xl text-slate-900">{risk.type}</h3>
            <div className={cn(
              "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block",
              levelStyles[risk.level]
            )}>
              {risk.level} Risk
            </div>
          </div>
        </div>
        {risk.level === 'Critical' && (
          <div className="p-2 bg-red-100 text-red-600 rounded-full animate-bounce">
            <AlertTriangle className="w-5 h-5" />
          </div>
        )}
      </div>

      <p className="mb-8 text-slate-600 text-sm leading-relaxed font-medium">{risk.description}</p>

      <div className="space-y-6">
        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <h4 className="font-black text-[10px] uppercase tracking-widest mb-3 text-slate-400">Immediate Actions</h4>
          <ul className="space-y-2">
            {risk.immediateActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                {action}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
          <h4 className="font-black text-[10px] uppercase tracking-widest mb-3 text-slate-400">Prevention & Prep</h4>
          <ul className="space-y-2">
            {risk.preventionTips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <div className="flex items-start gap-2 text-sm italic text-slate-500 bg-white p-3 rounded-xl border border-slate-50">
            <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
            <p><span className="font-bold text-slate-700 not-italic">Advice:</span> {risk.evacuationAdvice}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
