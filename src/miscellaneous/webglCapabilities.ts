/**
 * Checks real OffscreenCanvas support as a texture source
 */
function checkOffscreenCanvasSupportInternal(): boolean {
  if (typeof OffscreenCanvas === "undefined") {
    return false;
  }

  const testCanvasElement = document.createElement("canvas");
  testCanvasElement.width = 4;
  testCanvasElement.height = 4;

  const gl = testCanvasElement.getContext("webgl") ?? testCanvasElement.getContext("webgl2");
  if (!gl) {
    return false;
  }

  try {
    const offscreenCanvas = new OffscreenCanvas(4, 4);
    const offscreenContext = offscreenCanvas.getContext("2d");
    if (!offscreenContext) {
      return false;
    }

    offscreenContext.fillStyle = "#ff0000";
    offscreenContext.fillRect(0, 0, 4, 4);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreenCanvas);

    if (gl.getError() !== gl.NO_ERROR) {
      gl.deleteTexture(texture);
      return false;
    }

    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      gl.deleteFramebuffer(framebuffer);
      gl.deleteTexture(texture);
      return false;
    }

    const pixelData = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);

    // Check that the read pixel is red (with tolerance)
    const isRedPixel = pixelData[0] > 200 && pixelData[1] < 50 && pixelData[2] < 50 && pixelData[3] > 200;
    if (!isRedPixel) {
      return false;
    }

    return true;
  } catch (error) {
    void error;
    return false;
  }
}

/**
 * Checks sRGB support
 */
function checkSRGBSupportInternal(): boolean {
  const canvasElement = document.createElement("canvas");
  const gl = canvasElement.getContext("webgl2") ?? canvasElement.getContext("webgl");
  if (!gl) {
    return false;
  }

  if (gl instanceof WebGL2RenderingContext) {
    try {
      const texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.SRGB8_ALPHA8, 2, 2);
      const errorCode = gl.getError();
      gl.deleteTexture(texture);
      return errorCode === gl.NO_ERROR;
    } catch {
      return false;
    }
  }

  const extension = gl.getExtension("EXT_sRGB");
  if (!extension) {
    return false;
  }

  try {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, extension.SRGB_ALPHA_EXT, 2, 2, 0, extension.SRGB_ALPHA_EXT, gl.UNSIGNED_BYTE, null);
    const errorCode = gl.getError();
    gl.deleteTexture(texture);
    return errorCode === gl.NO_ERROR;
  } catch {
    return false;
  }
}

let OFFSCREEN_CANVAS_SUPPORTED_INTERNAL: boolean | undefined;
let SRGB_SUPPORTED_INTERNAL: boolean | undefined;

export const checkOffscreenCanvasSupport = (): boolean => {
  OFFSCREEN_CANVAS_SUPPORTED_INTERNAL ??= checkOffscreenCanvasSupportInternal();
  return OFFSCREEN_CANVAS_SUPPORTED_INTERNAL;
};

export const checkSRGBSupport = (): boolean => {
  SRGB_SUPPORTED_INTERNAL ??= checkSRGBSupportInternal();
  return SRGB_SUPPORTED_INTERNAL;
};
