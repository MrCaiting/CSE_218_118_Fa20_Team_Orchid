var canvas = document.getElementById("renderCanvas");

var uploadAudio = function () {
    const storageRef = firebase.storage().ref();

    var uploader = document.getElementById('uploader');
    var fileButton = document.getElementById('fileButton');
    fileButton.addEventListener('change', function (e) {
        var file = e.target.files[0];
        var storageRef = firebase.storage().ref(file.name);
        var task = storageRef.put(file);
        task.on('state_changed', function progress(snapshot) {
            var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            uploader.value = percentage;
        }, function error(err) {
            console.log(error.code);
        }, function complete() {
            // Upload completed successfully, now we can get the download URL
            task.snapshot.ref.getDownloadURL()
                .then(function (url) {
                    downloadURL = url;

                    const newMusic = {
                        userHandle: "test",
                        name: "sample1",
                        createdAt: new Date().toISOString(),
                        audioUrl: downloadURL
                    };

                    db.collection('musics')
                        .add(newMusic)
                        .then(doc => { })
                        .catch(err => {
                            res.status(500).json({ error: `something went wrong` });
                            console.error(err);
                        })

                    console.log('File available at', downloadURL);
                });
        });
    });  
}

var createScene = function () {
    var scene = new BABYLON.Scene(engine);

    // Lights
    var light0 = new BABYLON.DirectionalLight("Omni", new BABYLON.Vector3(-2, -5, 2), scene);
    var light1 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(2, -5, -2), scene);

    // Need a free camera for collisions
    var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 5, -20), scene);
    camera.minZ = .01;
    camera.attachControl(canvas, true);


    //Simple crate
    var box = new BABYLON.MeshBuilder.CreateBox("crate", {
        width: 40,
        height: 10,
        depth: 40,
        sideOrientation: 1
    }, scene);

    box.material = new BABYLON.StandardMaterial("Mat", scene);
    box.material.diffuseTexture = new BABYLON.Texture("textures/wood.jpg", scene);
    box.material.specularColor = new BABYLON.Color3.Black();
    box.position = new BABYLON.Vector3(0, 1, -20);


    //WILL CREATE FUNCTION TO REDUCE REDUDANT CODE
    //Create Plane For Ceiling
    var ceiling = BABYLON.MeshBuilder.CreatePlane("plane", {height:40, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    var ceilingMaterial = new BABYLON.StandardMaterial("ceilingColor", scene);
    
    //Postioning plane to the middle of the room
    ceiling.position = new BABYLON.Vector3(0, 5, -20);
    ceilingMaterial.diffuseColor = new BABYLON.Color3(0,0,0);

    //Rotating plane to fit in ceiling
    ceiling.rotation.x = Math.PI / 2;
    ceiling.material = ceilingMaterial;

    /******************** Create Plane For Wall 1 (front) *********************/
    var wall1 = BABYLON.MeshBuilder.CreatePlane("wall1", {height:10, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    var wallMaterial = new BABYLON.StandardMaterial("wallColor", scene);
    
    //Postioning plane to the middle of the room
    wall1.position = new BABYLON.Vector3(0, 0, -1);
    wallMaterial.diffuseColor = new BABYLON.Color3(1,0,1);

    //Rotating plane to fit in wall
    //ceiling.rotation.x = Math.PI / 2;
    wall1.material = wallMaterial;

    /******************** Create Plane For Wall 2 (left) *********************/
    var wall2 = BABYLON.MeshBuilder.CreatePlane("wall2", {height:10, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    var wallMaterial = new BABYLON.StandardMaterial("wallColor", scene);
    
    //Postioning plane to the middle of the room
    wall2.position = new BABYLON.Vector3(-19.5, 0, -20);
    wallMaterial.diffuseColor = new BABYLON.Color3(1,0,1);

    //Rotating plane to fit in wall
    wall2.rotation.y = -(Math.PI / 2);
    wall2.material = wallMaterial;

    /******************** Create Plane For Wall 3 (right) *********************/
    var wall3 = BABYLON.MeshBuilder.CreatePlane("wall3", {height:10, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    var wallMaterial = new BABYLON.StandardMaterial("wallColor", scene);
    
    //Postioning plane to the middle of the room
    wall3.position = new BABYLON.Vector3(19.5, 0, -20);
    wallMaterial.diffuseColor = new BABYLON.Color3(1,0,1);

    //Rotating plane to fit in wall
    wall3.rotation.y = (Math.PI / 2);
    wall3.material = wallMaterial;

     /******************** Create Plane For Wall 4 (back) *********************/
     var wall4 = BABYLON.MeshBuilder.CreatePlane("wall3", {height:10, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
     var wallMaterial = new BABYLON.StandardMaterial("wallColor", scene);
     
     //Postioning plane to the middle of the room
     wall4.position = new BABYLON.Vector3(0, 0, -39.5);
     wallMaterial.diffuseColor = new BABYLON.Color3(1,0,1);
 
     //Rotating plane to fit in wall
     wall4.rotation.y = -(Math.PI);
     wall4.material = wallMaterial;

    //Set gravity for the scene (G force like, on Y-axis)
    scene.gravity = new BABYLON.Vector3(0, -0.9, 0);

    // Enable Collisions
    scene.collisionsEnabled = true;
    box.checkCollisions = true;
    wall1.checkCollisions = true;
    wall2.checkCollisions = true;
    wall3.checkCollisions = true;
    wall4.checkCollisions = true;
    //Then apply collisions and gravity to the active camera
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera._needMoveForGravity = true;

    // Enable VR
    var vrHelper = scene.createDefaultVRExperience({createDeviceOrientationCamera:false});
    vrHelper.enableTeleportation({floorMeshes: [box]});

    // Audio Creation
    var isMusicPlaying = false;
    var music = new BABYLON.Sound("music", "guitar.mp3", scene, soundReady, { loop: true });
    // var musicUrl = "https://firebasestorage.googleapis.com/v0/b/orchid-87a13.appspot.com/o/example.mp3?alt=media&token=bb2fc8c7-9c71-49b9-8dd8-5c5b5125ea41";
    // var music = new BABYLON.Sound("Violons", "https://www.babylonjs-playground.com/sounds/violons11.wav", scene, soundReady, { loop: true });
    // var music = new BABYLON.Sound("Violons", musicUrl, scene, soundReady, { loop: true });
    // var music = new Audio(musicUrl);

    console.log("can print things on here");

    function soundReady() {
        if (isMusicPlaying) {
            console.log("Sound is being paused");
            music.pause();
            isMusicPlaying = false;
        }
        else {
            console.log("Sound is being played");
            music.play();
            isMusicPlaying = true;
        }
    }
    // Audio Toggle on Spacebar (Convert later to WebVR button when interacting with object)
    window.addEventListener("keydown", function (evt) {
        // Press space key to toggle music
        if (evt.keyCode === 32) {
            soundReady();
        }
    });
    var audioBox = BABYLON.Mesh.CreateBox("crate", 2, scene);
    audioBox.material = new BABYLON.StandardMaterial("Mat", scene);
    audioBox.position = new BABYLON.Vector3(0, -3, -7);
    music.attachToMesh(audioBox);
    return scene;
}

var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
var scene = createScene();

engine.runRenderLoop(function () {
    if (scene) {
        scene.render();
    }
});

// Resize
window.addEventListener("resize", function () {
    engine.resize();
});

// test upload 
uploadAudio();