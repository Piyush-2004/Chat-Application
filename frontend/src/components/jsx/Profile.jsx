import React, { useState, useEffect } from 'react';
import apiClient from '../helper/apiClient';
import styles from '../css/Profile.module.css';

function Profile() {
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setCurrentUser(parsed);
      if (parsed.image) {
        setPreview(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}${parsed.image}`);
      }
    }
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile || !currentUser) return;
    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      const res = await apiClient.uploadProfileImage(currentUser.id, formData);
      const updatedUser = {
        ...currentUser,
        image: res.path
      };

      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setStatus('Profile image updated successfully.');
    } catch (err) {
      console.error('Image upload failed:', err);
      setStatus('Failed to upload profile image.');
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setStatus('Passwords do not match.');
      return;
    }

    try {
      await apiClient.updatePassword(currentUser.id, newPassword);
      setStatus('Security credentials updated successfully.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error('Password update failed:', err);
      setStatus('Failed to update password credentials.');
    }
  };

  if (!currentUser) {
    return <div className={styles.errorState}>Loading curator credentials...</div>;
  }

  const userInitial = currentUser.username ? currentUser.username.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.profileContainer}>
      {/* Curator Identity Section */}
      <div className={styles.identityHeader}>
        <div className={styles.portraitWrapper}>
          {preview ? (
            <img src={preview} alt="Curator Portrait" className={styles.portraitImg} />
          ) : (
            <div className={styles.portraitFallback}>{userInitial}</div>
          )}
        </div>
        <div className={styles.identityDetails}>
          <span className={styles.establishedLabel}>ESTABLISHED MMXIV</span>
          <h2 className={styles.curatorName}>{currentUser.username}</h2>
          <div className={styles.credentialsMeta}>
            <span>IDENTIFICATION</span>
            <strong className={styles.credValue}>ARCHIVIST NO. 0{currentUser.id + 420}</strong>
            <span className={styles.metaDivider}>|</span>
            <span>STATIONED</span>
            <strong className={styles.credValue}>Geneva Sector</strong>
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      {/* Main Grid: Details on Left, Upload/Security on Right */}
      <div className={styles.profileGrid}>
        <div className={styles.gridLeft}>
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Curator Record</h3>
            <p className={styles.cardDescription}>
              Structural details and contact mapping for this active archive participant.
            </p>
            <div className={styles.detailsList}>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>COGNIZANT NAME:</span>
                <span className={styles.detailVal}>{currentUser.username}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>LOGICAL EMAIL:</span>
                <span className={styles.detailVal}>{currentUser.email || 'Not Provided'}</span>
              </div>
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>ENTRY REFERENCE ID:</span>
                <span className={styles.detailVal}>{currentUser.id}</span>
              </div>
            </div>
          </div>
          
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Identity Representation</h3>
            <p className={styles.cardDescription}>
              Update portrait ledger image. Upload vellum or digital copy.
            </p>
            <div className={styles.uploadBlock}>
              <label className={styles.fileUploadLabel}>
                CHOOSE PORTRAIT FILE
                <input type="file" accept="image/*" onChange={handleFileChange} className={styles.fileInput} />
              </label>
              {selectedFile && <span className={styles.fileName}>{selectedFile.name}</span>}
              <button onClick={handleUpload} disabled={!selectedFile} className={styles.actionBtn}>
                UPLOAD PORTRAIT
              </button>
            </div>
          </div>
        </div>

        <div className={styles.gridRight}>
          <div className={styles.card}>
            <h3 className={styles.sectionTitle}>Security Credentials</h3>
            <p className={styles.cardDescription}>
              Update password credentials below to secure physical or ledger accounts.
            </p>
            <div className={styles.securityForm}>
              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>NEW SECURITY KEY:</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new security password"
                  className={styles.textInput}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.inputLabel}>CONFIRM KEY:</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter security password"
                  className={styles.textInput}
                />
              </div>
              <button onClick={handleChangePassword} className={styles.actionBtn}>
                UPDATE CREDENTIALS
              </button>
              {status && <p className={styles.statusLine}>{status}</p>}
            </div>
          </div>
        </div>
      </div>
      
      <footer className={styles.profileFooter}>
        <span>© THE ARCHIVE — ALL RIGHTS RESERVED MMXIV - MMXXVI</span>
        <span>SYSTEM STATUS: SECURE</span>
      </footer>
    </div>
  );
}

export default Profile;
