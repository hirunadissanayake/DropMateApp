import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export const createParcel = async (token: string, data: any) => {
  const formData = new FormData();

  // Append text fields
  formData.append('name', data.name);
  formData.append('fromLocation', data.fromLocation);
  formData.append('toLocation', data.toLocation);
  formData.append('weight', String(data.weight));
  formData.append('description', data.description || '');
  formData.append('receiverName', data.receiverName);
  formData.append('receiverPhone', data.receiverPhone);
  formData.append('deliveryMethod', data.deliveryMethod);
  formData.append('note', data.note || '');
  formData.append('paymentMethod', data.paymentMethod || 'ONLINE');

  // Append images
  if (data.images && data.images.length > 0) {
    data.images.forEach((image: any, index: number) => {
      formData.append('images', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: `parcel_image_${index}.jpg`,
      } as any);
    });
  }

  try {
    const response = await axios.post(ENDPOINTS.PARCELS.CREATE, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const getFromLocations = async (token: string) => {
  try {
    const response = await axios.get(ENDPOINTS.PARCELS.FROM_LOCATIONS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getToLocations = async (token: string, fromLocation: string) => {
  try {
    const response = await axios.get(ENDPOINTS.PARCELS.TO_LOCATIONS, {
      params: { fromLocation },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getPreviewPrice = async (token: string, fromLocation: string, toLocation: string, weight: number) => {
  try {
    const response = await axios.get(ENDPOINTS.PARCELS.PREVIEW_PRICE, {
      params: { fromLocation, toLocation, weight },
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getParcelDetails = async (token: string, id: string) => {
  try {
    const response = await axios.get(ENDPOINTS.PARCELS.GET_DETAILS(id), {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getMyParcels = async (token: string) => {
  try {
    const response = await axios.get(ENDPOINTS.PARCELS.MY_PARCELS, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const cancelParcel = async (token: string, id: string) => {
  try {
    const response = await axios.put(ENDPOINTS.PARCELS.CANCEL(id), {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const deleteParcel = async (token: string, id: string) => {
  try {
    const response = await axios.delete(ENDPOINTS.PARCELS.DELETE(id), {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getAllActiveParcels = async (token: string) => {
  try {
    const response = await axios.get(ENDPOINTS.PARCELS.ACTIVE, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const payParcel = async (token: string, id: string) => {
  try {
    const response = await axios.post(ENDPOINTS.PARCELS.PAY(id), {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
