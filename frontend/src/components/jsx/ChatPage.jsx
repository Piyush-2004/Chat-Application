import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../css/ChatPage.module.css';
import apiClient from '../helper/apiClient';
import socket from '../helper/socket.js';
import ActionButton from './ActionButton';

const getConsolidatedReactions = (reactions, currentUserId, receiverId, receiverUsername) => {
  if (!reactions || !Array.isArray(reactions)) return [];
  const groups = {};
  reactions.forEach(r => {
    if (r && r.emoji) {
      if (!groups[r.emoji]) {
        groups[r.emoji] = { emoji: r.emoji, count: 0, users: [] };
      }
      groups[r.emoji].count += 1;
      const name = r.userId === currentUserId ? 'You' : (r.userId === receiverId ? (receiverUsername || 'Opponent') : `User ${r.userId}`);
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

function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [receiverInfo, setReceiverInfo] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [opponentTyping, setOpponentTyping] = useState(false);
  const { id } = useParams();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  const sender_id = currentUser?.id;
  const receiver_id = parseInt(id);

  // Fetch receiver info
  useEffect(() => {
    const fetchReceiverInfo = async () => {
      try {
        const data = await apiClient.getUserList();
        const receiver = data.find(user => user.id === receiver_id);
        setReceiverInfo(receiver);
      } catch (err) {
        console.error('Error fetching receiver info:', err);
      }
    };

    if (receiver_id) {
      fetchReceiverInfo();
    }
  }, [receiver_id]);

  // Fetch existing messages
  useEffect(() => {
    if (!sender_id || !receiver_id) return;

    const fetchMessages = async () => {
      try {
        const data = await apiClient.getMessageHistory(sender_id, receiver_id);
        if (Array.isArray(data)) {
          setMessages(data);
        }
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    };

    fetchMessages();
  }, [sender_id, receiver_id]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, opponentTyping]);

  // Socket connection and message handling
  useEffect(() => {
    if (!sender_id) return;

    if (!socket.connected) {
      socket.connect();
    }
    socket.emit('register', { user_id: sender_id });

    const handleReceiveMessage = (data) => {
      if (
        (data.sender_id === sender_id && data.receiver_id === receiver_id) ||
        (data.sender_id === receiver_id && data.receiver_id === sender_id)
      ) {
        setMessages((prev) => {
          const exists = prev.some(msg => msg.id === data.id);
          return exists ? prev : [...prev, data];
        });
      }
    };

    const handleMessageDeleted = (data) => {
      setMessages((prev) => prev.filter(msg => msg.id !== data.messageId));
    };

    const handleReactionAdded = (data) => {
      setMessages((prev) =>
        prev.map(msg =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    };

    const handleMessageForwarded = (data) => {
      if (data.receiverId === receiver_id) {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    const handleUserTyping = (data) => {
      if (data.sender_id === receiver_id) {
        setOpponentTyping(data.is_typing);
      }
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('message-deleted', handleMessageDeleted);
    socket.on('reaction-added', handleReactionAdded);
    socket.on('message-forwarded', handleMessageForwarded);
    socket.on('user-typing', handleUserTyping);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('message-deleted', handleMessageDeleted);
      socket.off('reaction-added', handleReactionAdded);
      socket.off('message-forwarded', handleMessageForwarded);
      socket.off('user-typing', handleUserTyping);
    };
  }, [sender_id, receiver_id]);

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
    if (inputMessage.trim() !== '' && sender_id && receiver_id) {
      const newMessage = {
        sender_id,
        receiver_id,
        text: inputMessage,
      };
      socket.emit('message', newMessage);
      
      setIsTyping(false);
      socket.emit('typing', { sender_id, receiver_id, is_typing: false });
      clearTimeout(window.typingTimeout);

      setInputMessage('');
    }
  };

  const handleInputChange = (e) => {
    setInputMessage(e.target.value);

    if (sender_id && receiver_id) {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing', { sender_id, receiver_id, is_typing: true });
      }

      clearTimeout(window.typingTimeout);
      window.typingTimeout = setTimeout(() => {
        setIsTyping(false);
        socket.emit('typing', { sender_id, receiver_id, is_typing: false });
      }, 1500);
    }
  };

  if (!currentUser) {
    return <div className={styles.errorState}>Please log in to access chat.</div>;
  }

  // Helper to check if a date line separator should be rendered between messages
  const shouldRenderDateSeparator = (index) => {
    if (index === 0) return true;
    const prevDate = new Date(messages[index - 1].created_at).toDateString();
    const currDate = new Date(messages[index].created_at).toDateString();
    return prevDate !== currDate;
  };

  const opponentName = receiverInfo?.username || `User ${receiver_id}`;
  const initial = opponentName ? opponentName.charAt(0).toUpperCase() : 'U';

  return (
    <div className={styles.chatContainer}>
      {/* Editorial Header */}
      <div className={styles.header}>
        <div className={styles.headerProfile}>
          <div className={styles.avatarLetter}>{initial}</div>
          <div className={styles.headerInfo}>
            <h3 className={styles.headerTitle}>{opponentName}</h3>
            <span className={styles.headerStatus}>
              <span className={styles.statusDot}></span> ACTIVE IN STUDIO
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
          <div className={styles.noMessages}>No correspondence recorded yet. Initiate entry.</div>
        ) : (
          messages.map((message, index) => {
            const isSent = message.sender_id === sender_id;
            const senderName = isSent ? currentUser.username : opponentName;
            const msgTime = formatMessageTime(message.created_at);
            
            return (
              <React.Fragment key={message.id || index}>
                {shouldRenderDateSeparator(index) && (
                  <div className={styles.dateSeparator}>
                    <span className={styles.dateText}>{formatMessageDate(message.created_at)}</span>
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
                          messageId={message.id}
                          senderId={message.sender_id}
                          currentUserId={sender_id}
                          message={message}
                        />
                      </div>
                    )}

                    <div className={styles.messageContent}>
                      <p className={styles.messageText}>{message.text}</p>
                      
                      {message.reactions && message.reactions.length > 0 && (
                        <div className={styles.reactionPillContainer}>
                          {getConsolidatedReactions(message.reactions, sender_id, receiver_id, receiverInfo?.username).map((item, idx) => (
                            <span
                              key={idx}
                              className={styles.reactionPill}
                              title={item.users.join(', ')}
                              onClick={() => handleReactionToggle(message.id, item.emoji)}
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
                          messageId={message.id}
                          senderId={message.sender_id}
                          currentUserId={sender_id}
                          message={message}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        
        {opponentTyping && (
          <div className={styles.typingIndicator}>
            {opponentName} is drafting a response...
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
            placeholder="Draft your response here..."
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

export default ChatPage;
