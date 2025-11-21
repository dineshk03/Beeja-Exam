# Admin Panel Guide

## Admin Login Credentials

**Default Admin Account:**
- Email: `admin@exam.com`
- Password: `admin123`

This account is automatically created when the server starts.

## Admin Features

### 1. Dashboard
Access: `/admin`

The admin dashboard provides:
- **Statistics Overview**
  - Total exams count
  - Active exams count
  - Total questions in question bank
  - Questions breakdown by type

- **Quick Actions**
  - Create new exam
  - Add questions
  - Access question bank

### 2. Question Bank
Access: `/admin/questions`

Manage all your exam questions with support for 5 question types:

#### Question Types

**1. Multiple Choice**
- General questions with 3 or more options
- Students select one correct answer
- Radio button selection
- Example: "What is the capital of France?" (Paris, London, Berlin, Madrid)

**1a. Multiple Answer (Checkboxes)**
- Questions with multiple correct answers
- Students can select multiple options
- Checkbox selection
- All correct answers must be selected to get points
- Example: "Which are programming languages?" (Python ✓, JavaScript ✓, HTML ✗, Java ✓)

**2. Single Choice**
- Binary or limited choice questions (typically 2 options)
- Used for True/False or Yes/No questions
- Students select one correct answer
- Example: "Is JavaScript a compiled language?" (True, False)

**3. Short Answer**
- Text-based answer
- Multiple acceptable answers support
- Case-sensitive option
- Free-form text input

**4. Match the Following**
- Two columns of items
- Students match left column to right column
- Drag-and-drop or dropdown selection
- Configurable number of items

**5. Code Test**
- Programming questions
- Built-in code editor (Monaco Editor)
- Support for multiple languages:
  - JavaScript
  - Python
  - Java
  - C++
  - C#
- Starter code template
- Multiple test cases with expected outputs
- Points per test case

#### Creating Questions

1. Click "Add Question" button
2. Select question type
3. Fill in:
   - Question text
   - Category (optional)
   - Points value
   - Difficulty level (easy/medium/hard)
4. Add type-specific content:
   - **Multiple/Single Choice**: Add options and mark correct answer
   - **Short Answer**: Add acceptable answers and case sensitivity
   - **Match Following**: Add left and right column items, set correct matches
   - **Code Test**: Select language, add starter code, create test cases
5. Click "Create Question"

#### Managing Questions

- **Search**: Find questions by text or category
- **Filter**: Filter by question type
- **Edit**: Modify existing questions
- **Delete**: Remove questions from bank

### 3. Exam Management
Access: `/admin/exams`

Create and manage exams:

#### Creating an Exam

1. Click "Create Exam"
2. Fill in exam details:
   - Title
   - Description
   - Duration (in minutes)
   - Passing score (percentage)
   - Category
3. Click "Create Exam"

#### Exam Properties

- **Active/Inactive Status**: Toggle exam visibility to students
- **Questions**: Add/remove questions from exam
- **Settings**: Modify exam properties

#### Building an Exam

1. Go to Exam Management
2. Click the "Settings" icon on an exam
3. You'll see two panels:
   - **Left Panel**: Current exam questions
   - **Right Panel**: Available questions from question bank

4. **Adding Questions**:
   - Search or filter available questions
   - Click the "+" button to add to exam

5. **Removing Questions**:
   - Click the trash icon on exam questions

6. **Exam Summary**:
   - View total questions
   - See total points
   - Check duration and passing score

### 4. Exam Builder
Access: `/admin/exams/build/:id`

Advanced exam construction interface:

**Features:**
- Drag-and-drop question ordering (future)
- Real-time exam summary
- Question preview
- Bulk operations
- Search and filter questions

**Exam Summary Shows:**
- Total number of questions
- Total points available
- Exam duration
- Passing score percentage

## Question Bank Best Practices

### 1. Categorization
- Use consistent category names
- Group related questions
- Examples: "JavaScript Basics", "React Hooks", "Python Fundamentals"

### 2. Point Distribution
- Easy questions: 5-10 points
- Medium questions: 10-15 points
- Hard questions: 15-25 points
- Code tests: 20-50 points (based on test cases)

### 3. Question Quality
- Write clear, unambiguous questions
- Avoid trick questions
- Provide realistic code scenarios for code tests
- Test one concept per question

### 4. Code Test Questions
- Provide helpful starter code
- Include edge cases in test cases
- Make test cases comprehensive
- Assign appropriate points per test case

## Exam Creation Workflow

### Recommended Process:

