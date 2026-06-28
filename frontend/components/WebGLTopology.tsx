'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const INIT_FRAGMENT = `
  precision mediump float;
  void main() {
    gl_FragColor = vec4(0.5, 0.5, 0.0, 1.0);
  }
`;

const FULLSCREEN_VERTEX = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const VELOCITY_FRAGMENT = `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uMouse;
  uniform vec2 uPrevMouse;
  uniform float uImpulse;
  uniform float uAspect;
  uniform float uDelta;
  uniform float uTime;

  vec2 decode(vec4 value) {
    return value.xy * 2.0 - 1.0;
  }

  vec4 encode(vec2 value) {
    vec2 packed = clamp(value, -1.0, 1.0) * 0.5 + 0.5;
    return vec4(packed, 0.0, 1.0);
  }

  void main() {
    vec2 prev = decode(texture2D(uVelocity, vUv));
    vec2 backtrace = vUv - prev * 0.020 * uDelta;
    vec2 advected = decode(texture2D(uVelocity, backtrace)) * 0.982;

    vec2 delta = vUv - uMouse;
    delta.x *= uAspect;
    float radius = exp(-dot(delta, delta) * 82.0);
    vec2 stroke = (uMouse - uPrevMouse) * vec2(uAspect, 1.0) * 5.0;
    vec2 vortex = vec2(-delta.y, delta.x) * radius * uImpulse * 0.74;
    vec2 ripple = vec2(
      sin((vUv.y + uTime * 0.11) * 18.0),
      cos((vUv.x - uTime * 0.08) * 21.0)
    ) * 0.006;

    vec2 velocity = advected + stroke * radius + vortex + ripple;
    gl_FragColor = encode(velocity);
  }
`;

const FLUID_FRAGMENT = `
  precision mediump float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform float uTime;

  vec2 decode(vec4 value) {
    return value.xy * 2.0 - 1.0;
  }

  void main() {
    vec2 velocity = decode(texture2D(uVelocity, vUv));
    float speed = length(velocity);
    float curl = velocity.x - velocity.y;
    float trace = smoothstep(0.018, 0.16, speed);
    float scan = 0.5 + 0.5 * sin((vUv.y + curl * 0.08) * 92.0 + uTime * 2.1);
    vec3 copper = vec3(0.98, 0.48, 0.04);
    vec3 green = vec3(0.05, 0.88, 0.55);
    vec3 color = mix(copper, green, clamp(speed * 3.2 + scan * 0.12, 0.0, 1.0));
    float alpha = trace * (0.07 + scan * 0.045);
    gl_FragColor = vec4(color, alpha);
  }
