// src/api/login.js
import axios from 'axios';

const { VITE_SERVER_URL } = import.meta.env;

export const login = async () => {
  try {
    const response = await axios.post(`${VITE_SERVER_URL}/login`);
    if (response.data.success) {
      return {
        data: response.data.data,
        success: true,
        status: response.status
      };
    } else {
      return {
        data: null,
        success: false,
        error: response.data.error || 'Failed to get QR'
      };
    }
  } catch (error) {
    return {
      data: null,
      success: false,
      error: error?.message || 'Failed to get QR'
    };
  }
};
