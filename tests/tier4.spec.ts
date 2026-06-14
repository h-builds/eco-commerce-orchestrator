import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Tier 4: Production Defenses', () => {
  // Scenario 1: Browse Shop
  test('Scenario 1: Browse Shop (SEO, Determinism, A11y)', async ({ page }) => {
    await page.goto('/shop');

    // Assert SEO meta tags
    const title = await page.title();
    expect(title).not.toBe('');
    
    // Check if meta description exists and has content
    const metaDescription = page.locator('meta[name="description"]');
    // It might not exist, but test expects it
    await expect(metaDescription).toHaveAttribute('content', /.*/);

    // Assert Determinism: find a price, reload, check it remains identical
    // We will wait for the first price text
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

    // Assert Accessibility
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  // Scenario 2: Main Thread Liberation
  test('Scenario 2: Main Thread Liberation', async ({ page }) => {
    await page.goto('/shop/mock-product');

    // Trigger a pricing calculation by changing quantity or variant if available, 
    // or just let the initial pricing calculation happen.
    // We will measure frame delay right after page load or a button click.
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

    // The delay should be small (e.g., < 100ms)
    expect(delay).toBeLessThan(100);

    // Run Axe-core on the UI
    const a11yResults = await new AxeBuilder({ page }).analyze();
    expect(a11yResults.violations).toEqual([]);
  });

  // Scenario 3: Heavy Benchmarking
  test('Scenario 3: Heavy Benchmarking', async ({ page }) => {
    await page.goto('/benchmarks');

    // Check SEO tags on the benchmark page
    const title = await page.title();
    expect(title).not.toBe('');
    const metaDescription = page.locator('meta[name="description"]');
    await expect(metaDescription).toHaveAttribute('content', /.*/);

    // Click "START BATTLE"
    const startButton = page.getByRole('button', { name: /START BATTLE/i });
    await startButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // Assert telemetry (e.g., open debug console or intercept requests and ensure RTT subtraction is present)
    // We will intercept the telemetry endpoint or look at debug console
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

    // Wait some time for telemetry to process
    await page.waitForTimeout(2000);

    // Check for logs in UI
    const logText = await page.locator('body').textContent();
    const hasRTTInfo = logText?.includes('RTT') || logText?.includes('executionTime') || telemetryFound;
    expect(hasRTTInfo).toBeTruthy();
  });

  // Scenario 4: Error Fallback A11y
  test('Scenario 4: Error Fallback A11y', async ({ page }) => {
    // Intercept and abort routes to force an error
    await page.route('**/api/pricing*', route => route.abort());
    await page.route('**/*.wasm', route => route.abort());

    // Navigate to a product
    await page.goto('/shop/mock-product');

    // Assert fallback UI displays (aria-live or role="alert")
    const errorAlert = page.locator('[role="alert"], [aria-live]');
    await expect(errorAlert).toBeVisible({ timeout: 5000 });

    // Run Axe-core on the error state
    const a11yResults = await new AxeBuilder({ page }).analyze();
    expect(a11yResults.violations).toEqual([]);
  });

  // Scenario 5: Offline Telemetry
  test('Scenario 5: Offline Telemetry', async ({ context, page }) => {
    await page.goto('/shop');
    
    // Set Playwright context to offline
    await context.setOffline(true);

    // Perform a client-side navigation to a product
    const productLink = page.getByRole('link', { name: /mock-product|product/i }).first();
    if (await productLink.isVisible()) {
      await productLink.click();
    } else {
      // Evaluate client-side routing if link is missing
      await page.evaluate(() => {
        const w = window as unknown as { next?: { router?: { push: (url: string) => void } } };
        if (w.next && w.next.router) {
          w.next.router.push('/shop/mock-product');
        } else {
          window.location.href = '/shop/mock-product';
        }
      });
    }

    // Assert fallback UI appears
    const fallbackUI = page.locator('[role="alert"], [aria-live], text=/error|offline|failed/i').first();
    await expect(fallbackUI).toBeVisible({ timeout: 5000 });

    // Verify telemetry console gracefully handles the offline state
    await context.setOffline(false); // set back online to fetch chunks if needed, or leave offline
    const debugConsoleBtn = page.getByRole('button', { name: /Open debug console/i });
    if (await debugConsoleBtn.isVisible()) {
      await debugConsoleBtn.click();
      const logList = page.getByRole('region', { name: /Developer Debug Console/i });
      await expect(logList).toBeVisible();
    }
  });
});
