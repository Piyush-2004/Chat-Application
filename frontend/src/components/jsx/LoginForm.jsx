import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import FormField from './FormField';
import ErrorMessage from './ErrorMessage';
import styles from '../css/LoginForm.module.css';
import apiClient from '../helper/apiClient.js';

function LoginForm({ setUser }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
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
    setLoading(true);

    try {
      const response = await apiClient.login(formData);
      console.log('Login response:', response);

      // Store user data in localStorage (including profile image details)
      localStorage.setItem('user', JSON.stringify(response.user));

      // Set user state
      setUser(response.user);

      // Navigate to correct chat view
      navigate('/chat');
    } catch (err) {
      console.error('Login error:', err);
      if (err.response) {
        setError(err.response.data.message);
      } else if (err.request) {
        setError("No response from server");
      } else {
        setError("Error: " + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2 className={styles.formTitle}>Login</h2>

        <ErrorMessage message={error} />

        <FormField
          label="Username"
          type="text"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="Enter your username"
        />

        <FormField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Enter your password"
        />

        <div style={{ textAlign: 'right', marginBottom: '15px' }}>
          <Link to="/forgot-password" className={styles.forgotLink}>
            Forgot Password?
          </Link>
        </div>

        <button type="submit" disabled={loading} className={styles.submitButton}>
          {loading ? 'Logging in...' : 'LOGIN'}
        </button>

        <p className={styles.switchForm}>
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginForm;