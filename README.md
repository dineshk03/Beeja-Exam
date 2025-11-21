# Exam Module - Pearson VUE Style

A comprehensive exam management system built with React and Node.js, featuring a Pearson VUE-inspired interface for conducting online assessments with a complete admin panel.

## Features

### 👨‍💼 Admin Features
- **Admin Dashboard** - Complete overview of exams and questions
- **Question Bank** - Centralized question management
- **5 Question Types** - Multiple choice, single choice, short answer, match following, code test
- **Exam Builder** - Drag-and-drop exam construction
- **Code Editor** - Monaco editor for programming questions
- **Analytics** - Question and exam statistics
- **Role-Based Access** - Separate admin and student interfaces

### 🎯 Student Features
- **User Authentication** - Secure login and registration system
- **Exam Dashboard** - Browse and select available exams
- **Exam Lobby** - Pre-exam instructions and rules
- **Timed Exams** - Countdown timer with warnings
- **Question Navigation** - Easy navigation between questions
- **Flag for Review** - Mark questions for later review
- **Question Navigator** - Visual grid showing exam progress
- **Auto-Submit** - Automatic submission when time expires
- **Results Display** - Detailed score breakdown and performance analysis
- **Multiple Question Types** - Support for all 5 question types

### 🎨 UI/UX Features
- Modern, clean interface inspired by Pearson VUE
- Responsive design for all devices
- Real-time timer with visual warnings
- Progress tracking
- Color-coded question status (answered, unanswered, flagged)
- Confirmation dialogs for critical actions
- Code syntax highlighting
- Intuitive admin interface

## Tech Stack

### Frontend
- **React 18** - UI library
- **React Router** - Navigation
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Monaco Editor** - Code editor for programming questions
- **Vite** - Build tool

### Backend
- **Node.js** - Runtime
- **Express** - Web framework
- **MongoDB** - Database with Mongoose ODM
- **JWT** - Authentication with role-based access
- **bcryptjs** - Password hashing

## Installation

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- MongoDB installed locally OR MongoDB Atlas account (cloud)

### Setup Steps

1. **Clone or navigate to the project directory**
   ```bash
   cd d:\Exam
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   copy .env.example .env
   ```

4. **Edit `.env` file with your configuration**
   ```
   PORT=5000
   JWT_SECRET=your-secret-key-change-this
   NODE_ENV=development
   MONGODB_URI=mongodb://localhost:27017/exam-module
   ```
   
   For MongoDB Atlas (cloud), use:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/exam-module
   ```

5. **Setup MongoDB** (See [MONGODB_SETUP.md](./MONGODB_SETUP.md) for detailed instructions)
   - Install MongoDB locally OR create MongoDB Atlas account
   - Start MongoDB service (if local)
   - Database will be created automatically on first run

6. **Start the application**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on `http://localhost:5000`
   - Frontend dev server on `http://localhost:3000`

## Usage

### Admin Access

**Default Admin Credentials:**
- Email: `admin@exam.com`
- Password: `admin123`

**Admin Features:**
1. **Dashboard** - View statistics and quick actions
2. **Question Bank** - Create and manage questions (5 types supported)
3. **Exam Management** - Create exams and add questions
4. **Exam Builder** - Build exams by adding questions from the bank

See [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) for detailed admin documentation.

### Student Access

1. **Register an Account**
   - Navigate to `http://localhost:3000`
   - Click "Register" and create a student account
   - Or use the login page if you already have an account

2. **Browse Exams**
   - View available exams on the dashboard
   - See exam details (duration, questions, passing score)

3. **Take an Exam**
   - Click "Start Exam" on any exam card
   - Read and accept the exam rules
   - Click "Start Exam" to begin

4. **During the Exam**
   - Answer questions based on type:
     - **Multiple/Single Choice**: Select the correct option
     - **Short Answer**: Type your answer
     - **Match Following**: Match items from two columns
     - **Code Test**: Write code in the editor
   - Use "Next" and "Previous" to navigate
   - Click the flag icon to mark questions for review
   - Use "Navigator" button to see all questions at once
   - Monitor the timer in the header
   - Submit when ready or wait for auto-submit

5. **View Results**
   - See your score and performance breakdown
   - Review correct/incorrect answers count
   - Return to dashboard for more exams

## Project Structure

```
d:\Exam\
├── server/                 # Backend code
│   ├── index.js           # Express server
│   ├── middleware/        # Auth middleware
│   └── routes/            # API routes
│       ├── auth.js        # Authentication
│       ├── exams.js       # Exam management
│       └── results.js     # Results
├── src/                   # Frontend code
│   ├── api/              # API client
│   ├── components/       # React components
│   │   ├── ExamTimer.jsx
│   │   ├── QuestionNavigator.jsx
│   │   └── SubmitConfirmation.jsx
│   ├── pages/            # Page components
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ExamLobby.jsx
│   │   ├── ExamInterface.jsx
│   │   └── Results.jsx
│   ├── store/            # State management
│   │   ├── authStore.js
│   │   └── examStore.js
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
│   └── index.css         # Global styles
├── package.json
├── vite.config.js
├── tailwind.config.js
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Exams
- `GET /api/exams` - Get all exams
- `GET /api/exams/:id` - Get exam details
- `POST /api/exams/:id/start` - Start exam session
- `POST /api/exams/session/:sessionId/answer` - Submit answer
- `POST /api/exams/session/:sessionId/flag` - Flag question
- `POST /api/exams/session/:sessionId/submit` - Submit exam
- `GET /api/exams/session/:sessionId` - Get session status

### Results
- `GET /api/results/my-results` - Get user's results
- `GET /api/results/:id` - Get specific result

## Key Features Explained

### Timer System
- Countdown timer starts when exam begins
- Visual warning when 5 minutes remain
- Auto-submit when time expires
- Cannot be paused once started

### Question Navigation
- Navigate freely between questions
- Visual progress indicator
- Grid view of all questions
- Color-coded status (answered/unanswered/flagged)

### Flagging System
- Mark questions for later review
- Visual flag indicator
- Track flagged questions in navigator
- Review flagged questions before submission

### Security
- JWT-based authentication
- Password hashing with bcrypt
- Protected API routes
- Session validation

## Customization

### Adding New Exams
Edit `server/routes/exams.js` and add to the `exams` array:

```javascript
{
  id: '3',
  title: 'Your Exam Title',
  description: 'Exam description',
  duration: 60, // minutes
  totalQuestions: 20,
  passingScore: 70,
  questions: [
    {
      id: 'q1',
      type: 'multiple-choice',
      question: 'Your question?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0, // Index of correct option
      points: 5,
    },
    // Add more questions...
  ],
}
```

### Styling
- Edit `tailwind.config.js` for theme customization
- Modify `src/index.css` for global styles
- Component styles use Tailwind utility classes

## Production Deployment

1. **Build the frontend**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   - Set `NODE_ENV=production`
   - Use a strong `JWT_SECRET`
   - Configure database connection (if using MongoDB)

3. **Serve the application**
   - Use a process manager like PM2
   - Set up reverse proxy with Nginx
   - Enable HTTPS

## Future Enhancements

- [ ] Database integration (MongoDB/PostgreSQL)
- [ ] Question types (true/false, multiple select, essay)
- [ ] Exam scheduling
- [ ] Admin panel for exam management
- [ ] Detailed analytics and reports
- [ ] Certificate generation
- [ ] Email notifications
- [ ] Proctoring features
- [ ] Question bank management
- [ ] Randomized question order

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions, please create an issue in the project repository.
