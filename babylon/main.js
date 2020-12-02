class Dropdown
{
	constructor(advancedTexture, height, width)
	{
		// Members
        this.height = height;
        this.width = width;
        this.color = "black";
        this.background = "white";

        this.advancedTexture = advancedTexture;

        // Container
		this.container = new BABYLON.GUI.Container();
        this.container.width = this.width;
        this.container.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.container.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        this.container.isHitTestVisible = false;
        
        // Primary button
        this.button = BABYLON.GUI.Button.CreateSimpleButton(null, "Please Select");
        this.button.height = this.height;
        this.button.background = this.background;
        this.button.color = this.color;
        this.button.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;

        // Options panel
        this.options = new BABYLON.GUI.StackPanel();
        this.options.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.options.top = this.height;
        this.options.isVisible = false;
        this.options.isVertical = true;

        var _this = this;
        this.button.onPointerUpObservable.add(function() {
            _this.options.isVisible = !_this.options.isVisible;
        });

        //custom hack to make dropdown visible;
        this.container.onPointerEnterObservable.add(function(){
            _this.container.zIndex = 555; //some big value            
        });

        this.container.onPointerOutObservable.add(function(){
            _this.container.zIndex = 0; //back to original            
        });

        // add controls
        this.advancedTexture.addControl(this.container);
        this.container.addControl(this.button);
        this.container.addControl(this.options);        
	}

    get top() {
        return this.container.top;
    }

    set top(value) {
       this.container.top = value;     
    }

    get left() {
        return this.container.left;
    }

    set left(value) {
       this.container.left = value;     
    } 
	
    addOption(text, callback)
	{
        var button = BABYLON.GUI.Button.CreateSimpleButton(text, text);
        button.height = this.height;
        button.paddingTop = "-1px";
        button.background = this.background;
        button.color = this.color;
        button.alpha = 1.0;
        button.onPointerUpObservable.add(() => {
            this.options.isVisible = false;            
        });        
        button.onPointerClickObservable.add(callback); 
        this.options.addControl(button);
    }

    clearOptions(){
        this.options = new BABYLON.GUI.StackPanel();
        this.options.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_TOP;
        this.options.top = this.height;
        this.options.isVisible = false;
        this.options.isVertical = true;
    }
	
};



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
                        userHandle: "public",
                        name: file.name,
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

var loadMusic = async function (fileName, scene, soundReady, audioBox) {
    const storageRef = firebase.storage().ref();
    storageRef.child(fileName).getDownloadURL().then(url => {
        return axios({
            method: 'get',
            url: url,
            responseType: 'blob'
        })
    }).then(blob => {
        return blob.data.arrayBuffer();
    }).then(buffer => {
        music = new BABYLON.Sound("FromArrayBuffer", buffer, scene, soundReady, { 
            loop: true,
            autoplay: false
        });
        music.attachToMesh(audioBox);
    }).catch(function (error) {
        console.error(error);
    });
}

var displaySamples = async function (dropdown) {
    return db
        .collection('musics')
        .get()
        .then((data) => {
            let samples = [];
            data.forEach((doc) => {
                samples.push({
                    userHandle: doc.data().userHandle,
                    name: doc.data().name,
                    createdAt: doc.data().createdAt,
                    audioUrl: doc.data().audioUrl
                });
                dropdown.addOption(doc.data().name);
            });
            return samples;
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json({ error: err.code });
        });
}


