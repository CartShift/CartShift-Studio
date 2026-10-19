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
    console.warn('[Portfolio FluidField]', gl.getShaderInfoLog(shader));
  }
  gl.deleteShader(shader);
  return null;
}

export default function FluidField({ paused = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointer = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl2', {
      alpha: true, antialias: true, depth: false, stencil: false,
      premultipliedAlpha: false, powerPreference: 'low-power',
    });
    if (!gl) return;
    const vs = compile(gl, vertex, gl.VERTEX_SHADER);
    const fs = compile(gl, fragment, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Portfolio FluidField]', gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return;
    }
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);
    gl.useProgram(program);
    const pos = gl.getAttribLocation(program, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);
    const resolution = gl.getUniformLocation(program, 'u_resolution');
    const time = gl.getUniformLocation(program, 'u_time');
    const move = gl.getUniformLocation(program, 'u_pointer');
    let raf = 0;
    let visible = true;
    let previous = -100;
    const started = performance.now();
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5, 1050 / Math.max(rect.width, 1));
      canvas.width = Math.max(1, Math.round(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.round(rect.height * pixelRatio));
      gl.viewport(0,0,canvas.width,canvas.height);
      previous = -100;
    };
    const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting;}, {threshold:.01});
    observer.observe(canvas);
    const onLost = (e: Event) => { e.preventDefault(); visible = false; setReady(false); };
    canvas.addEventListener('webglcontextlost', onLost);
    window.addEventListener('resize', resize, {passive:true});
    resize();
    const draw = (now: number) => {
      raf = window.requestAnimationFrame(draw);
      const still = paused || motionQuery.matches;
      if (!visible || document.hidden || (still && previous !== -100 && !(!ready))) return;
      if (now - previous < 34) return;
      previous = now;
      gl.useProgram(program);
      gl.uniform2f(resolution, canvas.width, canvas.height);
      gl.uniform1f(time, still ? 0 : (now - started) * .001);
      gl.uniform2f(move, pointer.current.x, pointer.current.y);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!canvas.dataset.rendered) { canvas.dataset.rendered = 'true'; setReady(true); }
    };
    raf = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('webglcontextlost', onLost);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }, [paused]);

  return (
    <div className={'v5-fluid-field' + (ready ? ' v5-fluid-field--ready' : '')}
      aria-hidden="true"
      onPointerMove={(event) => {
        const r = event.currentTarget.getBoundingClientRect();
        pointer.current.x = (event.clientX / Math.max(r.width,1) - .5);
        pointer.current.y = (event.clientY / Math.max(r.height,1) - .5);
      }}>
      <div className="v5-fluid-fallback">
        <i /><i /><i /><i />
      </div>
      <canvas className="v5-fluid-canvas" ref={canvasRef} />
    </div>
  );
}
