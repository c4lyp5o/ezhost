// The dock's parcel: a navy box strapped with label-yellow tape, drawn with
// three.js. Idles with a slow turn and bob, leans toward the pointer, and
// gets lively while files are dragged over the page or uploading (`excited`).
// Loaded lazily (React.lazy) so three.js stays out of the main bundle.
import { useEffect, useRef } from "react";
import * as THREE from "three";

const PALETTE = {
	dark: { box: 0x22365c, edge: 0xffc93c, tape: 0xffc93c, label: 0xe6ecf5 },
	light: { box: 0x2a4170, edge: 0x0f1a2e, tape: 0xffc93c, label: 0xffffff },
};

const Parcel3D = ({ excited = false, theme = "dark", reduceMotion = false, onReady }) => {
	const host = useRef(null);
	const state = useRef({ excited, theme });
	const readyCb = useRef(onReady);
	readyCb.current = onReady;

	// Keep live props in a ref so the scene isn't rebuilt on every change.
	useEffect(() => {
		state.current.excited = excited;
	}, [excited]);
	useEffect(() => {
		state.current.theme = theme;
		state.current.applyTheme?.(theme);
	}, [theme]);

	useEffect(() => {
		const el = host.current;
		let renderer;
		try {
			renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		} catch {
			return; // No WebGL: the static fallback behind the canvas stays visible.
		}
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
		renderer.outputColorSpace = THREE.SRGBColorSpace;
		el.appendChild(renderer.domElement);
		renderer.domElement.setAttribute("aria-hidden", "true");

		const scene = new THREE.Scene();
		const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
		camera.position.set(0, 0.4, 7.2);

		scene.add(new THREE.HemisphereLight(0xdfe8ff, 0x0f1a2e, 1.4));
		const key = new THREE.DirectionalLight(0xffffff, 2.2);
		key.position.set(3, 4, 5);
		scene.add(key);
		const rim = new THREE.DirectionalLight(0xffc93c, 1.1);
		rim.position.set(-4, -1, -3);
		scene.add(rim);

		const parcel = new THREE.Group();
		scene.add(parcel);
		const disposables = [];
		const track = (o) => (disposables.push(o), o);

		const W = 2.1, H = 1.45, D = 1.6;
		const boxMat = track(new THREE.MeshStandardMaterial({ roughness: 0.78, metalness: 0.05 }));
		const box = new THREE.Mesh(track(new THREE.BoxGeometry(W, H, D)), boxMat);
		parcel.add(box);

		const edgeMat = track(new THREE.LineBasicMaterial({ transparent: true, opacity: 0.85 }));
		parcel.add(new THREE.LineSegments(track(new THREE.EdgesGeometry(box.geometry)), edgeMat));

		// Tape: one strap around the box's middle, one over the lid.
		// A little self-light keeps the tape reading as label-yellow, not mustard.
		const tapeMat = track(new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1, emissive: 0xffc93c, emissiveIntensity: 0.28 }));
		const t = 0.32, lift = 0.012;
		parcel.add(new THREE.Mesh(track(new THREE.BoxGeometry(t, H + lift, D + lift)), tapeMat));
		parcel.add(new THREE.Mesh(track(new THREE.BoxGeometry(W + lift, t * 0.8, D + lift)), tapeMat));

		// Shipping label on the front face.
		const labelMat = track(new THREE.MeshStandardMaterial({ roughness: 0.9 }));
		const label = new THREE.Mesh(track(new THREE.PlaneGeometry(0.62, 0.42)), labelMat);
		label.position.set(-0.6, -0.26, D / 2 + lift);
		parcel.add(label);
		const barMat = track(new THREE.MeshBasicMaterial({ color: 0x0f1a2e }));
		for (let i = 0; i < 5; i++) {
			const bar = new THREE.Mesh(track(new THREE.PlaneGeometry(0.42 - i * 0.05, 0.035)), barMat);
			bar.position.set(-0.6 - i * 0.025, -0.14 - i * 0.06, D / 2 + lift * 2);
			parcel.add(bar);
		}

		const applyTheme = (name) => {
			const p = PALETTE[name] || PALETTE.dark;
			boxMat.color.setHex(p.box);
			edgeMat.color.setHex(p.edge);
			tapeMat.color.setHex(p.tape);
			labelMat.color.setHex(p.label);
			renderer.render(scene, camera); // repaint (matters when not animating)
		};
		applyTheme(state.current.theme);
		state.current.applyTheme = applyTheme;

		parcel.rotation.set(0.32, -0.6, 0);

		const resize = () => {
			const { width, height } = el.getBoundingClientRect();
			if (!width || !height) return;
			renderer.setSize(width, height, false);
			renderer.domElement.style.width = "100%";
			renderer.domElement.style.height = "100%";
			camera.aspect = width / height;
			camera.updateProjectionMatrix();
			renderer.render(scene, camera);
		};
		const ro = new ResizeObserver(resize);
		ro.observe(el);
		resize();
		readyCb.current?.();

		const teardown = () => {
			ro.disconnect();
			disposables.forEach((d) => d.dispose());
			renderer.dispose();
			renderer.domElement.remove();
			delete state.current.applyTheme;
		};

		// Reduced motion: one still frame, re-drawn only on resize/theme change.
		if (reduceMotion) return teardown;

		// Pointer lean (normalized -1..1 across the viewport).
		const pointer = { x: 0, y: 0 };
		const onMove = (e) => {
			pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
			pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
		};
		window.addEventListener("pointermove", onMove, { passive: true });

		// Only animate while visible on screen and the tab is in front.
		let visible = true;
		const io = new IntersectionObserver(([entry]) => {
			visible = entry.isIntersecting;
		});
		io.observe(el);

		const clock = new THREE.Clock();
		let spin = 0, energy = 0, raf = 0;
		const tick = () => {
			raf = requestAnimationFrame(tick);
			if (!visible || document.hidden) return;
			const dt = Math.min(clock.getDelta(), 0.05);
			const time = clock.elapsedTime;
			energy += ((state.current.excited ? 1 : 0) - energy) * Math.min(1, dt * 5);

			spin += dt * (0.25 + energy * 2.4);
			parcel.rotation.y = -0.6 + spin + pointer.x * 0.35;
			parcel.rotation.x = 0.32 + pointer.y * 0.18 + Math.sin(time * 9) * 0.04 * energy;
			parcel.position.y = Math.sin(time * 1.4) * 0.08 + energy * 0.25;
			parcel.scale.setScalar(1 + energy * 0.08);
			renderer.render(scene, camera);
		};
		tick();

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("pointermove", onMove);
			io.disconnect();
			teardown();
		};
	}, [reduceMotion]);

	return <div ref={host} className="absolute inset-0" />;
};

export default Parcel3D;
