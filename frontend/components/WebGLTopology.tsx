'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function WebGLTopology() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const isSmall = window.matchMedia('(max-width: 768px)').matches;
    const renderer = new THREE.WebGLRenderer({ antialias: !isSmall, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, isSmall ? 1.2 : 1.75));
    renderer.setSize(host.clientWidth, host.clientHeight);
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, host.clientWidth / host.clientHeight, 0.1, 100);
    camera.position.z = 7;

    const group = new THREE.Group();
    scene.add(group);

    const count = isSmall ? 520 : 1200;
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
      const mix = Math.random() * 0.35;
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
    const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.2 });
    const ringMesh = new THREE.Mesh(ring, ringMat);
    ringMesh.rotation.x = Math.PI / 2.35;
    group.add(ringMesh);

    const pointer = new THREE.Vector2(99, 99);
    const onMove = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove);

    gsap.registerPlugin(ScrollTrigger);
    const tween = gsap.to(group.rotation, {
      y: Math.PI * 1.4,
      x: Math.PI * 0.32,
      ease: 'none',
      scrollTrigger: {
        trigger: host,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });
    const scaleTween = gsap.to(group.scale, {
      x: 1.9,
      y: 1.9,
      z: 1.9,
      ease: 'none',
      scrollTrigger: {
        trigger: host,
        start: 'top top',
        end: 'bottom top',
        scrub: true
      }
    });

    let frameId = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      const t = clock.getElapsedTime();
      group.rotation.y += 0.0016;
      group.rotation.x = Math.sin(t * 0.22) * 0.08;

      const pos = geometry.attributes.position as THREE.BufferAttribute;
      const col = geometry.attributes.color as THREE.BufferAttribute;
      const px = pointer.x * 2.7;
      const py = pointer.y * 2.0;
      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        const bx = base[ix];
        const by = base[ix + 1];
        const bz = base[ix + 2];
        const dx = bx - px;
        const dy = by - py;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const force = Math.max(0, 0.7 - dist) * (isSmall ? 0.08 : 0.26);
        positions[ix] = bx + dx * force + Math.sin(t * 2.5 + i) * 0.015;
        positions[ix + 1] = by + dy * force + Math.cos(t * 2.0 + i) * 0.015;
        positions[ix + 2] = bz + Math.sin(t * 1.8 + i * 0.13) * 0.04;

        const hot = Math.min(1, force * 4.5);
        col.setXYZ(i,
          copper.r * (1 - hot) + green.r * hot,
          copper.g * (1 - hot) + green.g * hot,
          copper.b * (1 - hot) + green.b * hot
        );
      }
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
    };
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      tween.kill();
      scaleTween.kill();
      geometry.dispose();
      material.dispose();
      ring.dispose();
      ringMat.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div className="webgl-stage" ref={hostRef} aria-hidden />;
}
