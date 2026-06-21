import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export const createTemplate = async (token: string, data: any) => {
  try {
    const response = await axios.post(ENDPOINTS.TRIP_TEMPLATES.CREATE, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getMyTemplates = async (token: string) => {
  try {
    const response = await axios.get(ENDPOINTS.TRIP_TEMPLATES.MY_TEMPLATES, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const updateTemplate = async (token: string, id: string, data: any) => {
  try {
    const response = await axios.put(ENDPOINTS.TRIP_TEMPLATES.UPDATE(id), data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteTemplate = async (token: string, id: string) => {
  try {
    const response = await axios.delete(ENDPOINTS.TRIP_TEMPLATES.DELETE(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
