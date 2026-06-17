import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Tier 4: Production Defenses', () => {
  test('Scenario 1: Browse Shop (SEO, Determinism, A11y)', async ({ page }) => {
    await page.goto('/shop');

    const title = await page.title();
    expect(title).not.toBe('');
    
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.*/);

    const priceLocator = page.locator('.price, [data-testid="price"], text=/\\$\\d+\\.\\d{2}/').first();
    await priceLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    
    let initialPrice = '';
    if (await priceLocator.isVisible()) {
      initialPrice = (await priceLocator.textContent()) || '';
    }

    await page.reload();

    if (initialPrice) {
      await expect(page.locator('.price, [data-testid="price"], text=/\\$\\d+\\.\\d{2}/').first()).toHaveText(initialPrice);
    }

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Scenario 2: Main Thread Liberation', async ({ page }) => {
    await page.goto('/shop/mock-product');

    const delay = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let maxDelay = 0;
        let lastTime = performance.now();
        let frames = 0;
        
        const checkFrame = () => {
          const now = performance.now();
          const delay = now - lastTime;
          if (delay > maxDelay && frames > 0) {
             maxDelay = delay;
          }
          lastTime = now;
          frames++;
          if (frames < 60) { // monitor for ~1 second (60 frames)
            requestAnimationFrame(checkFrame);
          } else {
            resolve(maxDelay);
          }
        };
        requestAnimationFrame(checkFrame);
      });
    });

    expect(delay).toBeLessThan(100);

    const a11yResults = await new AxeBuilder({ page }).analyze();
    expect(a11yResults.violations).toEqual([]);
  });

  test('Scenario 3: Heavy Benchmarking', async ({ page }) => {
    await page.goto('/benchmarks');

    const title = await page.title();
    expect(title).not.toBe('');
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.*/);

    const startButton = page.getByRole('button', { name: /START BATTLE/i });
    await startButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    let telemetryFound = false;
    page.on('request', request => {
      if (request.url().includes('/api/telemetry') || request.url().includes('telemetry')) {
        const postData = request.postData();
        if (postData && (postData.includes('executionTimeMs') || postData.includes('internalExecTimeUs'))) {
          telemetryFound = true;
        }
      }
    });

    const debugConsoleBtn = page.getByRole('button', { name: /Open debug console/i });
    if (await debugConsoleBtn.isVisible()) {
      await debugConsoleBtn.click();
    }

    await page.waitForTimeout(2000);

    const logText = await page.locator('body').textContent();
    const hasRTTInfo = logText?.includes('RTT') || logText?.includes('executionTime') || telemetryFound;
    expect(hasRTTInfo).toBeTruthy();
  });

  test('Scenario 4: Error Fallback A11y', async ({ page }) => {
    await page.route('**/api/pricing*', route => route.abort());
    await page.route('**/*.wasm', route => route.abort());

    await page.goto('/shop/mock-product');

    const errorAlert = page.locator('[role="alert"], [aria-live]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    const a11yResults = await new AxeBuilder({ page }).analyze();
    expect(a11yResults.violations).toEqual([]);
  });

  test('Scenario 5: Offline Telemetry', async ({ context, page }) => {
    await page.goto('/shop');
    
    await context.setOffline(true);

    const productLink = page.getByRole('link', { name: /mock-product|product/i }).first();
    if (await productLink.isVisible()) {
      await productLink.click();
    } else {
      await page.evaluate(() => {
        const w = window as unknown as { next?: { router?: { push: (url: string) => void } } };
        if (w.next && w.next.router) {
          w.next.router.push('/shop/mock-product');
        } else {
          window.location.href = '/shop/mock-product';
        }
      });
    }

    const fallbackUI = page.locator('[role="alert"], [aria-live], text=/error|offline|failed/i').first();
    await expect(fallbackUI).toBeVisible({ timeout: 5000 });

    await context.setOffline(false); // set back online to fetch chunks if needed, or leave offline
    const debugConsoleBtn = page.getByRole('button', { name: /Open debug console/i });
    if (await debugConsoleBtn.isVisible()) {
      await debugConsoleBtn.click();
      const logList = page.getByRole('region', { name: /Developer Debug Console/i });
      await expect(logList).toBeVisible();
    }
  });
});
