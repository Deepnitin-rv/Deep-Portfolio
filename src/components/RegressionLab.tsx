import { useState } from 'react';
import { Play, RotateCcw } from 'lucide-react';
import type { DatasetPreset, Point, RegressionResponse, RegressionRun } from '../types';
import { LossChart, ScatterPlot } from './ScatterPlot';

interface RegressionLabProps {
  presets: DatasetPreset[];
  selectedPresetId: string;
  points: Point[];
  result: RegressionResponse | null;
  recentRuns: RegressionRun[];
  isTraining: boolean;
  error: string | null;
  onSelectPreset: (presetId: string) => void;
  onAddPoint: (point: Point) => void;
  onRemovePoint: (index: number) => void;
  onResetPoints: () => void;
  onTrain: (params: {
    method: 'gradient_descent' | 'ols';
    learningRate: number;
    epochs: number;
  }) => Promise<void>;
}

export function RegressionLab({
  presets,
  selectedPresetId,
  points,
  result,
  recentRuns,
  isTraining,
  error,
  onSelectPreset,
  onAddPoint,
  onRemovePoint,
  onResetPoints,
  onTrain,
}: RegressionLabProps) {
  const [method, setMethod] = useState<'gradient_descent' | 'ols'>('gradient_descent');
  const [learningRate, setLearningRate] = useState<number>(0.08);
  const [epochs, setEpochs] = useState<number>(250);
  const [predictX, setPredictX] = useState<string>('11');
  const [predictedY, setPredictedY] = useState<number | null>(null);
  const [isPredicting, setIsPredicting] = useState<boolean>(false);

  const activePreset = presets.find((p) => p.id === selectedPresetId) ?? presets[0];

  const handleMethodChange = (next: 'gradient_descent' | 'ols') => {
    setMethod(next);
    void onTrain({ method: next, learningRate, epochs });
  };

  const handleTrainSubmit = () => {
    void onTrain({ method, learningRate, epochs });
  };

  const handlePredict = async () => {
    if (!result) return;
    const num = Number(predictX);
    if (Number.isNaN(num)) return;

    setIsPredicting(true);
    try {
      const res = await fetch('/api/regression/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slope: result.slope,
          intercept: result.intercept,
          x: num,
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { predictedY: number };
        setPredictedY(data.predictedY);
      }
    } finally {
      setIsPredicting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Dataset Preset</p>
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-lg">
              {presets.map((preset) => {
                const active = preset.id === selectedPresetId;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectPreset(preset.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      active
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Optimization Method</p>
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => handleMethodChange('gradient_descent')}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  method === 'gradient_descent'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Gradient Descent
              </button>
              <button
                type="button"
                onClick={() => handleMethodChange('ols')}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  method === 'ols'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Closed-Form OLS
              </button>
            </div>
          </div>

          {method === 'gradient_descent' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="lr-slider" className="font-medium text-slate-700">
                    Learning Rate
                  </label>
                  <span className="font-mono text-slate-900 tabular-nums">
                    {learningRate.toFixed(2)}
                  </span>
                </div>
                <input
                  id="lr-slider"
                  type="range"
                  min={0.01}
                  max={0.4}
                  step={0.01}
                  value={learningRate}
                  onChange={(e) => setLearningRate(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label htmlFor="epochs-slider" className="font-medium text-slate-700">
                    Epochs
                  </label>
                  <span className="font-mono text-slate-900 tabular-nums">{epochs}</span>
                </div>
                <input
                  id="epochs-slider"
                  type="range"
                  min={20}
                  max={1000}
                  step={10}
                  value={epochs}
                  onChange={(e) => setEpochs(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              type="button"
              onClick={handleTrainSubmit}
              disabled={isTraining}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              {isTraining ? 'Training in Python...' : 'Train in Python'}
            </button>

            <button
              type="button"
              onClick={onResetPoints}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset Points
            </button>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Python Metrics Readout */}
          {result && (
            <div className="pt-4 border-t border-slate-200 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Fitted Equation (Python Output)</p>
                <p className="font-mono text-base font-semibold text-slate-900">
                  {result.equation}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-slate-500">Slope (m)</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {result.slope.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Intercept (b)</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {result.intercept.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">R-Squared</p>
                  <p className="font-mono text-sm font-semibold text-blue-600 tabular-nums">
                    {result.r2.toFixed(4)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">MSE</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {result.mse.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">RMSE</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {result.rmse.toFixed(3)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Samples</p>
                  <p className="font-mono text-sm font-semibold text-slate-900 tabular-nums">
                    {points.length}
                  </p>
                </div>
              </div>

              {/* Inference Input */}
              <div className="pt-3 border-t border-slate-100">
                <label htmlFor="predict-x" className="block text-xs font-medium text-slate-600 mb-2">
                  Run Prediction via Python
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="predict-x"
                    type="number"
                    step="0.5"
                    value={predictX}
                    onChange={(e) => setPredictX(e.target.value)}
                    className="w-28 px-3 py-1.5 text-sm font-mono bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                    placeholder="x value"
                  />
                  <button
                    type="button"
                    onClick={() => void handlePredict()}
                    disabled={isPredicting}
                    className="px-3.5 py-1.5 text-xs font-medium text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {isPredicting ? 'Computing...' : 'Predict Y'}
                  </button>
                  {predictedY !== null && (
                    <span className="font-mono text-sm font-semibold text-blue-600 tabular-nums">
                      y = {predictedY.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Visualization */}
        <div className="lg:col-span-7 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {activePreset?.name ?? 'Interactive Regression Plane'}
              </h3>
              <p className="text-xs text-slate-500">
                Click anywhere on the plot to add a sample, or click an existing point to remove it.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {points.length} points
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
            <ScatterPlot
              points={points}
              slope={result?.slope ?? 0}
              intercept={result?.intercept ?? 0}
              xLabel={activePreset?.xLabel ?? 'X Input'}
              yLabel={activePreset?.yLabel ?? 'Y Target'}
              interactive
              onAddPoint={onAddPoint}
              onRemovePoint={onRemovePoint}
              height={320}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-xs font-medium text-slate-600">
                Loss Convergence (MSE across Epochs)
              </p>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {result?.method === 'ols' ? 'Analytical Step' : `${result?.epochs ?? epochs} epochs`}
              </span>
            </div>
            <LossChart history={result?.lossHistory ?? []} />
          </div>

          {recentRuns.length > 0 && (
            <div className="pt-3 border-t border-slate-200">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Recent Runs Logged in Python SQLite
              </p>
              <div className="divide-y divide-slate-100 text-xs">
                {recentRuns.slice(0, 3).map((run) => (
                  <div
                    key={run.id}
                    className="py-1.5 flex items-center justify-between gap-4 text-slate-600"
                  >
                    <span className="truncate font-medium text-slate-800">{run.datasetName}</span>
                    <span className="font-mono text-slate-500 whitespace-nowrap shrink-0 tabular-nums">
                      {run.method === 'ols' ? 'OLS' : 'GD'} · m={run.slope.toFixed(2)} · R²={run.r2.toFixed(3)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
