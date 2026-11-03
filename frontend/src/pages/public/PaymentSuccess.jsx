import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const bookingReference = searchParams.get('booking_reference') || searchParams.get('booking_id');

  useEffect(() => {
    let active = true;
    const goToBookings = (result) => {
      if (!active) return;
      const status = result === 'success' ? 'success' : result === 'pending' ? 'pending' : 'error';
      navigate(`/profile?view=history&booking_status=${status}`, { replace: true });
    };

    if (!bookingReference) {
      goToBookings('error');
      return () => { active = false; };
    }

    api('/payments/xendit/finalize', {
      method: 'POST',
      body: JSON.stringify({ booking_reference: bookingReference }),
    }).then((result) => goToBookings(result.finalized ? 'success' : 'pending'))
      .catch(() => goToBookings('error'));

    return () => { active = false; };
  }, [bookingReference, navigate]);

  return null;
};

export default PaymentSuccess;
