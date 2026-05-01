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
