import Config, {RequestInterface} from './config';
import DataTask, {DataTaskOptions, ResponseType} from './data-task';
import XhrDataTask from './xhr-data-task';

export default class Network {
  constructor(private config: Config) {}

  public dataTask<T extends keyof ResponseType>(
    options: DataTaskOptions<T>
  ): DataTask<T> {
    switch (this.config.preferredRequestInterface) {
      case RequestInterface.Fetch:
        throw new Error('Not impelemnted.');
      case RequestInterface.XMLHttpRequest:
        return new XhrDataTask(options);
    }
  }
}
