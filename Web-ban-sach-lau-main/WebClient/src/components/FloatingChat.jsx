import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, Sparkles, AlertCircle, ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const FloatingChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const messagesEndRef = useRef(null);
  const pollingInterval = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 1. Tải lịch sử chat từ server
  const fetchMessages = async (showLoading = false) => {
    if (!user) return;
    try {
      if (showLoading) setLoading(true);
      const { data } = await client.get(`/chat/support/messages/${user.id}`);
      setMessages(data);
      
      // Tính tin nhắn chưa đọc gửi từ CSKH (sender_id !== user.id và is_read = false)
      if (!isOpen) {
        const unread = data.filter(m => !m.is_read && m.sender_id !== user.id).length;
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Error fetching support messages in client:', err);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Thiết lập vòng lặp polling chạy ngầm để phát hiện tin nhắn mới của CSKH phản hồi
  useEffect(() => {
    if (user) {
      fetchMessages(true);
      
      // Polling ngầm mỗi 4 giây khi tắt box chat, 2 giây khi mở box chat
      const intervalMs = isOpen ? 2000 : 4500;
      pollingInterval.current = setInterval(() => {
        fetchMessages(false);
      }, intervalMs);
    }

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [user, isOpen]);

  // Xử lý gửi tin nhắn
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !user || sending) return;

    try {
      setSending(true);
      const text = inputValue.trim();
      setInputValue('');

      const { data } = await client.post('/chat/support/send', {
        receiver_id: null, // Khách hàng gửi lên kênh Support chung
        message: text
      });

      if (data.success && data.message) {
        setMessages(prev => [...prev, data.message]);
        scrollToBottom();
      }
    } catch (err) {
      console.error('Error sending message from client:', err);
      alert('Gửi tin nhắn hỗ trợ thất bại. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, cubicBezier: [0.4, 0, 0.2, 1] }}
            style={styles.chatWindow}
            className="glass-chat"
          >
            {/* Header */}
            <div style={styles.header}>
              <div style={styles.headerInfo}>
                <div style={styles.avatar}>BH</div>
                <div>
                  <div style={styles.title}>Hỗ trợ BookHaven</div>
                  <div style={styles.status}>
                    <div style={styles.statusDot}></div>
                    <span>Tư vấn trực tuyến 24/7</span>
                  </div>
                </div>
              </div>
              <button onClick={handleToggle} style={styles.closeBtn}>
                <X size={18} />
              </button>
            </div>

            {/* Messages Area */}
            <div style={styles.messageList}>
              {!user ? (
                <div style={styles.emptyContainer}>
                  <AlertCircle size={32} color="rgba(255,255,255,0.2)" />
                  <p style={styles.emptyText}>Vui lòng đăng nhập tài khoản để gửi tin nhắn hỗ trợ tới bộ phận CSKH BookHaven.</p>
                  <a href="/login" style={styles.loginLink}>Đăng nhập ngay</a>
                </div>
              ) : loading && messages.length === 0 ? (
                <div style={styles.loaderContainer}>
                  <Loader2 className="spinner" size={24} color="var(--primary)" />
                </div>
              ) : messages.length === 0 ? (
                <div style={styles.emptyContainer}>
                  <Sparkles size={32} color="var(--primary)" style={{ opacity: 0.7 }} />
                  <h4 style={{ color: '#fff', marginTop: '12px', fontWeight: '700', fontSize: '14px' }}>Chào {user.name}!</h4>
                  <p style={styles.emptyText}>BookHaven có thể hỗ trợ gì cho bạn hôm nay? Hãy nhập tin nhắn bên dưới để nhận phản hồi ngay lập tức.</p>
                </div>
              ) : (
                <div style={styles.messagesScrollContainer}>
                  {/* Onboarding text */}
                  <div style={styles.chatTips}>
                    Hội thoại được bảo mật và hỗ trợ trực tuyến bởi Đội ngũ CSKH BookHaven.
                  </div>
                  {messages.map(msg => {
                    const isMe = msg.sender_id === user.id;
                    return (
                      <div 
                        key={msg.id} 
                        style={{
                          ...styles.messageRow,
                          justifyContent: isMe ? 'flex-end' : 'flex-start'
                        }}
                      >
                        <div 
                          style={{
                            ...styles.messageBubble,
                            ...(isMe ? styles.bubbleMe : styles.bubblePartner)
                          }}
                        >
                          <div>{msg.message}</div>
                          <div style={{
                            ...styles.messageTime,
                            color: isMe ? 'rgba(15,23,42,0.4)' : 'rgba(255,255,255,0.3)'
                          }}>
                            {new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            {user && (
              <form onSubmit={handleSend} style={styles.inputArea}>
                <input 
                  type="text" 
                  placeholder="Nhập câu hỏi tại đây..." 
                  style={styles.input}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  disabled={sending}
                />
                <button type="submit" style={styles.sendBtn} disabled={!inputValue.trim() || sending}>
                  {sending ? <Loader2 className="spinner" size={16} /> : <Send size={16} />}
                </button>
              </form>
            )}
          </motion.div>
        )}
        {showScrollTop && !isOpen && (
          <motion.button
            key="back-to-top"
            initial={{ opacity: 0, scale: 0.5, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 15 }}
            transition={{ duration: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={styles.backToTopBtn}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Cuộn về đầu trang"
          >
            <ArrowUp size={22} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating Action Button Trigger */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        style={styles.floatingBtn}
        onClick={handleToggle}
      >
        {isOpen ? (
          <X size={22} />
        ) : (
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MessageCircle size={22} />
            {unreadCount > 0 && (
              <span style={styles.unreadBadge}>{unreadCount}</span>
            )}
          </div>
        )}
      </motion.button>

      {/* CSS Injected styles */}
      <style>{`
        .glass-chat {
          background: rgba(15, 23, 42, 0.7) !important;
          backdrop-filter: blur(25px) !important;
          -webkit-backdrop-filter: blur(25px) !important;
          border: 1px solid rgba(255, 255, 255, 0.08) !important;
          box-shadow: 0 20px 60px rgba(0,0,0,0.4) !important;
        }

        .spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
};

const styles = {
  floatingBtn: {
    position: 'fixed',
    bottom: '30px',
    right: '30px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: '#0f172a',
    border: 'none',
    boxShadow: '0 8px 30px rgba(0, 216, 255, 0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  backToTopBtn: {
    position: 'fixed',
    bottom: '96px',
    right: '30px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    backgroundColor: 'var(--primary)',
    color: '#0f172a',
    border: 'none',
    boxShadow: '0 8px 30px rgba(0, 216, 255, 0.3)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  unreadBadge: {
    position: 'absolute',
    top: '-12px',
    right: '-12px',
    backgroundColor: '#ef4444',
    color: '#fff',
    fontSize: '9px',
    fontWeight: '800',
    borderRadius: '10px',
    padding: '3px 7px',
    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)',
    border: '2px solid #0f172a',
  },
  chatWindow: {
    position: 'fixed',
    bottom: '100px',
    right: '30px',
    width: '340px',
    height: '460px',
    borderRadius: '24px',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    zIndex: 999,
  },
  header: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  avatar: {
    width: '34px',
    height: '34px',
    backgroundColor: 'var(--primary)',
    color: '#0f172a',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '12px',
  },
  title: {
    fontWeight: '700',
    fontSize: '14px',
    color: '#fff',
  },
  status: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.4)',
    display: 'flex',
    alignItems: 'center',
    marginTop: '2px',
  },
  statusDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10b981',
    marginRight: '5px',
    boxShadow: '0 0 8px #10b981',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    display: 'flex',
    padding: '4px',
    borderRadius: '8px',
    transition: 'all 0.2s',
    ':hover': {
      color: '#fff',
      backgroundColor: 'rgba(255,255,255,0.05)'
    }
  },
  messageList: {
    flex: 1,
    padding: '15px 20px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'transparent',
  },
  messagesScrollContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    width: '100%',
  },
  chatTips: {
    fontSize: '10px',
    color: 'rgba(255,255,255,0.25)',
    textAlign: 'center',
    padding: '5px 10px 10px',
    lineHeight: '1.4',
  },
  messageRow: {
    display: 'flex',
    width: '100%',
  },
  messageBubble: {
    padding: '10px 14px',
    borderRadius: '16px',
    maxWidth: '75%',
    fontSize: '13px',
    lineHeight: '1.4',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  bubbleMe: {
    backgroundColor: 'var(--primary)',
    color: '#0f172a',
    fontWeight: '600',
    borderBottomRightRadius: '3px',
  },
  bubblePartner: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#fff',
    borderBottomLeftRadius: '3px',
    border: '1px solid rgba(255,255,255,0.03)',
  },
  messageTime: {
    fontSize: '9px',
    textAlign: 'right',
    marginTop: '4px',
  },
  loaderContainer: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '0 15px',
  },
  emptyText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.35)',
    marginTop: '10px',
    lineHeight: '1.5',
  },
  loginLink: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--primary)',
    textDecoration: 'none',
    marginTop: '15px',
    padding: '8px 20px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0,216,255,0.08)',
    border: '1.5px solid rgba(0,216,255,0.2)',
  },
  inputArea: {
    display: 'flex',
    padding: '15px 20px 20px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    gap: '10px',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '14px',
    padding: '10px 14px',
    outline: 'none',
    fontSize: '13px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: '#fff',
  },
  sendBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '12px',
    backgroundColor: 'var(--primary)',
    color: '#0f172a',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(0, 216, 255, 0.2)',
    transition: 'all 0.2s',
  }
};

export default FloatingChat;
