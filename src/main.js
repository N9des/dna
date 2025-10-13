import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as dat from 'lil-gui';

import dnaVertexShader from './shaders/dna-vertex.glsl';
import dnaFragmentShader from './shaders/dna-fragment.glsl';

export default class Sketch {
	constructor() {
		// Sizes
		this.sizes = {
			width: window.innerWidth,
			height: window.innerHeight,
		};
		// Init Renderer
		this.canvas = document.querySelector('canvas.webgl');

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true,
		});
		this.renderer.setSize(this.sizes.width, this.sizes.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

		// Init scene
		this.scene = new THREE.Scene();

		this.addCamera();

		this.addControls();

		this.addMesh();

		this.addDebug();

		// Init values
		this.time = 0;
		this.clock = new THREE.Clock();

		this.render();

		// Resize
		window.addEventListener('resize', this.resize.bind(this));
	}

	addControls() {
		this.controls = new OrbitControls(this.camera, this.canvas);
		this.controls.enableDamping = true;
	}

	addCamera() {
		this.camera = new THREE.PerspectiveCamera(
			70,
			this.sizes.width / this.sizes.height,
			0.01,
			100
		);
		this.camera.position.set(0, 5, 75);
	}

	addMesh() {
		// DNA parameters
		this.dnaParams = {
			numHelix: 6000,
			numLineSpace: 60,
			numLine: 100,
			helixLength: 150,
			helixRadius: 18,
			rotationSpeed: 0.4,
			wiggleSpeed: 4.0,
		};

		// Create the DNA double helix with particles
		this.createDNA();
	}

	createDNA() {
		// Clear existing DNA
		if (this.dnaParticles) {
			this.scene.remove(this.dnaParticles);
			this.dnaParticles.geometry.dispose();
			this.dnaParticles.material.dispose();
		}

		const { numHelix, numLineSpace, numLine, helixLength, helixRadius } =
			this.dnaParams;
		const numAmount = numHelix + numLineSpace * numLine;
		const toRadians = (deg) => (deg * Math.PI) / 180;
		const randomOffset = (scale) =>
			(Math.random() * 2 - 1) * Math.random() * scale;

		// Initialize buffers
		const positions = new Float32Array(numAmount * 3);
		const scales = new Float32Array(numAmount * 3);
		const radians = new Float32Array(numAmount);
		const radiuses = new Float32Array(numAmount);
		const delays = new Float32Array(numAmount);

		// Create helix strands
		for (let i = 0; i < numHelix; i++) {
			const t = i / numHelix;
			positions[i * 3] = (t * 2 - 1) * helixLength + randomOffset(6);
			positions[i * 3 + 1] = randomOffset(6);
			positions[i * 3 + 2] = randomOffset(6);
			scales[i * 3] = randomOffset(3);
			scales[i * 3 + 1] = randomOffset(3);
			scales[i * 3 + 2] = randomOffset(3);
			scales[i] = randomOffset(1);
			radians[i] = toRadians(t * 900 + (i % 2) * 180);
			radiuses[i] = helixRadius;
			delays[i] = Math.random() * Math.PI * 2;
		}

		// Create base pairs
		for (let j = 0; j < numLineSpace; j++) {
			const t = j / numLineSpace;
			const rad = toRadians(t * 900);

			for (let k = 0; k < numLine; k++) {
				const idx = j * numLine + k + numHelix;
				positions[idx * 3] = (t * 2 - 1) * helixLength + randomOffset(1);
				positions[idx * 3 + 1] = randomOffset(1);
				positions[idx * 3 + 2] = randomOffset(1);
				scales[idx * 3] = randomOffset(3);
				scales[idx * 3 + 1] = randomOffset(3);
				scales[idx * 3 + 2] = randomOffset(3);
				radians[idx] = rad;
				radiuses[idx] = ((k / numLine) * 2 - 1) * helixRadius;
				delays[idx] = Math.random() * Math.PI * 2;
			}
		}

		// Build geometry
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 3));
		geometry.setAttribute('radian', new THREE.BufferAttribute(radians, 1));
		geometry.setAttribute('radius', new THREE.BufferAttribute(radiuses, 1));
		geometry.setAttribute('delay', new THREE.BufferAttribute(delays, 1));

		// Build material
		const material = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
			},
			vertexShader: dnaVertexShader,
			fragmentShader: dnaFragmentShader,
			transparent: true,
			depthWrite: false,
		});

		this.dnaParticles = new THREE.Points(geometry, material);
		this.scene.add(this.dnaParticles);

		console.log(this.dnaParticles);
	}

	addDebug() {
		const gui = new dat.GUI();

		gui
			.add(this.dnaParams, 'numHelix')
			.min(1000)
			.max(10000)
			.step(100)
			.name('Helix Particles')
			.onChange(() => this.createDNA());
		gui
			.add(this.dnaParams, 'numLineSpace')
			.min(20)
			.max(100)
			.step(5)
			.name('Base Pairs')
			.onChange(() => this.createDNA());
		gui
			.add(this.dnaParams, 'numLine')
			.min(20)
			.max(200)
			.step(10)
			.name('Base Pair Density')
			.onChange(() => this.createDNA());
		gui
			.add(this.dnaParams, 'helixLength')
			.min(50)
			.max(300)
			.step(10)
			.name('Helix Length')
			.onChange(() => this.createDNA());
		gui
			.add(this.dnaParams, 'helixRadius')
			.min(5)
			.max(50)
			.step(1)
			.name('Helix Radius')
			.onChange(() => this.createDNA());
		gui
			.add(this.dnaParams, 'rotationSpeed')
			.min(0)
			.max(2)
			.step(0.01)
			.name('Rotation Speed');
		gui
			.add(this.dnaParams, 'wiggleSpeed')
			.min(0)
			.max(10)
			.step(0.1)
			.name('Wiggle Speed');
	}

	addAnim() {
		const elapsedTime = this.clock.getElapsedTime();

		if (this.dnaParticles) {
			this.dnaParticles.material.uniforms.time.value = elapsedTime;
		}
	}

	resize() {
		// Update sizes
		this.sizes.width = window.innerWidth;
		this.sizes.height = window.innerHeight;

		// Update camera
		this.camera.aspect = this.sizes.width / this.sizes.height;
		this.camera.updateProjectionMatrix();

		// Update renderer
		this.renderer.setSize(this.sizes.width, this.sizes.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	}

	render() {
		this.addAnim();

		// Update controls
		this.controls.update();

		this.renderer.render(this.scene, this.camera);
		window.requestAnimationFrame(this.render.bind(this));
	}
}

new Sketch();
