import { execSync } from 'child_process';

async function globalSetup() {
  console.log('Seeding local D1 database for Playwright tests...');
  try {
    const query = `
      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT,
        slug TEXT,
        description TEXT,
        price REAL,
        category TEXT,
        stock INTEGER,
        rating REAL,
        image_url TEXT,
        live_price REAL,
        agent_confidence REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      INSERT OR IGNORE INTO products (id, name, slug, description, price, category, stock, rating, image_url)
      VALUES ('mock-1', 'Mock Product', 'mock-product', 'A mock product for e2e tests', 50.0, 'Mock Category', 100, 4.5, '/mock-image.png');
    `;
    
    // Execute wrangler D1 command to ensure local DB has at least one product
    execSync(`npx wrangler d1 execute eco_db --local --command "${query.replace(/\n/g, ' ')}"`, { stdio: 'inherit' });
    console.log('Local D1 database seeded successfully.');
  } catch (error) {
    console.error('Failed to seed local D1 database:', error);
    // Do not throw, allow tests to attempt running anyway
  }
}

export default globalSetup;
