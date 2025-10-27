declare module "mic-recorder-to-mp3" {
  type Mp3Chunk = BlobPart;

  export interface MicRecorderOptions {
    bitRate?: number;
  }

  export default class MicRecorder {
    constructor(options?: MicRecorderOptions);
    start(): Promise<void>;
    stop(): { getMp3: () => Promise<[Mp3Chunk[], Blob]> };
  }
}
