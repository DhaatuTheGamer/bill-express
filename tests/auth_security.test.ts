// @vitest-environment node
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

// Setup environment variable before importing server
process.env.NODE_ENV = 'test';
// Ensure env vars are NOT set
delete process.env.ADMIN_USERNAME;
delete process.env.ADMIN_PASSWORD;

import { appPromise } from '../server.js';
import type { Express } from 'express';

let app: Express;

beforeAll(async () => {
    app = await appPromise;
});

describe('Authentication Security', () => {
  it('should return 500 when environment variables are missing', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Server configuration error');
  });

  it('should return 500 when using default credentials if they are NOT in env', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password' });

    expect(response.status).toBe(500); // Because they are missing from env
  });

  it('should work when environment variables are set', async () => {
    process.env.ADMIN_USERNAME = 'validuser';
    process.env.ADMIN_PASSWORD = 'validpassword';

    const response = await request(app)
      .post('/api/login')
      .send({ username: 'validuser', password: 'validpassword' });

    expect(response.status).toBe(200);

    const cookies = response.headers['set-cookie'];

    const healthResponse = await request(app)
      .get('/api/health')
      .set('Cookie', cookies);

    expect(healthResponse.status).toBe(200);

    // Clean up
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
  });
});
