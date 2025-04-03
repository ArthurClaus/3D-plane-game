// Get the canvas element from the HTML document
const canvas = document.getElementById("renderCanvas");

// Initialize the Babylon.js engine
const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });

// --- Scene Creation Function ---
const createScene = function () {
    // Create a new scene
    const scene = new BABYLON.Scene(engine);

    // Set a background color (sky blue)
    scene.clearColor = new BABYLON.Color3(0.5, 0.8, 1.0);

    // --- Camera ---
    // Create a basic ArcRotateCamera - allows rotating view with mouse/touch
    // Parameters: name, alpha, beta, radius, target position, scene
    const camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 2.5, 15, new BABYLON.Vector3(0, 5, 0), scene);
    // Attach camera controls to the canvas
    camera.attachControl(canvas, true);
    // Limit how far camera can zoom in/out (optional)
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 50;

    // --- Lighting ---
    // Create a basic hemispheric light
    // Parameters: name, direction, scene
    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    // Adjust light intensity
    light.intensity = 0.8;

    // --- Ground ---
    // Create a large ground plane
    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    // Create a material for the ground
    const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.2); // Greenish color
    ground.material = groundMat;

    // --- Placeholder Object (Instead of Plane for now) ---
    // Create a simple box mesh to represent where the plane would be
    const placeholderPlane = BABYLON.MeshBuilder.CreateBox("placeholder", { height: 0.5, width: 2, depth: 1.5 }, scene);
    // Position it slightly above the ground
    placeholderPlane.position.y = 2;
    // Add a simple material to it
    const placeholderMat = new BABYLON.StandardMaterial("placeholderMat", scene);
    placeholderMat.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2); // Reddish color
    placeholderPlane.material = placeholderMat;

    // --- Simple Animation (Example: Make the box rotate) ---
    // This runs before each frame is rendered
    scene.onBeforeRenderObservable.add(() => {
        if (placeholderPlane) { // Check if the mesh exists
            placeholderPlane.rotation.y += 0.01; // Rotate around the Y axis
        }
    });

    // Return the created scene
    return scene;
};

// --- Create the scene ---
const scene = createScene();

// --- Run the Render Loop ---
// This tells Babylon.js to continuously render the scene
engine.runRenderLoop(function () {
    scene.render();
});

// --- Handle Window Resizing ---
// Watch for browser/canvas resize events
window.addEventListener("resize", function () {
    engine.resize(); // Resize the Babylon.js engine
});

// Sources :
// 1. https://github.com/DennisOe/3D-Browser-Diorama
// 2. https://medium.com/@13979318939/babylon-js-guide-1-the-first-3d-scene-37d2ddb49e1c