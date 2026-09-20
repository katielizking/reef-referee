import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

/** Photographic texture for the hero. Place the file at public/hero/angelfish-albino.webp. */
export const HERO_FISH_SRC = "/hero/angelfish-albino.webp";

/*
 * An albino angelfish holding station in dark water.
 * The photograph is deformed on the GPU as a 128 x 128 mesh: tail strokes in uneven
 * bouts, fin rays ripple, the gills breathe. It is not a rotatable 3D model.
 * UV landmarks in the vertex shader are authored for this specific image.
 * If WebGL or the image is unavailable, the still photograph (or just the water) shows.
 */

const LOOP = 40;

const VERTEX = `
precision highp float;
attribute vec2 aUV;
uniform vec2 uViewport, uCenter;
uniform float uSize, uTime;
varying vec2 vUV;
varying float vLight;
const float PI2 = 6.28318530718;
float ellipse(vec2 p, vec2 origin, vec2 radius) {
  vec2 d=(p-origin)/radius;
  return exp(-dot(d,d)*2.7);
}
float strokeBurst(float t,float start) {
  return smoothstep(start,start+.28,t)*(1.-smoothstep(start+1.55,start+2.3,t));
}
void main() {
  vec2 p=aUV;
  float x=p.x, y=p.y;
  float tail=smoothstep(.646,.904,x)*(1.-smoothstep(.67,.75,y));
  float dorsalBase=.215+.185*smoothstep(.34,.65,x);
  float dorsal=(1.-smoothstep(dorsalBase-.05,dorsalBase+.018,y))*smoothstep(.30,.48,x);
  float analBase=.68-.61*(x-.40);
  float anal=smoothstep(analBase,analBase+.075,y)*smoothstep(.40,.52,x);
  anal*=1.-smoothstep(.69,.77,x)*(1.-smoothstep(.74,.87,y));
  float threads=smoothstep(.68,.91,y)*(1.-smoothstep(.44,.62,x-.35*(y-.70)));
  float gill=ellipse(p,vec2(.253,.466),vec2(.040,.102));
  float pectoral=ellipse(p,vec2(.361,.483),vec2(.064,.082));
  float burst=strokeBurst(uTime,1.)+strokeBurst(uTime,7.)+strokeBurst(uTime,16.)+strokeBurst(uTime,26.)+strokeBurst(uTime,34.);
  float effort=.09+.91*burst;
  float phase=uTime*PI2/1.25;
  float drive=(sin(phase)+.18*sin(phase*2.-.6))*effort;
  float dWave=sin(uTime*PI2/4.-x*8.2+y*3.+.3*sin(uTime*PI2/10.));
  float aWave=sin(uTime*PI2/5.-x*7.5-y*2.3+1.1+.22*sin(uTime*PI2/8.));
  float tailDepth=tail*drive;
  float z=tailDepth*.075+dorsal*dWave*.025+anal*aWave*.021;
  p.x+=tail*(cos(drive*.43)-1.)*.29;
  p.y+=tail*drive*.006;
  p.x+=dorsal*dWave*.007+anal*aWave*.006;
  p.y+=dorsal*sin(uTime*PI2/4.-x*9.)*.0028;
  p.y+=anal*sin(uTime*PI2/5.-x*8.+1.1)*.003;
  p.x+=threads*(sin(uTime*PI2/8.-y*8.+x*3.)*.012+sin(uTime*PI2/5.-y*11.)*.003);
  p.y+=threads*sin(uTime*PI2/8.-y*6.)*.0018;
  float breathPhase=uTime*PI2/2.+.12*sin(uTime*PI2/10.);
  float breath=.5+.5*sin(breathPhase);
  p.x+=gill*breath*.0023;
  float lips=ellipse(p,vec2(.078,.409),vec2(.023,.026));
  p.y+=lips*(2.*smoothstep(.395,.423,y)-1.)*(.0004+.0009*(.5+.5*sin(breathPhase+.7)));
  float pecPhase=uTime*PI2/1.25+.28*sin(uTime*PI2/8.);
  float pec=sin(pecPhase),scull=1.-.35*burst;
  p.x+=pectoral*pec*.0075*scull;
  p.y+=pectoral*cos(pecPhase)*.0027*scull;
  z+=pectoral*pec*.016;
  float yaw=.045+sin(uTime*PI2/40.)*.08+.012*drive;
  vec2 local=p-vec2(.5);
  local.x=local.x*cos(yaw)+z*sin(yaw);
  float roll=-.015+sin(uTime*PI2/20.)*.007+burst*.002*sin(phase-1.);
  local=mat2(cos(roll),sin(roll),-sin(roll),cos(roll))*local;
  float advances=smoothstep(1.,4.3,uTime)+smoothstep(7.,10.3,uTime)+smoothstep(16.,19.3,uTime)+smoothstep(26.,29.3,uTime)+smoothstep(34.,37.3,uTime);
  vec2 drift=vec2(.18*uTime/40.-.036*advances,sin(uTime*PI2/20.+.4)*.005+sin(uTime*PI2/8.)*.0015);
  vec2 screen=uCenter+(local+drift)*uSize;
  gl_Position=vec4(screen.x/uViewport.x*2.-1.,1.-screen.y/uViewport.y*2.,0.,1.);
  vUV=aUV;
  vLight=1.+dorsal*dWave*.035+anal*aWave*.03+tailDepth*.035+pectoral*pec*.035;
}`;

