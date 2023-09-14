import * as THREE from "three";
import ASScroll from "@ashthornton/asscroll";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import fragment from "./shaders/fragment.glsl";
import vertex from "./shaders/vertex.glsl";
import testTexture from "./texture.jpg";
import * as dat from "dat.gui";
import gsap from "gsap";

export default class Sktech {
  constructor(options) {
    this.container = options.domElement;
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;

    this.camera = new THREE.PerspectiveCamera(
      80,
      this.width / this.height,
      10,
      1000
    );
    this.camera.position.z = 600;
    this.camera.fov = (2 * Math.atan(this.height / 2 / 600) * 180) / Math.PI;

    this.scene = new THREE.Scene();

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.materials = [];

    this.asscroll = new ASScroll({
      disableRaf: true,
    });

    this.asscroll.enable({
      horizontalScroll: true,
    });

    this.time = 0;
    // this.setupSettings();
    this.addObjects();
    this.resize();
    this.render();
    this.setupResize();
  }

  setupSettings() {
    this.settings = {
      progress: 0,
    };
    this.gui = new dat.GUI();
    this.gui.add(this.settings, "progress", 0, 1, 0.001);
  }

  resize() {
    this.width = this.container.offsetWidth;
    this.height = this.container.offsetHeight;
    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();

    this.materials.forEach((m) => {
      m.uniforms.uResolution.value.x = this.width;
      m.uniforms.uResolution.value.y = this.height;
    });

    this.imageStore.forEach((item) => {
      let bounds = item.img.getBoundingClientRect();
      item.mesh.scale.set(bounds.width, bounds.height, 1);
      item.top = bounds.top;
      item.left = bounds.left + this.asscroll.currentPos;
      item.width = bounds.width;
      item.height = bounds.height;

      item.mesh.material.uniforms.uQuadSize.value.x = bounds.width;
      item.mesh.material.uniforms.uQuadSize.value.y = bounds.height;

      item.mesh.material.uniforms.uTextureSize.value.x = bounds.width;
      item.mesh.material.uniforms.uTextureSize.value.y = bounds.height;
    });
  }

  setupResize() {
    window.addEventListener("resize", this.resize.bind(this));
  }

  addObjects() {
    this.geometry = new THREE.PlaneGeometry(1, 1, 100, 100);
    this.material = new THREE.ShaderMaterial({
      // wireframe: true,
      uniforms: {
        time: { value: 1.0 },
        uProgress: { value: 0 },
        uTexture: { value: new THREE.TextureLoader().load(testTexture) },
        uTextureSize: { value: new THREE.Vector2(100, 100) },
        uCorners: { value: new THREE.Vector4(0, 0, 0, 0) },
        uResolution: { value: new THREE.Vector2(this.width, this.height) },
        uQuadSize: { value: new THREE.Vector2(300, 300) },
      },
      vertexShader: vertex,
      fragmentShader: fragment,
    });

    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.scale.set(300, 300, 1);
    // this.scene.add(this.mesh);
    this.mesh.position.x = 300;

    this.images = [...document.querySelectorAll(".js-image")];
    this.imageStore = this.images.map((img) => {
      let bounds = img.getBoundingClientRect();
      let m = this.material.clone();
      this.materials.push(m);
      let texture = new THREE.TextureLoader().load(img.src);

      m.uniforms.uTexture.value = texture;

               img.addEventListener('mouseout',()=>{
                this.tl = gsap.timeline()
                .to(m.uniforms.uCorners.value,{
                    x:0,
                    duration: 0.4
                })
                .to(m.uniforms.uCorners.value,{
                    y:0,
                    duration: 0.4
                },0.1)
                .to(m.uniforms.uCorners.value,{
                    z:0,
                    duration: 0.4
                },0.2)
                .to(m.uniforms.uCorners.value,{
                    w:0,
                    duration: 0.4
                },0.3)
            })

      let mesh = new THREE.Mesh(this.geometry, m);
      this.scene.add(mesh);
      mesh.scale.set(bounds.width, bounds.height, 1);
      return {
        img: img,
        mesh: mesh,
        width: bounds.width,
        height: bounds.height,
        top: bounds.top,
        left: bounds.left,
      };
    });
  }

  setPosition() {
    this.imageStore.forEach((o) => {
      o.mesh.position.x =
        -this.asscroll.currentPos + o.left - this.width / 2 + o.width / 2;
      o.mesh.position.y = -o.top + this.height / 2 - o.height / 2;
    });
  }

  render() {
    this.time += 0.05;
    this.material.uniforms.time.value = this.time;
    // this.material.uniforms.uProgress.value = this.settings.progress;
    // this.tl.progress(this.settings.progress);
    this.asscroll.update();
    this.setPosition();
    this.mesh.rotation.x = this.time / 2000;
    this.mesh.rotation.y = this.time / 1000;

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.render.bind(this));
  }
}

new Sktech({
  domElement: document.getElementById("container"),
});
