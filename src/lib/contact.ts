/**
 * Contact form rules shared by the browser script and the /api/contact endpoint,
 * so client-side hints and server-side enforcement never drift apart.
 */
export const CONTACT_LIMITS = {
  name: 100,
  company: 120,
  email: 254,
  messageMin: 10,
  message: 5000,
} as const;

/** Hidden field that real visitors never fill in. */
export const HONEYPOT_FIELD = 'website';

export type ContactField = 'name' | 'company' | 'email' | 'message';

export interface ContactInput {
  name: string;
  company: string;
  email: string;
  message: string;
}

export type ContactErrors = Partial<Record<ContactField, string>>;

export interface ContactResponse {
  ok: boolean;
  message: string;
  errors?: ContactErrors;
}

// Pragmatic address check: one "@", no whitespace, a dotted domain with a 2+ letter TLD.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)*\.[a-z]{2,}$/i;

const clean = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\r\n?/g, '\n').trim() : '';

export function normalizeContact(raw: Record<string, unknown>): ContactInput {
  return {
    // Single-line fields: collapse whitespace so they are safe in headers and subjects.
    name: clean(raw.name).replace(/\s+/g, ' '),
    company: clean(raw.company).replace(/\s+/g, ' '),
    email: clean(raw.email).toLowerCase(),
    message: clean(raw.message),
  };
}

export function validateContact(input: ContactInput): ContactErrors {
  const errors: ContactErrors = {};

  if (!input.name) errors.name = 'Please enter your name.';
  else if (input.name.length > CONTACT_LIMITS.name)
    errors.name = `Name must be ${CONTACT_LIMITS.name} characters or fewer.`;

  if (input.company.length > CONTACT_LIMITS.company)
    errors.company = `Company name must be ${CONTACT_LIMITS.company} characters or fewer.`;

  if (!input.email) errors.email = 'Please enter your email address.';
  else if (input.email.length > CONTACT_LIMITS.email || !EMAIL_PATTERN.test(input.email))
    errors.email = 'Please enter a valid email address, like name@example.com.';

  if (!input.message) errors.message = 'Please enter a message.';
  else if (input.message.length < CONTACT_LIMITS.messageMin)
    errors.message = `Message must be at least ${CONTACT_LIMITS.messageMin} characters.`;
  else if (input.message.length > CONTACT_LIMITS.message)
    errors.message = `Message must be ${CONTACT_LIMITS.message} characters or fewer.`;

  return errors;
}
