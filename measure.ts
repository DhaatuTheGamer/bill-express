import Database from 'better-sqlite3';

const db = new Database(':memory:');

db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    unit TEXT NOT NULL,
    price_ex_gst REAL NOT NULL,
    gst_rate REAL NOT NULL,
    hsn_code TEXT NOT NULL,
    stock REAL NOT NULL DEFAULT 0
  );
`);

const numProducts = 100000;
const products = [];
for (let i = 0; i < numProducts; i++) {
  products.push({
    code: `CODE${i}`,
    name: `Product ${i}`,
    category: `Category ${i % 10}`,
    unit: 'pcs',
    price: Math.random() * 1000,
    gst: 18,
    hsn: `HSN${i}`
  });
}

function testCurrent() {
  db.exec('DELETE FROM products');
  const start = performance.now();
  const insertMany = db.transaction((products: any[]) => {
    if (products.length === 0) return;

    const CHUNK_SIZE = 100;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, 100)').join(', ');
      const sql = `INSERT OR IGNORE INTO products (code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock) VALUES ${placeholders}`;
      const params: any[] = [];
      for (const p of chunk) {
        params.push(p.code, p.name, p.category, p.unit, p.price, p.gst, p.hsn);
      }
      db.prepare(sql).run(...params);
    }
  });

  insertMany(products);
  const end = performance.now();
  return end - start;
}

function testFlatMap() {
  db.exec('DELETE FROM products');
  const start = performance.now();
  const insertMany = db.transaction((products: any[]) => {
    if (products.length === 0) return;

    const CHUNK_SIZE = 100;
    for (let i = 0; i < products.length; i += CHUNK_SIZE) {
      const chunk = products.slice(i, i + CHUNK_SIZE);
      const placeholders = chunk.map(() => '(?, ?, ?, ?, ?, ?, ?, 100)').join(', ');
      const sql = `INSERT OR IGNORE INTO products (code, name, category, unit, price_ex_gst, gst_rate, hsn_code, stock) VALUES ${placeholders}`;

      const params = chunk.flatMap(p => [p.code, p.name, p.category, p.unit, p.price, p.gst, p.hsn]);

      db.prepare(sql).run(...params);
    }
  });

  insertMany(products);
  const end = performance.now();
  return end - start;
}

const numRuns = 20;

const currentTimes = [];
const flatMapTimes = [];

// Warmup
testCurrent();
testFlatMap();

for (let i = 0; i < numRuns; i++) {
  // Alternate execution order to reduce systemic bias
  if (i % 2 === 0) {
    currentTimes.push(testCurrent());
    flatMapTimes.push(testFlatMap());
  } else {
    flatMapTimes.push(testFlatMap());
    currentTimes.push(testCurrent());
  }
}

const currentAvg = currentTimes.reduce((a, b) => a + b, 0) / currentTimes.length;
const flatMapAvg = flatMapTimes.reduce((a, b) => a + b, 0) / flatMapTimes.length;

console.log(`Current Average: ${currentAvg.toFixed(2)}ms`);
console.log(`FlatMap Average: ${flatMapAvg.toFixed(2)}ms`);
