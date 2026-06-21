import React, { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import apiClient from '../helper/apiClient';
import socket from '../helper/socket';
import ForwardModal from './ForwardModal';
import styles from '../css/MessageMenu.module.css';

const QUICK_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ActionButton = ({ messageId, senderId, currentUserId, message }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const menuRef = useRef();

  const handleReaction = async (emoji) => {
    try {
      await apiClient.addReaction(messageId, currentUserId, emoji);
      setIsOpen(false);
      setShowFullPicker(false);
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  const handleFullEmojiClick = (emojiObject) => {
    handleReaction(emojiObject.emoji);
  };

  const handleDelete = async () => {
    if (senderId !== currentUserId) return;
    try {
      await apiClient.deleteMessage(messageId, currentUserId);
      socket.emit('delete-message', { messageId, sender_id: currentUserId });
      setIsOpen(false);
    } catch (err) {
      console.error('Error deleting message:', err);
    }
  };

  const handleForward = (receiverId) => {
    apiClient.forwardMessage(currentUserId, receiverId, message.id)
      .then(() => {
        setShowForwardModal(false);
        setIsOpen(false);
      })
      .catch((err) => {
        console.error('Error forwarding message:', err);
      });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
        setShowFullPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.menuContainer} ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.threeDotsBtn}
        title="Message actions"
      >
        ⋮
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {/* Reactions Row */}
          <div className={styles.reactionsRow}>
            {QUICK_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleReaction(emoji)}
                className={styles.quickEmojiBtn}
              >
                {emoji}
              </button>
            ))}
            <button
              onClick={() => setShowFullPicker(!showFullPicker)}
              className={styles.moreEmojiBtn}
              title="More emojis"
            >
              ➕
            </button>
          </div>

          {showFullPicker && (
            <div className={styles.emojiPickerWrapper}>
              <EmojiPicker
                onEmojiClick={handleFullEmojiClick}
                width={260}
                height={300}
                searchDisabled
                skinTonesDisabled
                previewConfig={{ showPreview: false }}
              />
            </div>
          )}

          <div className={styles.menuDivider}></div>

          {/* Action List */}
          <button onClick={() => setShowForwardModal(true)} className={styles.menuItem}>
            Forward
          </button>
          
          {senderId === currentUserId && (
            <button onClick={handleDelete} className={`${styles.menuItem} ${styles.deleteItem}`}>
              Delete
            </button>
          )}
        </div>
      )}

      <ForwardModal
        isOpen={showForwardModal}
        onClose={() => setShowForwardModal(false)}
        onForward={handleForward}
        currentUserId={currentUserId}
        message={message}
      />
    </div>
  );
};

export default ActionButton;
