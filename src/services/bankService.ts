import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export interface BankDetail {
  id: string;
  userId: string;
  bankName: string;
  accountNumber: string;
  accountHolderName: string;
  branchName?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getBankDetails = async (token: string): Promise<BankDetail[]> => {
  try {
    const response = await axios.get(ENDPOINTS.BANK.DETAILS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const addBankDetail = async (token: string, data: Partial<BankDetail>): Promise<BankDetail> => {
  try {
    const response = await axios.post(ENDPOINTS.BANK.DETAILS, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateBankDetail = async (token: string, id: string, data: Partial<BankDetail>): Promise<BankDetail> => {
  try {
    const response = await axios.put(ENDPOINTS.BANK.DETAIL(id), data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteBankDetail = async (token: string, id: string): Promise<void> => {
  try {
    await axios.delete(ENDPOINTS.BANK.DETAIL(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
