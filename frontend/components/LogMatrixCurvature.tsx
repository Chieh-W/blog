'use client';

import { useEffect } from 'react';
import * as THREE from 'three';

type CardBinding = {
  element: HTMLElement;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
};

const CARD_VERTEX = `
  varying vec2 vUv;
  uniform float uCurve;
  void main() {
    vUv = uv;
    vec3 p = position;
    float edge = abs(uv.y - 0.5) * 2.0;
    p.z += pow(edge, 1.8) * uCurve * 18.0;
    p.x += sin((uv.y + uCurve) * 3.14159) * uCurve * 8.0;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const CARD_FRAGMENT = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uCurve;
  uniform float uActive;

  void main() {
    vec2 grid = abs(fract(vUv * vec2(18.0, 12.0)) - 0.5);
    float trace = smoothstep(0.49, 0.5, max(grid.x, grid.y));
    float edge = 1.0 - smoothstep(0.0, 0.018, min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y)));
    float scan = 0.5 + 0.5 * sin(vUv.y * 70.0 + uTime * 2.4 + uCurve * 6.0);
    vec3 copper = vec3(0.96, 0.50, 0.04);
    vec3 green = vec3(0.06, 0.72, 0.50);
    vec3 color = mix(copper, green, abs(uCurve) * 1.25 + scan * 0.12);
    float alpha = trace * 0.05 + edge * 0.22 + abs(uCurve) * 0.10 + uActive * 0.08;
    gl_FragColor = vec4(color, alpha);
  }
`;

export function LogMatrixCurvature() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;

    const canvas = document.createElement('canvas');
    canvas.className = 'log-curvature-overlay';
    document.body.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance'
    });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, window.innerWidth, window.innerHeight, 0, -1000, 1000);
    const geometry = new THREE.PlaneGeometry(1, 1, 12, 12);
    const bindings: CardBinding[] = [];

    const createMaterial = () => new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uCurve: { value: 0 },
        uActive: { value: 0 }
      },
      vertexShader: CARD_VERTEX,
      fragmentShader: CARD_FRAGMENT
    });

    const bindCards = () => {
      const cards = Array.from(document.querySelectorAll<HTMLElement>('[data-log-card="true"]'));
      while (bindings.length < cards.length) {
        const mesh = new THREE.Mesh(geometry, createMaterial());
        mesh.frustumCulled = false;
        scene.add(mesh);
        bindings.push({ element: cards[bindings.length], mesh });
      }
      bindings.forEach((binding, index) => {
        binding.element = cards[index];
        binding.mesh.visible = Boolean(cards[index]);
      });
    };

    const resize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height, false);
      camera.left = 0;
      camera.right = width;
      camera.top = 0;
      camera.bottom = height;
      camera.updateProjectionMatrix();
    };

    bindCards();
    resize();

    let raf = 0;
    const render = (time: number) => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const now = time / 1000;

      bindings.forEach(({ element, mesh }) => {
        if (!element) {
          mesh.visible = false;
          return;
        }
        const rect = element.getBoundingClientRect();
        const visible = rect.bottom > -120 && rect.top < height + 120;
        mesh.visible = visible;
        if (!visible) return;

        const centerY = rect.top + rect.height * 0.5;
        const normalized = (centerY / Math.max(1, height) - 0.5) * 2;
        const curve = Math.max(-1, Math.min(1, normalized));
        const edgeFalloff = Math.pow(Math.abs(curve), 1.35);
        const tilt = -curve * edgeFalloff * 18;
        const depth = -edgeFalloff * 34;
        const scale = 1 - edgeFalloff * 0.032;

        element.style.setProperty('--curve-tilt', `${tilt.toFixed(3)}deg`);
        element.style.setProperty('--curve-depth', `${depth.toFixed(3)}px`);
        element.style.setProperty('--curve-scale', scale.toFixed(4));

        mesh.position.set(rect.left + rect.width * 0.5, rect.top + rect.height * 0.5, -20);
        mesh.scale.set(rect.width, rect.height, 1);
        mesh.material.uniforms.uTime.value = now;
        mesh.material.uniforms.uCurve.value = curve;
        mesh.material.uniforms.uActive.value = element.matches(':hover') ? 1 : 0;
      });

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };

    const observer = new MutationObserver(bindCards);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener('resize', resize);
      bindings.forEach(({ element, mesh }) => {
        element?.style.removeProperty('--curve-tilt');
        element?.style.removeProperty('--curve-depth');
        element?.style.removeProperty('--curve-scale');
        mesh.material.dispose();
        scene.remove(mesh);
      });
      geometry.dispose();
      renderer.dispose();
      canvas.remove();
    };
  }, []);

  return null;
}
