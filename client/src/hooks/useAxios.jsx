// hooks/useAxios.js
import { useState } from "react";
import axios from "axios";

// Pre-configured Axios instance
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_API, // your backend URL
  headers: {
    "Content-Type": "application/json",
  },
});

export const useAxios = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // fetch function for manual requests
  const fetch = (url, config = {}) => {
    setLoading(true);
    setError(null);

    return axiosInstance(url, config)
      .then((res) => {
        setLoading(false);
        return res.data;
      })
      .catch((err) => {
        setLoading(false);
        setError(err.response?.data || err.message);
        throw err; // rethrow to handle in .catch()
      });
  };

  return { fetch, loading, error };
};
