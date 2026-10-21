// Minimal dependency-free WebGL1 fullscreen-quad renderer. Owns the whole
// GPU lifecycle so components only need create() on mount and destroy()
// on unmount: render loop, pause when off-screen / tab hidden, reduced
// motion, adaptive resolution, and context loss/restore.

export interface ShaderRendererOptions {
  fragment: string;
  vertex: string;
  /** Fraction of CSS pixels to render at; soft shaders look identical at < 1. */
  renderScale?: number;
  maxDpr?: number;
  /** Render a single still frame and never animate. */
  staticFrame?: boolean;
  onFirstFrame?: () => void;
}

export interface ShaderRenderer {
  setPointer: (x: number, y: number) => void;
  destroy: () => void;
}

const MIN_RENDER_SCALE = 0.25;
const SLOW_FRAME_MS = 24;

const compile = (gl: WebGLRenderingContext, type: number, source: string) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('createShader failed');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Shader compile failed: ${log}`);
  }
  return shader;
};

/** Returns null when WebGL is unavailable so callers can fall back to CSS. */
export const createShaderRenderer = (
  canvas: HTMLCanvasElement,
  options: ShaderRendererOptions,
): ShaderRenderer | null => {
  const gl = canvas.getContext('webgl', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: 'low-power',
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const maxDpr = options.maxDpr ?? 1.5;
  let renderScale = options.renderScale ?? 0.5;

  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let uniforms: Record<string, WebGLUniformLocation | null> = {};

  const setup = () => {
    const vs = compile(gl, gl.VERTEX_SHADER, options.vertex);
    const fs = compile(gl, gl.FRAGMENT_SHADER, options.fragment);
    program = gl.createProgram()!;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(`Program link failed: ${gl.getProgramInfoLog(program)}`);
    }
    gl.useProgram(program);

    // One oversized triangle covers the viewport with no diagonal seam.
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    uniforms = Object.fromEntries(
      ['u_resolution', 'u_mouse', 'u_time', 'u_intensity'].map((name) => [
        name,
        gl.getUniformLocation(program!, name),
      ]),
    );
  };

  try {
    setup();
  } catch (error) {
    console.error(error);
    return null;
  }

  // Pointer is eased toward its target every frame so the field drifts
  // rather than snapping; intensity eases in for a soft first reveal.
  const pointer = { x: 0.7, y: 0.35, tx: 0.7, ty: 0.35 };
  let intensity = options.staticFrame ? 1 : 0;
  let rafId = 0;
  let running = false;
  let visible = true;
  let firstFrame = true;
  let lost = false;
  const startedAt = performance.now();
  let frameSamples: number[] = [];
  let lastFrame = 0;

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const width = Math.max(
      1,
      Math.round(canvas.clientWidth * dpr * renderScale),
    );
    const height = Math.max(
      1,
      Math.round(canvas.clientHeight * dpr * renderScale),
    );
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    }
  };

  const draw = (now: number) => {
    if (lost) return;
    resize();
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    intensity += (1 - intensity) * 0.02;

    gl.uniform2f(uniforms.u_resolution, canvas.width, canvas.height);
    gl.uniform2f(uniforms.u_mouse, pointer.x, pointer.y);
    gl.uniform1f(
      uniforms.u_time,
      options.staticFrame ? 12 : (now - startedAt) / 1000,
    );
    gl.uniform1f(uniforms.u_intensity, intensity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    if (firstFrame) {
      firstFrame = false;
      options.onFirstFrame?.();
    }
  };

  // Adaptive quality: if the GPU can't keep up, halve the render scale
  // (down to a floor) instead of dragging the whole page's frame rate.
  const trackFrameTime = (now: number) => {
    if (lastFrame) frameSamples.push(now - lastFrame);
    lastFrame = now;
    if (frameSamples.length < 60) return;
    const sorted = frameSamples.sort((a, b) => a - b);
    const median = sorted[sorted.length >> 1];
    frameSamples = [];
    if (median > SLOW_FRAME_MS && renderScale > MIN_RENDER_SCALE) {
      renderScale = Math.max(MIN_RENDER_SCALE, renderScale / 2);
    }
  };

  const loop = (now: number) => {
    if (!running) return;
    trackFrameTime(now);
    draw(now);
    rafId = requestAnimationFrame(loop);
  };

  const start = () => {
    if (running || lost || options.staticFrame) return;
    if (!visible || document.hidden) return;
    running = true;
    lastFrame = 0;
    rafId = requestAnimationFrame(loop);
  };

  const stop = () => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    visible ? start() : stop();
  });
  intersection.observe(canvas);

  const onVisibility = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVisibility);

  // Static mode has no loop to pick up size changes, so redraw on resize.
  const resizeObserver = new ResizeObserver(() => {
    if (options.staticFrame) draw(performance.now());
  });
  resizeObserver.observe(canvas);

  const onContextLost = (event: Event) => {
    event.preventDefault(); // required for webglcontextrestored to fire
    lost = true;
    stop();
  };
  const onContextRestored = () => {
    lost = false;
    try {
      setup();
    } catch (error) {
      console.error(error);
      return;
    }
    options.staticFrame ? draw(performance.now()) : start();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);

  if (options.staticFrame) draw(performance.now());
  else start();

  return {
    setPointer: (x, y) => {
      pointer.tx = x;
      pointer.ty = y;
    },
    destroy: () => {
      stop();
      intersection.disconnect();
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      if (!lost) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }
      // Browsers cap live contexts (~16); release ours eagerly instead of
      // waiting for GC, so repeated Home visits can't exhaust the pool.
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
};
