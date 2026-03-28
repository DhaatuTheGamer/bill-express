// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { appPromise } from '../server.js';
import type { Express } from 'express';

// Setup environment variable before importing server
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'password';

let app: Express;
let authCookie: string;

beforeAll(async () => {
    app = await appPromise;
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password' });
    authCookie = loginRes.headers['set-cookie'] as unknown as string;
});

describe('PUT /api/settings security validation', () => {
  it('should return 400 when store_name is not a string', async () => {
    const response = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie)
      .send({
        store_name: 123, // Invalid: should be string
        address: 'Test Address',
        phone: '1234567890',
        gstin: 'GSTIN123',
        state_code: 'SC123',
        logo_url: 'http://example.com/logo.png'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or missing required fields');
  });

  it('should return 400 when logo_url is not a string or null', async () => {
    const response = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie)
      .send({
        store_name: 'Store Name',
        address: 'Test Address',
        phone: '1234567890',
        gstin: 'GSTIN123',
        state_code: 'SC123',
        logo_url: 123 // Invalid: should be string or null
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or missing required fields');
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await request(app)
      .put('/api/settings')
      .set('Cookie', authCookie)
      .send({
        store_name: 'Store Name'
        // Missing other fields
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Invalid or missing required fields');
  });
});
