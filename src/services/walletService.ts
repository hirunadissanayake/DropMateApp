import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export interface WalletSummary {
  walletBalance: number;
  totalEarned: number;
  pendingWithdrawals: number;
  thisMonthEarned: number;
}

export interface WalletTransaction {
  id: string;
  type: 'DELIVERY_EARNED' | 'WITHDRAWAL';
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  description: string | null;
  parcelId: string | null;
  createdAt: string;
}

export const getWalletSummary = async (token: string): Promise<WalletSummary> => {
  try {
    const response = await axios.get(ENDPOINTS.WALLET.SUMMARY, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getTransactionHistory = async (token: string): Promise<WalletTransaction[]> => {
  try {
    const response = await axios.get(ENDPOINTS.WALLET.TRANSACTIONS, {
      headers: { Authorization: `Bearer ${token}` },
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
