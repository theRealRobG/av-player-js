import EventEmitter from '../utils/event-emitter';
import DataTask, {DataTaskOptions, ResponseType} from './data-task';
import HttpMethod from './http-method';

interface ResponseDetails {
  responseUrl: string;
  statusCode: number;
  headers: {[key: string]: string};
}

interface EventMap {
  metrics: CompletedDataTaskMetrics;
  response: ResponseDetails;
}

/**
 * Details about the completed data task.
 */
export interface CompletedDataTaskMetrics {
  /**
   * The time that the request started sending (realative to `Performance.timeOrigin`).
   */
  requestStartTimeInMilliseconds: number;
  /**
   * The number of bytes downloaded by the request.
   */
  bytesDownloaded: number;
  /**
   * The time taken to fully complete the request.
   */
  timeTakenInMilliSeconds: number;
}

/**
 * The reason why the `XhrDataTask` promise was rejected.
 */
export enum RejectReason {
  /** There was an error in the response */
  Error,
  /** The request was aborted */
  Abort,
}

export interface Rejection {
  reason: RejectReason;
  error: Error | undefined;
}

export default class XhrDataTask<T extends keyof ResponseType>
  extends EventEmitter<EventMap>
  implements DataTask<keyof ResponseType>
{
  private xhrPromise: Promise<ResponseType[T]>;
  private xhr = new XMLHttpRequest();
  private httpBody?: XMLHttpRequestBodyInit;
  private requestStartTime: number | undefined;
  private didSendRequest = false;

  constructor(options: DataTaskOptions<T>) {
    super({metrics: new Set(), response: new Set()});

    const {url, responseType} = options;
    const timeoutInterval = options.timeoutInterval ?? 0;
    const httpMethod = options.httpMethod ?? HttpMethod.Get;
    const httpBody = options.httpBody;
    const headers = options.headers ?? {};

    this.httpBody = httpBody;
    this.xhr.responseType = responseType;
    this.xhr.timeout = timeoutInterval;

    this.xhrPromise = new Promise((resolve, reject) => {
      this.xhr.onloadstart = () => {
        this.requestStartTime = performance.now();
      };

      this.xhr.onabort = () => {
        reject({reason: RejectReason.Abort} as Rejection);
      };

      this.xhr.onerror = () => {
        const responseEvent = this.getResponseEvent();
        if (responseEvent) {
          this.notifyEvent('response', responseEvent);
        }
        const rejection: Rejection = {
          reason: RejectReason.Error,
          error: new Error(
            `Request failed with status code ${responseEvent?.statusCode}`
          ),
        };
        reject(rejection);
      };

      this.xhr.ontimeout = () => {
        const rejection: Rejection = {
          reason: RejectReason.Error,
          error: new Error('Request failed due to timeout'),
        };
        reject(rejection);
      };

      this.xhr.onload = event => {
        const metricsEvent = this.getMetricsEvent(event);
        if (metricsEvent) {
          this.notifyEvent('metrics', metricsEvent);
        }
        const responseEvent = this.getResponseEvent();
        if (responseEvent) {
          this.notifyEvent('response', responseEvent);
        }
        resolve(this.xhr.response);
      };
    });

    this.xhr.open(httpMethod, url);
    this.addAllRequestHeaders(headers);
  }

  public async send(): Promise<ResponseType[T]> {
    if (!this.didSendRequest) {
      this.xhr.send(this.httpBody);
      this.didSendRequest = true;
    }
    return this.xhrPromise;
  }

  public abort(): void {
    this.xhr.abort();
  }

  private addAllRequestHeaders(headers: {[key: string]: string}) {
    const keys = Object.keys(headers);
    for (let i = 0; i < keys.length; i++) {
      this.xhr.setRequestHeader(keys[i], headers[keys[i]]);
    }
  }

  // Taken from:
  // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/getAllResponseHeaders
  private allResponseHeaders(): {[key: string]: string} {
    // Get the raw header string
    const headers = this.xhr.getAllResponseHeaders();

    // Convert the header string into an array
    // of individual headers
    const arr = headers.trim().split(/[\r\n]+/);

    // Create a map of header names to values
    const headerMap: {[key: string]: string} = {};
    for (let i = 0; i < arr.length; i++) {
      const line = arr[i];
      const parts = line.split(': ');
      const header = parts.shift();
      if (!header) continue;
      const value = parts.join(': ');
      headerMap[header] = value;
    }

    return headerMap;
  }

  private getResponseEvent(): ResponseDetails | undefined {
    const statusCode = this.xhr.status;
    if (statusCode > 0) {
      const responseUrl = this.xhr.responseURL;
      const headers = this.allResponseHeaders();
      return {statusCode, responseUrl, headers};
    }
  }

  private getMetricsEvent(
    event: ProgressEvent<EventTarget>
  ): CompletedDataTaskMetrics | undefined {
    const requestStartTime = this.requestStartTime;
    if (requestStartTime) {
      const requestEndTime = performance.now();
      const timeTaken = requestEndTime - requestStartTime;
      return {
        requestStartTimeInMilliseconds: requestStartTime,
        bytesDownloaded: event.total,
        timeTakenInMilliSeconds: timeTaken,
      };
    }
  }
}
