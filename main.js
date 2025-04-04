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
camera.position.set(0, 10, 30); // Ajusté pour voir l'avion au sol
camera.lookAt(0, 0, 0); 

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
const worldSize = 4000; // Make the world even larger (from 2000 to 3000)
const worldGeometry = new THREE.PlaneGeometry(worldSize, worldSize, 80, 80); // More segments for better detail
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

// --- Piste de décollage ---
const runwayLength = 200;
const runwayWidth = 15;
const runwayGeometry = new THREE.PlaneGeometry(runwayWidth, runwayLength);
const runwayMaterial = new THREE.MeshStandardMaterial({
    color: 0x333333, // Couleur gris foncé pour l'asphalte
    roughness: 0.7,
    metalness: 0.1,
});
const runway = new THREE.Mesh(runwayGeometry, runwayMaterial);
runway.rotation.x = -Math.PI / 2; // Aligner avec le sol
runway.rotation.z = Math.PI / 2; // Orienter la piste correctement
runway.position.set(0, 0.1, 0); // Légèrement au-dessus du sol pour éviter le z-fighting
runway.receiveShadow = true;
scene.add(runway);

// Marquage central de la piste
const centerLineGeometry = new THREE.PlaneGeometry(1, runwayLength - 20);
const centerLineMaterial = new THREE.MeshBasicMaterial({
    color: 0xFFFFFF, // Blanc
});
const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
centerLine.rotation.x = -Math.PI / 2;
centerLine.rotation.z = Math.PI / 2;
centerLine.position.set(0, 0.15, 0);
scene.add(centerLine);

// Marquages des extrémités de la piste
const addRunwayMarking = (posZ, size = 5) => {
    const markingGeometry = new THREE.PlaneGeometry(10, size);
    const markingMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFFFFF, // Blanc
    });
    const marking = new THREE.Mesh(markingGeometry, markingMaterial);
    marking.rotation.x = -Math.PI / 2;
    marking.position.set(0, 0.15, posZ);
    scene.add(marking);
};

// Ajouter des marquages tous les 25 unités
for (let i = -4; i <= 4; i++) {
    const posZ = i * 25;
    // Sauter le centre (0) car il a déjà le marquage central
    if (i !== 0) {
        addRunwayMarking(posZ, i % 2 === 0 ? 8 : 5); // Marquages plus grands tous les 50 unités
    }
}

// Lumières de piste d'atterrissage
const addRunwayLight = (x, z, color = 0xffffaa) => {
    const light = new THREE.PointLight(color, 0.5, 15);
    light.position.set(x, 0.5, z);
    scene.add(light);
    
    // Ajouter une petite sphère pour représenter la lumière visuellement
    const lightBulbGeometry = new THREE.SphereGeometry(0.5, 8, 8);
    const lightBulbMaterial = new THREE.MeshBasicMaterial({ color: color });
    const lightBulb = new THREE.Mesh(lightBulbGeometry, lightBulbMaterial);
    lightBulb.position.copy(light.position);
    scene.add(lightBulb);
};

// Ajouter des lumières le long de la piste
for (let i = -8; i <= 8; i++) {
    const posZ = i * 25;
    addRunwayLight(runwayWidth/2 + 1, posZ, 0xffaa00); // Côté droit (orange)
    addRunwayLight(-runwayWidth/2 - 1, posZ, 0xffaa00); // Côté gauche (orange)
}

// Lumières d'approche à l'extrémité sud de la piste
for (let i = 1; i <= 5; i++) {
    const posZ = runwayLength/2 + i * 10;
    addRunwayLight(0, posZ, 0xffffff); // Blanc
}

// Arbre de contrôle de la piste
const towerGeometry = new THREE.BoxGeometry(5, 15, 5);
const towerMaterial = new THREE.MeshStandardMaterial({
    color: 0x888888, // Gris
    roughness: 0.6
});
const tower = new THREE.Mesh(towerGeometry, towerMaterial);
tower.position.set(runwayWidth/2 + 15, 7.5, -runwayLength/4);
tower.castShadow = true;
scene.add(tower);

