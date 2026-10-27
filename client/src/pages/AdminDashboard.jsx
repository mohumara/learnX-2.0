import { useCallback, useEffect, useState } from 'react';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import StatCard from '../components/StatCard';
import StatusPill from '../components/StatusPill';
import { useToast } from '../context/ToastContext';
import { deleteUser, getAllTutors, getStats, getUsers, setTutorStatus } from '../services/admin';
import { capitalize, formatCurrency, formatDate } from '../lib/format';

export default function AdminDashboard() {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      const [stats, tutors, users] = await Promise.all([getStats(), getAllTutors(), getUsers()]);
      setData({ stats, tutors: tutors.tutors, users: users.users });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const review = async (id, status) => {
    try {
      await setTutorStatus(id, status);
      toast[status === 'approved' ? 'success' : 'info'](`Tutor ${status}.`);
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const remove = async (uid, label) => {
    if (!window.confirm(`Delete ${label}? This removes their account and cannot be undone.`)) return;
    try {
      await deleteUser(uid);
      toast.info('Account deleted.');
      load();
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (error) return <div className="container" style={{ paddingTop: 130 }}><EmptyState icon="bi-wifi-off" title="Couldn't load the dashboard" text={error} /></div>;
  if (!data) return <div style={{ paddingTop: 100 }}><PageLoader /></div>;

  const { stats, tutors, users } = data;
  const pending = tutors.filter((t) => t.status === 'pending');

  return (
    <>
      <PageHeader tag="Admin Dashboard" title="Platform overview" text="Review tutor applications and manage every account on LearnX." />

      <section className="dashboard-section">
        <div className="container">
          <div className="row g-4 mb-4">
            <div className="col-6 col-lg-3"><StatCard icon="bi-people-fill" color="blue" value={stats.totalUsers} label="Total Users" /></div>
            <div className="col-6 col-lg-3"><StatCard icon="bi-person-workspace" color="green" value={stats.totalTutors} label="Total Tutors" /></div>
            <div className="col-6 col-lg-3"><StatCard icon="bi-hourglass-split" color="amber" value={stats.pendingTutors} label="Pending Approvals" /></div>
            <div className="col-6 col-lg-3"><StatCard icon="bi-send-fill" color="blue" value={stats.totalRequests} label="Lesson Requests" /></div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-header"><h2><i className="bi bi-person-check"></i> Pending Tutor Approvals</h2></div>
            {pending.length === 0 ? (
              <EmptyState icon="bi-check2-circle" title="No pending approvals" text="New tutor sign-ups will appear here for review." />
            ) : (
              pending.map((t) => (
                <div className="request-row" key={t.id}>
                  <div className="request-row-main">
                    <strong>{t.name}</strong>
                    <span className="request-subject">{[...t.subjects, ...t.skills].join(', ') || 'No subjects set yet'}</span>
                    <p>{t.bio || 'No bio provided yet.'}</p>
                  </div>
                  <div className="request-actions">
                    <button type="button" className="btn accept-btn" onClick={() => review(t.id, 'approved')}><i className="bi bi-check-lg"></i> Approve</button>
                    <button type="button" className="btn decline-btn" onClick={() => review(t.id, 'rejected')}><i className="bi bi-x-lg"></i> Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-header"><h2><i className="bi bi-person-workspace"></i> All Tutors</h2></div>
            <div className="table-responsive-wrap">
              <table className="app-table">
                <thead><tr><th>Name</th><th>Subjects/Skills</th><th>Rate</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {tutors.map((t) => (
                    <tr key={t.id}>
                      <td><Avatar name={t.name} size="sm" /> {t.name}</td>
                      <td>{[...t.subjects, ...t.skills].slice(0, 2).join(', ') || 'None yet'}</td>
                      <td>{t.hourlyRate ? formatCurrency(t.hourlyRate) : 'Not set'}</td>
                      <td><StatusPill status={t.status} /></td>
                      <td>
                        <button type="button" className="table-action-btn" aria-label={`Delete ${t.name}`} onClick={() => remove(t.id, t.name)}>
                          <i className="bi bi-trash3"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="dashboard-panel">
            <div className="dashboard-panel-header"><h2><i className="bi bi-people"></i> All Users</h2></div>
            <div className="table-responsive-wrap">
              <table className="app-table">
                <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th></th></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.uid}>
                      <td><Avatar name={u.name} size="sm" /> {u.name}</td>
                      <td>{u.email}</td>
                      <td><span className={`role-pill role-${u.role}`}>{capitalize(u.role)}</span></td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        {u.role !== 'admin' ? (
                          <button type="button" className="table-action-btn" aria-label={`Delete ${u.name}`} onClick={() => remove(u.uid, u.name)}>
                            <i className="bi bi-trash3"></i>
                          </button>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
