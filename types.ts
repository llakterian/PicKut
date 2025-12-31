
export interface ImageVersion {
  id: string;
  url: string;
  prompt: string;
  timestamp: number;
}

export enum AppStatus {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  ERROR = 'ERROR'
}

export type AppMode = 'EDIT' | 'GENERATE';
export type Theme = 'matrix' | 'clean' | 'solar';

export type AspectRatio = "1:1" | "2:3" | "3:2" | "3:4" | "4:3" | "9:16" | "16:9" | "21:9";
export type ImageSize = "1K" | "2K" | "4K";

export interface EditRequest {
  imageUri: string;
  prompt: string;
  mimeType: string;
}

export interface GenerateRequest {
  prompt: string;
  aspectRatio: AspectRatio;
  imageSize: ImageSize;
}
