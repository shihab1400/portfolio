import type { APIRoute } from 'astro';
import { CONTACT_TO, SMTP_USER } from 'astro:env/server';
import {
  HONEYPOT_FIELD,
  normalizeContact,
  validateContact,
  type ContactResponse,
} from '../../lib/contact';
import { buildContactEmail } from '../../lib/email';
import { getTransporter, isMailerConfigured } from '../../lib/mailer';
import { createRateLimiter } from '../../lib/rate-limit';

export const prerender = false;

const MAX_BODY_BYTES = 16 * 1024;
const isRateLimited = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

class PayloadTooLargeError extends Error {}

/** Reads the request body, aborting as soon as it exceeds `limit` bytes. */
async function readBody(request: Request, limit: number): Promise<string> {
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > limit) throw new PayloadTooLargeError();
  if (!request.body) return '';

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new PayloadTooLargeError();
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function parseBody(raw: string, contentType: string): Record<string, unknown> {
  if (contentType.includes('application/json')) {
    const parsed: unknown = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  // Browsers without JavaScript submit the form natively; send them to a result page.
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const respond = (status: number, body: ContactResponse) =>
    wantsJson
      ? Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
      : redirect(body.ok ? '/contact/sent/' : '/contact/error/', 303);

  const contentType = request.headers.get('content-type') ?? '';
  if (!/application\/json|application\/x-www-form-urlencoded/.test(contentType)) {
    return respond(415, { ok: false, message: 'Unsupported request format.' });
  }

  if (isRateLimited(clientAddress ?? 'unknown')) {
    return respond(429, {
      ok: false,
      message: 'Too many messages in a short time. Please try again in a few minutes.',
    });
  }

  let raw: Record<string, unknown>;
  try {
    raw = parseBody(await readBody(request, MAX_BODY_BYTES), contentType);
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return respond(413, { ok: false, message: 'Your message is too long.' });
    }
    return respond(400, { ok: false, message: 'The request could not be read.' });
  }

  // Bots that fill the honeypot get a generic success so they don't adapt; nothing is sent.
  if (typeof raw[HONEYPOT_FIELD] === 'string' && raw[HONEYPOT_FIELD].trim() !== '') {
    return respond(200, { ok: true, message: 'Thanks! Your message has been sent.' });
  }

  const input = normalizeContact(raw);
  const errors = validateContact(input);
  if (Object.keys(errors).length > 0) {
    return respond(422, { ok: false, message: 'Please correct the highlighted fields.', errors });
  }

  if (!isMailerConfigured()) {
    console.error('[contact] Gmail SMTP is not configured (SMTP_USER / SMTP_PASS).');
    return respond(503, {
      ok: false,
      message: 'The contact form is temporarily unavailable. Please email me directly instead.',
    });
  }

  const { subject, text, html } = buildContactEmail(input);
  try {
    // Address objects (rather than "Name <addr>" strings) keep visitor input out of header parsing.
    await getTransporter().sendMail({
      from: { name: 'Portfolio Contact', address: SMTP_USER! },
      to: CONTACT_TO,
      replyTo: { name: input.name, address: input.email },
      subject,
      text,
      html,
    });
  } catch (error) {
    // Log only the SMTP error code (e.g. EAUTH), never credentials or the visitor's message.
    const code = (error as { code?: unknown }).code;
    console.error(`[contact] Gmail SMTP send failed (${typeof code === 'string' ? code : 'unknown'}).`);
    return respond(502, {
      ok: false,
      message: 'Your message could not be sent right now. Please try again later.',
    });
  }

  return respond(200, { ok: true, message: "Thanks! Your message has been sent. I'll reply soon." });
};

export const ALL: APIRoute = () =>
  new Response(null, { status: 405, headers: { Allow: 'POST' } });
