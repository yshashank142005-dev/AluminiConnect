import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

/* ── Typing dots indicator ── */
const TypingDots = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '10px 14px' }}>
    {[0, 1, 2].map(i => (
      <motion.span
        key={i}
        style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--text-muted)', display: 'block' }}
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
      />
    ))}
  </div>
);

/* ── Message bubble ── */
const MessageBubble = ({ msg, isOwn, index }) => (
  <motion.div
    style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '8px' }}
    initial={{ opacity: 0, y: 10, scale: 0.96 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ delay: Math.min(index * 0.025, 0.3), type: 'spring', stiffness: 400, damping: 30 }}
  >
    <div style={{
      maxWidth: '70%', padding: '10px 14px',
      borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      background: isOwn
        ? 'linear-gradient(135deg, var(--accent), #5b21b6)'
        : 'rgba(255,255,255,0.06)',
      color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.55,
      border: isOwn ? 'none' : '1px solid var(--border)',
      boxShadow: isOwn ? '0 4px 16px rgba(124,58,237,0.2)' : 'none',
    }}>
      {msg.content}
      <div style={{ fontSize: '10px', opacity: 0.55, marginTop: '5px', textAlign: isOwn ? 'right' : 'left' }}>
        {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : 'just now'}
        {isOwn && <span style={{ marginLeft: '5px' }}>✓</span>}
      </div>
    </div>
  </motion.div>
);

/* ── Conversation list skeleton ── */
const ConvSkeleton = () => (
  <div style={{ display: 'flex', gap: '12px', padding: '14px 16px', alignItems: 'center' }}>
    <div className="skeleton-shimmer" style={{ width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0 }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '7px' }}>
      <div className="skeleton-shimmer" style={{ height: '13px', width: '60%', borderRadius: '5px' }} />
      <div className="skeleton-shimmer" style={{ height: '11px', width: '80%', borderRadius: '5px' }} />
    </div>
  </div>
);

/* ── Chat area skeleton ── */
const ChatSkeleton = () => (
  <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
    {[false, true, false, true, false].map((own, i) => (
      <div key={i} style={{ display: 'flex', justifyContent: own ? 'flex-end' : 'flex-start' }}>
        <div className="skeleton-shimmer" style={{
          height: '42px', width: `${own ? 180 : 240}px`,
          borderRadius: own ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        }} />
      </div>
    ))}
  </div>
);

