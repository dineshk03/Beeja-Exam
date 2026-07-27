import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server/index.js';
import User from '../server/models/User.js';

describe('Authentication API', () => {
    let server;

    beforeAll(async () => {
        // Connect to test database
        const testDbUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/exam-test';
        await mongoose.connect(testDbUri);

        // Clear test data
        await User.deleteMany({});
    });

    afterAll(async () => {
        await mongoose.connection.close();
        if (server) server.close();
    });

    describe('POST /api/auth/register', () => {
        it('should register a new user successfully', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Student',
                    email: 'test@example.com',
                    password: 'Test123!@#',
                    role: 'student'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', 'test@example.com');
            expect(response.body.user).not.toHaveProperty('password');
        });

        it('should reject duplicate email registration', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Student 2',
                    email: 'test@example.com',
                    password: 'Test123!@#',
                    role: 'student'
                });

            expect(response.status).toBe(400);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject invalid email format', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Student',
                    email: 'invalid-email',
                    password: 'Test123!@#',
                    role: 'student'
                });

            expect(response.status).toBe(400);
        });

        it('should reject weak passwords', async () => {
            const response = await request(app)
                .post('/api/auth/register')
                .send({
                    name: 'Test Student',
                    email: 'test2@example.com',
                    password: '123',
                    role: 'student'
                });

            expect(response.status).toBe(400);
        });
    });

    describe('POST /api/auth/login', () => {
        it('should login with correct credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'Test123!@#'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token');
            expect(response.body.user).toHaveProperty('email', 'test@example.com');
        });

        it('should reject incorrect password', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'test@example.com',
                    password: 'WrongPassword'
                });

            expect(response.status).toBe(401);
        });

        it('should reject non-existent user', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'Test123!@#'
                });

            expect(response.status).toBe(401);
        });
    });
});
