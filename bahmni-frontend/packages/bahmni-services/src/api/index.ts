import { AxiosResponse } from 'axios';
import client from './client';

export const get = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await client.get(url);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const post = async <T>(url: string, data: any): Promise<T> => {
  const response: AxiosResponse<T> = await client.post(url, data);
  return response.data;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const put = async <T>(url: string, data: any): Promise<T> => {
  const response: AxiosResponse<T> = await client.put(url, data);
  return response.data;
};

export const del = async <T>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await client.delete(url);
  return response.data;
};
