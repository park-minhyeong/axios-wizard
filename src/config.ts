import { CreateAxiosDefaults, AxiosRequestConfig } from "axios";
import { Option, } from "./interface";

interface CreateAxiosDefaultsProps {
  baseUrl: string;
  option?: Option;
}

const createAxiosDefaults = ({
  baseUrl = "/api",
  option,
}: Partial<CreateAxiosDefaultsProps>): CreateAxiosDefaults => {
  const {
    version,
    contentType = "application/json",
    charset,
    accept,
  } = option ?? {};
  return {
    baseURL:
      typeof version !== "undefined" ? [baseUrl, version].join("/") : baseUrl,
    headers: {
      "Content-type": [contentType, charset && `; charset=${charset}`].join(""),
      Accept: accept,
    },
    validateStatus: (status) => status < 400,
  };
};

const axiosRequestConfig: AxiosRequestConfig = {
  withCredentials: true,
};

export { createAxiosDefaults, axiosRequestConfig };
