import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import PageLoader from '../components/PageLoader';
import EmptyState from '../components/EmptyState';
import { verifyPayment } from '../services/payments';

export default function PaymentVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!reference) {
      setError('No transaction reference found in URL.');
      setLoading(false);
      return;
    }

    verifyPayment(reference)
      .then((res) => {
        if (res.success) {
          setSuccess(true);
        } else {
          setError(res.reason || 'Payment was not successful. Please try again.');
        }
      })
      .catch((err) => {
        setError(err.message || 'Failed to verify transaction.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [reference]);

  return (
    <>
      <PageHeader
        tag="Payment Verification"
        title="Verifying your payment"
        text="Please wait while we confirm your transaction with Paystack."
      />

      <section className="dashboard-section">
        <div className="container" style={{ maxWidth: 600 }}>
          {loading ? (
            <div className="text-center py-5">
              <PageLoader />
              <p className="mt-3 text-muted">Confirming transaction with Paystack...</p>
            </div>
          ) : success ? (
            <div className="dashboard-panel text-center py-5">
              <div style={{ fontSize: '3.5rem', color: '#10B981' }} className="mb-3">
                <i className="bi bi-check-circle-fill"></i>
              </div>
              <h2 className="mb-2">Payment Confirmed!</h2>
              <p className="text-muted mb-4">
                Your lesson booking has been marked as paid. You and your tutor can now coordinate and start your sessions.
              </p>
              <div className="d-flex justify-content-center gap-3">
                <Link to="/learner/dashboard" className="btn btn-primary-cta">
                  <i className="bi bi-speedometer2"></i> Go to Dashboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="dashboard-panel text-center py-5">
              <div style={{ fontSize: '3.5rem', color: '#EF4444' }} className="mb-3">
                <i className="bi bi-x-circle-fill"></i>
              </div>
              <h2 className="mb-2">Payment Verification Failed</h2>
              <p className="text-muted mb-4">{error}</p>
              <div className="d-flex justify-content-center gap-3">
                <Link to="/learner/dashboard" className="btn btn-primary-cta">
                  Return to Dashboard
                </Link>
                <Link to="/contact" className="btn btn-secondary-cta">
                  Contact Support
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
