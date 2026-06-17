import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Tier 3 E2E - Cross-Feature Combinations', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.clear();
    });
  });

  test('Pricing Determinism + Web Worker Fallback', async ({ page }) => {
    let workerCreated = false;
    page.on('worker', () => {
      workerCreated = true;
    });

    await page.route('**/graphql', route => route.abort());

    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    expect(workerCreated).toBe(true);

    const priceText = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
    await expect(priceText).toBeVisible({ timeout: 10000 });
  });

  test('Graceful Degradation + Accessibility', async ({ page }) => {
    await page.route('**/graphql', route => route.abort());

    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)').first();
    await expect(alert).toBeVisible({ timeout: 10000 });
    const ariaLive = await alert.getAttribute('aria-live');
    expect(ariaLive).toMatch(/polite|assertive/);

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Pricing Determinism + Telemetry Integrity', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const priceText = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
    await expect(priceText).toBeVisible({ timeout: 10000 });

    const debugConsoleBtn = page.getByRole('button', { name: 'Open debug console' });
    await debugConsoleBtn.waitFor({ state: 'visible' });
    await debugConsoleBtn.click();

    const logRegion = page.getByRole('region', { name: 'Developer Debug Console' });
    await expect(logRegion).toBeVisible();

    const computeTimeLog = page.locator('text=/compute time|rtt|subtracted|latency adjusted/i').first();
    await expect(computeTimeLog).toBeVisible({ timeout: 10000 });
  });

  test('Accessibility + SEO', async ({ page }) => {
    await page.goto('/shop/mock-product');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    const title = await page.title();
    expect(title).not.toMatch(/AI|Magic|Smart|Intelligent/i);
    expect(title.length).toBeGreaterThan(0);

    const metaDescription = page.locator('meta[name="description"]');
    const description = await metaDescription.getAttribute('content');
    expect(description).toBeTruthy();
    expect(description).not.toMatch(/AI|Magic|Smart|Intelligent/i);
  });

  test('Fallback + Telemetry Source Indication', async ({ page }) => {
    await page.route('**/graphql', route => route.abort());

    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)').first();
    await expect(alert).toBeVisible({ timeout: 10000 });

    const debugConsoleBtn = page.getByRole('button', { name: 'Open debug console' });
    await debugConsoleBtn.waitFor({ state: 'visible' });
    await debugConsoleBtn.click();

    const logRegion = page.getByRole('region', { name: 'Developer Debug Console' });
    await expect(logRegion).toBeVisible();

    const workerSourceLog = page.locator('text=/worker|fallback|local simulation|simulated source/i').first();
    await expect(workerSourceLog).toBeVisible({ timeout: 10000 });
  });

});