// Toit de la tour
const roofGeometry = new THREE.ConeGeometry(6, 3, 4);
const roofMaterial = new THREE.MeshStandardMaterial({
    color: 0x994400, // Marron
    roughness: 0.7
});
const roof = new THREE.Mesh(roofGeometry, roofMaterial);
roof.position.set(tower.position.x, tower.position.y + 9, tower.position.z);
roof.castShadow = true;
scene.add(roof);

// --- Obstacles (Blocks) ---
const blockGroup = new THREE.Group(); // Group for organization
const blockCount = 500; // Increased from 300 to 500 buildings
const blockArea = worldSize * 0.85; // Spread blocks over more of the world size

const boxGeometry = new THREE.BoxGeometry(1, 1, 1); // Base size

// Définir une zone de sécurité autour de la piste d'atterrissage
const runwayBuffer = 30; // Zone de sécurité autour de la piste
const runwayStartZ = -runwayLength/2 - runwayBuffer;
const runwayEndZ = runwayLength/2 + runwayBuffer;
const runwayLeftX = -runwayWidth/2 - runwayBuffer;
const runwayRightX = runwayWidth/2 + runwayBuffer;

// Fonction pour vérifier si une position est sur la piste d'atterrissage
const isOnRunway = (posX, posZ) => {
    return posX > runwayLeftX && posX < runwayRightX && 
           posZ > runwayStartZ && posZ < runwayEndZ;
};

for (let i = 0; i < blockCount; i++) {
    const blockType = Math.random();
    let blockMesh;
    let blockHeight;
    let blockWidth = Math.random() * 8 + 10; // Random width (5 to 13) - agrandi depuis (3 à 8)
    let blockDepth = Math.random() * 8 + 10; // Random depth (5 to 13) - agrandi depuis (3 à 8)
    
    // Générer des coordonnées aléatoires
    let posX, posZ;
    do {
        posX = (Math.random() - 0.5) * blockArea;
        posZ = (Math.random() - 0.5) * blockArea;
    } while (isOnRunway(posX, posZ)); // Régénérer si sur la piste

    if (blockType < 0.7) { // 70% chance: "Building" (grey)
        // Distribution des hauteurs avec quelques gratte-ciels vraiment grands
        if (Math.random() < 0.15) { // 15% de super grands immeubles
            blockHeight = Math.random() * 80 + 70; // 70-150 unités (très grands gratte-ciels)
        } else if (Math.random() < 0.3) { // 30% de grands immeubles
            blockHeight = Math.random() * 40 + 30; // 30-70 unités (grands immeubles)
        } else { // 55% d'immeubles moyens
            blockHeight = Math.random() * 25 + 15; // 15-40 unités (immeubles moyens)
        }
        
        // Couleurs légèrement plus variées pour les bâtiments
        const buildingMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(
                Math.random() * 0.4 + 0.3, 
                Math.random() * 0.4 + 0.3, 
                Math.random() * 0.4 + 0.3
            ), // Plus de variations de gris
            roughness: 0.8
        });
        blockMesh = new THREE.Mesh(boxGeometry.clone(), buildingMaterial); // Clone geometry
    } else { // 30% chance: "Tree" (green/brown) - simple block representation
         blockHeight = Math.random() * 12 + 6; // Arbres plus grands: 6-18 unités (au lieu de 4-12)
         blockWidth *= 0.5; // Trees are thinner
         blockDepth *= 0.5;
         const treeMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(0.2 + Math.random()*0.2, 0.4 + Math.random() * 0.3, 0.1 + Math.random()*0.2), // Shades of green
            roughness: 0.9
        });
         blockMesh = new THREE.Mesh(boxGeometry.clone(), treeMaterial); // Clone geometry
    }

    blockMesh.scale.set(blockWidth, blockHeight, blockDepth);

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

// Initial position on the runway
plane.position.set(0, 2, runwayLength/2 - 20); // Positionner l'avion au début de la piste
plane.rotation.set(0, 0, 0); // Orientation initiale (nez vers l'avant)
scene.add(plane);


// --- Controls ---
const keysPressed = {};
const clock = new THREE.Clock();

