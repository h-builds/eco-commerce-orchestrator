import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('F1: Go Pricing Determinism', () => {
  test('Identical price on reload', async ({ page }) => {
    await page.goto('/shop/mock-product');
    const priceLocator = page.locator('[data-testid="product-price"], .price, .live-price').first();
    await priceLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const initialPrice = await priceLocator.textContent();
    
    await page.reload();
    const reloadedPriceLocator = page.locator('[data-testid="product-price"], .price, .live-price').first();
    await reloadedPriceLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const reloadedPrice = await reloadedPriceLocator.textContent();
    
    expect(initialPrice).toBeTruthy();
    expect(initialPrice).toEqual(reloadedPrice);
  });

  test('Stable price across multiple items', async ({ page }) => {
    await page.goto('/shop');
    const pricesLocator = page.locator('[data-testid="product-price"], .price, .live-price');
    await pricesLocator.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const count = await pricesLocator.count();
    
    expect(count).toBeGreaterThan(0);
    const initialPrices: (string | null)[] = [];
    for (let i = 0; i < Math.min(count, 3); i++) {
      initialPrices.push(await pricesLocator.nth(i).textContent());
    }

    await page.goto('/');
    await page.goto('/shop');

    for (let i = 0; i < Math.min(count, 3); i++) {
      const newPrice = await page.locator('[data-testid="product-price"], .price, .live-price').nth(i).textContent();
      expect(newPrice).toEqual(initialPrices[i]);
    }
  });

  test('Quantity determinism', async ({ page }) => {
    await page.goto('/shop/mock-product');
    const priceLocator = page.locator('[data-testid="product-price"], .price, .live-price').first();
    await priceLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const initialPrice = await priceLocator.textContent();

    const quantityInput = page.locator('input[type="number"], [data-testid="quantity-input"]').first();
    if (await quantityInput.isVisible()) {
      await quantityInput.fill('2');
      await page.waitForTimeout(500);
      await quantityInput.fill('1');
      await page.waitForTimeout(500);
      const finalPrice = await priceLocator.textContent();
      expect(finalPrice).toEqual(initialPrice);
    }
  });

  test('Valid currency format', async ({ page }) => {
    await page.goto('/shop/mock-product');
    const priceLocator = page.locator('[data-testid="product-price"], .price, .live-price').first();
    await priceLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const price = await priceLocator.textContent();
    // Matches string starting with $ followed by optional space, digits, dot, two digits
    expect(price).toMatch(/^\$\s*\d+\.\d{2}$/);
  });

  test('No race conditions on rapid interaction', async ({ page }) => {
    await page.goto('/shop/mock-product');
    const quantityInput = page.locator('input[type="number"], [data-testid="quantity-input"], button:has-text("+")').first();
    const priceLocator = page.locator('[data-testid="product-price"], .price, .live-price').first();
    
    if (await quantityInput.isVisible()) {
      for (let i = 0; i < 10; i++) {
        await quantityInput.click();
      }
      await page.waitForTimeout(1000);
      const stablePrice = await priceLocator.textContent();
      await page.waitForTimeout(1000);
      const stablePrice2 = await priceLocator.textContent();
      expect(stablePrice).toEqual(stablePrice2);
    }
  });
});

test.describe('F2: Main Thread Liberation & Fallback', () => {
  test('Worker API timeout fallback', async ({ page }) => {
    await page.route('**/api/pricing*', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      route.continue();
    });
    
    await page.goto('/shop/mock-product');
    const priceLocator = page.locator('[data-testid="product-price"], .price, .live-price').first();
    await priceLocator.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    const badgeLocator = page.locator('.fallback-badge, [data-testid="fallback-indicator"], text="Static Price"');
    
    const badgeVisible = await badgeLocator.isVisible();
    const priceVisible = await priceLocator.isVisible();
    expect(badgeVisible || priceVisible).toBeTruthy();
  });

  test('Offline fallback', async ({ context, page }) => {
    await page.goto('/shop/mock-product');
    await context.setOffline(true);
    await page.reload().catch(() => {});
    
    const priceLocator = page.locator('[data-testid="product-price"], .price, .live-price').first();
    await expect(priceLocator).toBeVisible({ timeout: 5000 });
  });

  test('aria-live announcement on error', async ({ page }) => {
    await page.route('**/api/pricing*', route => route.abort('failed'));
    await page.goto('/shop/mock-product');
    
    const liveRegion = page.locator('[aria-live="polite"], [aria-live="assertive"]');
    await expect(liveRegion.first()).toBeVisible({ timeout: 5000 });
    const text = await liveRegion.first().textContent();
    expect(text?.length).toBeGreaterThan(0);
  });

  test('Malformed response handling', async ({ page }) => {
    await page.route('**/api/pricing*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"invalid": "json"'
      });
    });
    await page.goto('/shop/mock-product');
    
    const priceLocator = page.locator('[data-testid="product-price"], .price, .live-price').first();
    await expect(priceLocator).toBeVisible({ timeout: 5000 });
  });

  test('Graceful degradation UI', async ({ page }) => {
    await page.route('**/api/pricing*', route => route.abort('failed'));
    await page.goto('/shop/mock-product');
    
    const warningIcon = page.locator('svg[data-testid="warning-icon"], .fallback-icon, text="Offline", .fallback-indicator');
    await expect(warningIcon.first()).toBeVisible({ timeout: 5000 });
  });
});

