'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A wholly original procedural 3D scene for Portfolio V5.
 * SDF toroidal forms are ray-marched and shaded with iridescent, glossy light.
 * No assets, shaders, fonts, or media from the reference site are used.
 */
const vertex = String.raw`#version 300 es
in vec2 a_position;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
`;

const fragment = String.raw`#version 300 es
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
out vec4 outColor;

const float PI = 3.14159265359;

mat2 turn(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

vec2 torusSDF(vec3 q, float major, float minor, float id, float phase) {
  float angle = atan(q.y, q.x);
  float bulge = .054 * sin(angle * 3.0 + phase) + .031 * sin(angle * 5.0 - phase * .7);
  float radius = major + bulge;
  float tube = minor * (1.0 + .15 * sin(angle * 3.0 - phase));
  return vec2(length(vec2(length(q.xy) - radius, q.z)) - tube, id);
}

vec2 scene(vec3 p) {
  float aspect = u_resolution.x / u_resolution.y;
  float small = clamp(u_resolution.x / 800.0, .59, 1.0);
  float halfWidth = aspect * 1.5;
  float time = u_time * .27;
  vec2 hit = vec2(99.0, -1.0);
  vec3 q;

  // Sculptures intentionally live outside the central type-safe region.
  q = p - vec3(-halfWidth + .12, 1.32, -.02);
  q.xy = turn(.55 + sin(time) * .07) * q.xy;
  q.yz = turn(.38) * q.yz;
  q /= small;
  vec2 a = torusSDF(q, .61, .23, 1.0, time + .7);
  a.x *= small;
  if (a.x < hit.x) hit = a;

  q = p - vec3(halfWidth - .13, 1.27, -.34);
  q.xy = turn(-.45 + sin(time * .8) * .06) * q.xy;
  q.xz = turn(.38) * q.xz;
  q /= small;
  a = torusSDF(q, .6, .265, 2.0, time + 2.2);
  a.x *= small;
  if (a.x < hit.x) hit = a;

  q = p - vec3(-halfWidth + .10, -1.32, -.05);
  q.xy = turn(-.7 + sin(time * .8) * .09) * q.xy;
  q.yz = turn(-.34) * q.yz;
  q /= small;
  a = torusSDF(q, .64, .265, 3.0, time + 4.5);
  a.x *= small;
  if (a.x < hit.x) hit = a;

  q = p - vec3(halfWidth - .1, -1.35, .08);
  q.xy = turn(.9 + sin(time) * .065) * q.xy;
  q.xz = turn(-.32) * q.xz;
  q /= small;
  a = torusSDF(q, .62, .245, 4.0, time + .8);
  a.x *= small;
  if (a.x < hit.x) hit = a;

  return hit;
}

vec3 normalAt(vec3 p) {
  const vec2 e = vec2(.0032, 0.0);
  return normalize(vec3(
    scene(p + e.xyy).x - scene(p - e.xyy).x,
    scene(p + e.yxy).x - scene(p - e.yxy).x,
    scene(p + e.yyx).x - scene(p - e.yyx).x
  ));
}

vec3 colorize(vec3 p, vec3 normal, float id, vec3 ray) {
  float f = 1.0 - max(dot(normal, -ray), 0.0);
  float fresnel = pow(f, 2.7);
  float swirl = dot(normal.xy, normalize(vec2(.71,.68)));
  float band = sin(swirl * 3.1 + p.y * 1.25 + id * 1.34 + u_time * .13);
  vec3 mint = vec3(.47,.92,.77);
  vec3 cyan = vec3(.42,.83,.94);
  vec3 lavender = vec3(.64,.63,.94);
  vec3 rose = vec3(.97,.64,.78);
  vec3 butter = vec3(.98,.88,.64);
  vec3 base = mix(mint, cyan, smoothstep(-.7,.9,band));
  base = mix(base, lavender, smoothstep(-.12,.88,sin(p.x * 1.9 + id * 2.2 + normal.y * 2.3)));
  base = mix(base, rose, smoothstep(.03,.96,sin(p.y * 2.3 + id + normal.x * 3.0)));
  base = mix(base, butter, .31 * smoothstep(.2,1.0,normal.y + sin(id * 1.5)));

  vec3 l1 = normalize(vec3(-.51, .72, 1.14));
  vec3 l2 = normalize(vec3(.86,-.13,.72));
  float diff = max(dot(normal,l1),0.0);
  float rim = max(dot(normal,l2),0.0);
  vec3 refl1 = reflect(-l1,normal);
  vec3 refl2 = reflect(-l2,normal);
  float highlight = pow(max(dot(refl1,-ray),0.0),64.0);
  float sparkle = pow(max(dot(refl2,-ray),0.0),160.0);
  float strip = pow(max(dot(refl1,-ray),0.0),13.0);
  vec3 glossy = base * (.63 + .32 * diff + .17 * rim);
  glossy = mix(glossy,vec3(.96,.97,1.),.62 * fresnel);
  glossy += vec3(1.0,.97,.94) * (highlight * 1.6 + sparkle * 1.15 + .13 * strip);
  glossy = pow(max(glossy,0.0),vec3(.87));
  return clamp(glossy,0.0,1.0);
}

void main(){
  vec2 uv = (gl_FragCoord.xy - .5 * u_resolution.xy) / u_resolution.y * 3.0;
  uv += u_pointer * .075;
  // The center of the composition is deliberately free of sculpture.
  // Avoid expensive ray marching under the headline.
  if (abs(uv.y) < .35) { outColor = vec4(0.0); return; }
  vec3 ro = vec3(uv, 4.8);
  vec3 rd = vec3(0.0,0.0,-1.0);
  float t = 0.0;
  float id = -1.0;
  bool found = false;
  for(int i = 0; i < 64; i++){
    vec2 d = scene(ro + rd * t);
    if(d.x < .0035){ id = d.y; found = true; break; }
    t += max(d.x * .81,.012);
    if(t > 9.0) break;
  }
  if(!found){ outColor = vec4(0.0); return; }
  vec3 p = ro + rd * t;
  vec3 n = normalAt(p);
  vec3 color = colorize(p,n,id,rd);
  outColor = vec4(color,1.0);
}
`;

