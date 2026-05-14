import axios from 'axios';
import { ENDPOINTS } from '../utils/endPoints';

export interface CreateReviewData {
  rating: number;
  comment?: string;
  parcelId: string;
  revieweeId: string;
}

export const createReview = async (token: string, data: CreateReviewData) => {
  try {
    const response = await axios.post(ENDPOINTS.REVIEWS.CREATE, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};

export const getUserReviews = async (userId: string) => {
  try {
    const response = await axios.get(ENDPOINTS.REVIEWS.GET_USER_REVIEWS(userId));
    return response.data;
  } catch (error: any) {
    throw error.response?.data || error;
  }
};
