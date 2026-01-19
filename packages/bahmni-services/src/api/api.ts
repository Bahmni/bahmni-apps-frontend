import { AxiosResponse } from 'axios';
import client from './client';

/**
 * HTTP GET request
 * @param url - The URL to send the GET request to
 * @returns Promise resolving to the response data
 */
export const get = async <T = unknown>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await client.get(url);
  return response.data;
};

/**
 * HTTP POST request
 * @param url - The URL to send the POST request to
 * @param data - The data to send in the request body
 * @returns Promise resolving to the response data
 */
export const post = async <T = unknown, D = unknown>(
  url: string,
  data: D,
): Promise<T> => {
  const response: AxiosResponse<T> = await client.post(url, data);
  return response.data;
};

/**
 * HTTP PUT request
 * @param url - The URL to send the PUT request to
 * @param data - The data to send in the request body
 * @returns Promise resolving to the response data
 */
export const put = async <T = unknown, D = unknown>(
  url: string,
  data: D,
): Promise<T> => {
  const response: AxiosResponse<T> = await client.put(url, data);
  return response.data;
};

/**
 * HTTP PATCH request
 * @param url - The URL to send the PATCH request to
 * @param data - The data to send in the request body
 * @returns Promise resolving to the response data
 */
export const patch = async <T = unknown, D = unknown>(
  url: string,
  data: D,
): Promise<T> => {
  const response: AxiosResponse<T> = await client.patch(url, data);
  return response.data;
};

/**
 * HTTP DELETE request
 * @param url - The URL to send the DELETE request to
 * @returns Promise resolving to the response data
 */
export const del = async <T = unknown>(url: string): Promise<T> => {
  const response: AxiosResponse<T> = await client.delete(url);
  return response.data;
};
