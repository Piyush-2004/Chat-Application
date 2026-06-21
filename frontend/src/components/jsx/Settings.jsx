import React, { useState, useEffect } from 'react';
import styles from '../css/Settings.module.css';

function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [twoFactor, setTwoFactor] = useState(true);
  const [autoRedact, setAutoRedact] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const opponentName = currentUser?.username || 'Archivist';
  const initial = opponentName.charAt(0).toUpperCase();

  return (
    <div className={styles.settingsContainer}>
      {/* Curator Header Block */}
      <div className={styles.header}>
        <div className={styles.headerProfile}>
          <div className={styles.avatarLetter}>{initial}</div>
          <div className={styles.headerInfo}>
            <span className={styles.establishedLabel}>ESTABLISHED MMXIV</span>
            <h2 className={styles.headerTitle}>{opponentName}</h2>
            <div className={styles.credentialsMeta}>
              <span>IDENTIFICATION</span>
              <strong className={styles.credValue}>ARCHIVIST NO. 0{currentUser ? currentUser.id + 420 : 422}</strong>
              <span className={styles.metaDivider}>|</span>
              <span>STATIONED</span>
              <strong className={styles.credValue}>Geneva Sector</strong>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.divider}></div>

      {/* Governance Section */}
      <section className={styles.settingsSection}>
        <div className={styles.sectionHeaderGrid}>
          <div className={styles.sectionIntro}>
            <h3 className={styles.sectionTitle}>Governance</h3>
            <p className={styles.sectionDesc}>
              Define the structural integrity and accessibility of your digital deposits.
            </p>
          </div>
        </div>

        <div className={styles.governanceGrid}>
          {/* Card 1: Privacy */}
          <div className={styles.governanceCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>🔒</span>
              <span className={styles.activeBadge}>ACTIVE</span>
            </div>
            <h4 className={styles.cardTitle}>Privacy & Encryption</h4>
            <p className={styles.cardText}>
              Standardized AES-256 protocols applied to all curated messaging streams and directory links.
            </p>
            <button className={styles.outlineActionBtn}>CONFIGURE KEYS</button>
          </div>

          {/* Card 2: Archive Storage */}
          <div className={styles.governanceCard}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>💾</span>
              <span className={styles.progressLabel}>84% USED</span>
            </div>
            <h4 className={styles.cardTitle}>Archive Storage</h4>
            <p className={styles.cardText}>
              Managing 14.2 Terabytes of historical documentation and high-fidelity media assets.
            </p>
            <div className={styles.progressBarWrapper}>
              <div className={styles.progressBar} style={{ width: '84%' }}></div>
            </div>
            <button className={styles.outlineActionBtn}>EXPAND VAULT</button>
          </div>
        </div>

        {/* Black Lineage Banner */}
        <div className={styles.lineageBanner}>
          <div className={styles.bannerInfo}>
            <h4 className={styles.bannerTitle}>Account Lineage</h4>
            <p className={styles.bannerText}>
              Track the historical changes, access logs, and succession planning for this archive identity.
            </p>
          </div>
          <button className={styles.bannerActionBtn}>
            VIEW RECORDS <span className={styles.arrowIcon}>→</span>
          </button>
        </div>

        {/* Monospaced Meta Items Row */}
        <div className={styles.systemMetadataRow}>
          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>LANGUAGE</span>
            <span className={styles.metaValue}>English (Oxford)</span>
          </div>
          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>TIMEZONE</span>
            <span className={styles.metaValue}>GMT +1:00</span>
          </div>
          <div className={styles.metaCol}>
            <span className={styles.metaLabel}>CURRENCY</span>
            <span className={styles.metaValue}>CHF (Fr.)</span>
          </div>
        </div>
      </section>

      <div className={styles.divider}></div>

      {/* Protocols Section */}
      <section className={styles.settingsSection}>
        <h3 className={styles.sectionTitle}>Protocols</h3>
        
        <div className={styles.protocolsList}>
          {/* Protocol Row 1 */}
          <div className={styles.protocolRow}>
            <div className={styles.protocolInfo}>
              <h4 className={styles.protocolName}>Two-Factor Authenticator</h4>
              <p className={styles.protocolDesc}>Require hardware key for all administrative entries.</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={() => setTwoFactor(!twoFactor)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>

          {/* Protocol Row 2 */}
          <div className={styles.protocolRow}>
            <div className={styles.protocolInfo}>
              <h4 className={styles.protocolName}>Automatic Redaction</h4>
              <p className={styles.protocolDesc}>Scrub metadata from all outgoing archive packages.</p>
            </div>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={autoRedact}
                onChange={() => setAutoRedact(!autoRedact)}
              />
              <span className={styles.slider}></span>
            </label>
          </div>
        </div>
      </section>

      {/* Editorial Page Footer */}
      <footer className={styles.pageFooter}>
        <span className={styles.footerCopyright}>© THE ARCHIVE — ALL RIGHTS RESERVED MMXIV - MMXXVI</span>
        <div className={styles.footerLinksRow}>
          <span>SYSTEM STATUS</span>
          <span className={styles.footerDot}>•</span>
          <span>LEGAL LEDGER</span>
          <span className={styles.footerDot}>•</span>
          <span className={styles.terminateText}>TERMINATE ACCESS</span>
        </div>
      </footer>
    </div>
  );
}

export default Settings;
