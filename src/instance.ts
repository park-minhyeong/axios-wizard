import axios, { AxiosRequestConfig } from "axios";
import { Http, Option } from "./interface";
import { axiosRequestConfig, createAxiosDefaults } from "./config";
import { setupInterceptors } from "./interceptor";

function instance(baseUrl: string, option?: Option): Http {
  const axiosInstance = axios.create(
    createAxiosDefaults({
      baseUrl,
      option,
    })
  );
  if (option?.interceptor) {
    setupInterceptors(axiosInstance, option.interceptor);
  }
  return {
    get: <RES>(url: string, config?: AxiosRequestConfig) =>
      axiosInstance.get<RES>(url, { ...axiosRequestConfig, ...config }),
    post: <REQ, RES>(url: string, data?: REQ, config?: AxiosRequestConfig) =>
      axiosInstance.post<RES>(url, data, { ...axiosRequestConfig, ...config }),
    put: <REQ, RES>(url: string, data?: REQ, config?: AxiosRequestConfig) =>
      axiosInstance.put<RES>(url, data, { ...axiosRequestConfig, ...config }),
    patch: <REQ, RES>(url: string, data?: REQ, config?: AxiosRequestConfig) =>
      axiosInstance.patch<RES>(url, data, { ...axiosRequestConfig, ...config }),
    delete: <RES>(url: string, data?: object) =>
      axiosInstance.delete<RES>(url, { ...data, ...axiosRequestConfig }),
    getInstance: () => axiosInstance
  };
}

export default instance;
