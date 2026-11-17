import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import { useAuth } from '../context/AuthContext';
import { getMyChats } from '../services/chats';
import { formatDate } from '../lib/format';

export default function Chats() {
  const { profile } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getMyChats()
      .then((res) => setChats(res.chats))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const otherPerson = (chat) => profile.role === 'learner' ? chat.tutorName : chat.learnerName;

  return (
    <>
      <PageHeader tag="Messages" title="Your lesson chats" text="Chats become available after a lesson payment is confirmed." />
      <section className="dashboard-section">
        <div className="container" style={{ maxWidth: 820 }}>
          {loading ? <PageLoader /> : error ? (
            <EmptyState icon="bi-wifi-off" title="Couldn't load your chats" text={error} />
          ) : chats.length === 0 ? (
            <EmptyState icon="bi-chat-dots" title="No chats yet" text="Pay for an accepted lesson request to start a private chat with your tutor or learner." />
          ) : (
            <div className="dashboard-panel">
              {chats.map((chat) => (
                <Link className="request-row text-decoration-none" to={`/chats/${chat.id}`} key={chat.id}>
                  <div className="request-row-main">
                    <div className="d-flex align-items-center gap-2 mb-1">
                      <strong>{otherPerson(chat)}</strong>
                      <span className="request-subject">{chat.subject}</span>
                      <span className="badge bg-light text-dark border text-capitalize">{chat.lessonType}</span>
                    </div>
                    <p>{chat.lastMessage || (chat.lessonType === 'online' ? 'Agree on a date and time for your online lesson.' : 'Use this private chat to coordinate your lesson.')}</p>
                    <span className="request-date">{formatDate(chat.lastMessageAt || chat.createdAt)}</span>
                  </div>
                  <i className="bi bi-chevron-right text-muted"></i>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