1. **Plan Your Exam**
   - Define learning objectives
   - Determine question distribution
   - Set appropriate duration

2. **Create Questions**
   - Build question bank first
   - Mix question types for variety
   - Ensure adequate difficulty distribution

3. **Build Exam**
   - Create exam structure
   - Add questions strategically
   - Review total points and time

4. **Test & Activate**
   - Review all questions
   - Check exam settings
   - Activate when ready

## Managing Question Types

### Multiple Choice Questions
```
Best for:
- Concept understanding
- Fact recall
- Scenario-based questions

Tips:
- Use 4 options typically
- Make distractors plausible
- Avoid "all of the above"
```

### Short Answer Questions
```
Best for:
- Definitions
- Brief explanations
- Fill-in-the-blank

Tips:
- Accept multiple correct answers
- Consider case sensitivity
- Keep answers concise
```

### Match the Following
```
Best for:
- Terminology matching
- Concept relationships
- Paired information

Tips:
- Use 4-6 items per column
- Ensure clear relationships
- Avoid ambiguous matches
```

### Code Test Questions
```
Best for:
- Algorithm implementation
- Problem-solving
- Syntax knowledge

Tips:
- Provide clear requirements
- Include sample input/output
- Test edge cases
- Give partial credit via test cases
```

## Student Experience

When students take exams:
- They see questions based on type
- Code editor for programming questions
- Drag-drop or dropdown for matching
- Text area for short answers
- Radio buttons for multiple choice

## Analytics (Future Feature)

Planned analytics include:
- Question difficulty analysis
- Student performance by question type
- Time spent per question
- Pass/fail rates
- Most missed questions

## API Endpoints for Admin

### Exams
- `GET /api/admin/exams` - List all exams
- `POST /api/admin/exams` - Create exam
- `PUT /api/admin/exams/:id` - Update exam
- `DELETE /api/admin/exams/:id` - Delete exam

### Questions
- `GET /api/admin/questions` - List all questions
- `POST /api/admin/questions` - Create question
- `PUT /api/admin/questions/:id` - Update question
- `DELETE /api/admin/questions/:id` - Delete question

### Exam Building
- `POST /api/admin/exams/:examId/questions/:questionId` - Add question to exam
- `DELETE /api/admin/exams/:examId/questions/:questionId` - Remove question from exam

### Statistics
- `GET /api/admin/stats` - Get system statistics

## Troubleshooting

### Questions not appearing in exam builder
- Check if questions are already added to the exam
- Verify question bank has questions
- Clear search/filter

### Exam not visible to students
- Check if exam is marked as "Active"
- Ensure exam has at least one question
- Verify exam settings

### Code editor not loading
- Check browser console for errors
- Ensure Monaco Editor is properly installed
- Try refreshing the page

## Security Notes

⚠️ **Important**:
- Change default admin password in production
- Use strong JWT secrets
- Implement rate limiting
- Add HTTPS in production
- Validate all inputs
- Sanitize user-generated content

## TCS iON Style Features 🆕

### Overview
Your exam system now includes TCS iON style features for a professional examination experience.

### 1. Section-Based Exams

Create exams with multiple sections (e.g., Aptitude, Technical, Verbal):

