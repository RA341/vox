import {ApiApi, Configuration} from "../openapi";

export const API_URL = import.meta.env.MODE === 'development'
    ? "http://localhost:8000"
    : window.location.origin;

console.log(`API url: ${API_URL} `)
const api = new ApiApi(new Configuration({basePath: API_URL, credentials: "include"}))

export default api