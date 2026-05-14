import axios from 'axios';
import { Linking } from 'react-native';
import { ENDPOINTS } from '../utils/endPoints';

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  description?: string;
  link?: string;
  screen: 'TRAVELER' | 'CUSTOMER' | 'BOTH';
  isActive: boolean;
  bgColors?: string[]; // For UI compatibility if needed
}

export const getBanners = async (screen?: 'TRAVELER' | 'CUSTOMER' | 'BOTH'): Promise<Banner[]> => {
  try {
    const response = await axios.get(ENDPOINTS.BANNERS.GET(screen));
    return response.data;
  } catch (error) {
    console.error('Error fetching banners:', error);
    return [];
  }
};

export const openLink = async (url: string) => {
  console.log('Attempting to open link:', url);
  if (!url) return;
  
  let formattedUrl = url.trim();
  if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
    formattedUrl = `https://${formattedUrl}`;
  }
  
  console.log('Formatted URL:', formattedUrl);

  try {
    // For standard web links, we can usually try to open them directly 
    // because Linking.canOpenURL is sometimes unreliable on newer Android versions
    if (formattedUrl.startsWith('http')) {
      await Linking.openURL(formattedUrl);
      return;
    }

    const supported = await Linking.canOpenURL(formattedUrl);
    if (supported) {
      await Linking.openURL(formattedUrl);
    } else {
      console.warn(`Don't know how to open URI: ${formattedUrl}`);
    }
  } catch (error) {
    console.error('Error opening link:', error);
  }
};
