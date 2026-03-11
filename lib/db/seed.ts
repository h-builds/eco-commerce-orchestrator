import { faker } from '@faker-js/faker';
import type { D1Database } from '@cloudflare/workers-types';

export interface ProductInsert {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  rating: number;
  image_url: string;
}

const CATEGORIES = [
  'Apparel',
  'Home & Kitchen',
  'Beauty & Personal Care',
  'Electronics',
  'Toys & Games',
  'Health & Wellness',
  'Office Supplies',
  'Groceries',
];

export async function seedDatabase(db: D1Database, count = 1000): Promise<{ message: string; inserted: number }> {
  // Check if seeding is already complete to make it idempotent
  const countResult = await db.prepare('SELECT COUNT(*) as count FROM products').first<{ count: number }>();
  
  if (countResult && countResult.count >= count) {
    return {
      message: `Database already seeded with ${countResult.count} products.`,
      inserted: 0,
    };
  }

  // Determine how many to insert
  const toInsert = count - (countResult ? countResult.count : 0);

  const products: ProductInsert[] = Array.from({ length: toInsert }).map(() => {
    const name = faker.commerce.productName();
    const slug = faker.helpers.slugify(name).toLowerCase() + '-' + faker.string.uuid().slice(0, 8);
    
    return {
      id: faker.string.uuid(),
      name,
      slug,
      description: faker.commerce.productDescription(),
      price: parseFloat(faker.commerce.price({ min: 5, max: 200, dec: 2 })),
      category: faker.helpers.arrayElement(CATEGORIES),
      stock: faker.number.int({ min: 0, max: 500 }),
      rating: faker.number.float({ min: 1, max: 5, multipleOf: 0.1 }),
      image_url: faker.image.urlLoremFlickr({ category: 'eco' }),
    };
  });

  // Since D1 has limits on statement variables and batch payloads, we should insert in chunks
  // A single statement in D1 can bind at most 100 parameters.
  // Each product has 9 parameters, meaning max ~11 products per INSERT statement.
  const CHUNK_SIZE = 10;
  let inserted = 0;

  for (let i = 0; i < products.length; i += CHUNK_SIZE) {
    const chunk = products.slice(i, i + CHUNK_SIZE);
    
    // Construct multi-value insert statement
    const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
    const statementStr = `INSERT INTO products (id, name, slug, description, price, category, stock, rating, image_url) VALUES ${placeholders}`;
    
    const params = chunk.flatMap((p) => [
      p.id,
      p.name,
      p.slug,
      p.description,
      p.price,
      p.category,
      p.stock,
      p.rating,
      p.image_url,
    ]);

    const { success, error } = await db.prepare(statementStr).bind(...params).run();

    if (!success) {
      throw new Error(`Failed to seed chunk at index ${i}: ${error}`);
    }
    inserted += chunk.length;
  }

  return { message: 'Seeding completed successfully.', inserted };
}
