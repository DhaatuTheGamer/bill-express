// @vitest-environment node
import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import db from '../src/db/index.js';

process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'password';


import { appPromise } from '../server.js';
import type { Express } from 'express';

let app: Express;
let authCookie: string;

beforeAll(async () => {
    app = await appPromise;
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password' });
    authCookie = loginRes.headers['set-cookie'] as unknown as string;
});

beforeEach(() => {
    db.exec('DELETE FROM customers');
});

describe('Customers API Validation', () => {
  it('should create a customer with valid data', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Cookie', authCookie)
      .send({
        name: 'John Doe',
        mobile: '1234567890',
        address: '123 Main St',
        gstin: '27AAAAA0000A1Z5',
        state: 'Maharashtra'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });

  it('should create a customer with only required data', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Cookie', authCookie)
      .send({
        name: 'Jane Doe'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('id');
  });

  it('should reject creating a customer with invalid name type', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Cookie', authCookie)
      .send({
        name: { first: 'John', last: 'Doe' }
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or missing required fields');
  });

  it('should reject creating a customer with invalid mobile type', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Cookie', authCookie)
      .send({
        name: 'John Doe',
        mobile: 1234567890 // number instead of string
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or missing required fields');
  });

  it('should reject creating a customer with missing name', async () => {
    const response = await request(app)
      .post('/api/customers')
      .set('Cookie', authCookie)
      .send({
        mobile: '1234567890'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or missing required fields');
  });

  describe('PUT /api/customers/:id', () => {
    let customerId: number;

    beforeEach(() => {
      const stmt = db.prepare('INSERT INTO customers (name, mobile) VALUES (?, ?)');
      const info = stmt.run('Existing Customer', '9876543210');
      customerId = info.lastInsertRowid as number;
    });

    it('should update a customer with valid data', async () => {
      const response = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Updated Customer',
          mobile: '0000000000'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject updating a customer with invalid data types', async () => {
      const response = await request(app)
        .put(`/api/customers/${customerId}`)
        .set('Cookie', authCookie)
        .send({
          name: 'Updated Customer',
          state: ['New York'] // array instead of string
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or missing required fields');
    });
  });
});