const FRAGMENT = `
precision mediump float;
uniform sampler2D uTexture;
varying vec2 vUV;
varying float vLight;
void main() {
  vec4 pixel=texture2D(uTexture,vUV);
  if(pixel.a<.006) discard;
  vec3 colour=pixel.rgb*vec3(.91,.95,1.0)*vLight;
  gl_FragColor=vec4(colour,pixel.a);
}`;

type Uniforms = Record<
  "uViewport" | "uCenter" | "uSize" | "uTime" | "uTexture",
  WebGLUniformLocation | null
>;

export function HomeHero() {
  const heroRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);
  const [paused, setPaused] = useState(false);
  const [motionAvailable, setMotionAvailable] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const pausedRef = useRef(false);
  const scheduleRef = useRef<() => void>(() => {});

  useEffect(() => {
    const hero = heroRef.current;
    const canvas = canvasRef.current;
    const poster = posterRef.current;
    if (!hero || !canvas || !poster) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    pausedRef.current = reduced.matches;
    setPaused(reduced.matches);

    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let uniforms: Uniforms | null = null;
    let indexCount = 0;
    let ready = false;
    let lost = false;
    let inView = true;
    let raf = 0;
    let previous: number | null = null;
    let elapsed = 0;
    let width = 1;
    let height = 1;
    let size = 1;
    let center: [number, number] = [0, 0];
    let disposed = false;
    const image = new Image();

    function compile(type: number, source: string) {
      const shader = gl!.createShader(type)!;
      gl!.shaderSource(shader, source);
      gl!.compileShader(shader);
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        const reason = gl!.getShaderInfoLog(shader);
        gl!.deleteShader(shader);
        throw new Error(reason ?? "Shader failed to compile");
      }
      return shader;
    }

    function initGPU() {
      gl = canvas!.getContext("webgl", {
        alpha: true,
        premultipliedAlpha: false,
        antialias: true,
        depth: false,
        powerPreference: "low-power",
      });
      if (!gl) return false;
      const vs = compile(gl.VERTEX_SHADER, VERTEX);
      const fs = compile(gl.FRAGMENT_SHADER, FRAGMENT);
      program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program) ?? "Program failed to link");
      }
      gl.useProgram(program);

      const divisions = 128;
      const vertices: number[] = [];
      const indices: number[] = [];
      for (let y = 0; y <= divisions; y++)
        for (let x = 0; x <= divisions; x++) vertices.push(x / divisions, y / divisions);
      for (let y = 0; y < divisions; y++)
        for (let x = 0; x < divisions; x++) {
          const a = y * (divisions + 1) + x;
          const b = a + 1;
          const d = a + divisions + 1;
          const e = d + 1;
          indices.push(a, b, d, b, e, d);
        }
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
      const uv = gl.getAttribLocation(program, "aUV");
      gl.enableVertexAttribArray(uv);
      gl.vertexAttribPointer(uv, 2, gl.FLOAT, false, 0, 0);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
      indexCount = indices.length;

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

      uniforms = {
        uViewport: gl.getUniformLocation(program, "uViewport"),
        uCenter: gl.getUniformLocation(program, "uCenter"),
        uSize: gl.getUniformLocation(program, "uSize"),
        uTime: gl.getUniformLocation(program, "uTime"),
        uTexture: gl.getUniformLocation(program, "uTexture"),
      };
      gl.uniform1i(uniforms.uTexture, 0);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.disable(gl.BLEND);
      gl.clearColor(0, 0, 0, 0);
      return true;
    }

    function draw(t: number) {
      if (!ready || lost || !gl || !uniforms) return;
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(program);
      gl.uniform2f(uniforms.uViewport, width, height);
      gl.uniform2f(uniforms.uCenter, center[0], center[1]);
      gl.uniform1f(uniforms.uSize, size);
      gl.uniform1f(uniforms.uTime, t);
      gl.drawElements(gl.TRIANGLES, indexCount, gl.UNSIGNED_SHORT, 0);
    }

    function layout() {
      const bounds = hero!.getBoundingClientRect();
      width = Math.max(bounds.width, 1);
      height = Math.max(bounds.height, 1);
      const mobile = width <= 800;
      size = mobile ? Math.min(width * 0.84, 355) : Math.min(height * 0.82, width * 0.465, 660);
      center = mobile ? [width * 0.52, 190] : [width * 0.755, height * 0.475];
      poster!.style.width = `${size}px`;
      poster!.style.height = `${size}px`;
      poster!.style.left = `${center[0] - size * 0.5}px`;
      poster!.style.top = `${center[1] - size * 0.5}px`;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      if (ready && !lost && gl) {
        gl.viewport(0, 0, canvas!.width, canvas!.height);
        draw(elapsed);
      }
    }

    function tick(now: number) {
      raf = 0;
      if (pausedRef.current || !inView || document.hidden || !ready || lost) {
        previous = null;
        return;
      }
      if (previous !== null) elapsed = (elapsed + Math.min((now - previous) / 1000, 0.05)) % LOOP;
      previous = now;
      draw(elapsed);
      raf = requestAnimationFrame(tick);
    }

    function schedule() {
      cancelAnimationFrame(raf);
      raf = 0;
      previous = null;
      if (!pausedRef.current && inView && !document.hidden && ready && !lost && !disposed) {
        raf = requestAnimationFrame(tick);
      }
    }
    scheduleRef.current = () => {
      draw(elapsed);
      schedule();
    };

    function fallback() {
      ready = false;
      hero!.classList.remove("gpu-ready");
      setMotionAvailable(false);
    }

    function start() {
      if (disposed) return;
      try {
        ready = initGPU();
        if (ready) {
          layout();
          hero!.classList.add("gpu-ready");
          setMotionAvailable(true);
          schedule();
        } else fallback();
      } catch (error) {
        console.warn("Fish animation unavailable; showing the still image.", error);
        fallback();
      }
    }

    const onReducedChange = () => {
      pausedRef.current = reduced.matches;
      setPaused(reduced.matches);
      draw(elapsed);
      schedule();
    };
    const onContextLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      hero.classList.remove("gpu-ready");
      schedule();
    };
    const onContextRestored = () => {
      lost = false;
      start();
    };

    reduced.addEventListener("change", onReducedChange);
    document.addEventListener("visibilitychange", schedule);
    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    const intersection =
      "IntersectionObserver" in window
        ? new IntersectionObserver(([entry]) => {
            inView = entry.isIntersecting;
            schedule();
          })
        : null;
    intersection?.observe(hero);
    const resize = "ResizeObserver" in window ? new ResizeObserver(layout) : null;
    if (resize) resize.observe(hero);
    else window.addEventListener("resize", layout);

    layout();
    image.onload = start;
    image.onerror = fallback;
    image.src = HERO_FISH_SRC;

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      reduced.removeEventListener("change", onReducedChange);
      document.removeEventListener("visibilitychange", schedule);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      intersection?.disconnect();
      if (resize) resize.disconnect();
      else window.removeEventListener("resize", layout);
      image.onload = null;
      image.onerror = null;
    };
  }, []);

  function toggleMotion() {
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
    scheduleRef.current();
  }

  return (
    <section ref={heroRef} className="ft-hero" aria-labelledby="hero-title">
      <canvas
        ref={canvasRef}
        role="img"
        aria-label="A pale freshwater angelfish with translucent fins, slowly holding position in dark water"
      />
      <img
        ref={posterRef}
        className="ft-hero-poster"
        src={HERO_FISH_SRC}
        alt=""
        aria-hidden
        hidden={posterFailed}
        onError={() => setPosterFailed(true)}
      />
      <div className="ft-hero-shade" />
      <div className="ft-hero-wrap">
        <div className="ft-hero-main">
          <div className="ft-hero-copy">
            <p className="ft-hero-eyebrow">Know your tank before you stock it</p>
            <h1 id="hero-title">
              A little planning.
              <br />A <em>better tank.</em>
            </h1>
            <p className="ft-hero-lede">
              Find fish that suit your tank, check who gets along and make room for them to thrive.
            </p>
            <div className="ft-hero-actions">
              <a className="ft-hero-primary" href="#builder">
                Plan my tank <span aria-hidden="true">↓</span>
              </a>
              <Link className="ft-hero-secondary" to="/species">
                Explore the fish
              </Link>
            </div>
          </div>
        </div>
        {!posterFailed && (
          <div className="ft-hero-caption">
            <em>Pterophyllum scalare</em>
            Freshwater angelfish · Albino
          </div>
        )}
        <div className="ft-hero-foot">
          <span>A good home starts with the right information.</span>
          {motionAvailable && (
            <button
              className="ft-hero-motion"
              type="button"
              aria-pressed={paused}
              onClick={toggleMotion}
            >
              {paused ? "Play motion" : "Pause motion"}
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
