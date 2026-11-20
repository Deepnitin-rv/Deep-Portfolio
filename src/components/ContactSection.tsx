import { useState, type FormEvent } from 'react';
import { Check, Copy, Download, FileText, Mail, Send } from 'lucide-react';

interface ContactSectionProps {
  email: string;
  totalInquiries: number;
  onOpenResume: () => void;
  onInquirySaved: (newCount: number) => void;
}

export function ContactSection({
  email,
  totalInquiries,
  onOpenResume,
  onInquirySaved,
}: ContactSectionProps) {
  const [name, setName] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API fallback ignored if unsupported
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: senderEmail,
          subject,
          message,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        stats?: { totalInquiries: number };
      };

      if (!res.ok) {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Could not save message. Check your inputs and try again.',
        });
        return;
      }

      setName('');
      setSenderEmail('');
      setSubject('');
      setMessage('');
      if (data.stats) {
        onInquirySaved(data.stats.totalInquiries);
      }
      setStatusMessage({
        type: 'success',
        text: 'Message recorded in Python SQLite database. Thank you for reaching out.',
      });
    } catch {
      setStatusMessage({
        type: 'error',
        text: 'Network error communicating with the Python backend.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
      {/* Left Info & Exports */}
      <div className="lg:col-span-5 space-y-8">
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            Get in Touch
          </h2>
          <p className="text-base text-slate-600 leading-relaxed max-w-md">
            Open to AI/ML learning collaborations, Python engineering projects, and internship
            opportunities.
          </p>
        </div>

        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div>
            <p className="text-xs text-slate-500 mb-1">Direct Email</p>
            <div className="flex flex-wrap items-center gap-3">
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
              >
                <Mail className="w-4 h-4 text-slate-500" aria-hidden="true" />
                {email}
              </a>
              <button
                type="button"
                onClick={() => void handleCopyEmail()}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 mb-3">Resume &amp; Python Exports</p>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={onOpenResume}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                View Resume PDF
              </button>
              <a
                href="/api/resume.txt"
                download="Deepnitin_R_V_Resume.txt"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Resume .txt
              </a>
              <a
                href="/api/resume.json"
                download="Deepnitin_R_V_Resume.json"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0"
              >
                <Download className="w-3.5 h-3.5" aria-hidden="true" />
                Resume .json
              </a>
            </div>
          </div>

          <p className="text-xs text-slate-500 pt-2 font-mono tabular-nums">
            Inquiries logged in Python SQLite: {totalInquiries}
          </p>
        </div>
      </div>

      {/* Right Contact Form */}
      <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="contact-name" className="block text-xs font-medium text-slate-700 mb-1.5">
                Your Name
              </label>
              <input
                id="contact-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="contact-email" className="block text-xs font-medium text-slate-700 mb-1.5">
                Email Address
              </label>
              <input
                id="contact-email"
                type="email"
                required
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="contact-subject" className="block text-xs font-medium text-slate-700 mb-1.5">
              Subject
            </label>
            <input
              id="contact-subject"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Project collaboration or internship inquiry"
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div>
            <label htmlFor="contact-message" className="block text-xs font-medium text-slate-700 mb-1.5">
              Message
            </label>
            <textarea
              id="contact-message"
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 resize-y"
            />
          </div>

          {statusMessage && (
            <div
              role="status"
              className={`flex items-center gap-2 text-xs font-medium px-3.5 py-2.5 rounded-lg border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {statusMessage.type === 'success' && (
                <Check className="w-4 h-4 shrink-0" aria-hidden="true" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              {submitting ? 'Saving to Python SQLite...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
