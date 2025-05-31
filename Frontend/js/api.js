// Helper functions for making API calls to our backend
const API_URL = 'http://127.0.0.1:5000/api';

// Function to get the current user's Firebase token
async function getAuthToken() {
  const user = firebase.auth().currentUser;
  if (user) {
    return user.getIdToken();
  }
  throw new Error('No user is signed in');
}

// Generic API call function with authentication
async function callApi(endpoint, method = 'GET', data = null) {
  try {
    const token = await getAuthToken();
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(`${API_URL}${endpoint}`, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}

// Disaster-related API calls
const disasterApi = {
  getAllDisasters: () => callApi('/disasters'),
  getDisaster: (id) => callApi(`/disasters/${id}`),
  createDisaster: (data) => callApi('/disasters', 'POST', data),
  updateDisaster: (id, data) => callApi(`/disasters/${id}`, 'PUT', data)
};

// Report-related API calls
const reportApi = {
  getAllReports: () => callApi('/reports'),
  getReportsByDisaster: (disasterId) => callApi(`/reports/disaster/${disasterId}`),
  createReport: (data) => callApi('/reports', 'POST', data),
  updateReport: (id, data) => callApi(`/reports/${id}`, 'PUT', data),
  deleteReport: (id) => callApi(`/reports/${id}`, 'DELETE')
};

// User profile API calls
const userApi = {
  getProfile: () => callApi('/auth/profile'),
  updateProfile: (data) => callApi('/auth/profile', 'PUT', data)
};
