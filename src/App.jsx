import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ExamLobby from './pages/ExamLobby';
import ExamInterface from './pages/ExamInterface';
import TestExamInterface from './pages/TestExamInterface';
import TestHome from './pages/TestHome';
import MinimalExamInterface from './pages/MinimalExamInterface';
import MinimalLogin from './pages/MinimalLogin';
import MinimalDashboard from './pages/MinimalDashboard';
import WorkingExamInterface from './pages/WorkingExamInterface';
import EnhancedTCSExamInterface from './pages/EnhancedTCSExamInterface';
import TestExamPage from './pages/TestExamPage';
import Results from './pages/Results';
import MyResults from './pages/MyResults';
import ExamResult from './pages/ExamResult';
import LiveExamResult from './pages/LiveExamResult';
import PreExamChecks from './pages/PreExamChecks';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ExamManagement from './pages/admin/ExamManagement';
import QuestionBank from './pages/admin/QuestionBank';
import CreateQuestion from './pages/admin/CreateQuestion';
import BulkQuestionImport from './pages/admin/BulkQuestionImport';
import ExamBuilder from './pages/admin/ExamBuilder';
import StudentManagement from './pages/admin/StudentManagement';
import CreateStudent from './pages/admin/CreateStudent';
import BulkStudentImport from './pages/admin/BulkStudentImport';
import StudentDetails from './pages/admin/StudentDetails';
import BatchManagement from './pages/admin/BatchManagement';
import ProctorMonitor from './pages/admin/ProctorMonitor';
import Scheduling from './pages/admin/Scheduling';
import Analytics from './pages/admin/Analytics';
import ReportManagement from './pages/admin/ReportManagement';
import StudentAnswers from './pages/admin/StudentAnswers';
import QuestionPapers from './pages/admin/QuestionPapers';

function App() {
  const { token, user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!token ? <Login /> : <Navigate to={isAdmin ? "/admin" : "/dashboard"} />} />
        <Route path="/register" element={!token ? <Register /> : <Navigate to={isAdmin ? "/admin" : "/dashboard"} />} />
        
        {/* Student Routes */}
        <Route path="/dashboard" element={token && !isAdmin ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/exam/:examId/pre-checks" element={token && !isAdmin ? <PreExamChecks /> : <Navigate to="/login" />} />
        <Route path="/exam/:examId/lobby" element={token && !isAdmin ? <ExamLobby /> : <Navigate to="/login" />} />
        <Route path="/exam/:examId/start" element={token && !isAdmin ? <EnhancedTCSExamInterface /> : <Navigate to="/login" />} />
        <Route path="/exam/result" element={token && !isAdmin ? <Results /> : <Navigate to="/login" />} />
        <Route path="/my-results" element={token && !isAdmin ? <MyResults /> : <Navigate to="/login" />} />
        <Route path="/result/:sessionId" element={token && !isAdmin ? <ExamResult /> : <Navigate to="/login" />} />
        <Route path="/live-result" element={token && !isAdmin ? <LiveExamResult /> : <Navigate to="/login" />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={token && isAdmin ? <AdminDashboard /> : <Navigate to="/login" />} />
        <Route path="/admin/exams" element={token && isAdmin ? <ExamManagement /> : <Navigate to="/login" />} />
        <Route path="/admin/questions" element={token && isAdmin ? <QuestionBank /> : <Navigate to="/login" />} />
        <Route path="/admin/questions/create" element={token && isAdmin ? <CreateQuestion /> : <Navigate to="/login" />} />
        <Route path="/admin/questions/bulk-import" element={token && isAdmin ? <BulkQuestionImport /> : <Navigate to="/login" />} />
        <Route path="/admin/questions/edit/:id" element={token && isAdmin ? <CreateQuestion /> : <Navigate to="/login" />} />
        <Route path="/admin/exams/build/:id" element={token && isAdmin ? <ExamBuilder /> : <Navigate to="/login" />} />
        <Route path="/admin/students" element={token && isAdmin ? <StudentManagement /> : <Navigate to="/login" />} />
        <Route path="/admin/students/create" element={token && isAdmin ? <CreateStudent /> : <Navigate to="/login" />} />
        <Route path="/admin/students/edit/:id" element={token && isAdmin ? <CreateStudent /> : <Navigate to="/login" />} />
        <Route path="/admin/students/bulk-import" element={token && isAdmin ? <BulkStudentImport /> : <Navigate to="/login" />} />
        <Route path="/admin/students/:id" element={token && isAdmin ? <StudentDetails /> : <Navigate to="/login" />} />
        <Route path="/admin/batches" element={token && isAdmin ? <BatchManagement /> : <Navigate to="/login" />} />
        <Route path="/admin/proctoring" element={token && isAdmin ? <ProctorMonitor /> : <Navigate to="/login" />} />
        <Route path="/admin/scheduling" element={token && isAdmin ? <Scheduling /> : <Navigate to="/login" />} />
        <Route path="/admin/analytics" element={token && isAdmin ? <Analytics /> : <Navigate to="/login" />} />
        <Route path="/admin/reports" element={token && isAdmin ? <ReportManagement /> : <Navigate to="/login" />} />
        <Route path="/admin/student-answers" element={token && isAdmin ? <StudentAnswers /> : <Navigate to="/login" />} />
        <Route path="/admin/exams/:examId/question-papers" element={token && isAdmin ? <QuestionPapers /> : <Navigate to="/login" />} />
        
        <Route path="/" element={<Navigate to={token ? (isAdmin ? "/admin" : "/dashboard") : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