**Features:**
- Each section has its own timer
- Independent question sets per section
- One-way navigation (students can't go back to previous sections)
- Section-wise completion tracking

**How to Create:**
1. When creating/editing an exam, enable "Section-Based Exam"
2. Add sections with:
   - Section name (e.g., "Aptitude")
   - Description
   - Duration (minutes)
   - Questions for that section
   - Navigation settings (allow/block going back)

**Example Structure:**
```
Exam: TCS Coding Assessment
├── Section 1: Aptitude (30 mins, 20 questions)
├── Section 2: Technical (45 mins, 25 questions)
└── Section 3: Programming (60 mins, 5 questions)
```

### 2. Instructions Page

Professional instructions screen before exam starts:

**Features:**
- Exam overview with duration, questions, passing score
- Section-wise breakdown (for sectional exams)
- Custom instructions and rules
- System requirements checklist
- Agreement checkbox (mandatory to proceed)
- Cannot start without accepting terms

**Configuration:**
- Add custom instructions when creating exam
- Add specific rules (displayed with warning icons)
- Instructions auto-shown before exam starts

### 3. On-Screen Calculator

Built-in calculator for students during exam:

**Features:**
- Basic operations (+, -, ×, ÷, %)
- Decimal support
- Memory functions
- Professional TCS iON style UI
- Always accessible during exam

**Configuration:**
- Enable/disable per exam
- Set in exam settings: `showCalculator: true/false`

### 4. Review Screen

Comprehensive review before final submission:

**Features:**
- Shows all questions and their status
- Statistics dashboard (Answered, Not Answered, Marked, Not Visited)
- Section-wise grouping
- Color-coded status indicators
- Warning for unanswered questions
- Option to go back and change answers

**Configuration:**
- Enable/disable per exam
- Set in exam settings: `showReviewScreen: true/false`

### 5. Enhanced Question Status Tracking

TCS iON style 5-category status system:

**Status Categories:**
- 🟢 **Answered** - Question answered
- 🔴 **Not Answered** - Question visited but not answered
- 🟡 **Marked for Review** - Flagged for later review
- 🟣 **Answered & Marked** - Answered but flagged
- ⚪ **Not Visited** - Question not viewed yet

**Features:**
- Automatic status tracking
- Visual indicators in question navigator
- Statistics in navigator and review screen
- Color-coded question palette

### 6. Photo Capture & Proctoring

Identity verification and exam monitoring:

**Features:**
- Initial photo capture before exam starts
- Periodic photo captures during exam
- Webcam permission handling
- Photo storage with timestamps
- Retake option for initial photo

**Configuration:**
```javascript
requirePhotoCapture: true/false
photoCaptureInterval: 300000  // milliseconds (5 mins)
```

### 7. Professional UI/UX

TCS iON inspired design:

**Features:**
- Clean, professional interface
- Gradient headers
- Card-based layouts
- Status-based color coding
- Smooth transitions
- Loading states
- Responsive design

**Color Scheme:**
- Primary: Blue (#2563EB)
- Success: Green (#059669)
- Warning: Yellow (#D97706)
- Danger: Red (#DC2626)
- Info: Purple (#7C3AED)

## Creating a TCS iON Style Exam

### Step-by-Step Guide:

**1. Create Exam**
```
Title: TCS Coding Assessment
Description: Technical screening test
Duration: 120 minutes (or set per section)
Passing Score: 60%
```

**2. Enable TCS iON Features**
```
☑ Section-Based Exam
☑ Show Instructions Page
☑ Enable Calculator
☑ Enable Review Screen
☑ Require Photo Capture
```

**3. Add Sections**
```
Section 1: Aptitude
- Duration: 30 mins
- Questions: 20
- ☑ One-way navigation

Section 2: Technical
- Duration: 45 mins
- Questions: 25
- ☑ One-way navigation

Section 3: Programming
- Duration: 45 mins
- Questions: 10
- ☑ One-way navigation
```

**4. Add Instructions**
```
General Instructions:
1. Read all questions carefully
2. Each section has a separate timer
3. You cannot go back to previous sections
4. Use the on-screen calculator if needed
5. Review your answers before final submission
```

**5. Add Rules**
```
- No external resources allowed
- Tab switching will be monitored
- Camera must remain on throughout
- Any violation may result in disqualification
```

**6. Build Question Bank**
- Add questions to appropriate sections
- Mix question types for variety
- Set appropriate difficulty levels

## Student Exam Flow (TCS iON Style)

1. **Instructions Page**
   - View exam details
   - Read instructions and rules
   - Check system requirements
   - Accept terms and conditions

2. **Photo Capture** (if enabled)
   - Initial identity verification
   - Periodic captures during exam

3. **Section 1**
   - Section timer starts
   - Answer questions
   - Use calculator if needed
   - Mark questions for review
   - Submit section (cannot go back)

4. **Section 2, 3, etc.**
   - Repeat process for each section

5. **Review Screen** (if enabled)
   - See all answers summary
   - View statistics
   - Go back to change answers
   - Final confirmation

6. **Submit**
   - Final submission
   - View results

## Question Navigator Features

Enhanced TCS iON style navigator:

**Statistics Display:**
- Total questions
- Answered count
- Not answered count
- Marked for review count
- Not visited count

**Question Grid:**
- Color-coded status
- One-click navigation
- Flag indicator
- Current question highlight

**Legend:**
- Visual guide for all status colors
- Clear explanations

## Future Enhancements

Planned features:
- [ ] Question import/export (CSV, JSON)
- [ ] Exam templates
- [ ] Question randomization
- [ ] Time limits per question
- [ ] Question pools
- [ ] Partial credit for code tests
- [ ] Plagiarism detection for code
- [ ] Detailed analytics dashboard
- [ ] Student performance reports
- [ ] Exam scheduling
- [✅] Proctoring features (Photo Capture Implemented)
