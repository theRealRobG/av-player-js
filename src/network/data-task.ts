import HttpMethod from './http-method';

/**
 * Defines the possible response types for a `DataTask`.
 */
export interface ResponseType {
  arraybuffer: ArrayBuffer;
  blob: Blob;
  document: Document;
  json: {[key: string]: unknown};
  text: string;
}

export interface DataTaskOptions<T extends keyof ResponseType> {
  url: string;
  responseType: T;
  timeoutInterval?: number;
  httpMethod?: HttpMethod;
  httpBody?: string;
  headers?: {[key: string]: string};
}

/**
 * A task, like downloading a specific resource, performed in a URL session.
 */
export default interface DataTask<T extends keyof ResponseType> {
  /**
   * Sends the data associated with this task to the configured endpoint.
   *
   * @returns A promise that resolves once the network request has completed successfully, or
   * rejects when the request either errors, times out, or is aborted.
   */
  send(): Promise<ResponseType[T]>;
  /**
   * Abort any ongoing network request.
   */
  abort(): void;
}
