import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Pane } from 'tweakpane';

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
		this.scene.background = new THREE.Color(0x224745);

		this.addCamera();

		this.addControls();

		this.addMesh();

		this.addDebug();

		// Init values
		this.time = 0;
		this.clock = new THREE.Clock();

		// Mouse tracking
		this.mouse = new THREE.Vector2();
		this.mouseLerped = new THREE.Vector2();
		this.mouseVelocity = new THREE.Vector3();
		this.prevRayOrigin = new THREE.Vector3();
		this.raycaster = new THREE.Raycaster();
		window.addEventListener('mousemove', this.onMouseMove.bind(this));

		this.render();

		// Resize
		window.addEventListener('resize', this.resize.bind(this));
	}

	addControls() {
		this.controls = new OrbitControls(this.camera, this.canvas);
		this.controls.enableDamping = true;
		this.controls.target.copy(this.cameraLookAt);
		this.controls.update();
	}

	addCamera() {
		this.camera = new THREE.PerspectiveCamera(
			70,
			this.sizes.width / this.sizes.height,
			0.01,
			500
		);
		this.cameraParams = {
			posX: -20,
			posY: -15,
			posZ: 78,
			lookX: 0,
			lookY: 22,
			lookZ: 0,
			rotZ: -47,
		};
		this.camera.position.set(
			this.cameraParams.posX,
			this.cameraParams.posY,
			this.cameraParams.posZ
		);
		this.cameraLookAt = new THREE.Vector3(
			this.cameraParams.lookX,
			this.cameraParams.lookY,
			this.cameraParams.lookZ
		);
		this.camera.lookAt(this.cameraLookAt);
	}

	addMesh() {
		// DNA parameters
		this.dnaParams = {
			// numHelix: 50000,
			numHelix: 10000,
			numLineSpace: 35,
			numLine: 200,
			// numLine: 700,
			helixLength: 170,
			helixRadius: 18,
			rotationSpeed: 0.2,
			wiggleSpeed: 2.0,
			scaleBase: 0.8,
			scaleAmplitude: 0.2,
			scaleSpeed: 4.0,
			mouseRadius: 20,
			mouseStrength: 10,
			mouseLerp: 0.03,
			trailStrength: 13,
			entryDuration: 2.0,
			entrySpread: 500,
			entryStagger: 0,
			particleColor: { r: 74, g: 182, b: 173 },
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
		const randomPositions = new Float32Array(numAmount * 3);
		const scales = new Float32Array(numAmount * 3);
		const radians = new Float32Array(numAmount);
		const radiuses = new Float32Array(numAmount);
		const delays = new Float32Array(numAmount);

		const spread = this.dnaParams.entrySpread;

		// Create helix strands
		for (let i = 0; i < numHelix; i++) {
			const t = i / numHelix;
			positions[i * 3] = (t * 2 - 1) * helixLength + randomOffset(3);
			positions[i * 3 + 1] = randomOffset(3);
			positions[i * 3 + 2] = randomOffset(3);
			// Random spread positions for entry animation
			randomPositions[i * 3] = (Math.random() - 0.5) * spread;
			randomPositions[i * 3 + 1] = (Math.random() - 0.5) * spread;
			randomPositions[i * 3 + 2] = (Math.random() - 0.5) * spread;
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
				// Random spread positions for entry animation
				randomPositions[idx * 3] = (Math.random() - 0.5) * spread;
				randomPositions[idx * 3 + 1] = (Math.random() - 0.5) * spread;
				randomPositions[idx * 3 + 2] = (Math.random() - 0.5) * spread;
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
		geometry.setAttribute(
			'randomPos',
			new THREE.BufferAttribute(randomPositions, 3)
		);
		geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 3));
		geometry.setAttribute('radian', new THREE.BufferAttribute(radians, 1));
		geometry.setAttribute('radius', new THREE.BufferAttribute(radiuses, 1));
		geometry.setAttribute('delay', new THREE.BufferAttribute(delays, 1));

		// Build material
		const material = new THREE.ShaderMaterial({
			uniforms: {
				time: { value: 0 },
				entryProgress: { value: 0 },
				entryStagger: { value: this.dnaParams.entryStagger },
				rotationSpeed: { value: this.dnaParams.rotationSpeed },
				wiggleSpeed: { value: this.dnaParams.wiggleSpeed },
				scaleBase: { value: this.dnaParams.scaleBase },
				scaleAmplitude: { value: this.dnaParams.scaleAmplitude },
				scaleSpeed: { value: this.dnaParams.scaleSpeed },
				rayOrigin: { value: new THREE.Vector3() },
				rayDir: { value: new THREE.Vector3(0, 0, -1) },
				mouseVelocity: { value: new THREE.Vector3() },
				mouseRadius: { value: this.dnaParams.mouseRadius },
				mouseStrength: { value: this.dnaParams.mouseStrength },
				trailStrength: { value: this.dnaParams.trailStrength },
				particleColor: {
					value: new THREE.Vector3(
						this.dnaParams.particleColor.r,
						this.dnaParams.particleColor.g,
						this.dnaParams.particleColor.b
					),
				},
			},
			vertexShader: dnaVertexShader,
			fragmentShader: dnaFragmentShader,
			transparent: true,
			depthWrite: false,
		});

		this.dnaParticles = new THREE.Points(geometry, material);
		this.scene.add(this.dnaParticles);
	}

	addDebug() {
		const pane = new Pane();

		const geometryFolder = pane.addFolder({ title: 'Geometry' });
		geometryFolder
			.addBinding(this.dnaParams, 'numHelix', {
				min: 1000,
				max: 100000,
				step: 100,
				label: 'Helix Particles',
			})
			.on('change', () => this.createDNA());
		geometryFolder
			.addBinding(this.dnaParams, 'numLineSpace', {
				min: 20,
				max: 100,
				step: 5,
				label: 'Base Pairs',
			})
			.on('change', () => this.createDNA());
		geometryFolder
			.addBinding(this.dnaParams, 'numLine', {
				min: 20,
				max: 1000,
				step: 50,
				label: 'Base Pair Density',
			})
			.on('change', () => this.createDNA());
		geometryFolder
			.addBinding(this.dnaParams, 'helixLength', {
				min: 50,
				max: 300,
				step: 10,
				label: 'Helix Length',
			})
			.on('change', () => this.createDNA());
		geometryFolder
			.addBinding(this.dnaParams, 'helixRadius', {
				min: 5,
				max: 50,
				step: 1,
				label: 'Helix Radius',
			})
			.on('change', () => this.createDNA());
		geometryFolder
			.addBinding(this.dnaParams, 'particleColor', {
				label: 'Particle Color',
				color: { type: 'int' },
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.particleColor.value.set(
						ev.value.r,
						ev.value.g,
						ev.value.b
					);
				}
			});

		const animationFolder = pane.addFolder({ title: 'Animation' });
		animationFolder
			.addBinding(this.dnaParams, 'rotationSpeed', {
				min: 0,
				max: 2,
				step: 0.01,
				label: 'Rotation Speed',
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.rotationSpeed.value = ev.value;
				}
			});
		animationFolder
			.addBinding(this.dnaParams, 'wiggleSpeed', {
				min: 0,
				max: 10,
				step: 0.1,
				label: 'Wiggle Speed',
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.wiggleSpeed.value = ev.value;
				}
			});

		const scaleFolder = pane.addFolder({ title: 'Scale' });
		scaleFolder
			.addBinding(this.dnaParams, 'scaleBase', {
				min: 0.1,
				max: 2.0,
				step: 0.1,
				label: 'Base',
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.scaleBase.value = ev.value;
				}
			});
		scaleFolder
			.addBinding(this.dnaParams, 'scaleAmplitude', {
				min: 0,
				max: 1.0,
				step: 0.05,
				label: 'Amplitude',
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.scaleAmplitude.value = ev.value;
				}
			});
		scaleFolder
			.addBinding(this.dnaParams, 'scaleSpeed', {
				min: 0,
				max: 10,
				step: 0.1,
				label: 'Speed',
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.scaleSpeed.value = ev.value;
				}
			});

		const mouseFolder = pane.addFolder({ title: 'Mouse' });
		mouseFolder
			.addBinding(this.dnaParams, 'mouseRadius', {
				min: 5,
				max: 50,
				step: 1,
				label: 'Radius',
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.mouseRadius.value = ev.value;
				}
			});
		mouseFolder
			.addBinding(this.dnaParams, 'mouseStrength', {
				min: 0,
				max: 30,
				step: 1,
				label: 'Strength',
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.mouseStrength.value = ev.value;
				}
			});
		mouseFolder.addBinding(this.dnaParams, 'mouseLerp', {
			min: 0.01,
			max: 1,
			step: 0.01,
			label: 'Smoothness',
		});
		mouseFolder
			.addBinding(this.dnaParams, 'trailStrength', {
				min: 0,
				max: 20,
				step: 1,
				label: 'Trail',
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.trailStrength.value = ev.value;
				}
			});

		const entryFolder = pane.addFolder({ title: 'Entry Animation' });
		entryFolder.addBinding(this.dnaParams, 'entryDuration', {
			min: 0.5,
			max: 10,
			step: 0.1,
			label: 'Duration',
		});
		entryFolder
			.addBinding(this.dnaParams, 'entryStagger', {
				min: 0,
				max: 1,
				step: 0.05,
				label: 'Stagger',
			})
			.on('change', (ev) => {
				if (this.dnaParticles) {
					this.dnaParticles.material.uniforms.entryStagger.value = ev.value;
				}
			});
		entryFolder
			.addBinding(this.dnaParams, 'entrySpread', {
				min: 50,
				max: 300,
				step: 10,
				label: 'Spread',
			})
			.on('change', () => this.createDNA());
		entryFolder.addButton({ title: 'Replay' }).on('click', () => {
			this.clock = new THREE.Clock();
		});

		const cameraFolder = pane.addFolder({ title: 'Camera' });
		const updateCamera = () => {
			this.camera.position.set(
				this.cameraParams.posX,
				this.cameraParams.posY,
				this.cameraParams.posZ
			);
			this.controls.target.set(
				this.cameraParams.lookX,
				this.cameraParams.lookY,
				this.cameraParams.lookZ
			);
			this.controls.update();
		};
		cameraFolder
			.addBinding(this.cameraParams, 'posX', {
				min: -100,
				max: 100,
				label: 'Pos X',
			})
			.on('change', updateCamera);
		cameraFolder
			.addBinding(this.cameraParams, 'posY', {
				min: -100,
				max: 100,
				label: 'Pos Y',
			})
			.on('change', updateCamera);
		cameraFolder
			.addBinding(this.cameraParams, 'posZ', {
				min: 20,
				max: 150,
				label: 'Pos Z',
			})
			.on('change', updateCamera);
		cameraFolder
			.addBinding(this.cameraParams, 'lookX', {
				min: -100,
				max: 100,
				label: 'Look X',
			})
			.on('change', updateCamera);
		cameraFolder
			.addBinding(this.cameraParams, 'lookY', {
				min: -100,
				max: 100,
				label: 'Look Y',
			})
			.on('change', updateCamera);
		cameraFolder
			.addBinding(this.cameraParams, 'lookZ', {
				min: -50,
				max: 50,
				label: 'Look Z',
			})
			.on('change', updateCamera);
		cameraFolder
			.addBinding(this.cameraParams, 'rotZ', {
				min: -180,
				max: 180,
				label: 'Roll',
			})
			.on('change', updateCamera);
	}

	onMouseMove(event) {
		this.mouse.x = (event.clientX / this.sizes.width) * 2 - 1;
		this.mouse.y = -(event.clientY / this.sizes.height) * 2 + 1;
	}

	addAnim() {
		const elapsedTime = this.clock.getElapsedTime();

		if (this.dnaParticles) {
			this.dnaParticles.material.uniforms.time.value = elapsedTime;

			// Entry animation progress (0 to 1)
			const entryProgress = Math.min(
				elapsedTime / this.dnaParams.entryDuration,
				1.0
			);
			this.dnaParticles.material.uniforms.entryProgress.value = entryProgress;

			// Lerp mouse position for smooth trailing effect
			this.mouseLerped.lerp(this.mouse, this.dnaParams.mouseLerp);

			// Update mouse ray for depth-aware interaction
			this.raycaster.setFromCamera(this.mouseLerped, this.camera);

			// Calculate velocity from ray origin movement
			this.mouseVelocity.subVectors(
				this.raycaster.ray.origin,
				this.prevRayOrigin
			);
			this.prevRayOrigin.copy(this.raycaster.ray.origin);

			this.dnaParticles.material.uniforms.rayOrigin.value.copy(
				this.raycaster.ray.origin
			);
			this.dnaParticles.material.uniforms.rayDir.value.copy(
				this.raycaster.ray.direction
			);
			this.dnaParticles.material.uniforms.mouseVelocity.value.copy(
				this.mouseVelocity
			);
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

		// Apply camera roll after controls update
		this.camera.rotation.z = (this.cameraParams.rotZ * Math.PI) / 180;

		this.renderer.render(this.scene, this.camera);
		window.requestAnimationFrame(this.render.bind(this));
	}
}

new Sketch();