var createScene = async function () {
    var scene = new BABYLON.Scene(engine);

    // Lights
    var light0 = new BABYLON.DirectionalLight("Omni", new BABYLON.Vector3(-10, -5, 10), scene);
    var light1 = new BABYLON.PointLight("Omni", new BABYLON.Vector3(2, -5, -2), scene);
    var hemisphericLight = new BABYLON.HemisphericLight("Omni", new BABYLON.Vector3(0, 10, -20), scene);

    // Need a free camera for collisions
    var camera = new BABYLON.FreeCamera("FreeCamera", new BABYLON.Vector3(0, 2, -20), scene);
    camera.minZ = .01;
    camera.attachControl(canvas, true);
    camera.speed = .75;


    //Simple crate
    var box = new BABYLON.MeshBuilder.CreateBox("crate", {
        width: 20,
        height: 7,
        depth: 20,
        sideOrientation: 1
    }, scene);


    //WILL CREATE FUNCTION TO REDUCE REDUDANT CODE
    //Create Plane For Ceiling
    // var ceiling = BABYLON.MeshBuilder.CreatePlane("plane", {height:40, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    // var ceilingMaterial = new BABYLON.StandardMaterial("ceilingColor", scene);
    
    // //Postioning plane to the middle of the room
    // ceiling.position = new BABYLON.Vector3(0, 5, -20);
    // ceilingMaterial.diffuseColor = new BABYLON.Color3(0,0,0);

    // //Rotating plane to fit in ceiling
    // ceiling.rotation.x = Math.PI / 2;
    // ceiling.material = ceilingMaterial;

    // /******************** Create Plane For Wall 1 (front) *********************/
    // var wall1 = BABYLON.MeshBuilder.CreatePlane("wall1", {height:10, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    // var wallMaterial = new BABYLON.StandardMaterial("wallColor", scene);
    
    // //Postioning plane to the middle of the room
    // wall1.position = new BABYLON.Vector3(0, 0, -1);
    // wallMaterial.diffuseColor = new BABYLON.Color3(1,0,1);

    // //Rotating plane to fit in wall
    // //ceiling.rotation.x = Math.PI / 2;
    // wall1.material = wallMaterial;

    // /******************** Create Plane For Wall 2 (left) *********************/
    // var wall2 = BABYLON.MeshBuilder.CreatePlane("wall2", {height:10, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    // var wallMaterial = new BABYLON.StandardMaterial("wallColor", scene);
    
    // //Postioning plane to the middle of the room
    // wall2.position = new BABYLON.Vector3(-19.5, 0, -20);
    // wallMaterial.diffuseColor = new BABYLON.Color3(1,0,1);

    // //Rotating plane to fit in wall
    // wall2.rotation.y = -(Math.PI / 2);
    // wall2.material = wallMaterial;

    // /******************** Create Plane For Wall 3 (right) *********************/
    // var wall3 = BABYLON.MeshBuilder.CreatePlane("wall3", {height:10, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    // var wallMaterial = new BABYLON.StandardMaterial("wallColor", scene);
    
    // //Postioning plane to the middle of the room
    // wall3.position = new BABYLON.Vector3(19.5, 0, -20);
    // wallMaterial.diffuseColor = new BABYLON.Color3(1,0,1);

    // //Rotating plane to fit in wall
    // wall3.rotation.y = (Math.PI / 2);
    // wall3.material = wallMaterial;

    //  /******************** Create Plane For Wall 4 (back) *********************/
    //  var wall4 = BABYLON.MeshBuilder.CreatePlane("wall3", {height:10, width: 40, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene);
    //  var wallMaterial = new BABYLON.StandardMaterial("wallColor", scene);
     
    //  //Postioning plane to the middle of the room
    //  wall4.position = new BABYLON.Vector3(0, 0, -39.5);
    //  wallMaterial.diffuseColor = new BABYLON.Color3(1,0,1);
 
    //  //Rotating plane to fit in wall
    //  wall4.rotation.y = -(Math.PI);
    //  wall4.material = wallMaterial;

    box.material = new BABYLON.StandardMaterial("Mat", scene);
    box.material.diffuseTexture = new BABYLON.Texture("textures/floor_texture.png", scene);
    box.material.specularColor = new BABYLON.Color3.Black();
    box.position = new BABYLON.Vector3(0, 1, -20);

    //Set gravity for the scene (G force like, on Y-axis)
    scene.gravity = new BABYLON.Vector3(0, -0.9, 0);

    // Enable Collisions
    scene.collisionsEnabled = true;
    box.checkCollisions = true;
    // wall1.checkCollisions = true;
    // wall2.checkCollisions = true;
    // wall3.checkCollisions = true;
    // wall4.checkCollisions = true;
    //Then apply collisions and gravity to the active camera
    camera.checkCollisions = true;
    camera.applyGravity = true;
    camera._needMoveForGravity = true;

    // Enable VR
    var vrHelper = scene.createDefaultVRExperience({createDeviceOrientationCamera:false});
    //vrHelper.enableTeleportation({floorMeshes: [box]});

    // Audio Creation
    var isMusicPlaying = true;
    //var music = new BABYLON.Sound("music", "guitar.mp3", scene, soundReady, { loop: true });
    var music1 = new BABYLON.Sound("rolling_A1", "rolling_A1.mp3", scene, soundReady, {loop: false});
    var music2 = new BABYLON.Sound("rolling_A2", "rolling_A2.mp3", scene, soundReady, {loop: false});
    var music3 = new BABYLON.Sound("rolling_S1", "rolling_S1.mp3", scene, soundReady, {loop: false});
    var music4 = new BABYLON.Sound("rolling_S2", "rolling_S2.mp3", scene, soundReady, {loop: false});
    var music5 = new BABYLON.Sound("rolling_S3", "rolling_S3.mp3", scene, soundReady, {loop: false});

    music1.setVolume(0.5);
    music2.setVolume(0.5);
    music3.setVolume(0.5);
    music4.setVolume(0.5);
    music5.setVolume(0.5);

    var soundsReady = 0;

    function soundReady() {
        soundsReady++;
        if(soundsReady >= 1) {
            if (isMusicPlaying) {
                console.log("Sound is being paused");
                music1.pause();
                music2.pause();
                music3.pause();
                music4.pause();
                music5.pause();
                isMusicPlaying = false;
            }
            else {
                console.log("Sound is being played");
                music1.play();
                music2.play();
                music3.play();
                music4.play();
                music5.play();
                isMusicPlaying = true;
            }
        }
    }
    // Audio Toggle on Spacebar (Convert later to WebVR button when interacting with object)
    window.addEventListener("keydown", function (evt) {
        // Press space key to toggle music
        if (evt.keyCode === 32) {
            soundReady();
        }
    });

    // Box in center of room: on spacebar will pause/play music
    var audioBox = BABYLON.Mesh.CreateBox("cube", 1, scene);
    audioBox.material = new BABYLON.StandardMaterial("Mat", scene);
    audioBox.position = new BABYLON.Vector3(-6.5, -2, -13);
    audioBox.isPickable = true;

    // var container =  BABYLON.SceneLoader.Load("", "computer_desk.glb", function(newScene){
    //     var meshes = newScene.meshes;
    
    //     meshes.forEach(function(item){
    //         item.isPickable = true;
    //         item.collisionsEnabled = true;
    //         item.checkCollisions = true;
    //     });
    // container.addAllToScene();


    var desk;
    meshisin = BABYLON.SceneLoader.ImportMesh("", "./", "computer_desk.glb", scene, function (newMeshes) {
        //scene.createDefaultCameraOrLight(true, true, true);
        desk = newMeshes[0];
        console.log("Loaded Mesh");
        desk.scaling.x = .01;
        desk.scaling.y = .01;
        desk.scaling.z = .01;
        desk.position = new BABYLON.Vector3(-8.5, -2.5, -18);
        desk.rotation = new BABYLON.Vector3(0,0,0);
        newMeshes.forEach(function(item){
            item.isPickable = true;
            item.collisionsEnabled = true;
            item.checkCollisions = true;
    
        });

    });
    var piano;
    meshisin = BABYLON.SceneLoader.ImportMesh("", "./", "piano.glb", scene, function (newMeshes) {
        //scene.createDefaultCameraOrLight(true, true, true);
        piano = newMeshes[0];
        console.log("Loaded Mesh2");
        piano.scaling.x = 3.5;
        piano.scaling.y = 3.5;
        piano.scaling.z = 3.5;
        piano.position = new BABYLON.Vector3(9.5, -2.5, -20);
        //desk.rotation = new BABYLON.Vector3(0,Math.PI/2,0);
        newMeshes.forEach(function(item){
            item.isPickable = true;
            item.collisionsEnabled = true;
            item.checkCollisions = true;
    
        });

    });
    var couch;
    meshisin = BABYLON.SceneLoader.ImportMesh("", "./", "couch.glb", scene, function (newMeshes) {
        //scene.createDefaultCameraOrLight(true, true, true);
        couch = newMeshes[0];
        console.log("Loaded Mesh2");
        couch.scaling.x = .03;
        couch.scaling.y = .03;
        couch.scaling.z = .03;
        couch.position = new BABYLON.Vector3(-6.55, -2.52, -25.5);
        couch.rotation = new BABYLON.Vector3(0,0,0);
        newMeshes.forEach(function(item){
            item.isPickable = true;
            item.collisionsEnabled = true;
            item.checkCollisions = true;
    
        });

    });
    var light;
    meshisin = BABYLON.SceneLoader.ImportMesh("", "./", "ceiling_light.glb", scene, function (newMeshes) {
        //scene.createDefaultCameraOrLight(true, true, true);
        light = newMeshes[0];
        console.log("Loaded Mesh2");
        light.scaling.x = .002;
        light.scaling.y = .0015;
        light.scaling.z = .002;
        light.position = new BABYLON.Vector3(0, 1.5, -22);
        //light.rotation = new BABYLON.Vector3(0,0,0);
        newMeshes.forEach(function(item){
            item.isPickable = true;
            item.collisionsEnabled = true;
            item.checkCollisions = true;
    
        });

    });

    var dynamicCylinder = BABYLON.Mesh.CreateCylinder("dynamicCylinder", 1, 1, 1, 24, 1, scene, true);
    dynamicCylinder.material = new BABYLON.StandardMaterial("Mat", scene);
    //dynamicCylinder.position = new BABYLON.Vector3(-6.5, -0, -7);
    dynamicCylinder.position = new BABYLON.Vector3(-6.5, 1, -13);

    dynamicCylinder.isPickable = true;
    dynamicCylinder.checkCollisions = true;

    // Sphere to pick up/place down
    var pickupSphere = BABYLON.Mesh.CreateSphere("pickupSphere", 32, 1, scene);
    //pickupSphere.position = new BABYLON.Vector3(-8, -3, -21);
    pickupSphere.position = new BABYLON.Vector3(-8, -2, -27);
    pickupSphere.isPickable = true;
    pickupSphere.checkCollisions = true;

    // Donut shape on top of audio box 
    var laneTorus = BABYLON.MeshBuilder.CreateTorus("laneAdd", {});
    laneTorus.material = new BABYLON.StandardMaterial("Mat", scene);
    //laneTorus.position = new BABYLON.Vector3(-6.5, -2, -7);
    laneTorus.position = new BABYLON.Vector3(-6.5, -1, -13);


    // Materials 
    var dawMaterial = new BABYLON.StandardMaterial("dawMaterial", scene);
    dawMaterial.ambientColor = new BABYLON.Color3(0.9, 0.9, 0.9);
    dawMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    dawMaterial.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

    var laneMaterial = new BABYLON.StandardMaterial("laneMaterial", scene);
    laneMaterial.ambientColor = new BABYLON.Color3(0.9, 0.9, 0.1);
    laneMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    laneMaterial.specularColor = new BABYLON.Color3(0.2, 0.1, 0.79);

     // Main Rectangle of the DAW 
     //w = 13.8, height = 5
    //var daw = BABYLON.MeshBuilder.CreatePlane("daw", {width: 13.8, height: 5, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene, true);
    //daw.position = new BABYLON.Vector3(0, -1, -4);
    var daw = BABYLON.MeshBuilder.CreatePlane("daw", {width: 13.8, height: 5, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene, true);
    daw.position = new BABYLON.Vector3(0, 0, -10.5);
    daw.material = dawMaterial;
    daw.checkCollisions = true;

    // Tab to represent initial project (more tabs in future)
    //var dawtab = BABYLON.MeshBuilder.CreatePlane("tab", {width: 3, height: 3, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene, true);
    //dawtab.position = new BABYLON.Vector3(-5.4, .5, -4);
    var dawtab = BABYLON.MeshBuilder.CreatePlane("tab", {width: 3, height: 3, sideOrientation: BABYLON.Mesh.DOUBLESIDE}, scene, true);
    dawtab.position = new BABYLON.Vector3(-5.4, 1.5, -10.5);
    dawtab.material = dawMaterial;

     // Play/Pause variables 
     var mainPlay = BABYLON.MeshBuilder.CreateDisc("main play", {tessellation: 3, radius:.3}, scene);
     //mainPlay.position = new BABYLON.Vector3(0, -2.8, -4.4);
     mainPlay.position = new BABYLON.Vector3(0, -1.8, -11);
     mainPlay.material = new BABYLON.StandardMaterial("Mat", scene);
 
     var mainPause = BABYLON.MeshBuilder.CreateDisc("main pause", {tessellation: 8, radius:.3}, scene);
     //mainPause.position = new BABYLON.Vector3(0, -2.8, -4.4);
     mainPause.position = new BABYLON.Vector3(0, -1.8, -11);
     mainPause.material = new BABYLON.StandardMaterial("Mat", scene);
     mainPause.setEnabled(false);
 
     var lane1Play = BABYLON.MeshBuilder.CreateDisc("lane1 play", {tessellation: 3, radius:.2}, scene);
     //lane1Play.position = new BABYLON.Vector3(-4.2, .2, -4.4);
     lane1Play.position = new BABYLON.Vector3(-4.2, 1.2, -11);
     lane1Play.material = new BABYLON.StandardMaterial("Mat", scene);
     lane1Play.setEnabled(false);
 
     var lane1Pause = BABYLON.MeshBuilder.CreateDisc("lane1 pause", {tessellation: 8, radius:.3}, scene);
     //lane1Pause.position = new BABYLON.Vector3(-4.2, .2, -4.4);
     lane1Pause.position = new BABYLON.Vector3(-4.2, 1.2, -11);
     lane1Pause.material = new BABYLON.StandardMaterial("Mat", scene);
     lane1Pause.setEnabled(false);
 
     var lane2Play = BABYLON.MeshBuilder.CreateDisc("lane2 play", {tessellation: 3, radius:.2}, scene);
     //lane2Play.position = new BABYLON.Vector3(-4.2, -1.4, -4.4);
     lane2Play.position = new BABYLON.Vector3(-4.2, -0.4, -11);
     lane2Play.material = new BABYLON.StandardMaterial("Mat", scene);
     lane2Play.setEnabled(false);
 
     var lane2Pause = BABYLON.MeshBuilder.CreateDisc("lane2 pause", {tessellation: 8, radius:.3}, scene);
     //lane2Pause.position = new BABYLON.Vector3(-4.2, -1.4, -4.4);
     lane2Pause.position = new BABYLON.Vector3(-4.2, -0.4, -11);
     lane2Pause.material = new BABYLON.StandardMaterial("Mat", scene);
     lane2Pause.setEnabled(false);

    // material for dynamic waveform objects
    var waveformMaterial = new BABYLON.StandardMaterial("texturePlane", scene);
    waveformMaterial.diffuseTexture = new BABYLON.Texture("textures/waveformjs.png", scene);
    waveformMaterial.specularColor = new BABYLON.Color3(0, 0, 0.1);
    waveformMaterial.backFaceCulling = false;

    // KEEP THIS PLEASE still testing
    /*scene.registerBeforeRender(function () {
        if (typeof dawFiles[0] !== 'undefined') {
            console.log("please work");
            dawFiles[0].onCollideObservable.add(() => {
                dawFiles[0].setParent(lanes[0]);
                console.log("this works!")
            });
            if(dawFiles[0].intersectsMesh(laneBoxes[0])) {
                console.log("this works");
                dawFiles[0].setParent(lanes[0]);
                dawFiles[0].rotation = dawFiles[0].parent.rotation;
                dawFiles[0].position.y = dawFiles[0].parent.position.y;
                dawFiles[0].position.x = dawFiles[0].parent.position.x;
            }
        }
    });*/

    var dawFiles = [];
    var lanes = [];
    var laneBoxes = [];
    scene.onPointerDown = function (evt, pickResult) {

        if (pickResult.hit) {
            if (pickResult.pickedMesh.name == "crate") {
                console.log("room clicked");
            }
            else if (pickResult.pickedMesh.name == "pickupSphere") {
                if (pickupSphere.parent == camera) {
                    pickupSphere.setParent(null);
                } else {
                    pickupSphere.setParent(camera);
                }
            }
            else if (pickResult.pickedMesh.name == "dynamicCylinder") {
                var name = "dawFile".concat(dawFiles.length.toString());
                console.log("name is: " + name);
                var obj = BABYLON.MeshBuilder.CreatePlane(name, {width:8,height:.8}, scene);
                obj.position = new BABYLON.Vector3(0, 1, -13);
                obj.height = 1;
                obj.width = 2;
                obj.checkCollisions = true;
                obj.setEnabled(true);
                console.log("height of obj is " + obj.height + " and width is " + obj.width);
                obj.material = waveformMaterial;
                switch(dawFiles.length) {
                    case 1:
                        music1.attachToMesh(obj);
                        break;
                    case 2:
                        music2.attachToMesh(obj);
                        break;
                    case 3:
                        music3.attachToMesh(obj);
                        break;
                    case 4:
                        music4.attachToMesh(obj);
                        break;
                    case 5:
                        music5.attachToMesh(obj);
                        break;
                }
                dawFiles.push(obj);
                console.log(obj);
            }
            // Lanes... WIP 
            else if (pickResult.pickedMesh.name == "laneAdd") {
                console.log("torus clicked and lane added");
                var lane1 = BABYLON.MeshBuilder.CreatePlane("lane1", {width: 9.8, height: 1}, scene);
                lane1.position = new BABYLON.Vector3(1.3, 1.2, -11);
                lane1.material = new BABYLON.StandardMaterial("Mat", scene);;
                lane1.setEnabled(true);
                lanes.push(lane1);
                console.log(lane1);
                var lane1box = BABYLON.MeshBuilder.CreateBox("lane1box", {width: 9.8, height: 1, depth: 2}, scene);
                lane1box.position = new BABYLON.Vector3(1.3, 1.2, -11);
                lane1box.isVisible = false;
                laneBoxes.push(lane1box);

                var lane2 = BABYLON.MeshBuilder.CreatePlane("lane2", {width: 9.8, height: 1}, scene);
                lane2.position = new BABYLON.Vector3(1.3, -0.4, -11);
                lane2.material = new BABYLON.StandardMaterial("Mat", scene);;
                lane2.setEnabled(true);
                lanes.push(lane2);
                console.log(lane2);
                var lane2box = BABYLON.MeshBuilder.CreateBox("lane1box", {width: 9.8, height: 1, depth: 2}, scene);
                lane2box.position = new BABYLON.Vector3(1.3, -0.4, -11);
                lane2box.isVisible = false;
                laneBoxes.push(lane2box);
                
                lane1Play.setEnabled(true);
                lane2Play.setEnabled(true);
            }
            else if (pickResult.pickedMesh.name.startsWith("dawFile")) {
                console.log("the " + pickResult.pickedMesh.name + " was selected.");
                if (pickResult.pickedMesh.parent == camera) {
                    pickResult.pickedMesh.setParent(null);
                    for( var laneBoxesI = 0; laneBoxesI < laneBoxes.length; laneBoxesI++) {
                        console.log("goes into this section at least for ", laneBoxesI);
                        if(pickResult.pickedMesh.intersectsMesh(laneBoxes[laneBoxesI])) {
                            console.log("parent is set to ", laneBoxes[laneBoxesI]);
                            pickResult.pickedMesh.setParent(lanes[laneBoxesI]);
                            pickResult.pickedMesh.rotation = pickResult.pickedMesh.parent.rotation;
                            pickResult.pickedMesh.position.y = 0;
                            pickResult.pickedMesh.position.z = -0.1;
                        }
                    }
                    
                    
                } else {
                    pickResult.pickedMesh.setParent(camera);
                }
            }
            // Main Play/Pause on DAW 
            else if (pickResult.pickedMesh.name == "main play") {
                console.log("main play has been clicked");
                mainPlay.setEnabled(false);
                mainPause.setEnabled(true);
            }
            else if (pickResult.pickedMesh.name == "main pause") {
                console.log("main pause has been clicked");
                mainPause.setEnabled(false);
                mainPlay.setEnabled(true);
            }

            // Lane Play/Pause
            else if (pickResult.pickedMesh.name == "lane1 play") {
                console.log("lane1 play has been clicked");
                lane1Play.setEnabled(false);
                lane1Pause.setEnabled(true);
            }
            else if (pickResult.pickedMesh.name == "lane1 pause") {
                console.log("lane1 pause has been clicked");
                lane1Pause.setEnabled(false);
                lane1Play.setEnabled(true);
            }
            else if (pickResult.pickedMesh.name == "lane2 play") {
                console.log("lane2 play has been clicked");
                lane2Play.setEnabled(false);
                lane2Pause.setEnabled(true);
            }
            else if (pickResult.pickedMesh.name == "lane2 pause") {
                console.log("lane2 pause has been clicked");
                lane2Pause.setEnabled(false);
                lane2Play.setEnabled(true);
            }

            // Cube that turns the DAW on and off 
            else if (pickResult.pickedMesh.name == "cube") {
                console.log("cube clicked and daw enabled is ", daw.isEnabled(false), dawtab.isEnabled(false), mainPlay.isEnabled(false), mainPause.isEnabled(false));
                if(daw.isEnabled(false), dawtab.isEnabled(false), mainPlay.isEnabled(false), mainPause.isEnabled(false) == true) {
                    daw.setEnabled(false), dawtab.setEnabled(false), mainPlay.setEnabled(false), mainPause.setEnabled(false);
                }
                else {
                    daw.setEnabled(true), dawtab.setEnabled(true), mainPlay.setEnabled(true), mainPause.setEnabled(true);
                }
            }
            if (pickResult.pickedMesh.name == "daw") {
                console.log("daw is clicked");

            }
            if (pickResult.pickedMesh.name == "tab") {
                console.log("tab is clicked");

            }
            
        }
    }

    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    var dropdownA = new Dropdown(advancedTexture, "40px", "250px");
    dropdownA.button.children[0].text = "My Library";
    dropdownA.top = "10px";
    dropdownA.right = "10px";
    samples = await displaySamples(dropdownA);

    // button = BABYLON.GUI.Button.CreateSimpleButton(null, "Reload");
    // button.width = "48px";
    // button.height = "86px";
    // button.thickness = 0;
    // button.verticalAlignment = 0;
    // button.horizontalAlignment = 1;
    // button.top = "60px";
    // advancedTexture.addControl(button);

    // const playerUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
    // samplePanel = createSamplePanel(playerUI);
    // playerUI.idealHeight = 720; //fit our fullscreen ui to this height
    // //create a simple button
    // const pauseBtn = BABYLON.GUI.Button.CreateSimpleButton("start", "SAMPLES");
    // pauseBtn.width = "48px";
    // pauseBtn.height = "86px";
    // pauseBtn.thickness = 0;
    // pauseBtn.verticalAlignment = 0;
    // pauseBtn.horizontalAlignment = 1;
    // pauseBtn.top = "-16px";
    // playerUI.addControl(pauseBtn);
    // pauseBtn.zIndex = 10;
    // this.pauseBtn = pauseBtn;
    // //this handles interactions with the start button attached to the scene
    // pauseBtn.onPointerClickObservable.add(async () => {
    //     var samples = await displaySamples();
    //     console.log(samples)
    //     samplePanel.isVisible = true;
    //     samplePanel.textBlock
    //     playerUI.addControl(samplePanel);
    // });

    return scene;
};

createSamplePanel = (playerUI) => {
    const samplePanel = new BABYLON.GUI.Rectangle();
    samplePanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    samplePanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    samplePanel.height = 0.8;
    samplePanel.width = 0.5;
    samplePanel.thickness = 1;
    samplePanel.background = "blue";
    samplePanel.cornerRadius = 20;
    samplePanel.isVisible = false;

    //stack panel for the buttons
    const stackPanel = new BABYLON.GUI.StackPanel();
    stackPanel.width = .83;
    samplePanel.addControl(stackPanel);

    const resumeBtn = BABYLON.GUI.Button.CreateSimpleButton("resume", "RESUME");
    resumeBtn.width = 0.18;
    resumeBtn.height = "44px";
    resumeBtn.color = "white";
    // resumeBtn.fontFamily = "Viga";
    resumeBtn.paddingBottom = "14px";
    resumeBtn.cornerRadius = 14;
    resumeBtn.fontSize = "12px";
    resumeBtn.textBlock.resizeToFit = true;
    resumeBtn.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    resumeBtn.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_BOTTOM;
    stackPanel.addControl(resumeBtn);

    resumeBtn.onPointerDownObservable.add(() => {
        samplePanel.isVisible = false;
        playerUI.removeControl(samplePanel);
    });
    
    
    return samplePanel;
}

var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

(async () => {

    var scene = await createScene();

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

})();
