import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../helper/apiClient';
import GroupCreateModal from './GroupCreateModal';
import styles from '../css/UserList.module.css';

// A mock catalog of editorial subjects & snippets mapping database users to screenshot counterparts
const EDITORIAL_CONTENT = {
  roshan: {
    subject: 'The 1924 Folio Acquisition',
    snippet: 'The document remains in a state of precarious preservation, Elias. We must...',
    time: '14:02'
  },
  julian: {
    subject: 'Auction House Memo',
    snippet: 'I\'ve verified the provenance of the ink-wash sketches from the gallery...',
    time: 'Yesterday'
  },
  beatrix: {
    subject: 'Family Seals Inquiry',
    snippet: 'Grandfather always spoke of the third seal. It might be in the vaults...',
    time: 'Oct 12'
  },
  miller: {
    subject: 'Quarterly Curation Review',
    snippet: 'The board is impressed with the new classification system you\'ve...',
    time: 'Oct 09'
  },
  bot: {
    subject: 'System Maintenance Complete',
    snippet: 'All correspondence from 1890-1910 has been successfully indexed...',
    time: 'Oct 05'
  }
};

const getEditorialMeta = (name) => {
  const lowercaseName = (name || '').toLowerCase();
  for (const [key, val] of Object.entries(EDITORIAL_CONTENT)) {
    if (lowercaseName.includes(key)) {
      return val;
    }
  }
  // Fallback metadata for other dynamically registered users
  return {
    subject: 'Correspondence Ledger',
    snippet: 'Click to open secure transcript log and review archival communications.',
    time: '12:15'
  };
};

function UserList({ onSelectChat }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [groups, setGroups] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);

  const { type, id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;

      try {
        const userList = await apiClient.getUserList();
        const groupList = await apiClient.getGroupsForUser(user.id);
        setFriends(userList);
        setGroups(groupList);
      } catch (err) {
        console.error('Error fetching user/group lists:', err);
      }
    };

    fetchData();
  }, [showGroupModal]);

  const filteredList = (viewMode === 'friends' ? friends : groups).filter(item =>
    (item.username || item.name)?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const viewModeType = viewMode === 'friends' ? 'user' : 'group';

  return (
    <div className={styles.userListContainer}>
      <div className={styles.header}>
        <div className={styles.brandBlock}>
          <h2 className={styles.recentTitle}>Recent Whispers</h2>
          <span className={styles.recentSubtitle}>Correspondence Log</span>
        </div>

        <input
          type="text"
          placeholder="Search the Directory..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <div className={styles.toggleContainer}>
          <button
            onClick={() => setViewMode('friends')}
            className={viewMode === 'friends' ? styles.activeToggle : styles.toggle}
          >
            ARCHIVES
          </button>
          <button
            onClick={() => setViewMode('groups')}
            className={viewMode === 'groups' ? styles.activeToggle : styles.toggle}
          >
            GROUPS
          </button>
        </div>
      </div>

      <ul className={styles.userList}>
        {filteredList.map((item) => {
          const name = viewMode === 'friends' ? item.username : item.name;
          const meta = getEditorialMeta(name);
          const isActive = id === item.id.toString() && type === viewModeType;

          return (
            <li
              key={item.id}
              className={`${styles.userItem} ${isActive ? styles.activeItem : ''}`}
              onClick={() => onSelectChat(viewModeType, item.id)}
            >
              <div className={styles.itemMetaHeader}>
                <span className={styles.itemName}>{name?.toUpperCase()}</span>
                <span className={styles.itemTime}>{meta.time}</span>
              </div>
              <h4 className={styles.itemSubject}>{meta.subject}</h4>
              <p className={styles.itemSnippet}>{meta.snippet}</p>
            </li>
          );
        })}
      </ul>

      <div className={styles.footer}>
        <button
          onClick={() => setShowGroupModal(true)}
          className={styles.createGroupButton}
        >
          ＋ CREATE GROUP
        </button>
      </div>
      {showGroupModal && <GroupCreateModal onClose={() => setShowGroupModal(false)} />}
    </div>
  );
}

export default UserList;
