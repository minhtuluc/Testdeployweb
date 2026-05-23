import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  User, 
  MessageSquare, 
  Search, 
  Loader2, 
  CheckCheck,
  Clock,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import client from '../api/client';

const ChatSupport = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null); // customer_id
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);

  // 1. Tải danh sách các phiên chat của khách hàng
  const fetchSessions = async (showLoading = false) => {
    try {
      if (showLoading) setLoadingSessions(true);
      const { data } = await client.get('/chat/support/sessions');
      setSessions(data);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      if (showLoading) setLoadingSessions(false);
    }
  };

  // 2. Tải lịch sử chat của phiên đang chọn
  const fetchMessages = async (customerId, showLoading = false) => {
    try {
      if (showLoading) setLoadingMessages(true);
      const { data } = await client.get(`/chat/support/messages/${customerId}`);
      setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      if (showLoading) setLoadingMessages(false);
    }
  };

  // Tự động cuộn xuống cuối khung chat khi có tin mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial load
  useEffect(() => {
    fetchSessions(true);
    
    // Thiết lập vòng lặp Polling để liên tục cập nhật danh sách hội thoại mới và tin nhắn chưa đọc
    const sessionTimer = setInterval(() => {
      fetchSessions(false);
    }, 4000);

    return () => clearInterval(sessionTimer);
  }, []);

  // Thay đổi phiên chat active
  useEffect(() => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    if (activeSession) {
      fetchMessages(activeSession, true);

      // Thiết lập Polling cập nhật tin nhắn mới mỗi 2 giây cực kỳ mượt mà
      pollingInterval.current = setInterval(() => {
        fetchMessages(activeSession, false);
      }, 2000);
    } else {
      setMessages([]);
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [activeSession]);

  // Gửi phản hồi của CSKH
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !activeSession || sending) return;

    try {
      setSending(true);
      const textToSend = messageText.trim();
      setMessageText('');

      const { data } = await client.post('/chat/support/send', {
        receiver_id: activeSession,
        message: textToSend
      });

      // Thêm ngay tin nhắn mới gửi vào list để hiện lên lập tức (Optimistic Update)
      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        // Tải lại sessions để update tin nhắn cuối cùng nhanh chóng
        fetchSessions(false);
      }
    } catch (err) {
      console.error('Error sending support message:', err);
      alert('Không thể gửi tin nhắn. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  // Lọc tìm kiếm khách hàng
  const filteredSessions = sessions.filter(s => 
    s.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCustomer = sessions.find(s => s.customer_id === activeSession);

  return (
    <div style={styles.container} className="animate-fade-in">
      <div className="glass" style={styles.chatWindow}>
        
        {/* Left Column: Chat Sessions List */}
        <div style={styles.sidebar}>
          <div style={styles.sidebarHeader}>
            <h3 style={styles.sidebarTitle}>Hỗ trợ trực tuyến</h3>
            <div style={styles.searchBox}>
              <Search size={16} color="rgba(255,255,255,0.3)" />
              <input 
                type="text" 
                placeholder="Tìm khách hàng..." 
                style={styles.searchInput}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div style={styles.sessionList}>
            {loadingSessions && sessions.length === 0 ? (
              <div style={styles.loaderContainer}>
                <Loader2 className="spinner" size={24} color="var(--primary)" />
              </div>
            ) : filteredSessions.length === 0 ? (
              <div style={styles.emptySessions}>
                <MessageSquare size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: '10px' }} />
                <span>Không tìm thấy cuộc trò chuyện nào</span>
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isActive = session.customer_id === activeSession;
                
                return (
                  <div 
                    key={session.customer_id}
                    onClick={() => setActiveSession(session.customer_id)}
                    style={{
                      ...styles.sessionCard,
                      ...(isActive ? styles.activeSessionCard : {})
                    }}
                  >
                    {/* User Avatar / Initials */}
                    <div style={styles.avatarContainer}>
                      {session.customer_avatar ? (
                        <img src={session.customer_avatar} alt="Avatar" style={styles.avatarImg} />
                      ) : (
                        <div style={styles.initialsAvatar}>
                          {session.customer_name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={styles.onlineIndicator}></div>
                    </div>

                    {/* Meta info */}
                    <div style={styles.sessionMeta}>
                      <div style={styles.sessionTopRow}>
                        <span style={styles.sessionName}>{session.customer_name}</span>
                        <span style={styles.sessionTime}>
                          {new Date(session.last_message_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={styles.sessionBottomRow}>
                        <span style={{
                          ...styles.sessionLastMessage,
                          fontWeight: session.unread_count > 0 ? '700' : '400',
                          color: session.unread_count > 0 ? '#fff' : 'rgba(255,255,255,0.4)'
                        }}>
                          {session.last_message}
                        </span>
                        {session.unread_count > 0 && (
                          <span style={styles.unreadBadge}>{session.unread_count}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Chat Conversation Messages View */}
        <div style={styles.chatArea}>
          {activeSession ? (
            <>
              {/* Header */}
              <div style={styles.chatHeader}>
                <div style={styles.headerUser}>
                  <div style={styles.avatarContainer}>
                    {activeCustomer?.customer_avatar ? (
                      <img src={activeCustomer.customer_avatar} alt="Avatar" style={styles.avatarImg} />
                    ) : (
                      <div style={styles.initialsAvatar}>
                        {activeCustomer?.customer_name?.charAt(0).toUpperCase() || 'K'}
                      </div>
                    )}
                    <div style={styles.onlineIndicator}></div>
                  </div>
                  <div>
                    <div style={styles.chatHeaderName}>{activeCustomer?.customer_name}</div>
                    <div style={styles.chatHeaderRole}>
                      <ShieldCheck size={12} color="var(--primary)" style={{ marginRight: '4px' }} />
                      <span>Khách hàng của BookHaven</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Message List */}
              <div style={styles.messagesBox}>
                {loadingMessages ? (
                  <div style={styles.loaderContainer}>
                    <Loader2 className="spinner" size={32} color="var(--primary)" />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={styles.emptyConversation}>
                    <MessageSquare size={40} color="rgba(255,255,255,0.1)" />
                    <p style={{ marginTop: '10px', fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
                      Chưa có lịch sử nhắn tin. Hãy bắt đầu hỗ trợ khách hàng!
                    </p>
                  </div>
                ) : (
                  <div style={styles.messagesList}>
                    {messages.map((msg) => {
                      const isMe = msg.sender_id !== activeSession;
                      
                      return (
                        <div 
                          key={msg.id}
                          style={{
                            ...styles.messageRow,
                            justifyContent: isMe ? 'flex-end' : 'flex-start'
                          }}
                        >
                          <div style={{
                            ...styles.messageBubble,
                            ...(isMe ? styles.bubbleMe : styles.bubblePartner)
                          }}>
                            <div style={styles.messageText}>{msg.message}</div>
                            <div style={{
                              ...styles.messageTime,
                              textAlign: isMe ? 'right' : 'left',
                              color: isMe ? 'rgba(15,23,42,0.5)' : 'rgba(255,255,255,0.3)'
                            }}>
                              <span>{new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                              {isMe && <CheckCheck size={12} style={{ marginLeft: '4px', display: 'inline' }} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Input form */}
              <form onSubmit={handleSendMessage} style={styles.inputForm}>
                <input 
                  type="text" 
                  placeholder="Nhập câu trả lời hỗ trợ khách hàng..." 
                  style={styles.chatInput}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" style={styles.sendButton} disabled={!messageText.trim() || sending}>
                  {sending ? (
                    <Loader2 className="spinner" size={18} />
                  ) : (
                    <Send size={18} />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div style={styles.welcomeContainer}>
              <div style={styles.welcomeCard}>
                <div style={styles.welcomeIconContainer}>
                  <MessageSquare size={48} color="var(--primary)" />
                </div>
                <h2 style={styles.welcomeTitle}>Hộp thư CSKH trực tuyến</h2>
                <p style={styles.welcomeText}>
                  Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu tương tác, chăm sóc khách hàng và giải quyết khiếu nại tức thời.
                </p>
                <div style={styles.welcomeStatus}>
                  <div style={styles.onlineBadge}></div>
                  <span>Bạn đang trực tuyến hỗ trợ</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .glass {
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 24px;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    height: 'calc(100vh - 120px)',
    display: 'flex',
    flexDirection: 'column',
  },
  chatWindow: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
    boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
  },
  sidebar: {
    width: '320px',
    borderRight: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(15,23,42,0.15)',
  },
  sidebarHeader: {
    padding: '25px 20px 15px',
  },
  sidebarTitle: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '15px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 15px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '13px',
    marginLeft: '10px',
    width: '100%',
    outline: 'none',
  },
  sessionList: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 10px 20px',
  },
  loaderContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '50px 0',
  },
  emptySessions: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'rgba(255,255,255,0.3)',
    fontSize: '13px',
    padding: '40px 20px',
    textAlign: 'center',
  },
  sessionCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 15px',
    borderRadius: '16px',
    cursor: 'pointer',
    marginBottom: '6px',
    transition: 'all 0.2s ease',
    backgroundColor: 'transparent',
  },
  activeSessionCard: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: '12px',
  },
  avatarImg: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    objectFit: 'cover',
    border: '1.5px solid rgba(255,255,255,0.1)',
  },
  initialsAvatar: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1.5px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    color: 'var(--primary)',
    fontSize: '16px',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    border: '2px solid #0f172a',
  },
  sessionMeta: {
    flex: 1,
    minWidth: 0, // Enables text truncation
  },
  sessionTopRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionName: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#fff',
  },
  sessionTime: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.3)',
  },
  sessionBottomRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '4px',
  },
  sessionLastMessage: {
    fontSize: '12px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flex: 1,
    marginRight: '10px',
  },
  unreadBadge: {
    fontSize: '10px',
    fontWeight: '800',
    backgroundColor: 'var(--primary)',
    color: '#0f172a',
    borderRadius: '50%',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  chatHeader: {
    padding: '20px 25px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerUser: {
    display: 'flex',
    alignItems: 'center',
  },
  chatHeaderName: {
    fontSize: '16px',
    fontWeight: '800',
    color: '#fff',
  },
  chatHeaderRole: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.4)',
    display: 'flex',
    alignItems: 'center',
    marginTop: '2px',
  },
  messagesBox: {
    flex: 1,
    overflowY: 'auto',
    padding: '25px',
  },
  emptyConversation: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    maxWidth: '65%',
    padding: '12px 18px',
    borderRadius: '20px',
    fontSize: '14px',
    lineHeight: '1.5',
    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
  },
  bubbleMe: {
    backgroundColor: 'var(--primary)', // bright cyan gradient
    color: '#0f172a',
    fontWeight: '600',
    borderBottomRightRadius: '4px',
    boxShadow: '0 4px 20px rgba(0, 216, 255, 0.15)',
  },
  bubblePartner: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#fff',
    borderBottomLeftRadius: '4px',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  messageText: {
    wordBreak: 'break-word',
  },
  messageTime: {
    fontSize: '10px',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  inputForm: {
    padding: '15px 25px 25px',
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  chatInput: {
    flex: 1,
    padding: '14px 20px',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.06)',
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    transition: 'all 0.2s',
    ':focus': {
      borderColor: 'var(--primary)',
      backgroundColor: 'rgba(255,255,255,0.05)'
    }
  },
  sendButton: {
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    border: 'none',
    backgroundColor: 'var(--primary)',
    color: '#0f172a',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(0, 216, 255, 0.2)',
    transition: 'all 0.2s',
    disabled: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      color: 'rgba(255,255,255,0.1)',
      cursor: 'not-allowed',
      boxShadow: 'none'
    }
  },
  welcomeContainer: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
  welcomeCard: {
    textAlign: 'center',
    maxWidth: '450px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  welcomeIconContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'rgba(0, 216, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '25px',
    boxShadow: '0 10px 30px rgba(0,216,255,0.1)',
  },
  welcomeTitle: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#fff',
    marginBottom: '12px',
  },
  welcomeText: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.4)',
    lineHeight: '1.6',
    marginBottom: '25px',
  },
  welcomeStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16,185,129,0.08)',
    padding: '6px 14px',
    borderRadius: '12px',
  },
  onlineBadge: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    boxShadow: '0 0 10px #10b981',
  }
};

export default ChatSupport;
