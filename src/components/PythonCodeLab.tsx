import { useEffect, useState } from 'react';
import { Play } from 'lucide-react';
import type { CodeSnippet, PythonSourceFile } from '../types';

interface PythonCodeLabProps {
  snippets: CodeSnippet[];
  pythonVersion: string;
}

interface RunOutput {
  ok: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
}

export function PythonCodeLab({ snippets, pythonVersion }: PythonCodeLabProps) {
  const [activeTab, setActiveTab] = useState<'runner' | 'source'>('runner');
  const [selectedSnippetId, setSelectedSnippetId] = useState<string>(snippets[0]?.id ?? '');
  const [code, setCode] = useState<string>(snippets[0]?.code ?? '');
  const [output, setOutput] = useState<RunOutput | null>(null);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const [sourceFiles, setSourceFiles] = useState<PythonSourceFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('linear_regression.py');
  const [sourceError, setSourceError] = useState<string | null>(null);

  useEffect(() => {
    if (snippets.length > 0 && !code) {
      setSelectedSnippetId(snippets[0].id);
      setCode(snippets[0].code);
    }
  }, [snippets, code]);

  useEffect(() => {
    if (activeTab !== 'source' || sourceFiles.length > 0) return;
    fetch('/api/source')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load Python source files.');
        return r.json();
      })
      .then((data: { files: PythonSourceFile[] }) => {
        setSourceFiles(data.files);
        if (data.files.length > 0) {
          setSelectedFile(data.files[0].name);
        }
      })
      .catch((err: Error) => setSourceError(err.message));
  }, [activeTab, sourceFiles.length]);

  const handleSelectSnippet = (snippet: CodeSnippet) => {
    setSelectedSnippetId(snippet.id);
    setCode(snippet.code);
    setOutput(null);
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    try {
      const res = await fetch('/api/python/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = (await res.json()) as RunOutput;
      setOutput(data);
    } catch {
      setOutput({
        ok: false,
        stdout: '',
        stderr: 'Could not reach the Python 3 runtime.',
        durationMs: 0,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const activeSource = sourceFiles.find((f) => f.name === selectedFile);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('runner')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'runner'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Live Python {pythonVersion} Runner
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('source')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'source'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Backend Python Source
          </button>
        </div>

        <p className="text-xs text-slate-500 font-mono">
          Standard Library Only · Zero External ML Frameworks
        </p>
      </div>

      {activeTab === 'runner' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Code Editor */}
          <div className="lg:col-span-7 p-6 border-b lg:border-b-0 lg:border-r border-slate-200 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {snippets.map((snippet) => (
                  <button
                    key={snippet.id}
                    type="button"
                    onClick={() => handleSelectSnippet(snippet)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedSnippetId === snippet.id
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {snippet.title}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => void handleRunCode()}
                disabled={isRunning}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" aria-hidden="true" />
                {isRunning ? 'Executing...' : 'Run Python'}
              </button>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              aria-label="Python 3 source code editor"
              className="w-full h-64 p-4 font-mono text-xs leading-relaxed text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
            />
          </div>

          {/* Output Console */}
          <div className="lg:col-span-5 p-6 bg-slate-950 text-slate-100 flex flex-col justify-between min-h-[320px]">
            <div>
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-xs">
                <span className="font-mono text-slate-300">Python {pythonVersion} Output</span>
                {output && (
                  <span className="font-mono text-slate-400 tabular-nums">
                    {output.durationMs.toFixed(1)} ms
                  </span>
                )}
              </div>

              {!output ? (
                <p className="font-mono text-xs text-slate-400 leading-relaxed">
                  Click &ldquo;Run Python&rdquo; to execute this snippet inside the portfolio&rsquo;s
                  Python {pythonVersion} subprocess against{' '}
                  <span className="text-slate-200">linear_regression.py</span> and{' '}
                  <span className="text-slate-200">portfolio_data.py</span>.
                </p>
              ) : (
                <div className="space-y-3 font-mono text-xs leading-relaxed">
                  {output.stdout && (
                    <pre className="whitespace-pre-wrap text-slate-100">{output.stdout}</pre>
                  )}
                  {output.stderr && (
                    <pre className="whitespace-pre-wrap text-red-400">{output.stderr}</pre>
                  )}
                  {!output.stdout && !output.stderr && (
                    <p className="text-slate-400">Process exited cleanly with no stdout output.</p>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 mt-6 border-t border-slate-800 text-[11px] font-mono text-slate-400">
              Allowed modules: linear_regression, portfolio_data, math, statistics, json, random
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {sourceFiles.map((f) => (
                <button
                  key={f.name}
                  type="button"
                  onClick={() => setSelectedFile(f.name)}
                  className={`px-3 py-1.5 text-xs font-mono rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedFile === f.name
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {f.filename}
                </button>
              ))}
            </div>
            {activeSource && (
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                {activeSource.lines} lines
              </span>
            )}
          </div>

          {sourceError ? (
            <p className="text-sm text-red-700">{sourceError}</p>
          ) : activeSource ? (
            <pre className="p-4 bg-slate-950 text-slate-100 rounded-xl font-mono text-xs leading-relaxed overflow-x-auto max-h-[420px] overflow-y-auto">
              <code>{activeSource.code}</code>
            </pre>
          ) : (
            <p className="text-sm text-slate-500">Loading Python source files...</p>
          )}
        </div>
      )}
    </div>
  );
}
