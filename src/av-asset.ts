import Asset from './manifest/asset';
import AssetResolver from './manifest/asset-resolver';

/**
 * This is very much placeholder status for now.
 *
 * I'm still not clear if a class for `AVAsset` is strictly necessary, or whether we can just accept
 * an `AssetLoader` implementation. I believe that `AVAsset` can be a place where add some extra
 * public methods that can help with asset inspection. For example, we can add async methods for
 * inspecting properties such as duration, available tracks, pre-fetching content.
 */
export default class AVAsset implements AssetResolver {
  constructor(private assetResolver: AssetResolver) {}

  resolve(): Promise<Asset> {
    return this.assetResolver.resolve();
  }
}
