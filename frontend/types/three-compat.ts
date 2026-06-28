import 'three';

declare module 'three' {
  /**
   * Compatibility alias for Three.js type packages that expose RenderTargetOptions
   * instead of the older WebGLRenderTargetOptions name.
   */
  export interface WebGLRenderTargetOptions extends RenderTargetOptions {}
}

export {};