let currentSpeed = 0;  // Commencer à l'arrêt
const maxSpeed = 2.5;   // Increased max speed
const minSpeed = 0.1;
const acceleration = 0.3; // Légèrement réduit pour un démarrage plus progressif
const deceleration = 1.0;
const rollSpeed = 0.5;    
const pitchSpeed = 0.3;   
const turnSpeed = 0.2;    // Vitesse de virage

// Variables pour la physique
let isGrounded = true;    // L'avion commence au sol
let isGameOver = false;   // État du jeu
const liftThreshold = 1.2; // Vitesse nécessaire pour décoller
const gravity = 0.05;      // Force de gravité
const liftFactor = 0.15;   // Force ascensionnelle

// --- Création du système de particules pour l'explosion ---
const explosionParticles = [];
let explosionLight = null;
const debrisParticles = [];
let explosionSound = null; // Variable pour suivre le son d'explosion

const createExplosion = (position) => {
    const particleCount = 150;
    const particleGeometry = new THREE.SphereGeometry(0.4, 8, 8);
    const particleMaterials = [
        new THREE.MeshBasicMaterial({ color: 0xff5500 }), // Orange
        new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Rouge
        new THREE.MeshBasicMaterial({ color: 0xffaa00 }), // Jaune orangé
        new THREE.MeshBasicMaterial({ color: 0x000000 })  // Fumée noire
    ];

    for (let i = 0; i < particleCount; i++) {
        const material = particleMaterials[Math.floor(Math.random() * particleMaterials.length)];
        const particle = new THREE.Mesh(particleGeometry, material);
        
        // Position initiale au point d'impact
        particle.position.copy(position);
        
        // Vélocité aléatoire
        particle.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 10,
            Math.random() * 10,
            (Math.random() - 0.5) * 10
        );
        
        // Durée de vie aléatoire
        particle.lifespan = Math.random() * 2 + 1; // 1-3 secondes
        particle.age = 0;
        
        scene.add(particle);
        explosionParticles.push(particle);
    }
    
    // Créer des débris d'avion
    createDebris(position);
    
    // Ajouter une lumière à l'explosion
    explosionLight = new THREE.PointLight(0xff5500, 10, 50);
    explosionLight.position.copy(position);
    scene.add(explosionLight);
    
    // Son d'explosion - utilise l'API Audio HTML5 standard
    try {
        explosionSound = new Audio('https://bigsoundbank.com/UPLOAD/mp3/1561.mp3');
        explosionSound.volume = 0.5;
        explosionSound.play().catch(e => console.log("Erreur de lecture audio:", e));
    } catch (err) {
        console.log("Erreur avec le son d'explosion:", err);
    }
};

// Créer des débris d'avion
const createDebris = (position) => {
    // Créer différentes formes de débris
    const debrisGeometries = [
        new THREE.BoxGeometry(1, 0.2, 2),  // Morceau d'aile
        new THREE.ConeGeometry(0.7, 2, 4), // Morceau de fuselage
        new THREE.SphereGeometry(0.5, 4, 4) // Morceau arrondi
    ];
    
    const debrisMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xaaaaaa, 
        roughness: 0.7, 
        metalness: 0.5
    });
    
    // Créer 10 débris
    for (let i = 0; i < 10; i++) {
        const geometry = debrisGeometries[Math.floor(Math.random() * debrisGeometries.length)];
        const debris = new THREE.Mesh(geometry, debrisMaterial);
        
        // Position initiale au point d'impact
        debris.position.copy(position);
        
        // Rotation aléatoire
        debris.rotation.set(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
        );
        
        // Vélocité aléatoire (moins que les particules d'explosion)
        debris.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 8,
            Math.random() * 5,
            (Math.random() - 0.5) * 8
        );
        
        // Rotation continue
        debris.rotationSpeed = new THREE.Vector3(
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 2
        );
        
        // Durée de vie plus longue pour les débris
        debris.lifespan = Math.random() * 3 + 3; // 3-6 secondes
        debris.age = 0;
        
        scene.add(debris);
        debrisParticles.push(debris);
    }
};

