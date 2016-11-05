const THREE = require("three-js")();
const OrbitControls = require("three-orbit-controls")(THREE);
const datGui = require("dat-gui");
const request = require('request');
const gsap = require('gsap');

//cam movement
let mouseX, mouseY;

//boilerplate
var container = document.createElement('div');
container.setAttribute("id", "container");
document.body.appendChild(container);
let camera, scene, renderer;

let moonMesh;
let controls;

let loader = new THREE.JSONLoader();

let pointLight, dirLight;
let dirLightX, dirLightY, dirLightZ;
let lightFocus = new THREE.Object3D();

function main() {
    //fetch current moon phase data
    request('http://api.burningsoul.in/moon', function(err, res, body) {
        let resJSON;

        function fillMoonData(res) {
            // console.log(res);

            setInterval(function() {

                let currentTS = Date.now();
                let tillFullMoonTS = res.FM.UT * 1000;
                let tillNewMoonTS = res.NNM.UT * 1000;

                let FMDiff = tillFullMoonTS - currentTS;
                let NMDiff = tillNewMoonTS - currentTS;

                let secsTillNM = Math.floor((FMDiff / 1000) % 60);
                let minsTillNM = Math.floor((FMDiff / 1000 / 60) % 60);
                let hrsTillNM = Math.floor((FMDiff / (1000 * 60 * 60)) % 24);
                let daysTillNM = Math.floor(FMDiff / (1000 * 60 * 60 * 24));

                let secsTillFM = Math.floor((NMDiff / 1000) % 60);
                let minsTillFM = Math.floor((NMDiff / 1000 / 60) % 60);
                let hrsTillFM = Math.floor((NMDiff / (1000 * 60 * 60)) % 24);
                let daysTillFM = Math.floor(NMDiff / (1000 * 60 * 60 * 24));

                document.getElementById("info1").innerText = "MOON PHASE: " + res.stage.toUpperCase();
                document.getElementById("info2").innerText = "ILLUMINATION: " + Math.floor(res.illumination) + "%";
                document.getElementById("info3").innerText = "DAYS SINCE LAST NEW MOON: " + Math.floor(res.age);
                document.getElementById("info4").innerText = "NEXT FULL MOON IN: \n " + +daysTillNM + " DAYS :: " + hrsTillNM + " HOURS :: " + minsTillNM + " MINUTES :: " + secsTillNM + " SECONDS ";
                document.getElementById("info5").innerText = "NEXT NEW MOON IN: \n " + +daysTillFM + " DAYS :: " + hrsTillFM + " HOURS :: " + minsTillFM + " MINUTES :: " + secsTillFM + " SECONDS ";
                document.getElementById("info6").innerText = "CURRENT DISTANCE FROM EARTH'S CORE: " + res.DFCOE + " KM";
                document.getElementById("info7").innerText = "CURRENT DISTANCE FROM THE SUN: " + res.DFS + " KM";
            }, 1000);

        }

        if (!err && res.statusCode == 200) {
            resJSON = JSON.parse(body);
            fillMoonData(resJSON);
            init(resJSON);
            render();
        }
    });


    function init(resJSON) {
        camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 2000);
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
        controls = new OrbitControls(camera, renderer.domElement);


        //light

        pointLight = new THREE.PointLight(0xffffff, 1, 0);
        pointLight.position.set(0, 100, 100);
        scene.add(pointLight);

        // let ambiLight = new THREE.AmbientLight(0xffffff, .1);
        // ambiLight.position.set(0,0,100);
        // scene.add(ambiLight);

        // scene.add(lightFocus);
        // dirLight = new THREE.DirectionalLight(0xffffff, 1);

        // dirLight.castShadow = false;
        // dirLight.target = lightFocus;
        // dirLight.position.z = 500;
        // dirLight.position.y = 400;
        // scene.add(dirLight);
        // console.log(dirLight);

        //sexy moon
        const material = new THREE.MeshStandardMaterial({
            map: THREE.ImageUtils.loadTexture('images/moon-4k.png'),
            normalMap: THREE.ImageUtils.loadTexture('images/moon_normal.jpg'),
            roughness: 0
        });
        loader.load('./models/Moon1.json', function(geometry) {
            moonMesh = new THREE.Mesh(geometry, material);
            console.log(moonMesh);
            moonMesh.material.map.minFilter = THREE.NearestFilter;
            scene.add(moonMesh);
        });


        let waxing = resJSON.stage == "waxing" ? true : false;
        let illumination = Math.floor(resJSON.illumination);

        // dummy testing object
        // let dummy = {};
        // dummy.stage = "waxing";
        // dummy.illumination = 62;
        // let waxing = dummy.stage == "waxing" ? true : false;
        // let illumination = Math.floor(dummy.illumination);


        // Phasing calculations
        // Waxing: X decreasing from 500 to 0, Y increasing from -500 to 500
        // Waning: X decreasing from 0 to -500, Y decrasing from 500 to -500
        //from API: Illumination 0-100 and waxing/waning.



        //if waxing
        // X = 500
        // Y = -500 + illumination * 10
        //if waning
        // X = -500
        // Y = illumination * 10 -500
        // console.log(waxing, illumination);
        if (waxing) {
            pointLight.position.x = 500;
            pointLight.position.y = -500 + illumination * 10;
            console.log("waxing, " + pointLight.position.x + " " + pointLight.position.y);
        } else {
            pointLight.position.x = -500;
            pointLight.position.y = illumination * 10 - 500;
            console.log("waning, " + pointLight.position.x + " " + pointLight.position.y);
        }

        // change light intensity based on illumination
        if (illumination > 80) {
            pointLight.intensity = 5;
        } else if (illumination < 80 && illumination > 60) {
            pointLight.intensity = 4;
        } else if (illumination < 60 && illumination > 40) {
            pointLight.intensity = 3;
        } else if (illumination < 40 && illumination > 20) {
            pointLight.intensity = 2;
        } else if (illumination < 20 && illumination > 1) {
            pointLight.intensity = 1.5;
        } else {
            pointLight.intensity = 0;
        }

        //DAT GUI
        // const gui = new datGui.GUI();
        // gui.add(pointLight.position, 'x', -500, 500);
        // gui.add(pointLight.position, 'y', -500, 500);
        // gui.add(pointLight.position, 'z', -500, 500);
        //

        document.onmouseup = function(e) {
                TweenLite.to(camera.position, 2, {
                    ease: Power4.easeOut,
                    x: 0,
                    y: 0,
                    z: 3
                });

            }
            // end INIT
    }

    function render() {
        animate();
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    function animate() {

        controls.update();
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

main();
