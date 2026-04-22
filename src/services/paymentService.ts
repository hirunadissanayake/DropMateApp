import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

// ─────────────────────────────────────────────────────────────────────────────
// generatePaymentHash
// Called before opening the PayHere SDK.
// Returns the hash, merchant_id, order_id, amount, currency, and sandbox flag.
// ─────────────────────────────────────────────────────────────────────────────
export const generatePaymentHash = async (token: string, parcelId: string) => {
  try {
    const response = await axios.post(
      ENDPOINTS.PAYMENT.GENERATE_HASH,
      { parcel_id: parcelId },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data as {
      hash: string;
      merchant_id: string;
      order_id: string;
      amount: string;
      currency: string;
      sandbox: boolean;
    };
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// getPaymentStatus
// Called after the user returns from the PayHere SDK to verify the payment
// was confirmed via the webhook on the backend.
// ─────────────────────────────────────────────────────────────────────────────
export const getPaymentStatus = async (token: string, parcelId: string) => {
  try {
    const response = await axios.get(ENDPOINTS.PAYMENT.STATUS(parcelId), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data as {
      parcelId: string;
      paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
      amount: number;
    };
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