test.describe('F3: Telemetry Integrity (RTT Subtraction)', () => {
  test('Network delay vs Compute Time', async ({ page }) => {
    await page.route('**/api/pricing*', async route => {
      await new Promise(resolve => setTimeout(resolve, 2000));
      route.continue();
    });
    
    await page.goto('/shop/mock-product');
    
    const computeTimeLocator = page.locator('[data-testid="compute-time"], .compute-time');
    await expect(computeTimeLocator.first()).toBeVisible({ timeout: 5000 });
    const text = await computeTimeLocator.first().textContent() || '';
    const computeMs = parseFloat(text.replace(/[^0-9.]/g, ''));
    expect(computeMs).toBeLessThan(50);
  });

  test('Telemetry payload validation', async ({ page }) => {
    let telemetryPayload: { total_time?: number; rtt?: number; compute_time?: number } | null = null;
    await page.route('**/api/telemetry*', async route => {
      try {
        telemetryPayload = route.request().postDataJSON();
      } catch {
        // ignore JSON parse error
      }
      await route.continue();
    });
    
    await page.goto('/shop/mock-product');
    await page.waitForTimeout(2000);
    
    const p = telemetryPayload as { total_time?: number; rtt?: number; compute_time?: number } | null;
    expect(p).not.toBeNull();
    expect(p?.total_time).toBeDefined();
    expect(p?.rtt).toBeDefined();
    expect(p?.compute_time).toBeDefined();
  });

  test('Mathematical correctness', async ({ page }) => {
    let telemetryPayload: { total_time?: number; rtt?: number; compute_time?: number } | null = null;
    await page.route('**/api/telemetry*', async route => {
      try {
        telemetryPayload = route.request().postDataJSON();
      } catch {
        // ignore
      }
      await route.continue();
    });
    
    await page.goto('/shop/mock-product');
    await page.waitForTimeout(2000);
    
    const p = telemetryPayload as { total_time?: number; rtt?: number; compute_time?: number } | null;
    if (p && p.compute_time !== undefined && p.total_time !== undefined && p.rtt !== undefined) {
      expect(p.compute_time).toBeLessThanOrEqual(p.total_time);
      expect(p.total_time).toBeGreaterThanOrEqual(p.rtt);
    }
  });

  test('Silent telemetry failure', async ({ page }) => {
    await page.route('**/api/telemetry*', route => route.abort('failed'));
    await page.goto('/shop/mock-product');
    
    const priceLocator = page.locator('[data-testid="product-price"], .price, .live-price').first();
    await expect(priceLocator).toBeVisible({ timeout: 5000 });
  });

  test('Zero/Negative RTT protection', async ({ page }) => {
    let telemetryPayload: { total_time?: number; rtt?: number; compute_time?: number } | null = null;
    await page.route('**/api/telemetry*', async route => {
      try {
        telemetryPayload = route.request().postDataJSON();
      } catch {
        // ignore
      }
      await route.continue();
    });
    
    await page.route('**/api/pricing*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ price: 50.00, compute_time: 2 })
      });
    });

    await page.goto('/shop/mock-product');
    await page.waitForTimeout(2000);
    
    const p = telemetryPayload as { total_time?: number; rtt?: number; compute_time?: number } | null;
    if (p && p.compute_time !== undefined) {
      expect(p.compute_time).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(p.compute_time)).toBe(false);
    }
  });
});

test.describe('F4: Accessibility (WCAG 2.1 AA)', () => {
  test('Axe audit - Homepage', async ({ page }) => {
    await page.goto('/');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Axe audit - Loading state', async ({ page }) => {
    await page.route('**/api/pricing*', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000));
      route.continue();
    });
    
    await page.goto('/shop/mock-product');
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Axe audit - Fallback state', async ({ context, page }) => {
    await page.goto('/shop/mock-product');
    await context.setOffline(true);
    await page.reload().catch(() => {});
    
    await page.waitForTimeout(2000);
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('Keyboard navigability', async ({ page }) => {
    await page.goto('/shop');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement !== document.body && document.activeElement !== null);
    expect(focusedElement).toBe(true);
  });

  test('Color contrast validation', async ({ page }) => {
    await page.goto('/shop/mock-product');
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('F5: SEO & Evidence-backed Copy', () => {
  test('Metadata presence', async ({ page }) => {
    await page.goto('/shop/mock-product');
    
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
    
    const metaDescription = await page.locator('meta[name="description"]').getAttribute('content');
    expect(metaDescription?.length).toBeGreaterThan(0);
  });

  test('Heading hierarchy', async ({ page }) => {
    await page.goto('/shop/mock-product');
    
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBe(1);
    
    const h2Count = await page.locator('h2').count();
    const h3Count = await page.locator('h3').count();
    
    if (h3Count > 0) {
      expect(h2Count).toBeGreaterThan(0);
    }
  });

  test('Absence of generic AI jargon', async ({ page }) => {
    await page.goto('/shop/mock-product');
    
    const bodyText = await page.locator('body').innerText();
    const lowerBody = bodyText.toLowerCase();
    
    expect(lowerBody).not.toContain('supercharge');
    expect(lowerBody).not.toContain('unleash');
    expect(lowerBody).not.toContain('synergy');
  });

  test('Presence of technical claims', async ({ page }) => {
    await page.goto('/');
    
    const bodyText = await page.locator('body').innerText();
    const lowerBody = bodyText.toLowerCase();
    
    expect(lowerBody.includes('zero-allocation') || lowerBody.includes('0 allocs/op')).toBeTruthy();
  });

  test('Telemetry copy semantics', async ({ page }) => {
    await page.goto('/shop/mock-product');
    
    const dlCount = await page.locator('dl').count();
    const dtCount = await page.locator('dt').count();
    const ddCount = await page.locator('dd').count();
    
    if (dlCount > 0) {
      expect(dtCount).toBeGreaterThan(0);
      expect(ddCount).toBeGreaterThan(0);
    }
    
    const computeTimeText = await page.locator('text=ms').first().textContent();
    expect(computeTimeText).toContain('ms');
  });
});
