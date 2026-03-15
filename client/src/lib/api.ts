import axios from "axios";

export const API_BASE_URL = "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // IMPORTANT for cookie auth
});
