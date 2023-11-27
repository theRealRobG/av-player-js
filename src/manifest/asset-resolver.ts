import Asset from './asset';

export default interface AssetResolver {
  resolve(): Promise<Asset>;
}
