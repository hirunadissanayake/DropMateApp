import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export const requestOtp = async (data: any) => {
  const formData = new FormData();

  // Append text fields
  formData.append('phone', data.phone);
  formData.append('nicNumber', data.nicNumber);
  formData.append('permanentAddress', data.permanentAddress);
  formData.append('name', data.fullName);
  formData.append('email', data.email);
  formData.append('password', data.password);
  formData.append('confirmPassword', data.confirmPassword);
  formData.append('roleRequested', data.roleRequested);
  formData.append('termsAccepted', String(data.termsAccepted));

  if (data.roleRequested === 'TRAVELER') {
    formData.append('weightCapacity', data.weightCapacity);
    formData.append('vehicleType', data.vehicleType);
  }

  // Append files
  if (data.selfie) {
    formData.append('selfie', {
      uri: data.selfie.uri,
      type: data.selfie.type || 'image/jpeg',
      name: 'selfie.jpg',
    } as any);
  }

  if (data.nicFront) {
    formData.append('nicFront', {
      uri: data.nicFront.uri,
      type: data.nicFront.type || 'image/jpeg',
      name: 'nicFront.jpg',
    } as any);
  }

  if (data.nicBack) {
    formData.append('nicBack', {
      uri: data.nicBack.uri,
      type: data.nicBack.type || 'image/jpeg',
      name: 'nicBack.jpg',
    } as any);
  }

  try {
    const response = await axios.post(ENDPOINTS.AUTH.REQUEST_OTP, formData, {
      headers: {
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

export const verifyOtp = async (phone: string, otp: string) => {
  try {
    const response = await axios.post(ENDPOINTS.AUTH.VERIFY_OTP, {
      phone,
      code: otp,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const login = async (data: { email: string; password: string }) => {
  try {
    const response = await axios.post(ENDPOINTS.AUTH.LOGIN, data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const forgotPassword = async (phone: string) => {
  try {
    const response = await axios.post(ENDPOINTS.AUTH.FORGOT_PASSWORD, { phone });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const verifyResetOtp = async (phone: string, otp: string) => {
  try {
    const response = await axios.post(ENDPOINTS.AUTH.VERIFY_RESET_OTP, {
      phone,
      code: otp,
    });
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const resetPassword = async (data: { resetToken: string; password: string; confirmPassword: string }) => {
  try {
    const response = await axios.post(ENDPOINTS.AUTH.RESET_PASSWORD, data);
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};

export const getMe = async (token: string) => {
  try {
    const response = await axios.get(ENDPOINTS.AUTH.GET_ME, {
      headers: {
        Authorization: `Bearer ${token}`,
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
export const updateProfile = async (token: string, data: any) => {
  try {
    const response = await axios.put(ENDPOINTS.AUTH.UPDATE_PROFILE, data, {
      headers: {
        Authorization: `Bearer ${token}`,
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
export const changePassword = async (token: string, data: any) => {
  try {
    const response = await axios.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, data, {
      headers: {
        Authorization: `Bearer ${token}`,
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
export const requestNewRole = async (token: string, data: any) => {
  const formData = new FormData();

  // Append text fields
  formData.append('role', data.role);
  if (data.weightCapacity) formData.append('weightCapacity', data.weightCapacity);
  if (data.vehicleType) formData.append('vehicleType', data.vehicleType);

  // Append files
  if (data.selfie) {
    formData.append('selfie', {
      uri: data.selfie.uri,
      type: data.selfie.type || 'image/jpeg',
      name: 'selfie.jpg',
    } as any);
  }

  if (data.nicFront) {
    formData.append('nicFront', {
      uri: data.nicFront.uri,
      type: data.nicFront.type || 'image/jpeg',
      name: 'nicFront.jpg',
    } as any);
  }

  if (data.nicBack) {
    formData.append('nicBack', {
      uri: data.nicBack.uri,
      type: data.nicBack.type || 'image/jpeg',
      name: 'nicBack.jpg',
    } as any);
  }

  try {
    const response = await axios.post(ENDPOINTS.AUTH.REQUEST_NEW_ROLE, formData, {
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

export const switchRole = async (token: string, role: 'CUSTOMER' | 'TRAVELER') => {
  try {
    const response = await axios.post(
      ENDPOINTS.AUTH.SWITCH_ROLE,
      { role },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error: any) {
    if (error.response) {
      throw error.response.data;
    }
    throw error;
  }
};