// Mise à jour des particules d'explosion
const updateExplosion = (deltaTime) => {
    // Mettre à jour les particules d'explosion
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        const particle = explosionParticles[i];
        
        // Appliquer la vélocité et la gravité
        particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime));
        particle.velocity.y -= 5 * deltaTime; // Gravité pour les particules
        
        // Réduire la taille avec le temps
        const scale = 1 - (particle.age / particle.lifespan);
        particle.scale.set(scale, scale, scale);
        
        // Incrémenter l'âge
        particle.age += deltaTime;
        
        // Supprimer les particules qui ont dépassé leur durée de vie
        if (particle.age > particle.lifespan) {
            scene.remove(particle);
            explosionParticles.splice(i, 1);
        }
    }
    
    // Mettre à jour les débris
    for (let i = debrisParticles.length - 1; i >= 0; i--) {
        const debris = debrisParticles[i];
        
        // Appliquer la vélocité et la gravité
        debris.position.add(debris.velocity.clone().multiplyScalar(deltaTime));
        debris.velocity.y -= 9.8 * deltaTime; // Gravité plus forte pour les débris
        
        // Friction au sol
        if (debris.position.y < 0.5) {
            debris.position.y = 0.5;
            debris.velocity.y = -debris.velocity.y * 0.3; // Rebond réduit
            debris.velocity.x *= 0.9; // Friction
            debris.velocity.z *= 0.9; // Friction
        }
        
        // Appliquer la rotation continue
        debris.rotation.x += debris.rotationSpeed.x * deltaTime;
        debris.rotation.y += debris.rotationSpeed.y * deltaTime;
        debris.rotation.z += debris.rotationSpeed.z * deltaTime;
        
        // Incrémenter l'âge
        debris.age += deltaTime;
        
        // Supprimer les débris qui ont dépassé leur durée de vie
        if (debris.age > debris.lifespan) {
            scene.remove(debris);
            debrisParticles.splice(i, 1);
        }
    }
    
    // Gérer la lumière d'explosion
    if (explosionLight) {
        explosionLight.intensity -= deltaTime * 5; // Réduire progressivement l'intensité
        
        if (explosionLight.intensity <= 0) {
            scene.remove(explosionLight);
            explosionLight = null;
        }
    }
};

// Fonction pour redémarrer le jeu
const restartGame = () => {
    // Réinitialiser les variables du jeu
    isGameOver = false;
    isGrounded = true;
    currentSpeed = 0;
    
    // Enregistrer le moment du redémarrage
    lastRestartTime = performance.now();
    
    // Arrêter le son d'explosion s'il est en cours
    if (explosionSound) {
        explosionSound.pause();
        explosionSound.currentTime = 0;
        explosionSound = null;
    }
    
    // Nettoyer les particules d'explosion
    for (let i = explosionParticles.length - 1; i >= 0; i--) {
        scene.remove(explosionParticles[i]);
    }
    explosionParticles.length = 0;
    
    // Nettoyer les débris
    for (let i = debrisParticles.length - 1; i >= 0; i--) {
        scene.remove(debrisParticles[i]);
    }
    debrisParticles.length = 0;
    
    // Supprimer la lumière d'explosion si elle existe encore
    if (explosionLight) {
        scene.remove(explosionLight);
        explosionLight = null;
    }
    
    // Repositionner l'avion
    plane.position.set(0, 2, runwayLength/2 - 20);
    plane.rotation.set(0, 0, 0);
    plane.visible = true;
    
    // Réinitialiser la vélocité de l'avion pour éviter des collisions immédiates
    plane.velocity = new THREE.Vector3(0, 0, 0);
    
    // Cacher le menu
    const gameOverMenu = document.getElementById('gameOverMenu');
    if (gameOverMenu) {
        gameOverMenu.style.display = 'none';
    }
};

document.addEventListener('keydown', (event) => {
    keysPressed[event.key.toLowerCase()] = true;
    keysPressed[event.code] = true;
});

document.addEventListener('keyup', (event) => {
    keysPressed[event.key.toLowerCase()] = false;
    keysPressed[event.code] = false;
});

