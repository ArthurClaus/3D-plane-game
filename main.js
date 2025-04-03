import * as THREE from 'three';

// --- Scene Setup ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Sky blue background

// --- Camera Setup ---
const camera = new THREE.PerspectiveCamera(
    75, // Field of View
    window.innerWidth / window.innerHeight, // Aspect Ratio
    0.1, // Near clipping plane
    5000 // Far clipping plane (increase for larger world)
);
// Initial camera position (will be updated to follow plane)
camera.position.set(0, 50, 100); // Start higher and further back
camera.lookAt(0, 20, 0); // Look towards a point slightly above the origin

// --- Renderer Setup ---
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('gameCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// --- Lighting ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Slightly brighter ambient
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(100, 150, 100); // Position the light source high
directionalLight.castShadow = true; // Enable shadows (optional, impacts performance)
// Configure shadow properties (optional)
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -200;
directionalLight.shadow.camera.right = 200;
directionalLight.shadow.camera.top = 200;
directionalLight.shadow.camera.bottom = -200;
scene.add(directionalLight);

// Enable shadows in the renderer
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows

// --- World (Flat Plane) ---
const worldSize = 2000; // Make the world quite large
const worldGeometry = new THREE.PlaneGeometry(worldSize, worldSize, 50, 50); // Width, Height, Segments W, Segments H
const worldMaterial = new THREE.MeshStandardMaterial({
    color: 0x55aa55, // Greenish ground color
    roughness: 0.9,
    metalness: 0.1,
    // side: THREE.DoubleSide // Can be useful for debugging, but not strictly needed here
});
const world = new THREE.Mesh(worldGeometry, worldMaterial);
world.rotation.x = -Math.PI / 2; // Rotate the plane to be horizontal
world.position.y = 0; // Set ground level at y=0
world.receiveShadow = true; // Allow the ground to receive shadows
scene.add(world);

// --- Obstacles (Blocks) ---
const blockGroup = new THREE.Group(); // Group for organization
const blockCount = 300;
const blockArea = worldSize * 0.8; // Spread blocks over 80% of the world size

const boxGeometry = new THREE.BoxGeometry(1, 1, 1); // Base size

for (let i = 0; i < blockCount; i++) {
    const blockType = Math.random();
    let blockMesh;
    let blockHeight;
    let blockWidth = Math.random() * 5 + 3; // Random width (3 to 8)
    let blockDepth = Math.random() * 5 + 3; // Random depth (3 to 8)


    if (blockType < 0.7) { // 70% chance: "Building" (grey)
        blockHeight = Math.random() * 15 + 5; // Random height (5 to 20)
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(Math.random() * 0.3 + 0.4, Math.random() * 0.3 + 0.4, Math.random() * 0.3 + 0.4), // Shades of grey
            roughness: 0.8
        });
        blockMesh = new THREE.Mesh(boxGeometry.clone(), buildingMaterial); // Clone geometry
    } else { // 30% chance: "Tree" (green/brown) - simple block representation
         blockHeight = Math.random() * 8 + 4; // Shorter (4 to 12)
         blockWidth *= 0.5; // Trees are thinner
         blockDepth *= 0.5;
         const treeMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.2 + Math.random()*0.2, 0.4 + Math.random() * 0.3, 0.1 + Math.random()*0.2), // Shades of green
            roughness: 0.9
        });
         blockMesh = new THREE.Mesh(boxGeometry.clone(), treeMaterial); // Clone geometry
    }

    blockMesh.scale.set(blockWidth, blockHeight, blockDepth);

    const posX = (Math.random() - 0.5) * blockArea;
    const posZ = (Math.random() - 0.5) * blockArea;
    const posY = blockHeight / 2; // Position base at y=0

    blockMesh.position.set(posX, posY, posZ);
    blockMesh.castShadow = true;
    blockMesh.receiveShadow = true;
    blockGroup.add(blockMesh);
}
scene.add(blockGroup);


// --- Plane ---
const plane = new THREE.Group();
const planeBodyGeometry = new THREE.ConeGeometry(1.5, 5, 8); // Slightly larger plane
const planeBodyMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd, metalness: 0.6, roughness: 0.5 });
const planeBody = new THREE.Mesh(planeBodyGeometry, planeBodyMaterial);
planeBody.rotation.x = Math.PI / 2;
planeBody.castShadow = true;
plane.add(planeBody);

const wingGeometry = new THREE.BoxGeometry(8, 0.3, 2); // Wider wings
const wingMaterial = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.5, roughness: 0.6 });
const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
leftWing.position.set(-4.5, 0, 0); // Adjusted position
leftWing.castShadow = true;
plane.add(leftWing);
const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
rightWing.position.set(4.5, 0, 0); // Adjusted position
rightWing.castShadow = true;
plane.add(rightWing);

const tailGeometry = new THREE.BoxGeometry(0.3, 2, 1.2); // Taller tail
const tail = new THREE.Mesh(tailGeometry, wingMaterial);
tail.position.set(0, 1, -2.2); // Adjusted position
tail.castShadow = true;
plane.add(tail);

// Initial position above the ground plane
plane.position.set(0, 50, 0); // Start 50 units above the center
plane.lookAt(0, 50, -1); // Point forward
scene.add(plane);


// --- Controls ---
const keysPressed = {};
const clock = new THREE.Clock();

