type DataType =
  | "application/json"
  | "application/x-www-form-urlencoded"
  | "multipart/form-data"
  | "text/html";

interface Options {
  version?: string;
  contentType?: DataType;
  accept?: DataType;
  charset?: string;
}

export type { Options, DataType };
