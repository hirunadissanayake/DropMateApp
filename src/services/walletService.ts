import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export interface WalletSummary {
  walletBalance: number;
  todayEarned: number;
  todayCashCollection: number;
  totalEarned: number;
  cashEarned: number;
  periodEarned: number;
  periodCashEarnings: number;
  periodOnlineEarnings: number;
  pendingWithdrawals: number;
  totalWithdrawn: number;
}

export interface WalletTransaction {
  id: string;
  type: 'DELIVERY_EARNED' | 'WITHDRAWAL' | 'PLATFORM_FEE_DEDUCTION';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string | null;
  parcelId: string | null;
  createdAt: string;
  parcel?: {
    price: number | null;
    platformFee: number | null;
    travelerPayout: number | null;
    paymentMethod: 'ONLINE' | 'CASH_ON_PICKUP' | 'CASH_ON_DELIVERY' | null;
  } | null;
}

export const getWalletSummary = async (token: string, filters?: { startDate?: string; endDate?: string }): Promise<WalletSummary> => {
  try {
    const response = await axios.get(ENDPOINTS.WALLET.SUMMARY, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export interface WalletTransactionResponse {
  transactions: WalletTransaction[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export const getTransactionHistory = async (token: string, filters?: { startDate?: string; endDate?: string; page?: number; limit?: number }): Promise<WalletTransactionResponse> => {
  try {
    const response = await axios.get(ENDPOINTS.WALLET.TRANSACTIONS, {
      headers: { Authorization: `Bearer ${token}` },
      params: filters,
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const requestWithdrawal = async (
  token: string,
  payload: {
    amount: number;
    bankDetailId?: string;
    bankName?: string;
    accountNumber?: string;
    accountHolderName?: string;
  }
): Promise<{ message: string }> => {
  try {
    const response = await axios.post(ENDPOINTS.WALLET.WITHDRAW, payload, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const requestTopUp = async (
  token: string,
  payload: {
    amount: number;
    slipUri: string;
  }
): Promise<{ message: string }> => {
  try {
    const formData = new FormData();
    formData.append('amount', payload.amount.toString());
    
    // Append the file
    const filename = payload.slipUri.split('/').pop() || 'slip.jpg';
    const type = filename.endsWith('.png') ? 'image/png' : 'image/jpeg';
    
    formData.append('slip', {
      uri: payload.slipUri,
      name: filename,
      type: type,
    } as any);

    const response = await axios.post(ENDPOINTS.WALLET.TOP_UP, formData, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
