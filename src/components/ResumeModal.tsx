import { useEffect, useState } from 'react';
import { Download, FileCode2, FileText, X } from 'lucide-react';
import type { PortfolioPayload } from '../types';

interface ResumeModalProps {
  open: boolean;
  onClose: () => void;
  portfolio: PortfolioPayload;
}

export function ResumeModal({ open, onClose, portfolio }: ResumeModalProps) {
  const [viewMode, setViewMode] = useState<'rendered' | 'structured'>('rendered');
  const [previewFailed, setPreviewFailed] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const triggerDownload = async (url: string, filename: string, key: string) => {
    setDownloading(key);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } finally {
      setDownloading(null);
    }
  };

  const { profile, education, projects, skills, spokenLanguages } = portfolio;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="resume-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h2 id="resume-modal-title" className="text-lg font-semibold text-slate-900">
                {profile.name} — Curriculum Vitae
              </h2>
              <p className="text-xs text-slate-500">
                Rendered via Python {portfolio.pythonVersion} with direct PDF, TXT, and JSON exports
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
              <button
                type="button"
                onClick={() => setViewMode('rendered')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'rendered'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Original PDF Page
              </button>
              <button
                type="button"
                onClick={() => setViewMode('structured')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  viewMode === 'structured'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Text Sheet
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void triggerDownload('/api/resume.pdf', 'Deepnitin_R_V_Resume.pdf', 'pdf')}
              disabled={downloading === 'pdf'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" aria-hidden="true" />
              {downloading === 'pdf' ? 'Saving...' : 'Download PDF'}
            </button>
            <button
              type="button"
              onClick={() => void triggerDownload('/api/resume.txt', 'Deepnitin_R_V_Resume.txt', 'txt')}
              disabled={downloading === 'txt'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" aria-hidden="true" />
              Python .txt
            </button>
            <button
              type="button"
              onClick={() => void triggerDownload('/api/resume.json', 'Deepnitin_R_V_Resume.json', 'json')}
              disabled={downloading === 'json'}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <FileCode2 className="w-3.5 h-3.5" aria-hidden="true" />
              Python .json
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close resume modal"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 overflow-y-auto p-4 sm:p-8 flex justify-center">
          {viewMode === 'rendered' && !previewFailed ? (
            <div className="w-full max-w-[760px] bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <img
                src={profile.resumePreviewUrl || '/api/resume/preview.png'}
                alt={`${profile.name} Resume Page 1`}
                referrerPolicy="no-referrer"
                onError={() => setPreviewFailed(true)}
                className="w-full h-auto block"
              />
            </div>
          ) : (
            <div className="w-full max-w-[760px] bg-white border border-slate-200 rounded-xl shadow-sm p-8 sm:p-12 space-y-8 text-slate-900">
              <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-200">
                <div className="space-y-1">
                  <h3 className="font-display text-3xl font-bold tracking-tight">{profile.name}</h3>
                  <p className="text-sm text-slate-600">{profile.email}</p>
                </div>
                <img
                  src={profile.avatarUrl}
                  alt={`Portrait of ${profile.name}`}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-lg object-cover object-top border border-slate-200 shrink-0"
                />
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-semibold text-slate-900">About Me</h4>
                <p className="text-sm text-slate-700 leading-relaxed">{profile.about}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-semibold text-slate-900">Education</h4>
                {education.map((edu, idx) => (
                  <div key={idx}>
                    <p className="text-sm font-semibold text-slate-900">{edu.degree}</p>
                    <p className="text-sm text-slate-600">
                      {edu.institution} | {edu.status}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-semibold text-slate-900">Projects</h4>
                {projects.map((proj) => (
                  <div key={proj.id} className="space-y-1">
                    <p className="text-sm font-semibold text-slate-900">{proj.title}</p>
                    <p className="text-sm text-slate-700 leading-relaxed">{proj.summary}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-semibold text-slate-900">Skills</h4>
                <p className="text-sm text-slate-700">
                  <span className="font-medium text-slate-900">Programming Languages:</span>{' '}
                  {skills.map((s) => s.name).join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-semibold text-slate-900">Languages</h4>
                <p className="text-sm text-slate-700">
                  {spokenLanguages.map((l) => l.name).join(' · ')}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