const speedIndicator = document.getElementById('speed-indicator');

// --- Détection de collision ---
let lastRestartTime = 0; // Moment du dernier redémarrage
// Créer un bounding box pour l'avion
const planeBoundingBox = new THREE.Box3();

const checkCollisions = () => {
    // Si le jeu est déjà terminé, ne pas vérifier les collisions
    if (isGameOver) return false;
    
    // Ne pas vérifier les collisions pendant un court délai après le redémarrage
    const currentTime = performance.now();
    if (currentTime - lastRestartTime < 1000) { // 1 seconde de grâce après redémarrage
        return false;
    }

    // Mettre à jour la bounding box de l'avion
    planeBoundingBox.setFromObject(plane);
    
    // Réduire légèrement la taille de la bounding box pour des collisions plus précises
    planeBoundingBox.min.add(new THREE.Vector3(0.5, 0.5, 0.5));
    planeBoundingBox.max.sub(new THREE.Vector3(0.5, 0.5, 0.5));

    // Vérifier la collision avec le sol (crash si vitesse verticale trop élevée ou angle incorrect)
    if (!isGrounded && plane.position.y < 2.5) {
        const verticalSpeed = plane.velocity ? -plane.velocity.y : 0;
        const landingAngle = Math.abs(plane.rotation.z);
        
        // Conditions d'un crash à l'atterrissage
        if (verticalSpeed > 0.5 || landingAngle > 0.3 || Math.abs(plane.rotation.x) > 0.3) {
            return true;
        }
    }

    // Bounding box temporaire pour chaque bâtiment
    const blockBoundingBox = new THREE.Box3();
    
    // Pour chaque bloc dans le groupe blockGroup
    for (let i = 0; i < blockGroup.children.length; i++) {
        const block = blockGroup.children[i];
        
        // Calculer la distance simple entre l'avion et le bloc pour optimisation
        const planePosition = plane.getWorldPosition(new THREE.Vector3());
        const blockPosition = block.getWorldPosition(new THREE.Vector3());
        const distance = planePosition.distanceTo(blockPosition);
        
        // Si la distance est trop grande, ignorer ce bloc (optimisation)
        const planeRadius = 5; // Rayon approximatif de l'avion
        // Ajustement pour tenir compte des bâtiments plus grands
        const blockWidth = block.scale.x;
        const blockDepth = block.scale.z;
        const blockRadius = Math.max(blockWidth, blockDepth) * 0.6; // Augmenté pour les grands bâtiments
        
        if (distance > (planeRadius + blockRadius + 1000)) { // Marges augmentées
            continue; // Passer au bloc suivant
        }
        
        // Pour les blocs proches, vérifier la collision précise avec les bounding boxes
        blockBoundingBox.setFromObject(block);
        
        // Étendre légèrement la boîte de collision des bâtiments pour s'assurer qu'ils sont détectés
        blockBoundingBox.expandByScalar(0.5);
        
        if (planeBoundingBox.intersectsBox(blockBoundingBox)) {
            return true; // Collision détectée
        }
    }

    return false;
};

// --- Fonction de Game Over ---
const triggerGameOver = () => {
    if (isGameOver) return; // Éviter les appels multiples
    
    isGameOver = true;
    
    // Créer l'explosion à la position de l'avion
    createExplosion(plane.position.clone());
    
    // Cacher l'avion
    plane.visible = false;
    
    // Afficher le menu de game over après un court délai
    setTimeout(() => {
        const gameOverMenu = document.getElementById('gameOverMenu');
        if (gameOverMenu) {
            gameOverMenu.style.display = 'flex';
        }
    }, 2000);
};

