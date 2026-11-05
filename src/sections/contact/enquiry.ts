import { company } from '../../content/company';

export interface Enquiry {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  /** Honeypot — real visitors never see or fill it. */
  botcheck: boolean;
}

export const SUBJECTS = ['Project enquiry', 'Business enquiry', 'General enquiry'] as const;

export type Field = 'name' | 'email' | 'phone' | 'subject' | 'message';
export type Errors = Partial<Record<Field, string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\d\s-]{7,20}$/;

export function validateField(field: Field, value: string): string | undefined {
  const v = value.trim();
  switch (field) {
    case 'name':
      return v.length < 2 ? 'Please enter your full name.' : undefined;
    case 'email':
      if (!v) return 'Please enter your email address.';
      return EMAIL.test(v) ? undefined : 'Please enter a valid email address, like name@example.com.';
    case 'phone':
      return !v || PHONE.test(v) ? undefined : 'Please use digits, spaces, + or - only (7–20 characters).';
    case 'subject':
      return v ? undefined : 'Please choose a subject.';
    case 'message':
      if (v.length < 20) return 'Please share a little more detail (at least 20 characters).';
      return v.length > 3000 ? 'Please keep your message under 3,000 characters.' : undefined;
  }
}

export function validate(data: Enquiry): Errors {
  const errors: Errors = {};
  (['name', 'email', 'phone', 'subject', 'message'] as Field[]).forEach((field) => {
    const error = validateField(field, data[field]);
    if (error) errors[field] = error;
  });
  return errors;
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; reason: 'not-configured' | 'network' | 'rejected'; message?: string };

export const isConfigured = () => Boolean(import.meta.env.VITE_WEB3FORMS_KEY);

/**
 * Sends the enquiry through Web3Forms to the company inbox. Success is
 * reported only when the service confirms delivery — never assumed.
 */
export async function submitEnquiry(data: Enquiry): Promise<SubmitResult> {
  const key = import.meta.env.VITE_WEB3FORMS_KEY;
  if (!key) return { ok: false, reason: 'not-configured' };
  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        access_key: key,
        subject: `Website enquiry — ${data.subject}`,
        from_name: `${data.name} via sensan website`,
        replyto: data.email,
        name: data.name,
        email: data.email,
        phone: data.phone || 'Not provided',
        topic: data.subject,
        message: data.message,
        botcheck: data.botcheck,
      }),
    });
    const json = (await response.json().catch(() => null)) as { success?: boolean; message?: string } | null;
    if (response.ok && json?.success) return { ok: true };
    return { ok: false, reason: 'rejected', message: json?.message };
  } catch {
    return { ok: false, reason: 'network' };
  }
}

/** A mailto: link carrying the enquiry — the honest fallback while online delivery is unavailable. */
export function mailtoFor(data: Enquiry): string {
  const body = [
    data.message,
    '',
    `— ${data.name}`,
    data.email,
    data.phone,
  ]
    .filter((line) => line !== undefined)
    .join('\n');
  return `mailto:${company.email}?subject=${encodeURIComponent(`Website enquiry — ${data.subject || 'General enquiry'}`)}&body=${encodeURIComponent(body)}`;
}
