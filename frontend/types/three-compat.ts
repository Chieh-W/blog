import 'three';

declare module 'three' {
  /**
   * Compatibility shim for Three.js type packages where WebGLRenderTargetOptions
   * is not exported. Keep this intentionally loose so WebGLTopology can compile
   * across minor @types/three naming differences.
   */
  export interface WebGLRenderTargetOptions {
    [key: string]: unknown;
  }
}

export {};
