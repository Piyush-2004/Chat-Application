import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../css/ChatPage.module.css';
import socket from '../helper/socket';
import apiClient from '../helper/apiClient';
import ActionButton from './ActionButton';

const getConsolidatedReactionsGroup = (reactions, currentUserId) => {
  if (!reactions || !Array.isArray(reactions)) return [];
  const groups = {};
  reactions.forEach(r => {
    if (r && r.emoji) {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      }
      groups[r.emoji].count += 1;
      const name = r.userId === currentUserId ? 'You' : `User ${r.userId}`;
      groups[r.emoji].users.push(name);
    }
  });
  return Object.values(groups);
};

const formatMessageDate = (dateString) => {
  if (!dateString) return 'CORRESPONDENCE';
  const d = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return d.toLocaleDateString('en-US', options).toUpperCase();
};

const formatMessageTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

function GroupChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [groupInfo, setGroupInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const { id: groupId } = useParams();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const sender_id = currentUser?.id;
  const group_id = parseInt(groupId);

  // Fetch group info
  useEffect(() => {
    if (!group_id) return;
    const fetchGroupInfo = async () => {
      try {
        const groupsList = await apiClient.getGroupsForUser(sender_id);
        const currentGroup = groupsList.find(g => g.id === group_id);
        setGroupInfo(currentGroup);
      } catch (err) {
        console.error('Error fetching group info:', err);
      }
    };
    if (sender_id) {
      fetchGroupInfo();
    }
  }, [group_id, sender_id]);

  // Fetch group messages
  useEffect(() => {
    if (!group_id) return;
    const fetchGroupMessages = async () => {
      try {
        const res = await apiClient.getGroupMessages(group_id);
        setMessages(res);
      } catch (err) {
        console.error('Error fetching group messages:', err);
      }
    };
    fetchGroupMessages();
  }, [group_id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Socket listeners
  useEffect(() => {
    if (!sender_id) return;

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('register', { user_id: sender_id });

    const handleReceiveGroupMessage = (data) => {
      if (data.group_id === group_id) {
        setMessages((prev) => [...prev, data]);
      }
    };

    const handleReactionAdded = (data) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    };

    const handleReceiveGroupTyping = (data) => {
      if (data.group_id === group_id) {
        setTypingUsers((prev) => {
          if (data.is_typing) {
            return prev.includes(data.username) ? prev : [...prev, data.username];
          } else {
            return prev.filter((u) => u !== data.username);
          }
        });
      }
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.filter((msg) => msg.id !== data.messageId));
    };

    socket.on('receive-group-message', handleReceiveGroupMessage);
    socket.on('reaction-added', handleReactionAdded);
    socket.on('receive-group-typing', handleReceiveGroupTyping);
    socket.on('message-deleted', handleMessageDeleted);

    return () => {
      socket.off('receive-group-message', handleReceiveGroupMessage);
      socket.off('reaction-added', handleReactionAdded);
      socket.off('receive-group-typing', handleReceiveGroupTyping);
      socket.off('message-deleted', handleMessageDeleted);
    };
  }, [group_id, sender_id]);

  const handleReactionToggle = async (messageId, emoji) => {
    if (!sender_id) return;
    try {
      await apiClient.addReaction(messageId, sender_id, emoji);
    } catch (err) {
      console.error('Error toggling reaction:', err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const newMsg = {
      text: inputMessage,
      sender_id,
      group_id,
    };

    socket.emit('send-group-message', newMsg);

    setIsTyping(false);
    socket.emit('group-typing', { sender_id, group_id, username: currentUser?.username, is_typing: false });
    clearTimeout(window.groupTypingTimeout);

    setInputMessage('');
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (sender_id && group_id && currentUser) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('group-typing', { sender_id, group_id, username: currentUser.username, is_typing: true });
      }

      clearTimeout(window.groupTypingTimeout);
      window.groupTypingTimeout = setTimeout(() => {
        setIsTyping(false);
        socket.emit('group-typing', { sender_id, group_id, username: currentUser.username, is_typing: false });
      }, 1500);
    }
  };

  if (!currentUser) {
    return <div className={styles.errorState}>Please log in to access group chat.</div>;
  }

  const shouldRenderDateSeparator = (index) => {
    if (index === 0) return true;
    const prevDate = new Date(messages[index - 1].created_at).toDateString();
    const currDate = new Date(messages[index].created_at).toDateString();
    return prevDate !== currDate;
  };

  const grpName = groupInfo?.name || `Group ${group_id}`;
  const initial = grpName ? grpName.charAt(0).toUpperCase() : 'G';

  return (
    <div className={styles.chatContainer}>
      {/* Editorial Header */}
      <div className={styles.header}>
        <div className={styles.headerProfile}>
          <div className={styles.avatarLetter}>{initial}</div>
          <div className={styles.headerInfo}>
            <h3 className={styles.headerTitle}>{grpName}</h3>
            <span className={styles.headerStatus}>
              <span className={styles.statusDot}></span> ARCHIVE SYNCHRONIZED
            </span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.headerActionBtn} title="Bookmark">🔖</button>
          <button className={styles.headerActionBtn} title="Search Log">🔍</button>
          <button className={styles.headerActionBtn} title="Actions">⋮</button>
        </div>
      </div>

      {/* Message Ledger Area */}
      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.noMessages}>No entry ledger recorded in this group yet.</div>
        ) : (
          messages.map((msg, index) => {
            const isSent = msg.sender_id === sender_id;
            const senderName = msg.username || `User ${msg.sender_id}`;
            const msgTime = formatMessageTime(msg.created_at);
            
            return (
              <React.Fragment key={msg.id || index}>
                {shouldRenderDateSeparator(index) && (
                  <div className={styles.dateSeparator}>
                    <span className={styles.dateText}>{formatMessageDate(msg.created_at)}</span>
                  </div>
                )}

                <div className={`${styles.message} ${isSent ? styles.sent : styles.received}`}>
                  {/* Sender Name & Time Metadata above message */}
                  <div className={styles.messageMeta}>
                    {isSent ? (
                      <>
                        <span className={styles.metaTime}>{msgTime}</span>
                        <span className={styles.metaDivider}>•</span>
                        <span className={styles.metaName}>{senderName.toUpperCase()}</span>
                      </>
                    ) : (
                      <>
                        <span className={styles.metaName}>{senderName.toUpperCase()}</span>
                        <span className={styles.metaDivider}>•</span>
                        <span className={styles.metaTime}>{msgTime}</span>
                      </>
                    )}
                  </div>

                  {/* Message Bubble + Floating action button row */}
                  <div className={styles.messageRow}>
                    {isSent && (
                      <div className={styles.messageActionsWrapper}>
                        <ActionButton
                          messageId={msg.id}
                          senderId={msg.sender_id}
                          currentUserId={sender_id}
                          message={msg}
                        />
                      </div>
                    )}

                    <div className={styles.messageContent}>
                      <p className={styles.messageText}>{msg.text}</p>
                      
                      {msg.reactions && msg.reactions.length > 0 && (
                        <div className={styles.reactionPillContainer}>
                          {getConsolidatedReactionsGroup(msg.reactions, sender_id).map((item, idx) => (
                            <span
                              key={idx}
                              className={styles.reactionPill}
                              title={item.users.join(', ')}
                              onClick={() => handleReactionToggle(msg.id, item.emoji)}
                            >
                              {item.emoji} {item.count > 1 ? item.count : ''}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {!isSent && (
                      <div className={styles.messageActionsWrapper}>
                        <ActionButton
                          messageId={msg.id}
                          senderId={msg.sender_id}
                          currentUserId={sender_id}
                          message={msg}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {typingUsers.length > 0 && (
          <div className={styles.typingIndicator}>
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} writing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Correspondence Bar */}
      <div className={styles.inputContainer}>
        <form onSubmit={handleSendMessage} className={styles.messageForm}>
          <button type="button" className={styles.formAttachmentBtn} title="Attach file">📎</button>
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            placeholder="Draft your group response here..."
            className={styles.messageInput}
          />
          <button type="button" className={styles.formEmojiBtn} title="Insert character">😊</button>
          <button type="submit" className={styles.sendButton}>
            ARCHIVE ⏵
          </button>
        </form>
        <div className={styles.formMetadataLine}>
          <span className={styles.metadataLeft}>Ink: Black Permanent • Paper: Vellum Finish</span>
          <span className={styles.metadataRight}>Status: Drafting...</span>
        </div>
      </div>
    </div>
  );
}

export default GroupChatPage;
