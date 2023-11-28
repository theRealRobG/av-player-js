import {Asset, AssetResolver} from 'av-player';
import EnglishAudioRendition from './rendition-audio-english';
import ItalianAudioRendition from './rendition-audio-italian';
import VideoHighRendition from './rendition-video-high';

// Asset information taken from Unified Streaming demo:
// https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel-multi-lang.ism/.m3u8

/**
 * This `AssetResolver` is for demo purposes only.
 *
 * It hard-codes the resolution of a Unified Streaming demo asset (Tears of Steel). Right now I
 * don't want to concentrate on parsing manifests, as I don't think that will lead to any dramatic
 * changes in architecture, and having things hard-coded are good enough to prove out some points.
 * Later on I'll also hard-code some discontinuities to provide some testing material for ensuring
 * continuous playback across discontinuity boundaries.
 */
export default class DemoAssetResolver implements AssetResolver {
  resolve(): Promise<Asset> {
    return Promise.resolve({
      audioRenditions: [
        new EnglishAudioRendition(),
        new ItalianAudioRendition(),
      ],
      videoRenditions: [new VideoHighRendition()],
    });
  }
}
