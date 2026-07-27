import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Exam Management System API',
            version: '3.0.0',
            description: 'Comprehensive API documentation for the Exam Management System with advanced proctoring, scheduling, and analytics capabilities.',
            contact: {
                name: 'API Support',
                email: 'support@examportal.com',
            },
            license: {
                name: 'MIT',
                url: 'https://opensource.org/licenses/MIT',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development server',
            },
            {
                url: 'https://api.examportal.com',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter JWT token obtained from login',
                },
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', format: 'email', example: 'john@example.com' },
                        role: { type: 'string', enum: ['student', 'admin'], example: 'student' },
                        isActive: { type: 'boolean', example: true },
                        assignedExams: { type: 'array', items: { type: 'string' } },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Exam: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        title: { type: 'string', example: 'JavaScript Fundamentals' },
                        description: { type: 'string', example: 'Test your JavaScript knowledge' },
                        duration: { type: 'number', example: 60, description: 'Duration in minutes' },
                        passingScore: { type: 'number', example: 70, description: 'Passing percentage' },
                        category: { type: 'string', example: 'Programming' },
                        isActive: { type: 'boolean', example: true },
                        questions: { type: 'array', items: { type: 'string' } },
                        assignedStudents: { type: 'array', items: { type: 'string' } },
                        allowedAttempts: { type: 'number', example: 1 },
                        startDate: { type: 'string', format: 'date-time' },
                        endDate: { type: 'string', format: 'date-time' },
                        showCalculator: { type: 'boolean', example: false },
                        showReviewScreen: { type: 'boolean', example: true },
                        requirePhotoCapture: { type: 'boolean', example: false },
                        createdBy: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },
                Question: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        type: {
                            type: 'string',
                            enum: ['multiple-choice', 'single-choice', 'short-answer', 'match-following', 'code-test'],
                            example: 'multiple-choice'
                        },
                        question: { type: 'string', example: 'What is the capital of France?' },
                        options: { type: 'array', items: { type: 'string' }, example: ['Paris', 'London', 'Berlin', 'Madrid'] },
                        correctAnswer: { type: 'number', example: 0 },
                        points: { type: 'number', example: 10 },
                        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'], example: 'easy' },
                        category: { type: 'string', example: 'Geography' },
                        isActive: { type: 'boolean', example: true },
                        createdBy: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },
                ExamSession: {
                    type: 'object',
                    properties: {
                        _id: { type: 'string' },
                        exam: { type: 'string' },
                        student: { type: 'string' },
                        startTime: { type: 'string', format: 'date-time' },
                        endTime: { type: 'string', format: 'date-time' },
                        submittedAt: { type: 'string', format: 'date-time' },
                        answers: { type: 'object' },
                        flaggedQuestions: { type: 'array', items: { type: 'string' } },
                        score: { type: 'number', example: 85 },
                        percentage: { type: 'number', example: 85 },
                        passed: { type: 'boolean', example: true },
                        status: { type: 'string', enum: ['in-progress', 'submitted', 'expired', 'terminated'], example: 'submitted' },
                    },
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'Error message' },
                    },
                },
            },
        },
        tags: [
            { name: 'Authentication', description: 'User authentication endpoints' },
            { name: 'Student - Exams', description: 'Student exam operations' },
            { name: 'Admin - Exams', description: 'Admin exam management' },
            { name: 'Admin - Questions', description: 'Question bank management' },
            { name: 'Admin - Students', description: 'Student management' },
            { name: 'Scheduling', description: 'Exam scheduling' },
            { name: 'Proctoring', description: 'Proctoring and monitoring' },
            { name: 'Analytics', description: 'Analytics and reporting' },
            { name: 'Verification', description: 'Identity and system verification' },
        ],
    },
    apis: ['./server/routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

export const setupSwagger = (app) => {
    // Swagger UI
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: 'Exam Portal API Docs',
    }));

    // Swagger JSON
    app.get('/api-docs.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });

    console.log('📚 Swagger documentation available at /api-docs');
};

export default swaggerSpec;
