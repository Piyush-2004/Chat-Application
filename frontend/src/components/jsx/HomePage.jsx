import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../css/HomePage.module.css';
import Image from '../../assets/Image.jpg';

function HomePage() {
  const navigate = useNavigate();

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section */}
      <section className={styles.heroSection}>
        <div className={styles.heroText}>
          <span className={styles.categoryLabel}>THE ARCHIVE • REAL-TIME WHISPER NETWORK</span>
          <h1 className={styles.heroHeading}>
            A silent network for direct correspondence.
          </h1>
          <p className={styles.heroParagraph}>
            Exchange secure whispers, establish group chambers, and react to logs instantly. The Archive is a premium, high-contrast messaging platform designed to keep your conversations private and organized.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryBtn} onClick={() => navigate('/register')}>
              START CHATTING
            </button>
            <button className={styles.outlineBtn} onClick={() => navigate('/login')}>
              SIGN IN TO VAULT
            </button>
          </div>
        </div>
        <div className={styles.heroImageWrapper}>
          <img src={Image} alt="The Archive Library Vault" className={styles.heroImage} />
          <span className={styles.imageCaption}>FIG 01. The Great Archive Terminal, Geneva Sector</span>
        </div>
      </section>

      <div className={styles.divider}></div>

      {/* Feature Columns */}
      <section className={styles.featuresSection}>
        <h2 className={styles.sectionHeader}>COMMUNICATION PROVISIONS</h2>
        <div className={styles.featureGrid}>
          <div className={styles.featureCol}>
            <span className={styles.colNumber}>01 / CHAT</span>
            <h3 className={styles.colTitle}>Direct Whispers</h3>
            <p className={styles.colText}>
              Send real-time private messages with live typing feedback, instant read indicators, and seamless delete-or-forward actions.
            </p>
          </div>
          <div className={styles.featureCol}>
            <span className={styles.colNumber}>02 / ROOM</span>
            <h3 className={styles.colTitle}>Group Chambers</h3>
            <p className={styles.colText}>
              Create shared discussion lobbies, invite multiple curators, share updates, and express feedback using inline emoji reactions.
            </p>
          </div>
          <div className={styles.featureCol}>
            <span className={styles.colNumber}>03 / DOCS</span>
            <h3 className={styles.colTitle}>Media Ledger</h3>
            <p className={styles.colText}>
              Upload images, documents, and historical files directly into the conversation stream, keeping a clear record of shared intelligence.
            </p>
          </div>
        </div>
      </section>

      <div className={styles.divider}></div>

      {/* Centered Quote */}
      <section className={styles.quoteSection}>
        <blockquote className={styles.quoteText}>
          "To communicate in silence is to preserve the integrity of our association."
        </blockquote>
        <cite className={styles.quoteAuthor}>— THE CHIEF ARCHIVIST</cite>
      </section>

      <div className={styles.divider}></div>

      {/* Bottom CTA Card */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2 className={styles.ctaTitle}>Ready to begin your correspondence?</h2>
          <p className={styles.ctaText}>
            Establish your user credentials today to join the directory and start sharing whispers instantly.
          </p>
          <button className={styles.ctaBtn} onClick={() => navigate('/register')}>
            ESTABLISH ACCOUNT
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.footerCopyright}>© THE ARCHIVE — ALL RIGHTS RESERVED MMXIV - MMXXVI</span>
        <div className={styles.footerMeta}>
          <span>SYSTEM STATUS: ACTIVE</span>
          <span className={styles.metaDivider}>•</span>
          <span>PROTOCOL: CHAT V4.2</span>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;