// --- Update Logic ---
function updatePlane(deltaTime) {
    // Ne pas mettre à jour si le jeu est terminé
    if (isGameOver) {
        updateExplosion(deltaTime);
        return;
    }

    // --- Acceleration / Deceleration ---
    if (keysPressed['w']) {
        currentSpeed += acceleration * deltaTime;
    } else if (keysPressed['s']) {
        currentSpeed -= deceleration * deltaTime;
    } else {
        // Natural deceleration (less aggressive)
        currentSpeed -= deceleration * 0.1 * deltaTime;
    }
    currentSpeed = Math.max(0, Math.min(maxSpeed, currentSpeed));
    speedIndicator.textContent = `Vitesse: ${(currentSpeed * 100).toFixed(0)} km/h | Altitude: ${isGrounded ? "Au sol" : plane.position.y.toFixed(1) + "m"}`;

    // Déplacement différent selon que l'avion est au sol ou en vol
    if (isGrounded) {
        // --- Mouvement au sol ---
        
        // Rotation de l'avion (uniquement sur l'axe Y quand au sol)
        let yawAngle = 0;
        if (keysPressed['a'] || keysPressed['arrowleft']) {
            yawAngle = turnSpeed * currentSpeed * deltaTime;
        } else if (keysPressed['d'] || keysPressed['arrowright']) {
            yawAngle = -turnSpeed * currentSpeed * deltaTime;
        }
        
        plane.rotateY(yawAngle);
        
        // Mouvement vers l'avant
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(plane.quaternion);
        forward.y = 0; // Garder le mouvement horizontal
        forward.normalize();
        
        const displacement = forward.multiplyScalar(currentSpeed * 25 * deltaTime);
        plane.position.add(displacement);
        
        // Vérifier si la vitesse est suffisante pour décoller automatiquement
        if (currentSpeed > liftThreshold) {
            isGrounded = false;
            plane.rotation.x = -0.05; // Légère inclinaison vers le haut pour le décollage
            
            // Initialiser la vélocité au décollage pour éviter des fausses détections
            plane.velocity = new THREE.Vector3(0, 0.1, -currentSpeed);
        }
    } else {
        // --- Contrôles en vol ---
        let deltaRoll = 0;
        let deltaPitch = 0;
        let deltaYaw = 0;

        // Contrôle du roulis (roll)
        if (keysPressed['a'] || keysPressed['arrowleft']) {
            deltaRoll = rollSpeed * deltaTime;
            // Ajouter un léger virage en fonction du roulis
            deltaYaw = rollSpeed * 0.3 * deltaTime;
        } else if (keysPressed['d'] || keysPressed['arrowright']) {
            deltaRoll = -rollSpeed * deltaTime;
            // Ajouter un léger virage en fonction du roulis
            deltaYaw = -rollSpeed * 0.3 * deltaTime;
        }

        // Contrôle du tangage (pitch)
        if (keysPressed['arrowdown']) { // Down Arrow -> Pitch Up
            deltaPitch = pitchSpeed * deltaTime;
        } else if (keysPressed['arrowup']) { // Up Arrow -> Pitch Down
            deltaPitch = -pitchSpeed * deltaTime;
        }

        // Appliquer les rotations
        plane.rotateZ(deltaRoll);
        plane.rotateX(deltaPitch);
        plane.rotateY(deltaYaw);

        // Physique du vol
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(plane.quaternion);
        
        // Effet de portance basé sur l'angle des ailes
        const liftVector = new THREE.Vector3(0, 1, 0);
        const rollFactor = Math.cos(plane.rotation.z); // Diminue la portance quand l'avion est incliné
        liftVector.multiplyScalar(liftFactor * currentSpeed * rollFactor);
        
        // Application de la gravité (augmentée)
        liftVector.y -= gravity * 1.5; // Gravité plus forte
        
        // Mouvement final
        const displacement = forward.multiplyScalar(currentSpeed * 25 * deltaTime);
        displacement.add(liftVector);
        plane.position.add(displacement);
        
        // Stocker la vélocité verticale pour la détection de crash
        plane.velocity = displacement.clone().divideScalar(deltaTime);

        // Auto-stabilisation du roulis quand aucune touche n'est pressée
        if (deltaRoll === 0 && Math.abs(plane.rotation.z) > 0.01) {
            const stabilizationFactor = 0.03;
            plane.rotation.z += (0 - plane.rotation.z) * stabilizationFactor;
        }
        
        // --- Collision avec le sol ---
        // Raycaster pour détecter le sol
        const raycaster = new THREE.Raycaster();
        raycaster.set(plane.position, new THREE.Vector3(0, -1, 0)); // Direction vers le bas
        
        const intersects = raycaster.intersectObject(world);
        
        if (intersects.length > 0 && intersects[0].distance < 2.0) {
            // Collision avec le sol en fonction de l'angle et de la vitesse
            const impactVelocity = Math.abs(plane.velocity.y);
            const landingAngle = Math.abs(plane.rotation.z);
            
            // Vérifier si l'avion vient juste de décoller
            const timeSinceRestart = performance.now() - lastRestartTime;
            const justTookOff = timeSinceRestart < 5000 && plane.position.y < 10;
            
            if ((impactVelocity > 0.4 || landingAngle > 0.3 || Math.abs(plane.rotation.x) > 0.3) && !justTookOff) {
                // Crash sur le sol à grande vitesse ou avec mauvais angle
                // Seulement si l'avion n'est pas en phase de décollage
                triggerGameOver();
            } else {
                // Atterrissage correct
                isGrounded = true;
                plane.position.y = intersects[0].point.y + 2.0; // Mettre l'avion juste au-dessus du point d'intersection
                
                // Réinitialiser l'orientation pour l'atterrissage
                const smoothFactor = 0.2;
                plane.rotation.x = plane.rotation.x * (1 - smoothFactor);
                plane.rotation.z = plane.rotation.z * (1 - smoothFactor);
            }
        }
    }

    // Vérifier les collisions avec les bâtiments
    if (checkCollisions()) {
        triggerGameOver();
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
    let relativeCameraOffset;
    
    if (isGrounded) {
        // Caméra plus proche et plus basse quand l'avion est au sol
        relativeCameraOffset = new THREE.Vector3(0, 3.0, 10);
    } else {
        // Caméra plus haute et plus éloignée en vol
        relativeCameraOffset = new THREE.Vector3(0, 5.0, 15);
    }

    // Appliquer la rotation de l'avion à la position de la caméra
    const cameraOffset = relativeCameraOffset.clone().applyMatrix4(plane.matrixWorld)
                                           .sub(plane.getWorldPosition(new THREE.Vector3()));

    // Calculer la position cible de la caméra
    const targetCameraPosition = plane.getWorldPosition(new THREE.Vector3()).add(cameraOffset);

    // Calculer le point à regarder (légèrement devant et au-dessous du nez de l'avion)
    const lookAheadDistance = isGrounded ? -10 : -20; // Regarder plus loin en vol
    const lookAtTargetOffset = new THREE.Vector3(0, -0.5, lookAheadDistance);
    const worldLookAtTarget = lookAtTargetOffset.clone().applyMatrix4(plane.matrixWorld);

    // Interpolation douce de la position de la caméra
    const positionLerpFactor = isGrounded ? 0.1 : 0.06;
    const lookAtLerpFactor = isGrounded ? 0.12 : 0.08;

    camera.position.lerp(targetCameraPosition, positionLerpFactor);

    // Interpolation douce du point de regard
    const currentLookAt = new THREE.Vector3();
    camera.getWorldDirection(currentLookAt).multiplyScalar(20).add(camera.position);

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

// --- Initialisation du menu Game Over ---
function initGameOverMenu() {
    const gameOverMenu = document.createElement('div');
    gameOverMenu.id = 'gameOverMenu';
    gameOverMenu.innerHTML = `
        <div class="gameOverContent">
            <h1>CRASH !</h1>
            <p>Votre avion s'est écrasé.</p>
            <button id="restartButton">Redémarrer</button>
        </div>
    `;
    gameOverMenu.style.display = 'none';
    document.body.appendChild(gameOverMenu);
    
    // Maintenant que l'élément est attaché au DOM, nous pouvons ajouter l'écouteur d'événements
    document.getElementById('restartButton').addEventListener('click', restartGame);
}

// Initialiser le menu quand le DOM est prêt
document.addEventListener('DOMContentLoaded', initGameOverMenu);

// --- Start the Game ---
animate();