export enum RequestInterface {
  Fetch,
  XMLHttpRequest,
}

export default interface Config {
  preferredRequestInterface: RequestInterface;
}
