import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  timeout: 120000,
});

export const getStreams = () => API.get('/career/streams');
export const getPaths = (streamId) => API.get(`/career/paths/${streamId}`);
export const getRoleDetails = (roleId) => API.get(`/career/role/${roleId}`);
export const getCompanies = () => API.get('/career/companies');
export const getAfterExperience = (years) => API.get(`/career/after-experience?years=${years}`);
export const getSalaryEstimate = (roleId, exp, city, companyType) =>
  API.get(`/career/salary-estimate?role_id=${roleId}&experience=${exp}&city=${city}&company_type=${companyType}`);

export const uploadResume = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return API.post('/resume/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const getPerspectives = (profile) => API.post('/simulate/perspectives', profile);
export const getSinglePerspective = (agentId, profile) => API.post(`/simulate/perspective/${agentId}`, profile);
export const getScenario = (profile) => API.post('/simulate/scenario', profile);
export const getWhatIf = (profile, change) => API.post(`/simulate/what-if?change=${change}`, profile);

export const getMarketPulse = () => API.get('/market/pulse');
export const getJobTrends = (role) => API.get(`/market/trends/${role}`);

export const getFuturePrediction = (roleId, years) => API.get(`/future/predict/${roleId}?years=${years}`);
export const getEmergingRoles = () => API.get('/future/emerging-roles');

export default API;