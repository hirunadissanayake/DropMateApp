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
  },
};