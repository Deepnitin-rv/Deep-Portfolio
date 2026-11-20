import { useCallback, useEffect, useState } from 'react';
import { ArrowDownRight } from 'lucide-react';
import { ContactSection } from './components/ContactSection';
import { PythonCodeLab } from './components/PythonCodeLab';
import { RegressionLab } from './components/RegressionLab';
import { ResumeModal } from './components/ResumeModal';
import { ScatterPlot } from './components/ScatterPlot';
import type { Point, PortfolioPayload, RegressionResponse } from './types';

export default function App() {
  const [portfolio, setPortfolio] = useState<PortfolioPayload | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [selectedPresetId, setSelectedPresetId] = useState<string>('study-scores');
  const [points, setPoints] = useState<Point[]>([]);
  const [regressionResult, setRegressionResult] = useState<RegressionResponse | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [trainError, setTrainError] = useState<string | null>(null);
  const [resumeOpen, setResumeOpen] = useState<boolean>(false);
  const [avatarError, setAvatarError] = useState<boolean>(false);

  const runTraining = useCallback(
    async (
      pts: Point[],
      datasetName: string,
      method: 'gradient_descent' | 'ols' = 'gradient_descent',
      learningRate = 0.08,
      epochs = 250,
    ) => {
      if (pts.length < 2) return;
      setIsTraining(true);
      setTrainError(null);
      try {
        const res = await fetch('/api/regression/train', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            points: pts,
            datasetName,
            method,
            learningRate,
            epochs,
          }),
        });
        const data = (await res.json()) as RegressionResponse & { error?: string };
        if (!res.ok) {
          setTrainError(data.error || 'Python training failed.');
          return;
        }
        setRegressionResult(data);
        if (data.recentRuns) {
          setPortfolio((prev) => (prev ? { ...prev, recentRuns: data.recentRuns! } : prev));
        }
      } catch {
        setTrainError('Unable to reach Python regression backend.');
      } finally {
        setIsTraining(false);
      }
    },
    [],
  );

  useEffect(() => {
    let active = true;
    fetch('/api/portfolio')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load portfolio data from Python backend.');
        return res.json();
      })
      .then((data: PortfolioPayload) => {
        if (!active) return;
        setPortfolio(data);
        const firstPreset = data.presets[0];
        if (firstPreset) {
          setSelectedPresetId(firstPreset.id);
          setPoints(firstPreset.points);
          void runTraining(firstPreset.points, firstPreset.name, 'gradient_descent', 0.08, 250);
        }
      })
      .catch((err: Error) => {
        if (active) setLoadError(err.message);
      });

    return () => {
      active = false;
    };
  }, [runTraining]);

  const handleSelectPreset = (presetId: string) => {
    if (!portfolio) return;
    const found = portfolio.presets.find((p) => p.id === presetId);
    if (!found) return;
    setSelectedPresetId(found.id);
    setPoints(found.points);
    void runTraining(found.points, found.name);
  };

  const handleAddPoint = (pt: Point) => {
    const next = [...points, pt];
    setPoints(next);
    const presetName =
      portfolio?.presets.find((p) => p.id === selectedPresetId)?.name ?? 'Custom Dataset';
    void runTraining(next, presetName);
  };

  const handleRemovePoint = (index: number) => {
    if (points.length <= 2) return;
    const next = points.filter((_, idx) => idx !== index);
    setPoints(next);
    const presetName =
      portfolio?.presets.find((p) => p.id === selectedPresetId)?.name ?? 'Custom Dataset';
    void runTraining(next, presetName);
  };

  const handleResetPoints = () => {
    if (!portfolio) return;
    const found = portfolio.presets.find((p) => p.id === selectedPresetId) ?? portfolio.presets[0];
    if (!found) return;
    setPoints(found.points);
    void runTraining(found.points, found.name);
  };

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-2xl p-6 space-y-3">
          <h1 className="text-lg font-semibold text-slate-900">Portfolio Engine Unavailable</h1>
          <p className="text-sm text-slate-600">{loadError}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <p className="text-sm font-mono text-slate-500">Initializing Python portfolio engine...</p>
      </div>
    );
  }

  const { profile, education, projects, skills, spokenLanguages, architecture } = portfolio;
  const featuredProject = projects[0];
  const activePreset =
    portfolio.presets.find((p) => p.id === selectedPresetId) ?? portfolio.presets[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* 3-Zone Top Bar Contract */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            {profile.name}
          </a>

          <nav
            aria-label="Primary navigation"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
          >
            <a
              href="#about"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              About
            </a>
            <a
              href="#projects"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Projects
            </a>
            <a
              href="#python-lab"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Python Lab
            </a>
            <a
              href="#education"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Education
            </a>
            <a
              href="#contact"
              className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Contact
            </a>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => setResumeOpen(true)}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              View Resume
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero Split */}
        <section id="about" className="max-w-[1200px] mx-auto px-6 pt-12 pb-14 lg:pt-16 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between space-y-8">
              <div className="space-y-5">
                <div className="flex items-center gap-4">
                  {!avatarError ? (
                    <img
                      src={profile.avatarUrl}
                      alt={`Portrait of ${profile.name}`}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-16 h-16 rounded-xl object-cover object-top border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-900 text-white font-display font-bold text-lg flex items-center justify-center shrink-0">
                      DR
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
                    <p className="text-sm text-slate-500">
                      {profile.role} · {profile.institution}
                    </p>
                  </div>
                </div>

                <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-slate-950 leading-[1.08] [text-wrap:balance]">
                  {profile.headline}
                </h1>

                <p className="text-base text-slate-600 leading-relaxed max-w-[60ch]">
                  {profile.about}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-2">
                <a
                  href="#projects"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                >
                  Explore Regression Lab
                  <ArrowDownRight className="w-4 h-4" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={() => setResumeOpen(true)}
                  className="text-sm font-medium text-slate-700 hover:text-slate-950 underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Open Resume PDF
                </button>
              </div>
            </div>

            {/* Right Visual Anchor: Live Python Regression Viewport */}
            <div className="lg:col-span-6 flex">
              <div className="w-full bg-white border border-slate-200 rounded-2xl p-6 flex flex-col justify-between">
                <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Live Python {portfolio.pythonVersion} Model Preview
                    </p>
                    <h2 className="text-base font-semibold text-slate-900">
                      {featuredProject?.title}
                    </h2>
                  </div>
                  <span className="font-mono text-xs font-medium text-blue-600 tabular-nums">
                    {regressionResult ? regressionResult.equation : 'Training...'}
                  </span>
                </div>

                <div className="py-3">
                  <ScatterPlot
                    points={points}
                    slope={regressionResult?.slope ?? 0}
                    intercept={regressionResult?.intercept ?? 0}
                    xLabel={activePreset?.xLabel}
                    yLabel={activePreset?.yLabel}
                    interactive
                    onAddPoint={handleAddPoint}
                    onRemovePoint={handleRemovePoint}
                    height={250}
                  />
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
                  <span>Click plot to add data point and re-fit in Python</span>
                  {regressionResult && (
                    <span className="font-mono text-slate-700 tabular-nums">
                      R² = {regressionResult.r2.toFixed(4)} · MSE = {regressionResult.mse.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Full-Width Structured 4-Column Summary Strip */}
        <section className="bg-white border-y border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-7 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <div>
              <p className="text-xs text-slate-500 mb-1">Degree</p>
              <p className="text-sm font-semibold text-slate-900">B.Tech CSE (AI &amp; ML)</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Institution</p>
              <p className="text-sm font-semibold text-slate-900">
                {profile.institution} · {profile.year}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Programming Languages</p>
              <p className="text-sm font-semibold text-slate-900">
                {skills.map((s) => s.name).join(' · ')}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Spoken Languages</p>
              <p className="text-sm font-semibold text-slate-900">
                {spokenLanguages.map((l) => l.name).join(' · ')}
              </p>
            </div>
          </div>
        </section>

        {/* Section 01: Featured Project + Interactive Python Regression Lab */}
        <section id="projects" className="max-w-[1200px] mx-auto px-6 py-16 lg:py-20 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
            <div className="lg:col-span-7 space-y-3">
              <p className="text-xs font-mono text-blue-600">01. Featured Project</p>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 [text-wrap:balance]">
                {featuredProject?.title}
              </h2>
              <p className="text-base text-slate-600 leading-relaxed max-w-[65ch]">
                {featuredProject?.summary}
              </p>
            </div>

            <div className="lg:col-span-5 text-sm text-slate-600 space-y-2">
              {featuredProject?.details.map((line, i) => (
                <p key={i} className="leading-relaxed">
                  {line}
                </p>
              ))}
            </div>
          </div>

          <RegressionLab
            presets={portfolio.presets}
            selectedPresetId={selectedPresetId}
            points={points}
            result={regressionResult}
            recentRuns={portfolio.recentRuns}
            isTraining={isTraining}
            error={trainError}
            onSelectPreset={handleSelectPreset}
            onAddPoint={handleAddPoint}
            onRemovePoint={handleRemovePoint}
            onResetPoints={handleResetPoints}
            onTrain={async ({ method, learningRate, epochs }) => {
              const presetName = activePreset?.name ?? 'Custom Dataset';
              await runTraining(points, presetName, method, learningRate, epochs);
            }}
          />
        </section>

        {/* Section 02: Python Code Runner & Source Inspector */}
        <section
          id="python-lab"
          className="bg-white border-y border-slate-200 py-16 lg:py-20"
        >
          <div className="max-w-[1200px] mx-auto px-6 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="space-y-3 max-w-2xl">
                <p className="text-xs font-mono text-blue-600">02. Python-First Architecture</p>
                <h2 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-slate-950 [text-wrap:balance]">
                  Every dataset, algorithm, and API runs in Python {portfolio.pythonVersion}.
                </h2>
                <p className="text-base text-slate-600 leading-relaxed">
                  Test the from-scratch linear regression classes directly in the live Python
                  runtime below, or inspect the backend Python modules serving this portfolio.
                </p>
              </div>

              <div className="text-xs text-slate-500 font-mono space-y-1 shrink-0">
                <p>Runtime: {architecture.runtime}</p>
                <p>Database: {architecture.storage}</p>
              </div>
            </div>

            <PythonCodeLab snippets={portfolio.snippets} pythonVersion={portfolio.pythonVersion} />
          </div>
        </section>

        {/* Section 03: Education, Skills & Languages */}
        <section id="education" className="max-w-[1200px] mx-auto px-6 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left: Education & Spoken Languages */}
            <div className="lg:col-span-5 space-y-10">
              <div className="space-y-4">
                <p className="text-xs font-mono text-blue-600">03. Background</p>
                <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-950">
                  Education &amp; Languages
                </h2>
                <div className="pt-2">
                  {!avatarError ? (
                    <img
                      src={profile.avatarUrl}
                      alt={`Portrait of ${profile.name}`}
                      referrerPolicy="no-referrer"
                      onError={() => setAvatarError(true)}
                      className="w-40 h-40 rounded-2xl object-cover object-top border border-slate-200"
                    />
                  ) : (
                    <div className="w-40 h-40 rounded-2xl bg-slate-900 text-white font-display font-bold text-3xl flex items-center justify-center">
                      DR
                    </div>
                  )}
                </div>
              </div>

              {education.map((edu, idx) => (
                <div key={idx} className="pt-5 border-t border-slate-200 space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-semibold text-slate-900">{edu.degree}</h3>
                    <p className="text-sm text-slate-600">
                      {edu.institution} · {edu.status}
                    </p>
                  </div>
                  <ul className="space-y-1.5 text-sm text-slate-600 pt-1">
                    {edu.focus.map((item) => (
                      <li key={item}>· {item}</li>
                    ))}
                  </ul>
                </div>
              ))}

              <div className="pt-5 border-t border-slate-200 space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Spoken Languages</h3>
                <div className="divide-y divide-slate-200">
                  {spokenLanguages.map((lang) => (
                    <div
                      key={lang.name}
                      className="py-2.5 flex items-center justify-between text-sm"
                    >
                      <span className="font-medium text-slate-900">{lang.name}</span>
                      <span className="text-slate-500">{lang.proficiency}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Programming Skills */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <h3 className="font-display text-2xl font-semibold tracking-tight text-slate-950">
                  Programming Languages
                </h3>
                <p className="text-sm text-slate-600">
                  Core languages used across coursework, algorithmic problem solving, and AI/ML
                  implementations.
                </p>
              </div>

              <div className="divide-y divide-slate-200 border-y border-slate-200 bg-white rounded-2xl px-6">
                {skills.map((skill, idx) => (
                  <div
                    key={skill.name}
                    className="py-5 grid grid-cols-1 sm:grid-cols-12 gap-2 sm:gap-6 items-baseline"
                  >
                    <div className="sm:col-span-4 flex items-baseline gap-3">
                      <span className="font-mono text-xs text-slate-400 tabular-nums">
                        0{idx + 1}
                      </span>
                      <span className="text-base font-semibold text-slate-900">{skill.name}</span>
                    </div>
                    <p className="sm:col-span-8 text-sm text-slate-600 leading-relaxed">
                      {skill.context}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Section 04: Contact */}
        <section
          id="contact"
          className="bg-white border-t border-slate-200 py-16 lg:py-20"
        >
          <div className="max-w-[1200px] mx-auto px-6">
            <ContactSection
              email={profile.email}
              totalInquiries={portfolio.stats.totalInquiries}
              onOpenResume={() => setResumeOpen(true)}
              onInquirySaved={(count) =>
                setPortfolio((prev) =>
                  prev ? { ...prev, stats: { ...prev.stats, totalInquiries: count } } : prev,
                )
              }
            />
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-[1200px] mx-auto px-6 py-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            {profile.name} · {profile.institution} · {profile.email}
          </p>
          <div className="flex items-center gap-6">
            <a href="#about" className="hover:text-slate-900 transition-colors">
              About
            </a>
            <a href="#projects" className="hover:text-slate-900 transition-colors">
              Projects
            </a>
            <a href="#python-lab" className="hover:text-slate-900 transition-colors">
              Python Lab
            </a>
            <button
              type="button"
              onClick={() => setResumeOpen(true)}
              className="hover:text-slate-900 transition-colors cursor-pointer"
            >
              Resume PDF
            </button>
          </div>
        </div>
      </footer>

      <ResumeModal
        open={resumeOpen}
        onClose={() => setResumeOpen(false)}
        portfolio={portfolio}
      />
    </div>
  );
}
