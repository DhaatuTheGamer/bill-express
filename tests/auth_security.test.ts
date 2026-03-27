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
  it('should return 500 when logging in and environment variables are missing', async () => {
    const response = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'password' });

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Server configuration error');
  });

  it('should return 401 when logging in with invalid credentials', async () => {
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'password';

    const response = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'wrongpassword' });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');

    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
  });

  it('should set an auth token cookie when logging in successfully and verify access', async () => {
    process.env.ADMIN_USERNAME = 'validuser';
    process.env.ADMIN_PASSWORD = 'validpassword';

    const loginResponse = await request(app)
      .post('/api/login')
      .send({ username: 'validuser', password: 'validpassword' });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.success).toBe(true);

    const cookies = loginResponse.headers['set-cookie'];
    expect(cookies).toBeDefined();

    const cookieString = Array.isArray(cookies) ? cookies.find(c => c.startsWith('auth_token=')) : cookies;
    expect(cookieString).toBeDefined();

    // Verify access
    const response = await request(app)
      .get('/api/health')
      .set('Cookie', cookieString);

    expect(response.status).toBe(200);

    // Clean up
    delete process.env.ADMIN_USERNAME;
    delete process.env.ADMIN_PASSWORD;
  });
});
