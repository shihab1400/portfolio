import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const valid = {
  name: 'Ada Lovelace',
  company: 'Analytical Engines',
  email: 'ada@example.com',
  message: 'Hello! I would like to talk about a new project.',
};

async function fill(page: Page, values: Partial<typeof valid>) {
  const form = page.locator('[data-contact-form]');
  if (values.name !== undefined) await form.locator('#contact-name').fill(values.name);
  if (values.company !== undefined) await form.getByLabel('Company name').fill(values.company);
  if (values.email !== undefined) await form.getByLabel('Email address').fill(values.email);
  if (values.message !== undefined) await form.getByLabel('Message').fill(values.message);
  return form;
}

test.describe('contact form (browser)', () => {
  test('shows accessible validation errors and sends nothing when invalid', async ({ page }) => {
    let requests = 0;
    await page.route('**/api/contact', (route) => {
      requests += 1;
      return route.abort();
    });
    await page.goto('/#contacts');
    const form = await fill(page, { email: 'not-an-email' });
    await form.getByRole('button', { name: 'Send message' }).click();

    const name = form.locator('#contact-name');
    await expect(name).toHaveAttribute('aria-invalid', 'true');
    await expect(name).toBeFocused();
    await expect(name).toHaveAccessibleDescription('Please enter your name.');
    await expect(form.locator('#contact-email-error')).toContainText('valid email address');
    await expect(form.locator('#contact-message-error')).toHaveText('Please enter a message.');
    await expect(form.getByRole('status')).toContainText('Error');
    expect(requests).toBe(0);

    await fill(page, { name: valid.name });
    await expect(name).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('success: confirms, clears the form and blocks double submits', async ({ page }) => {
    let requests = 0;
    let body: Record<string, string> = {};
    await page.route('**/api/contact', async (route) => {
      requests += 1;
      body = route.request().postDataJSON();
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await route.fulfill({ status: 200, json: { ok: true, message: 'Thanks! Your message has been sent.' } });
    });
    await page.goto('/#contacts');
    const form = await fill(page, valid);
    const button = form.locator('[data-submit]');
    await button.click();
    await expect(button).toBeDisabled();
    await expect(button).toHaveText('Sending…');
    // A second submit while sending (e.g. pressing Enter) must not fire another request.
    await form.evaluate((el: HTMLFormElement) => el.requestSubmit());

    await expect(form.getByRole('status')).toHaveText('Success: Thanks! Your message has been sent.');
    expect(requests).toBe(1);
    expect(body).toMatchObject(valid);
    await expect(form.getByLabel('Email address')).toHaveValue('');
    await expect(button).toBeEnabled();
  });

  test('failure: shows the server message and keeps what was typed', async ({ page }) => {
    await page.route('**/api/contact', (route) =>
      route.fulfill({ status: 502, json: { ok: false, message: 'Your message could not be sent right now.' } }),
    );
    await page.goto('/#contacts');
    const form = await fill(page, valid);
    await form.getByRole('button', { name: 'Send message' }).click();
    await expect(form.getByRole('status')).toHaveText('Error: Your message could not be sent right now.');
    await expect(form.getByLabel('Message')).toHaveValue(valid.message);
  });
});

test.describe('contact endpoint (server)', () => {
  // The endpoint is rate limited per IP, so these run once, in order, in a single project.
  test.describe.configure({ mode: 'serial' });
  test.beforeEach(({}, testInfo) => test.skip(testInfo.project.name !== 'chromium', 'server checks run once'));

  const post = (request: APIRequestContext, data: unknown, headers: Record<string, string> = {}) =>
    request.post('/api/contact', {
      data: typeof data === 'string' ? data : JSON.stringify(data),
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...headers },
    });

  test('rejects unsupported content types and methods', async ({ request }) => {
    expect((await post(request, 'x', { 'Content-Type': 'text/plain' })).status()).toBe(415);
    expect((await request.get('/api/contact')).status()).toBe(405);
  });

  test('re-validates input on the server', async ({ request }) => {
    const res = await post(request, { ...valid, email: 'bad@', message: 'short' });
    expect(res.status()).toBe(422);
    const json = await res.json();
    expect(json.ok).toBe(false);
    expect(Object.keys(json.errors).sort()).toEqual(['email', 'message']);
  });

  test('accepts honeypot submissions without sending them', async ({ request }) => {
    expect((await post(request, { ...valid, website: 'https://spam.example' })).status()).toBe(200);
  });

  test('never reports success when the email provider is not configured', async ({ request }) => {
    const res = await post(request, valid);
    expect(res.status()).toBe(503);
    expect((await res.json()).ok).toBe(false);
  });

  test('rejects oversized payloads', async ({ request }) => {
    expect((await post(request, { ...valid, message: 'x'.repeat(20_000) })).status()).toBe(413);
  });

  test('rate limits repeated submissions', async ({ request }) => {
    // Four requests above count toward the limit of five per window.
    expect((await post(request, valid)).status()).toBe(503);
    expect((await post(request, valid)).status()).toBe(429);
  });
});
