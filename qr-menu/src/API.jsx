import axios from "axios";

const hostname = window.location.hostname;

const API_BASE_URL =
  hostname === "localhost" || hostname === "127.0.0.1"
    ? "http://localhost:8000/api/"
    : `http://${hostname}:8000/api/`;

// 🔐 axios instance oluştur
const API = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// 🟢 Request interceptor → Token ekle
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 🔄 Response interceptor → Token yenileme işlemi
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Eğer 401 hatası alındıysa (token süresi dolmuş)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refresh");
        if (!refreshToken) throw new Error("No refresh token");

        // refresh endpoint'ini otomatik belirle
        const refreshURL =
          hostname === "localhost" || hostname === "127.0.0.1"
            ? "http://localhost:8000/api/token/refresh/"
            : `http://${hostname}:8000/api/token/refresh/`;

        const response = await axios.post(refreshURL, {
          refresh: refreshToken,
        });

        localStorage.setItem("access", response.data.access);

        // Yeni token ile isteği tekrar et
        originalRequest.headers[
          "Authorization"
        ] = `Bearer ${response.data.access}`;

        return API(originalRequest);
      } catch (err) {
        console.error("Token refresh failed:", err);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

export default API;
export { API_BASE_URL };
