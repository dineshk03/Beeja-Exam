import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, ArrowRight } from 'lucide-react';
import { getUserCertificates } from '../services/certificateAPI';
import CertificateModal from '../components/Certificate/CertificateModal';
import { formatDate } from '../utils/dateFormatter';
import { useAuthStore } from '../store/authStore';

export default function Certificates() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const data = await getUserCertificates();
        // Attach the logged-in student's name to each certificate for the modal
        setCertificates(data.map(c => ({ ...c, studentName: user?.name || '' })));
      } catch (error) {
        console.error('Error fetching certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Award className="w-8 h-8 text-cyan-500" />
          <h1 className="text-3xl font-semibold text-gray-900">My Certificates</h1>
        </div>

        {certificates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">No certificates yet</p>
            <p className="text-gray-400 text-sm mb-6">
              Complete an exam with a passing score to earn your first certificate!
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 transition-colors text-sm font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((certificate) => (
              <div
                key={certificate.certificateId}
                onClick={() => setSelectedCertificate(certificate)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
              >
                {/* Top accent */}
                <div className="h-1 w-12 bg-cyan-500 rounded-full mb-4" />

                <h3 className="text-base font-semibold text-gray-900 mb-3 line-clamp-2">
                  {certificate.courseName}
                </h3>

                <div className="space-y-1 text-sm text-gray-500 mb-4">
                  <p>
                    <span className="font-medium text-gray-700">ID:</span>{' '}
                    {certificate.certificateId}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Completed:</span>{' '}
                    {formatDate(certificate.completionDate)}
                  </p>
                  <p>
                    <span className="font-medium text-gray-700">Score:</span>{' '}
                    <span className="text-cyan-600 font-semibold">{certificate.score}%</span>
                    {certificate.grade && (
                      <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {certificate.grade}
                      </span>
                    )}
                  </p>
                </div>

                <button className="flex items-center gap-1 text-cyan-600 text-sm font-medium hover:text-cyan-700 transition-colors">
                  View Certificate <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedCertificate && (
        <CertificateModal
          certificateData={selectedCertificate}
          onClose={() => setSelectedCertificate(null)}
        />
      )}
    </div>
  );
}