type Props = { paused?: boolean };

function compile(gl: WebGL2RenderingContext, source: string, shaderType: number) {
  const shader = gl.createShader(shaderType);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
  if (process.env.NODE_ENV !== 'production') {
    console.warn('[Portfolio FluidField] Shader error:', gl.getShaderInfoLog(shader));
  }
  gl.deleteShader(shader);
  return null;
}

export default function FluidField({ paused = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const wakeRef = useRef<(() => void) | null>(null);
  const [rendered, setRendered] = useState(false);
  const [contextGeneration, setContextGeneration] = useState(0);

  useEffect(() => {
    pausedRef.current = paused;
    wakeRef.current?.();
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = (() => {
      try {
        return canvas.getContext('webgl2', {
          alpha: true,
          antialias: false,
          depth: false,
          stencil: false,
          premultipliedAlpha: false,
          powerPreference: 'low-power',
        });
      } catch {
        // Keep the decorative CSS fallback if graphics initialization is blocked.
        return null;
      }
    })();
    if (!gl) return;

    const vs = compile(gl, vertex, gl.VERTEX_SHADER);
    const fs = compile(gl, fragment, gl.FRAGMENT_SHADER);
    if (!vs || !fs) {
      if (vs) gl.deleteShader(vs);
      if (fs) gl.deleteShader(fs);
      return;
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      return;
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[Portfolio FluidField] Program error:', gl.getProgramInfoLog(program));
      }
      gl.deleteProgram(program);
      return;
    }

    const buffer = gl.createBuffer();
    if (!buffer) {
      gl.deleteProgram(program);
      return;
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.useProgram(program);
    const position = gl.getAttribLocation(program, 'a_position');
    if (position === -1) {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
      return;
    }
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, 'u_resolution');
    const time = gl.getUniformLocation(program, 'u_time');
    const pointer = gl.getUniformLocation(program, 'u_pointer');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    const frameInterval = 1000 / (coarsePointer ? 18 : 24);
    const target = { x: 0, y: 0 };
    let current = { x: 0, y: 0 };
    let active = true;
    let visible = true;
    let lost = false;
    let raf = 0;
    let needFrame = true;
    let previousFrame = 0;
    let previousMotionFrame = 0;
    let animationTime = 0;
    let firstFrame = true;

    const canRender = () => active && !lost && visible && !document.hidden;
    const isStatic = () => pausedRef.current || reducedMotion.matches;

    const schedule = () => {
      if (!raf && canRender() && (needFrame || !isStatic())) {
        raf = window.requestAnimationFrame(draw);
      }
    };

    const draw = (now: number) => {
      raf = 0;
      if (!canRender()) return;
      if (!needFrame && now - previousFrame < frameInterval) {
        schedule();
        return;
      }
      const still = isStatic();
      const delta = previousMotionFrame ? Math.min((now - previousMotionFrame) / 1000, 0.08) : 0;
      previousMotionFrame = now;
      if (!still) animationTime += delta;
      previousFrame = now;
      needFrame = false;

      if (!still) {
        current = {
          x: current.x + (target.x - current.x) * 0.075,
          y: current.y + (target.y - current.y) * 0.075,
        };
      }

      gl.useProgram(program);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, reducedMotion.matches ? 0 : animationTime);
      gl.uniform2f(pointer, current.x, current.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      if (firstFrame) {
        firstFrame = false;
        canvas.dataset.rendered = 'true';
        setRendered(true);
      }
      if (!still) schedule();
    };

    const wake = () => {
      needFrame = true;
      previousMotionFrame = 0;
      schedule();
    };
    wakeRef.current = wake;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      // Capped pixel count protects mobile GPU and battery without changing CSS size.
      const scale = Math.min(
        window.devicePixelRatio || 1,
        1.25,
        Math.sqrt(550_000 / (rect.width * rect.height)),
      );
      const width = Math.max(1, Math.round(rect.width * scale));
      const height = Math.max(1, Math.round(rect.height * scale));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl.viewport(0, 0, width, height);
        wake();
      }
    };

    const onPointer = (event: PointerEvent) => {
      if (isStatic() || event.pointerType === 'touch') return;
      target.x = event.clientX / window.innerWidth - 0.5;
      target.y = event.clientY / window.innerHeight - 0.5;
    };

    const onVisibilityChange = () => {
      if (document.hidden && raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
      if (!document.hidden) wake();
    };

    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      canvas.removeAttribute('data-rendered');
      setRendered(false);
      if (raf) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };

    const onContextRestored = () => {
      // The effect recreates all shaders, buffers and uniforms on the restored context.
      setContextGeneration(value => value + 1);
    };

    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          visible = entry.isIntersecting;
          if (!visible && raf) {
            window.cancelAnimationFrame(raf);
            raf = 0;
          }
          if (visible) wake();
        }, { threshold: 0.01 })
      : null;
    observer?.observe(canvas);

    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(resize)
      : null;
    resizeObserver?.observe(canvas);

    window.addEventListener('resize', resize, { passive: true });
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('visibilitychange', onVisibilityChange);
    canvas.addEventListener('webglcontextlost', onContextLost);
    canvas.addEventListener('webglcontextrestored', onContextRestored);
    reducedMotion.addEventListener('change', wake);

    resize();
    schedule();

    return () => {
      active = false;
      wakeRef.current = null;
      if (raf) window.cancelAnimationFrame(raf);
      observer?.disconnect();
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      canvas.removeEventListener('webglcontextrestored', onContextRestored);
      reducedMotion.removeEventListener('change', wake);
      if (!gl.isContextLost()) {
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }
    };
  }, [contextGeneration]);

  return (
    <div className={'v5-fluid-field' + (rendered ? ' v5-fluid-field--ready' : '')} aria-hidden="true">
      <div className="v5-fluid-fallback">
        <i /><i /><i /><i />
      </div>
      <canvas className="v5-fluid-canvas" ref={canvasRef} />
    </div>
  );
}
