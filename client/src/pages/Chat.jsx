import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../context/AuthContext';
import { getChat, getChatMessages, sendChatMessage } from '../services/chats';
import { formatDate } from '../lib/format';

export default function Chat() {
  const { id } = useParams();
  const { profile } = useAuth();
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [chatRes, messagesRes] = await Promise.all([getChat(id), getChatMessages(id)]);
        if (!active) return;
        setChat(chatRes.chat);
        setMessages(messagesRes.messages);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    const interval = window.setInterval(() => {
      getChatMessages(id).then((res) => active && setMessages(res.messages)).catch(() => {});
    }, 5000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [id]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const res = await sendChatMessage(id, text.trim());
      setMessages((items) => [...items, res.message]);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const otherPerson = chat && (profile.role === 'learner' ? chat.tutorName : chat.learnerName);
  const prompt = chat?.lessonType === 'online'
    ? 'Use this chat to agree on the date and time for your online lesson.'
    : 'Use this private chat to coordinate the details of your in-person lesson.';

  return (
    <>
      <PageHeader tag="Lesson chat" title={otherPerson || 'Private lesson chat'} text={prompt} />
      <section className="dashboard-section">
        <div className="container" style={{ maxWidth: 820 }}>
          {loading ? <PageLoader /> : error && !chat ? (
            <EmptyState icon="bi-chat-square-x" title="Couldn't open this chat" text={error} />
          ) : (
            <div className="dashboard-panel">
              <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                <div><strong>{otherPerson}</strong><span className="request-subject ms-2">{chat.subject}</span></div>
                <Link to="/chats" className="btn btn-sm btn-secondary-cta">All Chats</Link>
              </div>
              <div className="chat-messages">
                {messages.length === 0 ? <p className="text-muted text-center my-4">Start the conversation.</p> : messages.map((message) => (
                  <div className={`chat-message ${message.senderId === profile.uid ? 'mine' : ''}`} key={message.id}>
                    <div>{message.text}</div>
                    <small>{message.senderId === profile.uid ? 'You' : message.senderName} · {formatDate(message.createdAt)}</small>
                  </div>
                ))}
              </div>
              {error && <p className="text-danger small mt-3 mb-0">{error}</p>}
              <form className="d-flex gap-2 mt-3" onSubmit={send}>
                <input className="form-control" value={text} maxLength="1000" onChange={(e) => setText(e.target.value)} placeholder="Write a message..." />
                <button className="btn btn-primary-cta" disabled={sending} type="submit">
                  {sending ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-send"></i>}
                  <span className="visually-hidden">Send</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
