// frontend/src/services/authService.js
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};