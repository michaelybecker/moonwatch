const THREE = require("three-js")();
// const OrbitControls = require("three-orbit-controls")(THREE);
const datGui = require("dat-gui");
const request = require('request');

let sphere;

//boilerplate
var container = document.createElement('div');
container.setAttribute("id", "container");
document.body.appendChild(container);
let camera, scene, renderer;

let moonMesh;
// let controls;

let loader = new THREE.JSONLoader();

let pointLight;

function init() {
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.z = 3;
    scene = new THREE.Scene();
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000);
    container.appendChild(renderer.domElement);
    window.addEventListener('resize', onWindowResize, false);
    // controls = new OrbitControls(camera, renderer.domElement);


    //light
    pointLight = new THREE.PointLight(0xffffff, 2, 0);
    pointLight.position.set(0, 0, 100);
    scene.add(pointLight);

    // let ambiLight = new THREE.AmbientLight(0xffffff, 2);
    // ambiLight.position.set(0,0,100);
    // scene.add(ambiLight);


    //DAT GUI
    const gui = new datGui.GUI();
    gui.add(pointLight.position, 'x', -500, 500);
    gui.add(pointLight.position, 'y', -500, 500);
    gui.add(pointLight.position, 'z', -500, 500);



    //test sphere
    const sphereGeo = new THREE.BoxGeometry(20,20,20);
    const sphereMat = new THREE.MeshPhongMaterial({color: 0xff00ff});
    sphere = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphere);

    //sexy moon
    const material = new THREE.MeshStandardMaterial({
        map: THREE.ImageUtils.loadTexture('images/moon-4k.png'),
        normalMap: THREE.ImageUtils.loadTexture('images/moon_normal.jpg')
    });
    loader.load('./models/Moon1.json', function(geometry) {
        moonMesh = new THREE.Mesh(geometry, material);
        // moonMesh.scale.set(10,10,10);
        scene.add(moonMesh);
    });




// end INIT
}

function render() {
    animate();
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}

function animate() {
    if (moonMesh) {
        moonMesh.rotation.y -= 0.0001;
    }
    // controls.update();
//     console.log(pointLight.position.x, pointLight.position.y, pointLight.position.z);
//     sphere.position.x = pointLight.position.x;
// sphere.position.y = pointLight.position.y;
// sphere.position.z = pointLight.position.z;
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

//fetch current moon phase data
request('http://api.burningsoul.in/moon', function(err, res, body) {
  if(!err &&res.statusCode == 200) {
    console.log(body);
  }
  init();
 render();
});
