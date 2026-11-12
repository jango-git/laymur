/** WebGL capabilities the library adapts to */
interface WebGLCapabilities {
  /** OffscreenCanvas works as a texture source */
  offscreenCanvas: boolean;
  /** sRGB textures are supported */
  srgb: boolean;
}

type ProbeContext = WebGLRenderingContext | WebGL2RenderingContext;

/** Discards errors left by earlier calls, so that the next getError reports only the next call */
function clearErrors(gl: ProbeContext): void {
  while (gl.getError() !== gl.NO_ERROR) {
    // Drain the error queue
  }
}

/**
 * Checks real OffscreenCanvas support as a texture source
 */
function probeOffscreenCanvas(gl: ProbeContext): boolean {
  if (typeof OffscreenCanvas === "undefined") {
    return false;
  }

  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();

  try {
    const offscreenCanvas = new OffscreenCanvas(4, 4);
    const offscreenContext = offscreenCanvas.getContext("2d");
    if (!offscreenContext) {
      return false;
    }

    offscreenContext.fillStyle = "#ff0000";
    offscreenContext.fillRect(0, 0, 4, 4);

    clearErrors(gl);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, offscreenCanvas);
    if (gl.getError() !== gl.NO_ERROR) {
      return false;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
      return false;
    }

    const pixelData = new Uint8Array(4);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelData);

    return pixelData[0] > 200 && pixelData[1] < 50 && pixelData[2] < 50 && pixelData[3] > 200;
  } catch {
    return false;
  } finally {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteFramebuffer(framebuffer);
    gl.deleteTexture(texture);
  }
}

/**
 * Checks sRGB support
 */
function probeSRGB(gl: ProbeContext): boolean {
  const isWebGL2 =
    typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;
  const extension = isWebGL2 ? null : gl.getExtension("EXT_sRGB");
  if (!isWebGL2 && !extension) {
    return false;
  }

  const texture = gl.createTexture();

  try {
    clearErrors(gl);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    if (isWebGL2) {
      gl.texStorage2D(gl.TEXTURE_2D, 1, gl.SRGB8_ALPHA8, 2, 2);
    } else if (extension) {
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        extension.SRGB_ALPHA_EXT,
        2,
        2,
        0,
        extension.SRGB_ALPHA_EXT,
        gl.UNSIGNED_BYTE,
        null,
      );
    }

    return gl.getError() === gl.NO_ERROR;
  } catch {
    return false;
  } finally {
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.deleteTexture(texture);
  }
}

/**
 * Runs all checks on one temporary context and releases it right away. Browsers keep a limited
 * number of live WebGL contexts and lose the oldest one when the limit is exceeded, so a probe
 * context left for the garbage collector can cost the application its own context.
 */
function probeCapabilities(): WebGLCapabilities {
  const canvasElement = document.createElement("canvas");
  canvasElement.width = 4;
  canvasElement.height = 4;

  const gl = canvasElement.getContext("webgl2") ?? canvasElement.getContext("webgl");
  if (!gl) {
    return { offscreenCanvas: false, srgb: false };
  }

  try {
    return {
      offscreenCanvas: probeOffscreenCanvas(gl),
      srgb: probeSRGB(gl),
    };
  } finally {
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
}

let CAPABILITIES_INTERNAL: WebGLCapabilities | undefined;

function getCapabilities(): WebGLCapabilities {
  CAPABILITIES_INTERNAL ??= probeCapabilities();
  return CAPABILITIES_INTERNAL;
}

export const checkOffscreenCanvasSupport = (): boolean => getCapabilities().offscreenCanvas;

export const checkSRGBSupport = (): boolean => getCapabilities().srgb;
