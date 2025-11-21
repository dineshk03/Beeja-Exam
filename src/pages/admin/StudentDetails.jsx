import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Calendar, BookOpen, Plus, Trash2, CheckCircle, XCircle, Users } from 'lucide-react';
import api from '../../api/axios';
import AdminLayout from '../../components/admin/AdminLayout';

function StudentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [availableExams, setAvailableExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchStudentDetails();
    fetchAvailableExams();
  }, [id]);

  const fetchStudentDetails = async () => {
    try {
      const response = await api.get(`/admin/students/${id}`);
      setStudent(response.data.student);
      setSessions(response.data.sessions);
    } catch (error) {
      console.error('Error fetching student details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableExams = async () => {
    try {
      const response = await api.get('/admin/exams');
      setAvailableExams(response.data);
    } catch (error) {
      console.error('Error fetching exams:', error);
    }
  };

  const assignExam = async (examId) => {
    try {
      await api.post(`/admin/exams/${examId}/assign/${id}`);
      fetchStudentDetails();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning exam:', error);
      alert(error.response?.data?.error || 'Failed to assign exam');
    }
  };

  const unassignExam = async (examId) => {
    if (!confirm('Are you sure you want to unassign this exam?')) return;
    
    try {
      await api.delete(`/admin/exams/${examId}/assign/${id}`);
      fetchStudentDetails();
    } catch (error) {
      console.error('Error unassigning exam:', error);
      alert('Failed to unassign exam');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading student details...</div>
        </div>
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-gray-600">Student not found</p>
          <button
            onClick={() => navigate('/admin/students')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Students
          </button>
        </div>
      </AdminLayout>
    );
  }

  const unassignedExams = availableExams.filter(
    exam => !student.assignedExams.some(assigned => assigned._id === exam._id)
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/students')}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{student.name}</h1>
            <p className="text-gray-600 mt-1">Student Details & Exam Assignments</p>
          </div>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900">{student.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Joined Date</p>
                <p className="text-gray-900">{new Date(student.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <BookOpen className="w-5 h-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Assigned Exams</p>
                <p className="text-gray-900">{student.assignedExams.length} exams</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-500">Batch</p>
                <p className="text-gray-900">
                  {student.batch ? (
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                      {student.batch}
                    </span>
                  ) : (
                    <span className="text-gray-400">No batch assigned</span>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-5 h-5 flex items-center justify-center">
                {student.isActive ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={student.isActive ? 'text-green-600' : 'text-red-600'}>
                  {student.isActive ? 'Active' : 'Inactive'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assigned Exams */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Assigned Exams</h2>
            <button
              onClick={() => setShowAssignModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              <span>Assign Exam</span>
            </button>
          </div>

          {student.assignedExams.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No exams assigned yet</p>
          ) : (
            <div className="space-y-3">
              {student.assignedExams.map((exam) => (
                <div
                  key={exam._id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h3 className="font-semibold text-gray-900">{exam.title}</h3>
                    <p className="text-sm text-gray-600">{exam.duration} minutes</p>
                  </div>
                  <button
                    onClick={() => unassignExam(exam._id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    title="Unassign Exam"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Exam Sessions History */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Exam History</h2>
          {sessions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No exam attempts yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sessions.map((session) => (
                    <tr key={session._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.exam?.title || 'Unknown Exam'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(session.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {session.status === 'submitted' 
                          ? `${session.percentage?.toFixed(1)}%` 
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            session.status === 'submitted'
                              ? session.passed
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {session.status === 'submitted'
                            ? session.passed
                              ? 'Passed'
                              : 'Failed'
                            : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Assign Exam Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Assign Exam</h3>
            {unassignedExams.length === 0 ? (
              <p className="text-gray-500 text-center py-4">All exams are already assigned</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {unassignedExams.map((exam) => (
                  <button
                    key={exam._id}
                    onClick={() => assignExam(exam._id)}
                    className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-300"
                  >
                    <div className="font-semibold text-gray-900">{exam.title}</div>
                    <div className="text-sm text-gray-600">{exam.duration} minutes</div>
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAssignModal(false)}
              className="mt-4 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default StudentDetails;