`;

export function WebGLTopology() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const isSmall = window.matchMedia('(max-width: 768px)').matches;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderer = new THREE.WebGLRenderer({ antialias: !isSmall, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.15 : 1.65));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.z = 7;

    const group = new THREE.Group();
    scene.add(group);

    const fluidSize = isSmall ? 64 : 96;
    const targetOptions: THREE.WebGLRenderTargetOptions = {
      type: THREE.UnsignedByteType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false
    };
    let velocityRead = new THREE.WebGLRenderTarget(fluidSize, fluidSize, targetOptions);
    let velocityWrite = new THREE.WebGLRenderTarget(fluidSize, fluidSize, targetOptions);
    velocityRead.texture.generateMipmaps = false;
    velocityWrite.texture.generateMipmaps = false;

    const simScene = new THREE.Scene();
    const simCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const simGeometry = new THREE.PlaneGeometry(2, 2);
    const initMaterial = new THREE.ShaderMaterial({ vertexShader: FULLSCREEN_VERTEX, fragmentShader: INIT_FRAGMENT });
    const velocityMaterial = new THREE.ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader: VELOCITY_FRAGMENT,
      uniforms: {
        uVelocity: { value: velocityRead.texture },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uPrevMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uImpulse: { value: 0 },
        uAspect: { value: 1 },
        uDelta: { value: 1 },
        uTime: { value: 0 }
      }
    });
    const passMesh = new THREE.Mesh(simGeometry, initMaterial);
    simScene.add(passMesh);
    renderer.setRenderTarget(velocityRead);
    renderer.render(simScene, simCamera);
    renderer.setRenderTarget(velocityWrite);
    renderer.render(simScene, simCamera);
    renderer.setRenderTarget(null);
    passMesh.material = velocityMaterial;

    const fluidPlaneMaterial = new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: FLUID_FRAGMENT,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uVelocity: { value: velocityRead.texture },
        uTime: { value: 0 }
      }
    });
    const fluidPlane = new THREE.Mesh(new THREE.PlaneGeometry(12, 8), fluidPlaneMaterial);
    fluidPlane.position.z = -2.2;
    scene.add(fluidPlane);

    const count = isSmall ? 420 : 1100;
    const columns = isSmall ? 24 : 38;
    const positions = new Float32Array(count * 3);
    const base = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const copper = new THREE.Color('#f59e0b');
    const green = new THREE.Color('#10b981');

    for (let i = 0; i < count; i++) {
      const phi = Math.acos(2 * Math.random() - 1);
      const theta = Math.random() * Math.PI * 2;
      const radius = 1.65 + Math.random() * 1.05;
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      positions[i * 3] = base[i * 3] = x;
      positions[i * 3 + 1] = base[i * 3 + 1] = y;
      positions[i * 3 + 2] = base[i * 3 + 2] = z;
      const mix = Math.random() * 0.28;
      const c = copper.clone().lerp(green, mix);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: isSmall ? 0.025 : 0.018,
      vertexColors: true,
      transparent: true,
      opacity: 0.86,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    group.add(points);

    const ring = new THREE.TorusGeometry(2.3, 0.006, 8, 180);
    const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.18 });
    const ringMesh = new THREE.Mesh(ring, ringMat);
    ringMesh.rotation.x = Math.PI / 2.35;
    group.add(ringMesh);

    const pointer = new THREE.Vector2(99, 99);
    const pointerUv = new THREE.Vector2(0.5, 0.5);
    const prevPointerUv = new THREE.Vector2(0.5, 0.5);
    const smoothedUv = new THREE.Vector2(0.5, 0.5);
    const pointerVelocity = new THREE.Vector2();
    const scrollState = { progress: 0 };
    let pointerActive = false;

    const onMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointerActive = true;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    gsap.registerPlugin(ScrollTrigger);
    const rotationTween = gsap.to(group.rotation, {
      y: Math.PI * 1.4,
      x: Math.PI * 0.32,
      ease: 'none',
      scrollTrigger: {
        trigger: host,
        start: 'top top',
        end: 'bottom top',
        scrub: reducedMotion ? false : 0.65
      }
    });
    const scaleTween = gsap.to(group.scale, {
      x: 1.75,
      y: 1.75,
      z: 1.75,
      ease: 'none',
      scrollTrigger: {
        trigger: host,
        start: 'top top',
        end: 'bottom top',
        scrub: reducedMotion ? false : 0.65
      }
    });
    const deconstructTween = gsap.to(scrollState, {
      progress: reducedMotion ? 0.42 : 1,
      ease: 'none',
      scrollTrigger: {
        trigger: host,
        start: 'top top',
        end: 'bottom top',
        scrub: reducedMotion ? false : 0.65
      }
    });

    let frameId = 0;
    let lastTime = performance.now();
    const clock = new THREE.Clock();
    const animate = () => {
      const now = performance.now();
      const delta = Math.min(2, Math.max(0.1, (now - lastTime) / 16.667));
      lastTime = now;
      const t = clock.getElapsedTime();
      const progress = reducedMotion ? 0.18 : scrollState.progress;

      const autoUv = new THREE.Vector2(0.5 + Math.cos(t * 0.21) * 0.22, 0.5 + Math.sin(t * 0.17) * 0.20);
      if (pointerActive) {
        pointerUv.set(pointer.x * 0.5 + 0.5, pointer.y * 0.5 + 0.5);
      } else {
        pointerUv.copy(autoUv);
      }
      prevPointerUv.copy(smoothedUv);
      smoothedUv.lerp(pointerUv, pointerActive ? 0.13 : 0.04);
      pointerVelocity.copy(smoothedUv).sub(prevPointerUv);

      velocityMaterial.uniforms.uVelocity.value = velocityRead.texture;
      velocityMaterial.uniforms.uMouse.value.copy(smoothedUv);
      velocityMaterial.uniforms.uPrevMouse.value.copy(prevPointerUv);
      velocityMaterial.uniforms.uImpulse.value = Math.min(1, pointerVelocity.length() * 42 + (pointerActive ? 0.015 : 0.035));
      velocityMaterial.uniforms.uAspect.value = host.clientWidth / Math.max(1, host.clientHeight);
      velocityMaterial.uniforms.uDelta.value = delta;
      velocityMaterial.uniforms.uTime.value = t;
      renderer.setRenderTarget(velocityWrite);
      renderer.render(simScene, simCamera);
      renderer.setRenderTarget(null);
      [velocityRead, velocityWrite] = [velocityWrite, velocityRead];
      fluidPlaneMaterial.uniforms.uVelocity.value = velocityRead.texture;
      fluidPlaneMaterial.uniforms.uTime.value = t;

      group.rotation.y += reducedMotion ? 0 : 0.0014;
      group.rotation.x += Math.sin(t * 0.22) * 0.0009;

      const pos = geometry.attributes.position as THREE.BufferAttribute;
      const col = geometry.attributes.color as THREE.BufferAttribute;
      const px = (smoothedUv.x - 0.5) * 5.4;
      const py = (smoothedUv.y - 0.5) * 4.0;
      const settle = Math.min(1, progress * 0.72);

      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const bx = base[ix];
        const by = base[ix + 1];
        const bz = base[ix + 2];

        const gridX = ((i % columns) - columns / 2) * (isSmall ? 0.16 : 0.125);
        const gridY = ((Math.floor(i / columns) % columns) - columns / 2) * (isSmall ? 0.16 : 0.125);
        const gridZ = -0.85 + ((i % 7) * 0.012);
        const tx = bx * (1 - settle) + gridX * settle;
        const ty = by * (1 - settle) + gridY * settle;
        const tz = bz * (1 - settle) + gridZ * settle;

        const dx = tx - px;
        const dy = ty - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const magneticForce = Math.max(0, 0.68 - dist) * (isSmall ? 0.08 : 0.25) * (1 - settle * 0.45);
        const vortexFalloff = Math.exp(-dist * dist * 1.35) * (0.06 + Math.min(0.28, pointerVelocity.length() * 8));
        const tangentX = -dy * vortexFalloff;
        const tangentY = dx * vortexFalloff;
        const jitter = reducedMotion ? 0 : 0.012;

        positions[ix] = tx + dx * magneticForce + tangentX + Math.sin(t * 2.5 + i) * jitter;
        positions[ix + 1] = ty + dy * magneticForce + tangentY + Math.cos(t * 2.0 + i) * jitter;
        positions[ix + 2] = tz + Math.sin(t * 1.8 + i * 0.13) * jitter * 3.2 + vortexFalloff * 0.4;

        const hot = Math.min(1, magneticForce * 4.8 + vortexFalloff * 3.5);
        col.setXYZ(i,
          copper.r * (1 - hot) + green.r * hot,
          copper.g * (1 - hot) + green.g * hot,
          copper.b * (1 - hot) + green.b * hot
        );
      }

      material.opacity = 0.86 - progress * 0.32;
      ringMat.opacity = 0.18 - progress * 0.08;
      pos.needsUpdate = true;
      col.needsUpdate = true;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    const resize = () => {
      renderer.setSize(host.clientWidth, host.clientHeight);
      camera.aspect = host.clientWidth / host.clientHeight;
      camera.updateProjectionMatrix();
      velocityMaterial.uniforms.uAspect.value = host.clientWidth / Math.max(1, host.clientHeight);
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      rotationTween.kill();
      scaleTween.kill();
      deconstructTween.kill();
      geometry.dispose();
      material.dispose();
      ring.dispose();
      ringMat.dispose();
      fluidPlane.geometry.dispose();
      fluidPlaneMaterial.dispose();
      velocityRead.dispose();
      velocityWrite.dispose();
      initMaterial.dispose();
      velocityMaterial.dispose();
      simGeometry.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="webgl-stage" ref={hostRef} aria-hidden />;
}
