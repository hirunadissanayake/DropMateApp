import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export const requestMatch = async (token: string, data: { parcelId: string, tripId: string }) => {
  try {
    const response = await axios.post(ENDPOINTS.DELIVERY.MATCH_REQUEST, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getPendingMatches = async (token: string) => {
  try {
    const response = await axios.get(ENDPOINTS.DELIVERY.PENDING_MATCHES, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const acceptMatch = async (token: string, matchId: string) => {
  try {
    const response = await axios.patch(ENDPOINTS.DELIVERY.ACCEPT_MATCH(matchId), {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const rejectMatch = async (token: string, matchId: string) => {
  try {
    const response = await axios.patch(ENDPOINTS.DELIVERY.REJECT_MATCH(matchId), {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const rejectMatchWithReason = async (token: string, matchId: string, reason: string) => {
  try {
    const response = await axios.patch(ENDPOINTS.DELIVERY.REJECT_MATCH(matchId), { reason }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const cancelMatch = async (token: string, matchId: string) => {
  try {
    const response = await axios.patch(ENDPOINTS.DELIVERY.CANCEL_MATCH(matchId), {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const expireMatch = async (token: string, matchId: string) => {
  try {
    const response = await axios.patch(ENDPOINTS.DELIVERY.EXPIRE_MATCH(matchId), {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const initiatePickup = async (token: string, parcelId: string) => {
  try {
    const response = await axios.post(ENDPOINTS.DELIVERY.INITIATE_PICKUP, { parcelId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const verifyPickup = async (token: string, parcelId: string, code: string) => {
  try {
    const response = await axios.post(ENDPOINTS.DELIVERY.VERIFY_PICKUP, { parcelId, code }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const initiateDelivery = async (token: string, parcelId: string) => {
  try {
    const response = await axios.post(ENDPOINTS.DELIVERY.INITIATE_DELIVERY, { parcelId }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const verifyDelivery = async (token: string, parcelId: string, code: string) => {
  try {
    const response = await axios.post(ENDPOINTS.DELIVERY.VERIFY_DELIVERY, { parcelId, code }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
