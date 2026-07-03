import axios from 'axios';

// const BASE_URL = 'http://localhost:5000';
const BASE_URL = 'https://quiz-ten-delta-13.vercel.app';

export default axios.create({
  baseURL: BASE_URL
});

export const axiosPrivate = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
});
