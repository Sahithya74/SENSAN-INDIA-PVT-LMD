import { useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import { ArrowRight, Check, LoaderCircle, Mail } from 'lucide-react';
import { company } from '../../content/company';
import { SUBJECTS, isConfigured, mailtoFor, submitEnquiry, validate, validateField, type Enquiry, type Errors, type Field } from './enquiry';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const EMPTY: Enquiry = { name: '', email: '', phone: '', subject: '', message: '', botcheck: false };

const FIELDS: { field: Field; label: string; type?: string; autoComplete?: string; optional?: boolean }[] = [
  { field: 'name', label: 'Full name', autoComplete: 'name' },
  { field: 'email', label: 'Email', type: 'email', autoComplete: 'email' },
  { field: 'phone', label: 'Phone', type: 'tel', autoComplete: 'tel', optional: true },
];

export function ContactForm() {
  const [data, setData] = useState<Enquiry>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [status, setStatus] = useState<Status>('idle');
  const [failure, setFailure] = useState('');
  const form = useRef<HTMLFormElement>(null);
  const online = isConfigured();

  const update = (field: Field) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = event.target.value;
    setData((d) => ({ ...d, [field]: value }));
    if (touched[field]) setErrors((e) => ({ ...e, [field]: validateField(field, value) }));
  };
  const blur = (field: Field) => () => {
    setTouched((t) => ({ ...t, [field]: true }));
    setErrors((e) => ({ ...e, [field]: validateField(field, data[field]) }));
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const found = validate(data);
    setErrors(found);
    setTouched({ name: true, email: true, phone: true, subject: true, message: true });
    const first = Object.keys(found)[0];
    if (first) {
      form.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    if (!online) {
      window.location.href = mailtoFor(data);
      return;
    }
    setStatus('sending');
    const result = await submitEnquiry(data);
    if (result.ok) {
      setStatus('sent');
      setData(EMPTY);
      setTouched({});
      return;
    }
    setStatus('error');
    setFailure(
      result.reason === 'network'
        ? 'Your message could not be sent — please check your connection and try again.'
        : `Your message could not be delivered${result.message ? ` (${result.message})` : ''}. Please try again, or email us directly.`,
    );
  };

  const describedBy = (field: Field) => (errors[field] && touched[field] ? `${field}-error` : undefined);

  if (status === 'sent') {
    return (
      <div role="status" className="metal-border rounded-sm bg-graphite/40 p-10">
        <span className="grid h-12 w-12 place-items-center rounded-full border border-silver/40 text-porcelain">
          <Check size={20} strokeWidth={1.5} />
        </span>
        <h3 className="metal-text mt-6 font-display text-display-md font-medium">Thank you — your enquiry has been sent.</h3>
        <p className="mt-4 max-w-md text-silver">It has been delivered to the SENSAN team, who can reply to the email address you provided.</p>
        <button type="button" onClick={() => setStatus('idle')} className="label mt-8 text-chrome underline decoration-silver/40 underline-offset-4">
          Send another enquiry
        </button>
      </div>
    );
  }

  return (
    <form ref={form} noValidate onSubmit={onSubmit} aria-describedby={online ? undefined : 'form-mode'} className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
      {!online && (
        <p id="form-mode" className="flex gap-3 border-l border-silver/40 pl-4 text-[14px] leading-relaxed text-silver sm:col-span-2">
          <Mail size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Online enquiries are being set up. Until then, this form opens your email app with your message ready to send to{' '}
            <a className="text-porcelain underline decoration-silver/40 underline-offset-4" href={`mailto:${company.email}`}>
              {company.email}
            </a>
            .
          </span>
        </p>
      )}

      {FIELDS.map(({ field, label, type = 'text', autoComplete, optional }) => (
        <div key={field}>
          <label htmlFor={field} className="label text-fog">
            {label} {optional && <span className="normal-case tracking-normal">(optional)</span>}
          </label>
          <input
            id={field}
            name={field}
            type={type}
            autoComplete={autoComplete}
            value={data[field]}
            onChange={update(field)}
            onBlur={blur(field)}
            aria-invalid={errors[field] && touched[field] ? true : undefined}
            aria-describedby={describedBy(field)}
            aria-required={!optional}
            className="field"
          />
          {errors[field] && touched[field] && (
            <p id={`${field}-error`} className="mt-2 text-[13px] text-[#e0a39b]">
              {errors[field]}
            </p>
          )}
        </div>
      ))}

      <div>
        <label htmlFor="subject" className="label text-fog">
          Subject
        </label>
        <select
          id="subject"
          name="subject"
          value={data.subject}
          onChange={update('subject')}
          onBlur={blur('subject')}
          aria-invalid={errors.subject && touched.subject ? true : undefined}
          aria-describedby={describedBy('subject')}
          aria-required
          className="field"
        >
          <option value="">Select a subject</option>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        {errors.subject && touched.subject && (
          <p id="subject-error" className="mt-2 text-[13px] text-[#e0a39b]">
            {errors.subject}
          </p>
        )}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor="message" className="label text-fog">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          value={data.message}
          onChange={update('message')}
          onBlur={blur('message')}
          aria-invalid={errors.message && touched.message ? true : undefined}
          aria-describedby={describedBy('message')}
          aria-required
          className="field resize-y"
        />
        {errors.message && touched.message && (
          <p id="message-error" className="mt-2 text-[13px] text-[#e0a39b]">
            {errors.message}
          </p>
        )}
      </div>

      {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
      <input
        type="checkbox"
        name="botcheck"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        checked={data.botcheck}
        onChange={(e) => setData((d) => ({ ...d, botcheck: e.target.checked }))}
      />

      <div className="flex flex-wrap items-center gap-6 sm:col-span-2">
        <button
          type="submit"
          disabled={status === 'sending'}
          className="metal-border light-sweep group inline-flex items-center gap-3 rounded-full bg-porcelain px-7 py-4 text-[14px] font-medium tracking-[0.04em] text-obsidian transition-transform hover:-translate-y-0.5 disabled:opacity-70"
        >
          {status === 'sending' ? (
            <>
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" /> Sending…
            </>
          ) : (
            <>
              {online ? 'Send enquiry' : 'Continue in email'}
              <ArrowRight size={16} strokeWidth={1.6} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </>
          )}
        </button>
        <p role="status" aria-live="polite" className="text-[14px] text-[#e0a39b]">
          {status === 'error' && (
            <>
              {failure}{' '}
              <a className="text-porcelain underline underline-offset-4" href={mailtoFor(data)}>
                Email instead
              </a>
            </>
          )}
        </p>
      </div>
    </form>
  );
}
