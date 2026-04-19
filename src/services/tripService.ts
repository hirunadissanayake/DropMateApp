import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export const createTrip = async (token: string, data: any) => {
  try {
    const response = await axios.post(ENDPOINTS.TRIPS.CREATE, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getMyTrips = async (token: string) => {
  try {
    const response = await axios.get(ENDPOINTS.TRIPS.MY_TRIPS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getFromLocations = async (token: string) => {
  try {
    const response = await axios.get(ENDPOINTS.TRIPS.FROM_LOCATIONS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getToLocations = async (token: string, fromLocation: string) => {
  try {
    const response = await axios.get(ENDPOINTS.TRIPS.TO_LOCATIONS, {
      params: { fromLocation },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const cancelTrip = async (token: string, id: string) => {
  try {
    const response = await axios.put(ENDPOINTS.TRIPS.CANCEL(id), {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteTrip = async (token: string, id: string) => {
  try {
    const response = await axios.delete(ENDPOINTS.TRIPS.DELETE(id), {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getTripDetails = async (token: string, id: string) => {
  try {
    const response = await axios.get(ENDPOINTS.TRIPS.GET_DETAILS(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
export const getActiveTrips = async (token: string) => {
  try {
    const response = await axios.get(ENDPOINTS.TRIPS.ACTIVE, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
export const updateTripCapacity = async (token: string, id: string, capacityKg: number) => {
  try {
    const response = await axios.put(ENDPOINTS.TRIPS.UPDATE_CAPACITY(id), { capacityKg }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
