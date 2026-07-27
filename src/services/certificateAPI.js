import api from '../api/axios';

export async function getUserCertificates() {
  const response = await api.get('/results/my-certificates');
  return response.data;
}
