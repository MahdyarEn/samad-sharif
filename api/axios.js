import axios from "axios";

const BASE_URL = "https://setad.dining.sharif.edu";

const app = axios.create({
  baseURL: BASE_URL,
  validateStatus: (status) => status < 500,
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
  },
});

const api = {
  get: app.get,
  post: app.post,
  put: app.put,
};
export default api;
