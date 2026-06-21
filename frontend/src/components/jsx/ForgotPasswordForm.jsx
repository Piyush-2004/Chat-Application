import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FormField from './FormField';
import ErrorMessage from './ErrorMessage';
import styles from '../css/LoginForm.module.css'; // Reuses login styles
import apiClient from '../helper/apiClient.js';

function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username || !formData.email || !formData.newPassword || !formData.confirmPassword) {
      setError('All fields are required.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await apiClient.resetPassword(formData.username, formData.email, formData.newPassword);
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Reset password error:', err);
      if (err.response) {
        setError(err.response.data.message);
      } else {
        setError('Failed to reset password. Please check your network.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2 className={styles.formTitle}>Reset Password</h2>

        {error && <ErrorMessage message={error} />}
        {success && <div style={{ color: '#2ec4b6', marginBottom: '15px', fontSize: '0.9rem', textAlign: 'center' }}>{success}</div>}

        <FormField
          label="Username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter your username"
        />

        <FormField
          label="Email Address"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="Enter your email"
        />

        <FormField
          label="New Password"
          type="password"
          name="newPassword"
          value={formData.newPassword}
          onChange={handleChange}
          placeholder="Enter new password"
        />

        <FormField
          label="Confirm New Password"
          type="password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          placeholder="Confirm new password"
        />

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'RESETTING...' : 'RESET PASSWORD'}
        </button>

        <p className={styles.switchForm}>
          Remember your password? <Link to="/login">Login here</Link>
        </p>
      </form>
    </div>
  );
}

export default ForgotPasswordForm;
