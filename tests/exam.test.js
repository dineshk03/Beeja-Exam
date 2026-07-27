import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../server/index.js';
import User from '../server/models/User.js';
import Exam from '../server/models/Exam.js';
import Question from '../server/models/Question.js';

describe('Exam API', () => {
    let adminToken;
    let studentToken;
    let testExam;
    let testQuestion;

    beforeAll(async () => {
        const testDbUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/exam-test';
        await mongoose.connect(testDbUri);

        // Clear test data
        await User.deleteMany({});
        await Exam.deleteMany({});
        await Question.deleteMany({});

        // Create admin user
        const adminResponse = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Admin User',
                email: 'admin@test.com',
                password: 'Admin123!@#',
                role: 'admin'
            });
        adminToken = adminResponse.body.token;

        // Create student user
        const studentResponse = await request(app)
            .post('/api/auth/register')
            .send({
                name: 'Student User',
                email: 'student@test.com',
                password: 'Student123!@#',
                role: 'student'
            });
        studentToken = studentResponse.body.token;
    });

    afterAll(async () => {
        await mongoose.connection.close();
    });

    describe('Admin Exam Management', () => {
        it('should create a new exam (admin only)', async () => {
            const response = await request(app)
                .post('/api/admin/exams')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Test Exam',
                    description: 'This is a test exam',
                    duration: 60,
                    passingScore: 70,
                    category: 'Testing'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('title', 'Test Exam');
            testExam = response.body;
        });

        it('should reject exam creation by student', async () => {
            const response = await request(app)
                .post('/api/admin/exams')
                .set('Authorization', `Bearer ${studentToken}`)
                .send({
                    title: 'Unauthorized Exam',
                    description: 'Should fail',
                    duration: 60,
                    passingScore: 70
                });

            expect(response.status).toBe(403);
        });

        it('should get all exams (admin)', async () => {
            const response = await request(app)
                .get('/api/admin/exams')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('should update exam details', async () => {
            const response = await request(app)
                .put(`/api/admin/exams/${testExam._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Updated Test Exam',
                    duration: 90
                });

            expect(response.status).toBe(200);
            expect(response.body.title).toBe('Updated Test Exam');
            expect(response.body.duration).toBe(90);
        });

        it('should create a question', async () => {
            const response = await request(app)
                .post('/api/admin/questions')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    type: 'multiple-choice',
                    question: 'What is 2 + 2?',
                    options: ['2', '3', '4', '5'],
                    correctAnswer: 2,
                    points: 10,
                    difficulty: 'easy',
                    category: 'Math'
                });

            expect(response.status).toBe(201);
            expect(response.body).toHaveProperty('question', 'What is 2 + 2?');
            testQuestion = response.body;
        });

        it('should add question to exam', async () => {
            const response = await request(app)
                .post(`/api/admin/exams/${testExam._id}/questions/${testQuestion._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.message).toContain('added');
        });

        it('should delete exam', async () => {
            const response = await request(app)
                .delete(`/api/admin/exams/${testExam._id}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
        });
    });

    describe('Student Exam Access', () => {
        let activeExam;

        beforeEach(async () => {
            // Create an active exam for testing
            const response = await request(app)
                .post('/api/admin/exams')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    title: 'Student Test Exam',
                    description: 'For student testing',
                    duration: 30,
                    passingScore: 60,
                    isActive: true
                });
            activeExam = response.body;
        });

        it('should get available exams (student)', async () => {
            const response = await request(app)
                .get('/api/exams')
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(Array.isArray(response.body)).toBe(true);
        });

        it('should get exam details', async () => {
            const response = await request(app)
                .get(`/api/exams/${activeExam._id}`)
                .set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('title');
        });

        it('should reject access without authentication', async () => {
            const response = await request(app)
                .get('/api/exams');

            expect(response.status).toBe(401);
        });
    });
});
