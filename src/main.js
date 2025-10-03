import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

import vertexShader from './shaders/vertex.glsl';
import fragmentShader from './shaders/fragment.glsl';

export default class Sketch {
	constructor() {
		// Sizes
		this.sizes = {
			width: window.innerWidth,
			height: window.innerHeight,
		}
		// Init Renderer
		this.canvas = document.querySelector('canvas.webgl');

		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true
		});
		this.renderer.setSize(this.sizes.width, this.sizes.height);
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

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
		this.controls = new OrbitControls(this.camera, this.canvas)
		this.controls.enableDamping = true
	}

	addCamera() {
		this.camera = new THREE.PerspectiveCamera(
			70,
			this.sizes.width / this.sizes.height,
			0.01,
			10
		);
		this.camera.position.z = 1;
	}

	addMesh() {
		this.geometry = new THREE.PlaneGeometry(1, 1, 1, 1);

		this.material = new THREE.ShaderMaterial({
			vertexShader: vertexShader,
			fragmentShader: fragmentShader,
			uniforms: {
				progress: { value: 0 },
			},
			side: THREE.DoubleSide,
		});

		this.mesh = new THREE.Mesh(this.geometry, this.material);
		this.scene.add(this.mesh);
	}

	addDebug() {
		const gui = new dat.GUI();
		gui.add(this.material.uniforms.progress, 'value').min(0.1).max(10).step(0.001).name('uProgress');
	}

	addAnim() {
		const elapsedTime = this.clock.getElapsedTime();
		// console.log(elapsedTime);
	}

	resize() {
		// Update sizes
    this.sizes.width = window.innerWidth
    this.sizes.height = window.innerHeight

    // Update camera
    this.camera.aspect = this.sizes.width / this.sizes.height
    this.camera.updateProjectionMatrix()

    // Update renderer
    this.renderer.setSize(this.sizes.width, this.sizes.height)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
	}

	render() {
		this.addAnim()

		// Update controls
    this.controls.update();

		this.renderer.render(this.scene, this.camera);
		window.requestAnimationFrame(this.render.bind(this));
	}
}

new Sketch();
