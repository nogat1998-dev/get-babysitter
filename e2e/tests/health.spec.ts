import { test, expect } from '@playwright/test';

test.describe('Health Check', () => {
  test('GET /api/health returns ok', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/health');
    expect(response.ok()).toBeTruthy();

    const body = await response.json();
    expect(body.status).toBe('ok');
    expect(body).toHaveProperty('timestamp');
  });
});
