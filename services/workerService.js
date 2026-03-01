import { api, safeRequest } from './api';

export const getMe = async () => {
  return safeRequest(() => api.get('/api/workers/me'));
};

export const getWorkers = async (filters = {}) => {
  return safeRequest(() => api.get('/api/workers', { params: filters }));
};

export const searchWorkers = async (latOrParams, lng, radius, skills) => {
  const params =
    latOrParams && typeof latOrParams === 'object'
      ? {...latOrParams}
      : {
          latitude: latOrParams,
          longitude: lng,
          radiusKm: radius,
          skills,
        };

  return safeRequest(() =>
    api.get('/api/workers/search', {
      params,
    })
  );
};

export const getWorkerById = async (id) => {
  return safeRequest(() => api.get(`/api/workers/${id}`));
};

export const updateWorker = async (id, data) => {
  return safeRequest(() => api.put(`/api/workers/${id}`, data));
};

export const uploadProfilePhoto = async (workerId, file, onUploadProgress) => {
  const form = new FormData();
  form.append('file', file);

  return safeRequest(() =>
    api.post(`/api/workers/${workerId}/profile-photo`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
  );
};

export const uploadDocument = async (
  workerId,
  file,
  { documentType, issue_date, expiry_date } = {},
  onUploadProgress
) => {
  const form = new FormData();
  // backend expects field name: file
  form.append('file', file);

  if (documentType) form.append('documentType', documentType);
  if (issue_date) form.append('issue_date', issue_date);
  if (expiry_date) form.append('expiry_date', expiry_date);

  return safeRequest(() =>
    api.post(`/api/workers/${workerId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    })
  );
};

export const addSkill = async (workerId, skill) => {
  return safeRequest(() => api.post(`/api/workers/${workerId}/skills`, { skill_name: skill }));
};

export const removeSkill = async (workerId, skillId) => {
  return safeRequest(() => api.delete(`/api/workers/${workerId}/skills/${skillId}`));
};

export const updateAvailability = async (workerId, schedule) => {
  return safeRequest(() => api.put(`/api/workers/${workerId}/availability`, { availability: schedule }));
};
