// @vitest-environment node
import { test, describe, afterAll as after, beforeAll, assert } from 'vitest';
import request from 'supertest';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'password';
import { appPromise } from '../../server.js';
import type { Express } from 'express';
import db from '../db/index.js';

describe('Products API', () => {
  let app: Express;
  let authCookie: string;

  beforeAll(async () => {
    app = await appPromise;
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password' });

    const cookies = res.headers['set-cookie'];
    authCookie = Array.isArray(cookies) ? cookies.find(c => c.startsWith('auth_token=')) || '' : cookies || '';
  });

  const testProduct = {
    code: 'TEST_DUP_01',
    name: 'Duplicate Test Product',
    category: 'Test',
    unit: 'pcs',
    price_ex_gst: 100,
    gst_rate: 18,
    hsn_code: '1234',
    stock: 10
  };

  after(() => {
    // Cleanup the database after tests
    db.prepare('DELETE FROM products WHERE code = ?').run(testProduct.code);
  });

  test('should return 400 when inserting a product with a duplicate code', async () => {
    // 1. Insert the product for the first time
    const res1 = await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send(testProduct)
      .expect(200);

    assert.ok(res1.body.id, 'First insert should return an id');

    // 2. Insert the same product again to trigger UNIQUE constraint violation
    const res2 = await request(app)
      .post('/api/products')
      .set('Cookie', authCookie)
      .send(testProduct)
      .expect(400);

    assert.ok(res2.body.error, 'Response should contain an error message');
    assert.match(res2.body.error, /An error occurred while processing the request/, 'Error message should indicate failure');
  });
});
