import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api/axios';
import { formatDistanceToNow } from 'date-fns';

const MessageBubble = ({ msg, isOwn }) => (
  <div style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '8px' }}>
    <div style={{
      maxWidth: '70%', padding: '10px 14px', borderRadius: isOwn ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
      background: isOwn ? 'linear-gradient(135deg, var(--accent), #5b21b6)' : 'rgba(255,255,255,0.06)',
      color: 'var(--text-primary)', fontSize: '14px', lineHeight: 1.5,
      border: isOwn ? 'none' : '1px solid var(--border)',
    }}>
      {msg.content}
      <div style={{ fontSize: '10px', opacity: 0.6, marginTop: '4px', textAlign: isOwn ? 'right' : 'left' }}>
        {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : 'just now'}
      </div>
    </div>
  </div>
);

export default function MessagesPage() {
  const { user } = useAuth();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();
  const { joinRoom, sendMessage, onReceiveMessage, offReceiveMessage, emitTyping, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);
  const roomId = activeConv ? [user._id, activeConv._id].sort().join('_') : null;

  useEffect(() => {
    api.get('/messages/conversations').then(res => setConversations(res.data.conversations || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (paramUserId) loadConversation(paramUserId);
  }, [paramUserId]);

  const loadConversation = async (partnerId) => {
    setLoading(true);
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
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const handler = (msg) => {
      if (msg.roomId === roomId || !msg.roomId) {
        setMessages(prev => [...prev, msg]);
      }
    };
    onReceiveMessage(handler);
    return () => offReceiveMessage(handler);
  }, [roomId, onReceiveMessage, offReceiveMessage]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    } catch { setMessages(prev => prev.slice(0, -1)); } 
    finally { setSending(false); }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    emitTyping(roomId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(roomId, false), 1500);
  };

  const isOnline = (id) => onlineUsers.includes(id);
  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?';

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--navbar-h))', overflow: 'hidden' }}>
      {/* Conversations List */}
      <div style={{ width: '300px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, background: 'var(--bg-secondary)' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px' }}>Messages</h2>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 16px' }}>
              <div>💬</div><p style={{ fontSize: '13px' }}>No conversations yet.<br />Browse alumni to start chatting.</p>
            </div>
          ) : conversations.map((conv, i) => {
            const partner = conv.partner;
            const isActive = activeConv?._id === partner?._id;
            return (
              <div key={i} onClick={() => { setActiveConv(partner); loadConversation(partner._id); navigate(`/messages/${partner._id}`); }}
                style={{ display: 'flex', gap: '12px', padding: '14px 16px', cursor: 'pointer', background: isActive ? 'rgba(124,58,237,0.12)' : 'transparent', borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent', transition: 'var(--transition)' }}>
                <div style={{ position: 'relative' }}>
                  <div className="avatar avatar-md" style={{ fontSize: '15px' }}>{initials(partner?.name)}</div>
                  {isOnline(partner?._id) && <div className="online-dot" style={{ position: 'absolute', bottom: 0, right: 0 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 600, fontSize: '14px' }}>{partner?.name}</span>
                    {conv.unreadCount > 0 && <span className="badge">{conv.unreadCount}</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {conv.lastMessage?.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!activeConv ? (
          <div className="empty-state" style={{ flex: 1 }}>
            <div className="empty-icon">💬</div>
            <h3>Select a conversation</h3>
            <p>Choose from the left or browse alumni to start chatting</p>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-secondary)' }}>
              <div style={{ position: 'relative' }}>
                <div className="avatar avatar-md" style={{ fontSize: '15px' }}>{initials(activeConv.name)}</div>
                {isOnline(activeConv._id) && <div className="online-dot" style={{ position: 'absolute', bottom: 0, right: 0 }} />}
              </div>
              <div>
                <div style={{ fontWeight: 700 }}>{activeConv.name}</div>
                <div style={{ fontSize: '12px', color: isOnline(activeConv._id) ? 'var(--success)' : 'var(--text-muted)' }}>
                  {isOnline(activeConv._id) ? 'Online' : 'Offline'}
                  {typing && ' · typing...'}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {loading ? <div className="loading-screen" style={{ minHeight: '200px' }}><div className="spinner" /></div> :
                messages.length === 0 ? (
                  <div className="empty-state"><div>✉️</div><p>No messages yet. Say hello!</p></div>
                ) : messages.map((msg, i) => (
                  <MessageBubble key={i} msg={msg} isOwn={msg.sender?._id === user._id || msg.sender === user._id} />
                ))
              }
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '12px', background: 'var(--bg-secondary)' }}>
              <input
                className="input"
                placeholder={`Message ${activeConv.name}...`}
                value={text}
                onChange={handleTyping}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                style={{ flex: 1 }}
              />
              <button onClick={handleSend} disabled={!text.trim() || sending} className="btn btn-primary" style={{ flexShrink: 0 }}>
                {sending ? <span className="spinner spinner-sm" /> : '➤'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
