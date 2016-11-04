const THREE = require("three-js")();
// const OrbitControls = require("three-orbit-controls")(THREE);
const datGui = require("dat-gui");


//boilerplate
var container = document.createElement('div');
container.setAttribute("id", "container");
document.body.appendChild(container);
let camera, scene, renderer;

let moonMesh;
// let controls;

let loader = new THREE.JSONLoader();


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


    //lights
    // const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // directionalLight.position.set(-640, 320, 30);
    // scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 3);
    pointLight.position.set(0, 0, 300);
    scene.add(pointLight);


    //sexy moon
    const material = new THREE.MeshStandardMaterial({
        map: THREE.ImageUtils.loadTexture('images/moon-4k.png'),
        normalMap: THREE.ImageUtils.loadTexture('images/moon_normal.jpg')
    });
    loader.load('./models/Moon1.json', function(geometry) {
        moonMesh = new THREE.Mesh(geometry, material);
        scene.add(moonMesh);
    });


    //DAT GUI
    const gui = new datGui.GUI();
    gui.add(pointLight.position, 'x', -10000, 10000);
    gui.add(pointLight.position, 'y', -10000, 10000);
    // gui.add(pointLight.position, 'z', -2000, 2000);


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
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}


window.onload = init();
render();
