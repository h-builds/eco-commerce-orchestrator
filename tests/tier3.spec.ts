import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Tier 3 E2E - Cross-Feature Combinations', () => {

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.sessionStorage.clear();
    });
  });

  // 1. F1 + F2: Pricing Determinism + Web Worker Fallback
  test('Pricing Determinism + Web Worker Fallback', async ({ page }) => {
    let workerCreated = false;
    page.on('worker', () => {
      workerCreated = true;
    });

    // Abort network request to simulate failure/fallback
    await page.route('**/graphql', route => route.abort());

    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    // Verify worker was spawned for fallback calculation
    expect(workerCreated).toBe(true);

    // Verify deterministic price is rendered (using fallback values)
    const priceText = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
    await expect(priceText).toBeVisible({ timeout: 10000 });
  });

  // 2. F2 + F4: Graceful Degradation + Accessibility
  test('Graceful Degradation + Accessibility', async ({ page }) => {
    // Trigger fallback
    await page.route('**/graphql', route => route.abort());

    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    // Assert fallback alert is shown
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)').first();
    await expect(alert).toBeVisible({ timeout: 10000 });
    // Expect aria-live for accessibility
    const ariaLive = await alert.getAttribute('aria-live');
    expect(ariaLive).toMatch(/polite|assertive/);

    // Run AxeBuilder for accessibility assertions
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // 3. F1 + F3: Pricing Determinism + Telemetry Integrity
  test('Pricing Determinism + Telemetry Integrity', async ({ page }) => {
    await page.goto('/shop');
    await page.waitForLoadState('networkidle');

    // Verify deterministic price
    const priceText = page.locator('text=/\\$\\d+\\.\\d{2}/').first();
    await expect(priceText).toBeVisible({ timeout: 10000 });

    // Open telemetry console
    const debugConsoleBtn = page.getByRole('button', { name: 'Open debug console' });
    await debugConsoleBtn.waitFor({ state: 'visible' });
    await debugConsoleBtn.click();

    const logRegion = page.getByRole('region', { name: 'Developer Debug Console' });
    await expect(logRegion).toBeVisible();

    // Assert telemetry shows pure compute time / RTT subtraction explicitly
    const computeTimeLog = page.locator('text=/compute time|rtt|subtracted|latency adjusted/i').first();
    await expect(computeTimeLog).toBeVisible({ timeout: 10000 });
  });

  // 4. F4 + F5: Accessibility + SEO
  test('Accessibility + SEO', async ({ page }) => {
    await page.goto('/shop/mock-product');
    await page.waitForLoadState('networkidle');

    // Accessibility check
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);

    // Check title and description for concrete engineering descriptors, avoiding AI jargon
    const title = await page.title();
    expect(title).not.toMatch(/AI|Magic|Smart|Intelligent/i);
    expect(title.length).toBeGreaterThan(0);

    const metaDescription = page.locator('meta[name="description"]');
    const description = await metaDescription.getAttribute('content');
    expect(description).toBeTruthy();
    expect(description).not.toMatch(/AI|Magic|Smart|Intelligent/i);
  });

  // 5. F2 + F3: Fallback + Telemetry
  test('Fallback + Telemetry Source Indication', async ({ page }) => {
    // Trigger fallback
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

    // Assert telemetry indicates source was the local Web Worker / fallback
    const workerSourceLog = page.locator('text=/worker|fallback|local simulation|simulated source/i').first();
    await expect(workerSourceLog).toBeVisible({ timeout: 10000 });
  });

});
