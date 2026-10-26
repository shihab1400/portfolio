import type { ContactInput } from './contact';

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);

export function buildContactEmail(input: ContactInput) {
  const company = input.company || 'Not provided';
  const subject = `Portfolio inquiry from ${input.name}`.slice(0, 150);

  const text = [
    `Name: ${input.name}`,
    `Company: ${company}`,
    `Email: ${input.email}`,
    '',
    'Message:',
    input.message,
  ].join('\n');

  const row = (label: string, value: string) =>
    `<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top">${label}</th><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`;

  const html = `<div style="font-family:ui-monospace,Menlo,Consolas,monospace;font-size:14px;color:#1f2228">
<h2 style="font-size:16px">New portfolio inquiry</h2>
<table role="presentation">${row('Name', input.name)}${row('Company', company)}${row('Email', input.email)}</table>
<p style="margin-top:16px;font-weight:bold">Message</p>
<p style="white-space:pre-wrap">${escapeHtml(input.message)}</p>
</div>`;

  return { subject, text, html };
}
