import instance from "./instance";
import { Http, Option } from "./interface";

type Handler<T> = {
  [p in keyof T]: (
    version?: string,
    option?: Omit<Option, "version">
  ) => Http;
};

function handler<T extends Record<string, string>>(obj: T, globalOption?: Option): Handler<T> {
  return Object.keys(obj).reduce<Handler<T>>((acc, cur) => {
    acc[cur as keyof T] = (
      version?: string,
      option?: Omit<Option, "version">
    ) => instance(obj[cur], { version, ...globalOption, ...option });
    return acc;
  }, {} as Handler<T>);
}

export { handler };
export * from "./interface";
