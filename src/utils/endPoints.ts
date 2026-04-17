export const BASE_URL = "https://drop-mate.onrender.com";

export const ENDPOINTS = {
  AUTH: {
    REQUEST_OTP: `${BASE_URL}/api/auth/request-otp`,
    VERIFY_OTP: `${BASE_URL}/api/auth/verify-otp`,
    LOGIN: `${BASE_URL}/api/auth/login`,
    FORGOT_PASSWORD: `${BASE_URL}/api/auth/forgot-password`,
    VERIFY_RESET_OTP: `${BASE_URL}/api/auth/verify-reset-otp`,
    RESET_PASSWORD: `${BASE_URL}/api/auth/reset-password`,
    GET_ME: `${BASE_URL}/api/auth/me`,
    UPDATE_PROFILE: `${BASE_URL}/api/auth/update-profile`,
    CHANGE_PASSWORD: `${BASE_URL}/api/auth/change-password`,
    REQUEST_NEW_ROLE: `${BASE_URL}/api/auth/request-new-role`,
    SWITCH_ROLE: `${BASE_URL}/api/auth/switch-role`,
  },
  PARCELS: {
    CREATE: `${BASE_URL}/api/parcels/create`,
    FROM_LOCATIONS: `${BASE_URL}/api/parcels/from-locations`,
    TO_LOCATIONS: `${BASE_URL}/api/parcels/to-locations`,
    PREVIEW_PRICE: `${BASE_URL}/api/parcels/preview-price`,
  },
};