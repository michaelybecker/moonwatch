const THREE = require("three-js")();
const OrbitControls = require("three-orbit-controls")(THREE);
const datGui = require("dat-gui");
const request = require('request');
const gsap = require('gsap');

//threejs boilerplate
var container = document.createElement('div');
container.setAttribute("id", "container");
document.body.appendChild(container);
let camera, scene, renderer, controls;

let loadManager = new THREE.LoadingManager(),
    loader = new THREE.JSONLoader(loadManager),
    tLoader = new THREE.TextureLoader(loadManager);
let moon;
let pointLight;

function main() {
    //fetch current moon data
    request('http://api.burningsoul.in/moon', function(err, res, body) {
        if (!err && res.statusCode == 200) {
            let resJSON = JSON.parse(body);
            fillMoonData(resJSON);
            init(resJSON);
            render();
        }

        //get moon data, update every second
        function fillMoonData(res) {
            setInterval(function() {
                // fetch UNIX timestamps
                let currentTS = Date.now();
                let fullMoonTS = res.FM.UT * 1000;
                let newMoonTS = res.NNM.UT * 1000;

                // calc countdown to New Moon and Full Moon
                let FMDiff = fullMoonTS - currentTS;
                let NMDiff = newMoonTS - currentTS;

                let secsTillNM = Math.floor((FMDiff / 1000) % 60);
                let minsTillNM = Math.floor((FMDiff / 1000 / 60) % 60);
                let hrsTillNM = Math.floor((FMDiff / (1000 * 60 * 60)) % 24);
                let daysTillNM = Math.floor(FMDiff / (1000 * 60 * 60 * 24));

                let secsTillFM = Math.floor((NMDiff / 1000) % 60);
                let minsTillFM = Math.floor((NMDiff / 1000 / 60) % 60);
                let hrsTillFM = Math.floor((NMDiff / (1000 * 60 * 60)) % 24);
                let daysTillFM = Math.floor(NMDiff / (1000 * 60 * 60 * 24));

                // next time use a framework!
                document.getElementById("info1").innerText = "MØØN PHASE: " + res.stage.toUpperCase();
                document.getElementById("info2").innerText = "ILLUMINATIØN: " + Math.floor(res.illumination) + "%";
                document.getElementById("info3").innerText = "DAYS SINCE LAST NEW MØØN: " + Math.floor(res.age);
                document.getElementById("info4").innerText = "NEXT FULL MØØN IN: \n " + +daysTillNM + " DAYS :: " + hrsTillNM + " HØURS :: " + minsTillNM + " MINUTES :: " + secsTillNM + " SECØNDS ";
                document.getElementById("info5").innerText = "NEXT NEW MØØN IN: \n " + +daysTillFM + " DAYS :: " + hrsTillFM + " HØURS :: " + minsTillFM + " MINUTES :: " + secsTillFM + " SECØNDS ";
                document.getElementById("info6").innerText = "CURRENT DISTANCE FROM EARTH'S CØRE: " + res.DFCOE + " KM";
                document.getElementById("info7").innerText = "CURRENT DISTANCE FROM THE SUN: " + res.DFS + " KM";
            }, 1000);
        }
    });


    //threejs initialization
    function init(resJSON) {

        loadManager.onProgress = function(item, loaded, total) {
            console.log(item, loaded, total);
            document.getElementById("loading-screen").innerText = "Loading resource " + loaded + " of " + total;
            if (loaded == total) {
                document.getElementById("loading-screen").innerText = "";
                let terminalLines = document.getElementsByClassName("terminal");
                console.log(terminalLines);
                  for (const line of terminalLines) {
                  line.style.visibility = "visible";
                }
            }
        }


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

        //load moon
        const material = new THREE.MeshStandardMaterial({
            map: tLoader.load('images/moon-4k.png'),
            normalMap: tLoader.load('images/moon_normal.jpg'),
            roughness: 0
        });
        loader.load('./models/Moon1.json', function(geometry) {
            moon = new THREE.Mesh(geometry, material);
            moon.material.map.minFilter = THREE.NearestFilter;
            scene.add(moon);
            moon.rotation.set(-3.1574931502098282, 0.09398952589047571, -0.23115874171955486);

            //DAT GUI
            // const gui = new datGui.GUI();
            // var xx = gui.add(moon.rotation, 'x', -5, 5);
            // gui.add(moon.rotation, 'y', -5, 5);
            // gui.add(moon.rotation, 'z', -5, 5);
            // xx.onChange(function(){console.log(moon.rotation)});
        });

        // optional dummy testing object
        // let dummy = {};
        // dummy.stage = "waxing";
        // dummy.illumination = 96;
        // let waxing = dummy.stage == "waxing" ? true : false;
        // let illumination = Math.floor(dummy.illumination);

        //real data from API: Illumination 0-100 and waxing/waning.
        let waxing = resJSON.stage == "waxing" ? true : false;
        let illumination = Math.floor(resJSON.illumination);

        // Phasing calculations
        //if close to full moon, set X in center
        if (illumination > 98) {
            pointLight.position.x = 0;
            pointLight.position.y = 500;
        } else {
            // Waxing: X decreasing from 500 to 0, Y increasing from -500 to 500
            // Waning: X decreasing from 0 to -500, Y decrasing from 500 to -500
            if (waxing) {
                pointLight.position.x = 500;
                pointLight.position.y = -500 + illumination * 10;
                // console.log("waxing, x:" + pointLight.position.x + " y:" + pointLight.position.y);
            } else if (!waxing) {
                pointLight.position.x = -500;
                pointLight.position.y = illumination * 10 - 500;
                // console.log("waning, x:" + pointLight.position.x + " y:" + pointLight.position.y);
            }
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




        document.onmouseup = function(e) {
            TweenLite.to(camera.position, 2, {
                ease: Power4.easeOut,
                x: 0,
                y: 0,
                z: 3
            });
        }

    } // end INIT

    //threejs rendering
    function render() {
        controls.update();
        requestAnimationFrame(render);
        renderer.render(scene, camera);
    }

    // onWindowResie helper
    function onWindowResize() {
        renderer.setSize(window.innerWidth, window.innerHeight);
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
    }

    // rotation helper

    function rotateAroundObjectAxis(object, axis, radians) {
        let rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
        object.matrix.multiply(rotObjectMatrix);
        object.rotation.setFromRotationMatrix(object.matrix);
    }
}

main();
