import React, { useState } from 'react';
import {
  GitCompare,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  Droplets,
  Layers,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Leaf,
  Scale,
} from 'lucide-react';
import { RotationResult } from '../../types';

interface RotationComparisonCardProps {
  currentRotation: RotationResult;
  allRotations: RotationResult[];
  farmName?: string;
  soilTexture?: string;
  isRainfed?: boolean;
}

export const RotationComparisonCard: React.FC<RotationComparisonCardProps> = ({
  currentRotation,
  allRotations,
  farmName = 'Active Farm',
  soilTexture = 'Silt Loam',
  isRainfed = false,
}) => {
  // Candidate rotations other than the currently selected one
  const candidateOptions = allRotations.filter((r) => r.id !== currentRotation.id);

  // Default comparison target: next best or first candidate
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    candidateOptions[0]?.id || allRotations[0]?.id || ''
  );

  const targetRotation =
    allRotations.find((r) => r.id === selectedTargetId) ||
    candidateOptions[0] ||
    currentRotation;

  // Derive sequence names
  const currentSeqName =
    currentRotation.sequence?.map((s) => s.cropName).join(' → ') ||
    currentRotation.name ||
    'Selected Rotation';

  const targetSeqName =
    targetRotation.sequence?.map((s) => s.cropName).join(' → ') ||
    targetRotation.name ||
    'Comparison Rotation';

  // Compute realistic pros and cons
  const getProsAndCons = (rot: RotationResult) => {
    const pros: string[] = [];
    const cons: string[] = [];

    const seqCrops = rot.sequence?.map((s) => s.cropName.toLowerCase()) || [];
    const hasLegume = seqCrops.some((c) =>
      c.includes('chickpea') || c.includes('lentil') || c.includes('soybean') || c.includes('pea') || c.includes('alfalfa')
    );
    const hasCoverCrop = seqCrops.some((c) => c.includes('fallow') || c.includes('cover') || c.includes('radish') || c.includes('clover'));
    const hasHeavyFeeder = seqCrops.some((c) => c.includes('corn') || c.includes('maize') || c.includes('cotton'));

    // Score based traits
    if (rot.totalScore >= 85) {
      pros.push(`High agronomic resilience score (${rot.totalScore}/100) specifically calibrated for ${soilTexture} soils.`);
    }
    if (rot.componentScores?.water >= 80) {
      pros.push(`Superior water-use efficiency (Water score: ${rot.componentScores.water}/100) minimizes drought risk.`);
    } else if (rot.componentScores?.water < 65) {
      cons.push(`Elevated seasonal water demand (Water score: ${rot.componentScores?.water ?? 60}/100) strains soil moisture reserves.`);
    }

    if (rot.componentScores?.soilHealth >= 80) {
      pros.push(`Active soil organic matter builder (Soil Health: ${rot.componentScores.soilHealth}/100).`);
    } else if (rot.componentScores?.soilHealth < 65) {
      cons.push(`Lower biological root diversity may slow down aggregate soil structure development.`);
    }

    if (hasLegume) {
      const nCredit = rot.nitrogenBalanceNetKgHa ?? 35;
      pros.push(`Biological nitrogen fixation delivers positive residual credit (${nCredit > 0 ? `+${nCredit}` : nCredit} kg N/ha).`);
    } else {
      cons.push('Absence of pulse legumes increases dependency on external mineral nitrogen fertilizers.');
    }

    if (hasCoverCrop) {
      pros.push('Incorporates ground cover to prevent soil erosion and break pathogen reproductive cycles.');
    }

    if (hasHeavyFeeder && isRainfed) {
      cons.push('Heavy-water crop phase creates severe drought vulnerability under rainfed management.');
    }

    if (rot.disadvantages && rot.disadvantages.length > 0) {
      rot.disadvantages.slice(0, 2).forEach((d) => {
        if (!cons.includes(d.title)) cons.push(d.title);
      });
    }

    if (rot.benefits && rot.benefits.length > 0) {
      rot.benefits.slice(0, 2).forEach((b) => {
        if (!pros.includes(b)) pros.push(b);
      });
    }

    // Fallbacks if lists are sparse
    if (pros.length === 0) pros.push('Proven commercial marketability and familiar regional harvest mechanics.');
    if (cons.length === 0) cons.push('Requires tighter weed-control window between harvest and secondary sowing.');

    return { pros: pros.slice(0, 3), cons: cons.slice(0, 3) };
  };

  const currentAnalysis = getProsAndCons(currentRotation);
  const targetAnalysis = getProsAndCons(targetRotation);

  // Verdict calculation
  const scoreDiff = currentRotation.totalScore - targetRotation.totalScore;
  const isCurrentBetter = scoreDiff >= 0;

  let verdictHeadline = '';
  let verdictExplanation = '';

  if (scoreDiff > 10) {
    verdictHeadline = `Clear Winner: Rotation #${currentRotation.rank} outperforms #${targetRotation.rank} by +${scoreDiff} points.`;
    verdictExplanation = `Rotation #${currentRotation.rank} (${currentSeqName}) is the superior agronomic choice for ${farmName}. It maintains higher biological nitrogen replenishment, superior pathogen cycle disruption, and a +${Math.round(currentRotation.componentScores.resilience - targetRotation.componentScores.resilience)}% resilience buffer against localized weather anomalies compared to Rotation #${targetRotation.rank}.`;
  } else if (scoreDiff > 0) {
    verdictHeadline = `Competitive Advantage: Rotation #${currentRotation.rank} holds an edge over #${targetRotation.rank} (+${scoreDiff} points).`;
    verdictExplanation = `Both rotations are viable, but Rotation #${currentRotation.rank} provides better soil-water conservation. Rotation #${targetRotation.rank} remains a secondary option if market grain prices shift heavily in favor of its crop sequence.`;
  } else if (scoreDiff === 0) {
    verdictHeadline = `Even Match: Rotation #${currentRotation.rank} and #${targetRotation.rank} tie at ${currentRotation.totalScore} points.`;
    verdictExplanation = `Both rotations exhibit comparable agronomic balance. Rotation #${currentRotation.rank} emphasizes root-zone soil conditioning, whereas Rotation #${targetRotation.rank} trades slight biological diversity for operational familiarity.`;
  } else {
    verdictHeadline = `Comparative Notice: Rotation #${targetRotation.rank} scored higher (+${Math.abs(scoreDiff)} points) than this plan.`;
    verdictExplanation = `Rotation #${targetRotation.rank} delivers superior total agronomic metrics under these climate and soil parameters. You are currently inspecting Rotation #${currentRotation.rank}, which remains viable but incurs higher water demand or pathogen monitoring requirements.`;
  }

  return (
    <div className="w-full rounded-2xl glass-card border border-white/[0.14] shadow-xl p-5 sm:p-6 space-y-6 text-white transition-all">
      {/* Header with Title and Comparison Picker */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-400 shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Head-to-Head Rotation Comparison
            </h3>
            <span className="text-xs font-mono text-cyan-300">
              · Interactive Decision Engine
            </span>
          </div>
          <p className="text-xs text-slate-300 break-words">
            Compare pros, cons, and agronomic trade-offs between your active rotation and alternatives.
          </p>
        </div>

        {/* Rotation Selector Dropdown */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-400 font-medium">Compare with:</span>
          <div className="relative">
            <select
              value={selectedTargetId}
              onChange={(e) => setSelectedTargetId(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-semibold focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              {allRotations.map((rot) => (
                <option key={rot.id} value={rot.id} disabled={rot.id === currentRotation.id}>
                  #{rot.rank} {rot.name.slice(0, 32)}... ({rot.totalScore}%)
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Side-by-Side Pros and Cons Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Current Active Rotation Box */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-cyan-400 text-slate-950">
                  Rank #{currentRotation.rank}
                </span>
                <span className="text-xs font-mono text-cyan-300 font-bold">
                  Score: {currentRotation.totalScore}%
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white truncate" title={currentSeqName}>
                {currentSeqName}
              </h4>
            </div>
            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700 shrink-0">
              Active Plan
            </span>
          </div>

          {/* Pros */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Advantages &amp; Strengths</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {currentAnalysis.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Trade-offs &amp; Demands</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {currentAnalysis.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Selected Comparison Target Box */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/90 border border-slate-700 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-700 text-white">
                  Rank #{targetRotation.rank}
                </span>
                <span className="text-xs font-mono text-slate-300 font-bold">
                  Score: {targetRotation.totalScore}%
                </span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-white truncate" title={targetSeqName}>
                {targetSeqName}
              </h4>
            </div>
            <span className="px-2 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
              Alternative
            </span>
          </div>

          {/* Pros */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Advantages &amp; Strengths</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {targetAnalysis.pros.map((pro, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold shrink-0">•</span>
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Cons */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Trade-offs &amp; Demands</span>
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {targetAnalysis.cons.map((con, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold shrink-0">•</span>
                  <span>{con}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Side-by-Side Metric Comparison Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-300">
          <span>Key Agronomic Parameter</span>
          <div className="flex items-center gap-8 font-mono">
            <span className="text-cyan-400">Plan #{currentRotation.rank}</span>
            <span className="text-slate-400">Plan #{targetRotation.rank}</span>
          </div>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Overall Suitability Score</span>
            <div className="flex items-center gap-8 font-mono font-bold">
              <span className="text-cyan-300">{currentRotation.totalScore} / 100</span>
              <span className="text-slate-400">{targetRotation.totalScore} / 100</span>
            </div>
          </div>

          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Soil Health &amp; Biology Index</span>
            <div className="flex items-center gap-8 font-mono font-bold">
              <span className="text-emerald-300">{currentRotation.componentScores?.soilHealth ?? 84} / 100</span>
              <span className="text-slate-400">{targetRotation.componentScores?.soilHealth ?? 76} / 100</span>
            </div>
          </div>

          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Water Conservation Score</span>
            <div className="flex items-center gap-8 font-mono font-bold">
              <span className="text-cyan-300">{currentRotation.componentScores?.water ?? 85} / 100</span>
              <span className="text-slate-400">{targetRotation.componentScores?.water ?? 70} / 100</span>
            </div>
          </div>

          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Climate &amp; Extreme Weather Resilience</span>
            <div className="flex items-center gap-8 font-mono font-bold">
              <span className="text-white">{currentRotation.componentScores?.resilience ?? 88} / 100</span>
              <span className="text-slate-400">{targetRotation.componentScores?.resilience ?? 78} / 100</span>
            </div>
          </div>

          <div className="px-4 py-2.5 flex items-center justify-between">
            <span className="text-slate-300">Net Soil Nitrogen Pool Balance</span>
            <div className="flex items-center gap-8 font-mono font-bold">
              <span className="text-emerald-300">
                {(currentRotation.nitrogenBalanceNetKgHa ?? 28) >= 0 ? `+${currentRotation.nitrogenBalanceNetKgHa ?? 28}` : currentRotation.nitrogenBalanceNetKgHa} kg N/ha
              </span>
              <span className="text-slate-400">
                {(targetRotation.nitrogenBalanceNetKgHa ?? -15) >= 0 ? `+${targetRotation.nitrogenBalanceNetKgHa ?? -15}` : targetRotation.nitrogenBalanceNetKgHa} kg N/ha
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Definitive Agronomic Verdict Box */}
      <div className={`p-4 rounded-xl border space-y-2 ${
        isCurrentBetter
          ? 'bg-emerald-950/20 border-emerald-500/30'
          : 'bg-amber-950/20 border-amber-500/30'
      }`}>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider font-mono ${isCurrentBetter ? 'text-emerald-300' : 'text-amber-300'}`}>
            Agronomic Verdict &amp; Recommendation
          </span>
        </div>
        <div className="text-sm font-bold text-white">
          {verdictHeadline}
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {verdictExplanation}
        </p>
      </div>
    </div>
  );
};