/* ── Page ── */
export default function MessagesPage() {
  const { user } = useAuth();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { joinRoom, sendMessage, onReceiveMessage, offReceiveMessage, emitTyping, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [convLoading, setConvLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimer = useRef(null);
  const roomId = activeConv ? [user._id, activeConv._id].sort().join('_') : null;

  /* Load conversations */
  useEffect(() => {
    api.get('/messages/conversations')
      .then(res => setConversations(res.data.conversations || []))
      .catch(() => {})
      .finally(() => setConvLoading(false));
  }, []);

  /* Deep-link to a user */
  useEffect(() => {
    if (paramUserId) loadConversation(paramUserId);
  }, [paramUserId]);

  const loadConversation = async (partnerId) => {
    setChatLoading(true);
    try {
      const [userRes, msgsRes] = await Promise.all([
        api.get(`/users/profile/${partnerId}`),
        api.get(`/messages/${partnerId}`),
      ]);
      setActiveConv(userRes.data.user);
      setMessages(msgsRes.data.messages || []);
      await api.put(`/messages/${partnerId}/read`).catch(() => {});
      const rid = [user._id, partnerId].sort().join('_');
      joinRoom(rid);
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally { setChatLoading(false); }
  };

  /* Receive messages via socket */
  useEffect(() => {
    const handler = (msg) => {
      if (msg.roomId === roomId || !msg.roomId) {
        setMessages(prev => [...prev, msg]);
      }
    };
    onReceiveMessage(handler);
    return () => offReceiveMessage(handler);
  }, [roomId, onReceiveMessage, offReceiveMessage]);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  const handleSend = async () => {
    if (!text.trim() || !activeConv) return;
    const content = text.trim();
    setText('');
    setSending(true);
    const optimistic = { sender: { _id: user._id }, content, createdAt: new Date() };
    setMessages(prev => [...prev, optimistic]);
    try {
      const res = await api.post('/messages/send', { recipientId: activeConv._id, content });
      sendMessage(roomId, res.data.message);
    } catch {
      setMessages(prev => prev.slice(0, -1));
    } finally { setSending(false); }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    emitTyping(roomId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(roomId, false), 1500);
  };

  const isOnline = (id) => onlineUsers?.includes(id);
  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--navbar-h))', overflow: 'hidden' }}>

      {/* ── Conversations sidebar ── */}
      <div style={{
        width: '300px', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        background: 'rgba(13,17,32,0.6)', backdropFilter: 'blur(12px)',
      }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px' }}>💬 Messages</h2>
          {conversations.length > 0 && (
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
              {conversations.length} chat{conversations.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {convLoading ? (
            [...Array(5)].map((_, i) => <ConvSkeleton key={i} />)
          ) : conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 16px', gap: '10px' }}>
              <motion.span
                style={{ fontSize: '40px' }}
                animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                transition={{ duration: 1.5, delay: 0.3 }}
              >🫧</motion.span>
              <p style={{ fontSize: '13px', textAlign: 'center', lineHeight: 1.6 }}>
                No conversations yet.<br />
                <Link to="/alumni" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>Browse alumni</Link>
                {' '}to start chatting.
              </p>
            </div>
          ) : conversations.map((conv, i) => {
            const partner = conv.partner;
            const isActive = activeConv?._id === partner?._id;
            const online = isOnline(partner?._id);
            return (
              <motion.div
                key={i}
                onClick={() => { setActiveConv(partner); loadConversation(partner._id); navigate(`/messages/${partner._id}`); }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ background: 'rgba(255,255,255,0.04)' }}
                style={{
                  display: 'flex', gap: '12px', padding: '13px 16px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent',
                  borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
                  transition: 'background 0.15s ease, border-color 0.15s ease',
                }}
              >
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div className="avatar avatar-md" style={{ fontSize: '15px' }}>{initials(partner?.name)}</div>
                  {online && (
                    <motion.div
                      className="online-dot"
                      style={{ position: 'absolute', bottom: 0, right: 0 }}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring' }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {partner?.name}
                    </span>
                    {conv.unreadCount > 0 && (
                      <motion.span
                        className="badge"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500 }}
                      >
                        {conv.unreadCount}
                      </motion.span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: online ? 'var(--success)' : 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                    {online ? '● Online' : conv.lastMessage?.content || 'Start a conversation'}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── Chat area ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeConv ? (
          /* No conversation selected */
          <motion.div
            className="empty-state"
            style={{ flex: 1 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.span
              style={{ fontSize: '64px', marginBottom: '12px', display: 'block' }}
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              💬
            </motion.span>
            <h3 style={{ fontSize: '20px' }}>Your messages live here</h3>
            <p style={{ maxWidth: '320px', marginTop: '8px', fontSize: '14px', lineHeight: 1.7 }}>
              Select a conversation on the left, or{' '}
              <Link to="/alumni" style={{ color: 'var(--accent-light)', fontWeight: 600 }}>connect with alumni</Link>
              {' '}to start a new one.
            </p>
          </motion.div>
        ) : (
          <>
            {/* Chat Header */}
            <motion.div
              style={{
                padding: '14px 24px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(13,17,32,0.7)', backdropFilter: 'blur(12px)',
              }}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div style={{ position: 'relative' }}>
                <div className="avatar avatar-md" style={{ fontSize: '15px' }}>{initials(activeConv.name)}</div>
                {isOnline(activeConv._id) && (
                  <div className="online-dot" style={{ position: 'absolute', bottom: 0, right: 0 }} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{activeConv.name}</div>
                <div style={{ fontSize: '12px', color: isOnline(activeConv._id) ? 'var(--success)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{isOnline(activeConv._id) ? '● Online now' : 'Offline'}</span>
                  {partnerTyping && <span style={{ color: 'var(--text-muted)' }}>· typing…</span>}
                </div>
              </div>
              {activeConv.currentRole && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'right' }}>
                  <div style={{ fontWeight: 600 }}>{activeConv.currentRole}</div>
                  {activeConv.company && <div>{activeConv.company}</div>}
                </div>
              )}
            </motion.div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              {chatLoading ? (
                <ChatSkeleton />
              ) : messages.length === 0 ? (
                <motion.div
                  className="empty-state"
                  style={{ minHeight: '300px' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.span
                    style={{ fontSize: '44px', marginBottom: '8px', display: 'block' }}
                    animate={{ rotate: [0, 15, -15, 10, -10, 0] }}
                    transition={{ duration: 1.4, delay: 0.4 }}
                  >
                    👋
                  </motion.span>
                  <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '16px' }}>
                    Say hello to {activeConv.name?.split(' ')[0]}!
                  </p>
                  <p style={{ fontSize: '13px', marginTop: '4px' }}>
                    This is the beginning of your conversation.
                  </p>
                </motion.div>
              ) : (
                <>
                  {messages.map((msg, i) => (
                    <MessageBubble
                      key={i}
                      index={i}
                      msg={msg}
                      isOwn={msg.sender?._id === user._id || msg.sender === user._id}
                    />
                  ))}
                  {/* Typing indicator */}
                  <AnimatePresence>
                    {partnerTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        style={{ display: 'flex', justifyContent: 'flex-start' }}
                      >
                        <div style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid var(--border)',
                          borderRadius: '18px 18px 18px 4px',
                        }}>
                          <TypingDots />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <div style={{
              padding: '14px 24px', borderTop: '1px solid var(--border)',
              display: 'flex', gap: '10px', alignItems: 'center',
              background: 'rgba(13,17,32,0.8)', backdropFilter: 'blur(12px)',
            }}>
              <input
                ref={inputRef}
                className="input"
                placeholder={`Message ${activeConv.name?.split(' ')[0]}…`}
                value={text}
                onChange={handleTyping}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                style={{ flex: 1 }}
              />
              <motion.button
                onClick={handleSend}
                disabled={!text.trim() || sending}
                className="btn btn-primary"
                style={{ flexShrink: 0, minWidth: '48px', justifyContent: 'center' }}
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.94 }}
              >
                {sending
                  ? <span className="spinner spinner-sm" />
                  : <motion.span
                      animate={text.trim() ? { x: [0, 3, 0] } : {}}
                      transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 1.5 }}
                    >➤</motion.span>
                }
              </motion.button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
