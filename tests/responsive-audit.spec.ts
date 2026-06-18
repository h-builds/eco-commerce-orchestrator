import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import * as fs from 'fs';
import * as path from 'path';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 }
];

const PAGES = [
  { name: 'home', url: '/' },
  { name: 'shop', url: '/shop' },
  { name: 'product', url: '/shop/mock-product' },
  { name: 'dashboard', url: '/admin/dashboard' },
  { name: 'benchmarks', url: '/benchmarks' }
];

test.describe('Responsive UI Audit', () => {
  for (const pageInfo of PAGES) {
    test.describe(pageInfo.name, () => {
      for (const vp of VIEWPORTS) {
        test(`Viewport ${vp.name}`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          const response = await page.goto(pageInfo.url, { waitUntil: 'networkidle', timeout: 30000 });
          
          if (!response || response.status() >= 400) {
              console.error(`Page ${pageInfo.url} returned status ${response?.status()}`);
          }

          // Wait a bit for animations
          await page.waitForTimeout(1000);

          const screenshotDir = path.join(process.cwd(), '.screenshots');
          if (!fs.existsSync(screenshotDir)) {
            fs.mkdirSync(screenshotDir, { recursive: true });
          }

          const screenshotPath = path.join(screenshotDir, `${pageInfo.name}-${vp.name}.png`);
          await page.screenshot({ path: screenshotPath, fullPage: true });

          // Run Axe accessibility scan
          try {
            const results = await new AxeBuilder({ page }).analyze();
            const violations = results.violations.map(v => ({
                id: v.id,
                impact: v.impact,
                description: v.description,
                nodes: v.nodes.map(n => ({ html: n.html, target: n.target }))
            }));
            
            const axePath = path.join(screenshotDir, `${pageInfo.name}-${vp.name}-axe.json`);
            fs.writeFileSync(axePath, JSON.stringify(violations, null, 2));
          } catch (e) {
            console.error(`Axe check failed for ${pageInfo.url} on ${vp.name}`, e);
          }
        });
      }
    });
  }
});
