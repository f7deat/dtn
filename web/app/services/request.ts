import axios from "axios";

const request = axios.create();

request.interceptors.request.use(
  (config) => {
    // You can modify the request config here if needed
    config.baseURL = 'https://api.dtn.dhhp.edu.vn';
    return config;
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

export default request;