let currentSpeed = 0.5; // Start with some initial speed
const maxSpeed = 2.5;   // Increased max speed
const minSpeed = 0.1;
const acceleration = 1.0; // Increased acceleration
const deceleration = 1.2;
const rollSpeed = 1.8;    // Slightly faster roll
const pitchSpeed = 1.2;   // Slightly faster pitch

document.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
    keysPressed[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
    keysPressed[event.code] = false;
});

const speedIndicator = document.getElementById('speed-indicator');

// --- Update Logic ---
function updatePlane(deltaTime) {
    // --- Acceleration / Deceleration ---
    if (keysPressed['w']) {
        currentSpeed += acceleration * deltaTime;
    } else if (keysPressed['s']) {
        currentSpeed -= deceleration * deltaTime;
    } else {
        // Natural deceleration (less aggressive)
         currentSpeed -= deceleration * 0.1 * deltaTime;
    }
    currentSpeed = Math.max(minSpeed, Math.min(maxSpeed, currentSpeed));
    speedIndicator.textContent = `Speed: ${currentSpeed.toFixed(2)}`;

    // --- Rotation ---
    let deltaRoll = 0;
    let deltaPitch = 0;

    if (keysPressed['a'] || keysPressed['arrowleft']) {
        deltaRoll = rollSpeed * deltaTime;
    } else if (keysPressed['d'] || keysPressed['arrowright']) {
        deltaRoll = -rollSpeed * deltaTime;
    }

    if (keysPressed['arrowdown']) { // Down Arrow -> Pitch Up
        deltaPitch = pitchSpeed * deltaTime;
    } else if (keysPressed['arrowup']) { // Up Arrow -> Pitch Down
        deltaPitch = -pitchSpeed * deltaTime;
    }

    plane.rotateZ(deltaRoll);
    plane.rotateX(deltaPitch);

    // --- Movement ---
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(plane.quaternion);
    const displacement = forward.multiplyScalar(currentSpeed * 25 * deltaTime); // Adjust speed multiplier
    plane.position.add(displacement);

    // --- Keep Plane Above Ground (Simple check) ---
    const minAltitude = 5.0; // Minimum height above y=0 ground
    if (plane.position.y < minAltitude) {
        plane.position.y = minAltitude;
        // Optional: Add a slight "bounce" or speed reduction on hitting min altitude
        // currentSpeed *= 0.9;
        // // Prevent plane from pitching further down if grounded
        // if (plane.rotation.x < 0) {
        //     plane.rotation.x = 0;
        // }
    }

    // --- Optional: Auto-leveling Roll ---
    if (deltaRoll === 0 && plane.rotation.z !== 0) {
        const rollLerpFactor = 0.04; // Slightly slower auto-level
        plane.rotation.z += (0 - plane.rotation.z) * rollLerpFactor;
         // Clamp to prevent floating point issues causing constant tiny rotations
        if(Math.abs(plane.rotation.z) < 0.001) plane.rotation.z = 0;
    }

    // --- World Boundaries (Optional - simple wrap around) ---
    const halfWorldSize = worldSize / 2;
    if (Math.abs(plane.position.x) > halfWorldSize) {
        plane.position.x = -plane.position.x * 0.99; // Wrap and slightly offset
    }
    if (Math.abs(plane.position.z) > halfWorldSize) {
        plane.position.z = -plane.position.z * 0.99; // Wrap and slightly offset
    }
}

// --- Camera Following Logic ---
function updateCamera() {
    const relativeCameraOffset = new THREE.Vector3(0, 4.0, 12); // Adjust offset: Higher and further back

    // Apply the plane's world rotation to the offset vector
    // Use matrixWorld for world coordinates
    const cameraOffset = relativeCameraOffset.clone().applyMatrix4(plane.matrixWorld)
                                            .sub(plane.getWorldPosition(new THREE.Vector3())); // Get offset in world space


    // Calculate the desired camera position
    const targetCameraPosition = plane.getWorldPosition(new THREE.Vector3()).add(cameraOffset);

    // Calculate the target to look at (slightly in front and below the plane's nose)
    const lookAtTargetOffset = new THREE.Vector3(0, -0.5, -15); // Point further ahead and slightly down
    const worldLookAtTarget = lookAtTargetOffset.applyMatrix4(plane.matrixWorld);


    // Smoothly interpolate camera position and lookAt target
    const positionLerpFactor = 0.06; // Slower lerp for smoother camera
    const lookAtLerpFactor = 0.08;

    camera.position.lerp(targetCameraPosition, positionLerpFactor);

    // Smoothly interpolate the lookAt target
    // We need a stable target point to lerp towards. Directly lerping camera.lookAt() can be tricky.
    // Instead, lerp a temporary vector and then make the camera look at it.
    const currentLookAt = new THREE.Vector3(); // Where the camera is currently looking (approx)
    camera.getWorldDirection(currentLookAt).multiplyScalar(20).add(camera.position); // Estimate current lookAt point

    const finalLookAt = currentLookAt.lerp(worldLookAtTarget, lookAtLerpFactor);
    camera.lookAt(finalLookAt);

}

// --- Animation Loop ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = Math.min(clock.getDelta(), 0.1); // Get time delta, clamp max value to prevent jumps

    updatePlane(deltaTime);
    updateCamera();

    renderer.render(scene, camera);
}

// --- Handle Window Resize ---
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// --- Start the Game ---
animate();