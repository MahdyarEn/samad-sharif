import axios from "axios";

const BASE_URL = "https://setad.dining.sharif.edu";

const app = axios.create({
  baseURL: BASE_URL,
});

app.interceptors.request.use(
  (res) => res,
  (err) => Promise.reject(err)
);

const api = {
  get: app.get,
  post: app.post,
};
export default api;
