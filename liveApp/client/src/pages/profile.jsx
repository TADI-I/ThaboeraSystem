import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './profile.css';
import Sidebar from '../components/Sidebar';

const ProfilePage = () => {
  const [profile, setProfile] = useState({ 
    user: { full_name: '', email: '', avatar: '' },
    staff: { phone: '' }
  });
  const [newPassword, setNewPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) {
          window.location.href = '/login';
          return;
        }

        const response = await axios.get('/api/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.match('image.*') || file.size > 2 * 1024 * 1024) {
      setError('Invalid file. Please upload an image less than 2MB');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('authToken');
      const response = await axios.post('/api/uploads/avatar', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Update avatar URL in profile
      await axios.put('/api/profile/avatar', { avatarUrl: response.data.url }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setProfile(prev => ({
        ...prev,
        user: { ...prev.user, avatar: response.data.url }
      }));
      setSuccess('Profile image updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const token = localStorage.getItem('authToken');
      await axios.put('/api/profile', {
        full_name: profile.user.full_name,
        email: profile.user.email,
        phone: profile.staff.phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      const currentPassword = e.target.currentPassword.value;
      const confirmPassword = e.target.confirmPassword.value;

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      const token = localStorage.getItem('authToken');
      await axios.put('/api/profile/password', {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Password updated successfully');
      setNewPassword('');
      setPasswordStrength(0);
      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewPasswordInput = (value) => {
    setNewPassword(value);
    let strength = 0;
    if (value.length >= 8) strength++;
    if (value.length >= 12) strength++;
    if (/[a-z]/.test(value)) strength++;
    if (/[A-Z]/.test(value)) strength++;
    if (/[0-9]/.test(value)) strength++;
    if (/[^a-zA-Z0-9]/.test(value)) strength++;
    setPasswordStrength((strength / 6) * 100);
  };

  const togglePassword = (e) => {
    const input = e.target.previousElementSibling;
    input.type = input.type === 'password' ? 'text' : 'password';
    e.target.classList.toggle('fa-eye');
    e.target.classList.toggle('fa-eye-slash');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      user: { ...prev.user, [name]: value }
    }));
  };

  const handleStaffInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      staff: { ...prev.staff, [name]: value }
    }));
  };

  return (
    <div className="main-view">
      <Sidebar />
      <div className="profile-container">
        {error && <div className="alert alert-danger">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="profile-header">
          <div className="avatar-container">
            <img
              id="profileImage"
              src={profile.user.avatar || '/default-avatar.jpg'}
              alt="Profile"
            />
            <button 
              id="changeImageBtn" 
              onClick={() => document.getElementById('imageUpload').click()}
              disabled={isLoading}
            >
              <i className="fas fa-camera"></i>
            </button>
            <input 
              type="file" 
              id="imageUpload" 
              accept="image/*" 
              onChange={handleImageChange} 
              disabled={isLoading}
            />
          </div>
          <h1>{profile.user.full_name || 'User'}</h1>
          <p>{profile.user.email || 'email@example.com'}</p>
        </div>

        <div className="profile-details">
          <h2><i className="fas fa-user-circle"></i> Account Information</h2>
          <form onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="full_name"
                value={profile.user.full_name}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={profile.user.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={profile.staff.phone || ''}
                onChange={handleStaffInputChange}
                disabled={isLoading}
              />
            </div>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Updating...
                </>
              ) : (
                <>
                  <i className="fas fa-save"></i> Update Profile
                </>
              )}
            </button>
          </form>

          <h2><i className="fas fa-lock"></i> Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div className="form-group">
              <label>Current Password</label>
              <div className="password-wrapper">
                <input 
                  type="password" 
                  name="currentPassword" 
                  required 
                  disabled={isLoading}
                />
                <i 
                  className="fas fa-eye toggle-password" 
                  onClick={togglePassword}
                ></i>
              </div>
            </div>
            <div className="form-group">
              <label>New Password</label>
              <div className="password-wrapper">
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => handleNewPasswordInput(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <i 
                  className="fas fa-eye toggle-password" 
                  onClick={togglePassword}
                ></i>
              </div>
              <div className="password-strength">
                <div
                  className="password-strength-bar"
                  style={{ 
                    width: `${passwordStrength}%`, 
                    backgroundColor: passwordStrength < 40 ? 'var(--danger)' : 
                                    passwordStrength < 70 ? 'var(--warning)' : 'var(--success)' 
                  }}
                ></div>
              </div>
            </div>
            <div className="form-group">
              <label>Confirm New Password</label>
              <div className="password-wrapper">
                <input 
                  type="password" 
                  name="confirmPassword" 
                  required 
                  disabled={isLoading}
                />
                <i 
                  className="fas fa-eye toggle-password" 
                  onClick={togglePassword}
                ></i>
              </div>
            </div>
            <button 
              type="submit" 
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i> Updating...
                </>
              ) : (
                <>
                  <i className="fas fa-key"></i> Change Password
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;