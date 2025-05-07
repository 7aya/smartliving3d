// Smart Living 3D Application - Web 3D Assignment 2025
// Enhanced script with animations and advanced features

// Global variables
let scene, camera, renderer, controls;
let mixer, clock;
let loadingManager;
let currentModel = null;
let currentModelName = 'tv';
let wireframeMode = false;
let autoRotate = true;
let stats = {};
let models = {};
let animations = {};
let lights = {};
let isFullscreen = false;
let isHeroModelLoaded = false;
let tvPowerOn = false;
let fridgeDoorOpen = false;
let lampOn = false;
let frameCount = 0;
let lastTime = 0;
let fps = 0;
let heroCamera;
let composer;


console.log("THREE.GLTFLoader available:", typeof THREE.GLTFLoader !== 'undefined');

// DOM elements
const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const heroModelContainer = document.getElementById('hero-model-container');
const modelContainer = document.getElementById('model-container');
const modelItems = document.querySelectorAll('.model-item');
const wireframeToggle = document.getElementById('wireframe-toggle');
const rotationToggle = document.getElementById('rotation-toggle');
const cameraSelect = document.getElementById('camera-select');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const exploreBtn = document.getElementById('explore-btn');
const modelExplorer = document.getElementById('model-explorer');
const modelControls = document.querySelectorAll('.model-controls');
const verticesCount = document.getElementById('vertices-count');
const facesCount = document.getElementById('faces-count');
const materialsCount = document.getElementById('materials-count');
const fpsCounter = document.getElementById('fps-counter');

// Light control elements
const ambientLightToggle = document.getElementById('ambient-light-toggle');
const directionalLightToggle = document.getElementById('directional-light-toggle');
const spotlightToggle = document.getElementById('spotlight-toggle');
const lightIntensity = document.getElementById('light-intensity');

// Model descriptions
const modelDescriptions = {
    tv: "A modern smart entertainment system with 4K display, integrated streaming services, and voice control capabilities.",
    fridge: "An energy-efficient smart refrigerator with temperature control, door sensors, and customisable appearance.",
    lamp: "An adjustable smart lamp with various lighting modes, color temperature settings, and energy-saving features."
};

// Initialise the application
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, initialising application...");
    
    // Initialise Splitting.js for text animations
    if (window.Splitting) {
        Splitting();
    }
    
    // Setup loading manager FIRST
    setupLoadingManager();
    
    // Initialise 3D components after loading manager is set up
    if (heroModelContainer) {
        console.log("Initialising hero model...");
        initHeroModel();
    }
    
    if (modelContainer) {
        console.log("Initialising main model viewer...");
        init();  // This will call loadModels()
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Handle scroll animations
    window.addEventListener('scroll', handleScroll);
    handleScroll();
});

// Create a custom GLSL shader material
function createCustomShader(type) {
    let vertexShader, fragmentShader;
    
    // Base vertex shader for all materials
    vertexShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    // Different fragment shaders based on material type
    switch (type) {
        case 'glass':
            fragmentShader = `
                uniform vec3 color;
                uniform float opacity;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(-vPosition);
                    
                    // Simple fresnel effect
                    float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);
                    
                    // Combine base color with fresnel effect
                    vec3 finalColor = mix(color, vec3(1.0), fresnel * 0.7);
                    
                    gl_FragColor = vec4(finalColor, opacity);
                }
            `;
            return new THREE.ShaderMaterial({
                uniforms: { 
                    color: { value: new THREE.Color(0x000000) },
                    opacity: { value: 0.9 }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                transparent: true
            });
            
        case 'metal':
            fragmentShader = `
                uniform vec3 color;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(-vPosition);
                    
                    // Simple reflection calculation
                    float reflection = pow(dot(normal, viewDir), 2.0);
                    
                    // Add some metallic highlights
                    vec3 finalColor = color + reflection * 0.5;
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `;
            return new THREE.ShaderMaterial({
                uniforms: { 
                    color: { value: new THREE.Color(0xf2f2f2) }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader
            });
            
        case 'emissive':
            fragmentShader = `
                uniform vec3 color;
                uniform float intensity;
                varying vec2 vUv;
                
                void main() {
                    // Create pulsing effect
                    float pulse = sin(vUv.x * 10.0 + vUv.y * 10.0 + intensity * 5.0) * 0.5 + 0.5;
                    vec3 glow = color * (intensity + pulse * 0.3 * intensity);
                    
                    gl_FragColor = vec4(glow, 1.0);
                }
            `;
            return new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(0xffffee) },
                    intensity: { value: 0.0 }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                transparent: true
            });
            
        default:
            // Default phong-like shader
            fragmentShader = `
                uniform vec3 color;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(-vPosition);
                    
                    // Basic diffuse lighting
                    float diffuse = max(dot(normal, vec3(0.0, 1.0, 0.5)), 0.0);
                    
                    vec3 finalColor = color * (0.3 + diffuse * 0.7);
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `;
            return new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(0x888888) }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader
            });
    }
}
    
// Update model statistics display
function updateModelStats(model) {
    if (!verticesCount || !facesCount || !materialsCount) return;
    
    let verticesTotal = 0;
    let facesTotal = 0;
    let materialsSet = new Set();
    
    model.traverse(child => {
        if (child.isMesh) {
            // Count vertices
            if (child.geometry.attributes.position) {
                verticesTotal += child.geometry.attributes.position.count;
            }
            
            // Count faces (triangles)
            if (child.geometry.index) {
                facesTotal += child.geometry.index.count / 3;
            } else if (child.geometry.attributes.position) {
                facesTotal += child.geometry.attributes.position.count / 3;
            }
            
            // Count unique materials
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => materialsSet.add(mat));
                } else {
                    materialsSet.add(child.material);
                }
            }
        }
    });
    
    // Animate counters
    animateCounter(verticesCount, verticesTotal);
    animateCounter(facesCount, facesTotal);
    animateCounter(materialsCount, materialsSet.size);
}

// Animate counter for stats
function animateCounter(element, target) {
    const duration = 1500;
    const start = parseInt(element.textContent.replace(/,/g, '')) || 0;
    const increment = (target - start) / (duration / 16);
    let current = start;
    
    const updateCounter = () => {
        current += increment;
        const complete = increment > 0 ? current >= target : current <= target;
        
        if (complete) {
            element.textContent = target.toLocaleString();
        } else {
            element.textContent = Math.floor(current).toLocaleString();
            requestAnimationFrame(updateCounter);
        }
    };
    
    updateCounter();
}

// Setup event listeners for UI controls
function setupEventListeners() {
    // Model selection
    // In setupEventListeners()
    const modelItems = document.querySelectorAll('.model-item');
    modelItems.forEach(item => {
    const modelName = item.getAttribute('data-model');
    item.addEventListener('click', function() {
        loadModel(modelName);
        
        // Update active class
        modelItems.forEach(mi => mi.classList.remove('active'));
        this.classList.add('active');
        
        // Update controls visibility
        updateModelControls(modelName);

         // Play sound effect
         playSound('audio/switch.mp3');
    });
})
    
    // Wireframe toggle
    const wireframeToggle = document.getElementById('wireframe-toggle');
if (wireframeToggle) {
    console.log("Found wireframe toggle");
    wireframeToggle.addEventListener('change', function() {
        console.log("Wireframe toggle changed:", this.checked);
        toggleWireframe(this.checked);
    });
} else {
    console.error("Wireframe toggle element not found!");
}

// Toggles wireframe mode on all model meshes
// Toggle wireframe mode on all model meshes
function toggleWireframe(enabled) {
    console.log("Toggling wireframe mode:", enabled);
    if (!currentModel) {
        console.warn("No current model available for wireframe toggle");
        return;
    }
    
    wireframeMode = enabled;
    
    currentModel.traverse(function(child) {
        if (child.isMesh) {
            console.log(`Setting wireframe on mesh: ${child.name || 'unnamed mesh'}`);
            
            if (enabled) {
                // Store original material if not already saved
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material.clone();
                }
                
                // Create wireframe material
                child.material = new THREE.MeshBasicMaterial({
                    color: 0x00bcd4,
                    wireframe: true
                });
            } else {
                // Restore original material
                if (child.userData.originalMaterial) {
                    child.material = child.userData.originalMaterial;
                }
            }
            
            // Ensure material update flag is set
            child.material.needsUpdate = true;
        }
    });
}
    
    // Rotation toggle
const rotationToggle = document.getElementById('rotation-toggle');
if (rotationToggle) {
    rotationToggle.addEventListener('change', function() {
        autoRotate = this.checked;
        if (controls) {
            controls.autoRotate = autoRotate;
        }
    });
}

// In animate function
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Handle model rotation if enabled
    if (autoRotate && currentModel) {
        currentModel.rotation.y += 0.005;
    }
    
    // Update animation mixer if available
    if (mixer) {
        mixer.update(clock.getDelta());
    }
    
    // Update FPS counter
    const now = performance.now();
    frameCount++;

    if (now > lastTime + 1000) {
    fps = Math.round((frameCount * 1000) / (now - lastTime));
    frameCount = 0;
    lastTime = now;
    
    const fpsCounter = document.getElementById('fps-counter');
    if (fpsCounter) fpsCounter.textContent = fps;
}

    
    // Use composer if available, otherwise fallback to renderer
    if (composer) {
        composer.render();
    } else {
        renderer.render(scene, camera);
    }
}

    
    // Camera view selection
    const cameraSelect = document.getElementById('camera-select');
    if (cameraSelect) {
        cameraSelect.addEventListener('change', function() {
            changeCameraView(this.value);
        });
    }
    
    // Light toggles
    const ambientLightToggle = document.getElementById('ambient-light-toggle');
    if (ambientLightToggle) {
        ambientLightToggle.addEventListener('change', function() {
            if (lights.ambient) lights.ambient.visible = this.checked;
        });
    }
    
    const directionalLightToggle = document.getElementById('directional-light-toggle');
    if (directionalLightToggle) {
        directionalLightToggle.addEventListener('change', function() {
            if (lights.directional) lights.directional.visible = this.checked;
        });
    }
    
    const spotlightToggle = document.getElementById('spotlight-toggle');
    if (spotlightToggle) {
        spotlightToggle.addEventListener('change', function() {
            if (lights.spot) lights.spot.visible = this.checked;
        });
    }
    
    const lightIntensity = document.getElementById('light-intensity');
    if (lightIntensity) {
        lightIntensity.addEventListener('input', function() {
            const intensity = parseFloat(this.value);
            if (lights.ambient) lights.ambient.intensity = intensity * 0.5;
            if (lights.directional) lights.directional.intensity = intensity;
            if (lights.spot) lights.spot.intensity = intensity * 0.8;
            if (lights.rimLight) lights.rimLight.intensity = intensity * 0.5;
        });
    }
    
    // TV controls
    const tvPowerBtn = document.getElementById('tv-power-btn');
    if (tvPowerBtn) {
        tvPowerBtn.addEventListener('click', toggleTVPower);
    }
    
    const tvNetflixBtn = document.getElementById('tv-netflix-btn');
    if (tvNetflixBtn) {
        tvNetflixBtn.addEventListener('click', () => changeTVChannel('netflix'));
    }
    
    const tvYoutubeBtn = document.getElementById('tv-youtube-btn');
    if (tvYoutubeBtn) {
        tvYoutubeBtn.addEventListener('click', () => changeTVChannel('youtube'));
    }
    
    const tvVolumeUp = document.getElementById('tv-volume-up');
    if (tvVolumeUp) {
        tvVolumeUp.addEventListener('click', () => adjustTVVolume(true));
    }
    
    const tvVolumeDown = document.getElementById('tv-volume-down');
    if (tvVolumeDown) {
        tvVolumeDown.addEventListener('click', () => adjustTVVolume(false));
    }
    
    // Fridge controls
    const fridgeDoorBtn = document.getElementById('fridge-door-btn');
    if (fridgeDoorBtn) {
        fridgeDoorBtn.addEventListener('click', toggleFridgeDoor);
    }
    
    const fridgeTempUp = document.getElementById('fridge-temp-up');
    if (fridgeTempUp) {
        fridgeTempUp.addEventListener('click', () => adjustFridgeTemp(true));
    }
    
    const fridgeTempDown = document.getElementById('fridge-temp-down');
    if (fridgeTempDown) {
        fridgeTempDown.addEventListener('click', () => adjustFridgeTemp(false));
    }
    
    // Color options for fridge
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            changeFridgeColor(this.dataset.color);
            // Update active state
            document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Lamp controls
    const lampPowerBtn = document.getElementById('lamp-power-btn');
    if (lampPowerBtn) {
        lampPowerBtn.addEventListener('click', toggleLamp);
    }
    
    const lampBrightness = document.getElementById('lamp-brightness');
    if (lampBrightness) {
        lampBrightness.addEventListener('input', function() {
            changeLampBrightness(this.value);
        });
    }
    
    // Lamp color temperature buttons
    const lampWarm = document.getElementById('lamp-warm');
    if (lampWarm) {
        lampWarm.addEventListener('click', () => changeLampColor('warm'));
    }
    
    const lampNeutral = document.getElementById('lamp-neutral');
    if (lampNeutral) {
        lampNeutral.addEventListener('click', () => changeLampColor('neutral'));
    }
    
    const lampCool = document.getElementById('lamp-cool');
    if (lampCool) {
        lampCool.addEventListener('click', () => changeLampColor('cool'));
    }
    
    // Lamp lighting modes
    if (document.getElementById('lamp-mode-day')) {
        document.getElementById('lamp-mode-day').addEventListener('click', () => setLampMode('day'));
    }
    
    if (document.getElementById('lamp-mode-night')) {
        document.getElementById('lamp-mode-night').addEventListener('click', () => setLampMode('night'));
    }
    
    if (document.getElementById('lamp-mode-mood')) {
        document.getElementById('lamp-mode-mood').addEventListener('click', () => setLampMode('mood'));
    }
    
    // Fullscreen button
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', toggleFullscreen);
    }
    
    // Explore button in hero section
    const exploreBtn = document.getElementById('explore-btn');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', function() {
            const modelExplorer = document.getElementById('model-explorer');
            modelExplorer.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Window resize handler
    window.addEventListener('resize', onWindowResize);
}

// Toggle wireframe mode on all model meshes
function toggleWireframe(enabled) {
    console.log("Toggling wireframe mode:", enabled);
    if (!currentModel) {
        console.warn("No model loaded for wireframe toggle");
        return;
    }
    
    wireframeMode = enabled;
    
    currentModel.traverse(function(child) {
        if (child.isMesh) {
            if (enabled) {
                // Store original material if not already saved
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material.clone();
                }
                
                // Create wireframe material
                const wireframeMaterial = new THREE.MeshBasicMaterial({
                    color: 0x00ffff,
                    wireframe: true
                });
                child.material = wireframeMaterial;
            } else {
                // Restore original material
                if (child.userData.originalMaterial) {
                    child.material = child.userData.originalMaterial.clone();
                }
            }
        }
    });
    
    console.log("Wireframe mode set to:", enabled);
    playSound('audio/click.mp3');
}

// Change camera view
function changeCameraView(view) {
    switch (view) {
        case 'front':
            if (window.gsap) {
                gsap.to(camera.position, {
                    x: 0,
                    y: 0,
                    z: 5,
                    duration: 1,
                    onUpdate: () => controls.update()
                });
            } else {
                camera.position.set(0, 2, 8);
                controls.update();
            }
            break;
        case 'side':
            if (window.gsap) {
                gsap.to(camera.position, {
                    x: 5,
                    y: 0,
                    z: 0,
                    duration: 1,
                    onUpdate: () => controls.update()
                });
            } else {
                camera.position.set(5, 0, 0);
                controls.update();
            }
            break;
        case 'top':
            if (window.gsap) {
                gsap.to(camera.position, {
                    x: 0,
                    y: 5,
                    z: 0,
                    duration: 1,
                    onUpdate: () => controls.update()
                });
            } else {
                camera.position.set(0, 5, 0);
                controls.update();
            }
            break;
        case 'orbit':
            if (window.gsap) {
                gsap.to(camera.position, {
                    x: 3,
                    y: 2,
                    z: 3,
                    duration: 1,
                    onUpdate: () => controls.update()
                });
            } else {
                camera.position.set(3, 2, 3);
                controls.update();
            }
            break;
    }
    
    playSound('audio/click.mp3');
}

// Quick fix for TV screen texture display

// Add the missing function
function clearScreenIndicators() {
    // Remove any existing visual indicators
    const toRemove = [];
    scene.traverse(child => {
        if (child.name === "ScreenEdgeIndicator" || 
            child.name === "ScreenOverlayIndicator" || 
            child.name === "ScreenLabel" ||
            child.name === "ScreenIndicator" ||
            child.name === "ScreenTextIndicator") {
            toRemove.push(child);
        }
    });
    
    toRemove.forEach(obj => {
        if (obj.parent) {
            obj.parent.remove(obj);
        } else {
            scene.remove(obj);
        }
    });
}

// Global TV state object
var tvState = {
    screenMesh: null,
    powerOn: false,
    screenMeshName: 'Mesh003_1'  // The screen mesh name
};

function toggleTVPower() {
    tvState.powerOn = !tvState.powerOn;
    
    if (!models.tv) {
        console.error("TV model not loaded");
        return;
    }
    
    console.log("Toggling TV power:", tvState.powerOn ? "ON" : "OFF");
    
    // Find Mesh003_1 if we don't already have it
    if (!tvState.screenMesh) {
        console.log("Searching for TV screen mesh...");
        
        models.tv.traverse(child => {
            if (child.name === "Mesh003_1" && child.isMesh) {
                tvState.screenMesh = child;
                console.log(`Found screen mesh: ${child.name}`);
                
                // Create and store glass shader if not already done
                if (!child.userData.glassShader) {
                    child.userData.glassShader = createCustomShader('glass');
                    child.userData.glassShader.uniforms.color.value = new THREE.Color(0x222222);
                    child.userData.glassShader.uniforms.opacity.value = 0.9;
                    console.log("Created glass shader for TV");
                }
                
                // Save original material
                if (!child.userData.originalMaterial) {
                    child.userData.originalMaterial = child.material.clone();
                    console.log("Saved original material");
                }
            }
        });
        
        if (!tvState.screenMesh) {
            console.error("Could not find TV screen mesh");
            return;
        }
    }
    
    if (tvState.powerOn) {
        // Create standard material for the screen
        const screenMaterial = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: new THREE.Color(0.2, 0.2, 0.2),
            emissiveIntensity: 1.0,
            roughness: 0.1,
            metalness: 0.1
        });
        
        // Apply the material immediately
        tvState.screenMesh.material = screenMaterial;
        console.log("Applied new screen material");
        
        // Load Netflix texture
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('textures/netflix.png', 
            function(texture) {
                console.log("Netflix texture loaded successfully");
                texture.flipY = false; // Fix texture orientation if needed
                screenMaterial.map = texture;
                screenMaterial.needsUpdate = true;
                console.log("Texture applied to TV screen");
            },
            function(xhr) {
                console.log(`Netflix loading: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
            },
            function(error) {
                console.error("Error loading Netflix texture:", error);
                screenMaterial.color.set(0xff0000);
                screenMaterial.needsUpdate = true;
            }
        );
    } else {
        // Use glass shader when TV is off
        if (tvState.screenMesh.userData.glassShader) {
            tvState.screenMesh.material = tvState.screenMesh.userData.glassShader;
            console.log("Applied glass shader for off state");
        } else {
            console.error("No glass shader available");
            // Fallback to dark material
            const darkMaterial = new THREE.MeshStandardMaterial({
                color: 0x111111,
                emissive: new THREE.Color(0, 0, 0),
                roughness: 0.5,
                metalness: 0.3
            });
            tvState.screenMesh.material = darkMaterial;
        }
    }
    
    playSound(tvState.powerOn ? 'audio/tv_on.mp3' : 'audio/tv_off.mp3');
}

function changeTVChannel(channel) {
    if (!tvState.powerOn) {
        console.log("TV is off - cannot change channel");
        return;
    }
    
    if (!tvState.screenMesh) {
        console.error("TV screen mesh not found");
        return;
    }
    
    console.log(`Changing TV channel to: ${channel}`);
    console.log(`Using mesh: ${tvState.screenMeshName}`);
    
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(`textures/${channel}.png`, 
        function(texture) {
            console.log(`${channel} texture loaded successfully`);
            texture.flipY = false;
            tvState.screenMesh.material.map = texture;
            tvState.screenMesh.material.needsUpdate = true;
            console.log(`Texture successfully applied to ${tvState.screenMeshName}`);
        },
        function(xhr) {
            console.log(`${channel} loading: ${(xhr.loaded / xhr.total * 100).toFixed(0)}%`);
        },
        function(error) {
            console.error(`Error loading ${channel} texture:`, error);
            tvState.screenMesh.material.color.set(0xff0000);
            tvState.screenMesh.material.needsUpdate = true;
        }
    );
    
    playSound('audio/click.mp3');
}

// Update the TV volume controls to check the screen mesh
function adjustTVVolume(increase) {
    if (!tvState.powerOn) {
        console.log("TV is off - cannot adjust volume");
        return;
    }
    
    // the existing volume adjustment code...
    playSound(increase ? 'audio/volume_up.mp3' : 'audio/volume_down.mp3');
}

// Initialise the TV state when the model loads
// Add this to the loadModels function:
loader.load('models/tv.glb', function(gltf) {
    console.log("TV model loaded successfully!");
    models.tv = gltf.scene;
    
    // Initialise the TV state immediately
    models.tv.traverse(child => {
        if (child.name === "Mesh003_1" && child.isMesh) {
            tvState.screenMesh = child;
            console.log(`Initialised Mesh003_1 on load`);
            
            // Save original material immediately
            if (!child.userData.originalMaterial) {
                child.userData.originalMaterial = child.material.clone();
                console.log("Saved original material on load");
            }
        }
    });
    
    // Debug: Log if we found the screen during initialisation
    if (tvState.screenMesh) {
        console.log("TV screen mesh successfully initialised");
    } else {
        console.log("Warning: TV screen mesh not found during initialisation");
    }
    
    // Add GLSL shader for glass/TV screen
function createGlassShader() {
    const vertexShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    const fragmentShader = `
        uniform vec3 color;
        varying vec3 vNormal;
        varying vec3 vPosition;
        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(-vPosition);
            float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);
            vec3 finalColor = mix(color, vec3(1.0), fresnel);
            gl_FragColor = vec4(finalColor, 0.7);
        }
    `;
    
    return new THREE.ShaderMaterial({
        uniforms: { color: { value: new THREE.Color(0x00bcd4) } },
        vertexShader,
        fragmentShader,
        transparent: true
    });
}

// Add post-processing
const composer = new THREE.EffectComposer(renderer);
const renderPass = new THREE.RenderPass(scene, camera);
composer.addPass(renderPass);

// Add bloom effect
const bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5, 0.4, 0.85
);
composer.addPass(bloomPass);
});

// Debug helper function
function debugTVScreen() {
    console.log("=== TV Screen Debug Info ===");
    console.log("Screen mesh name:", tvState.screenMeshName);
    console.log("Screen mesh object:", tvState.screenMesh);
    console.log("Power state:", tvState.powerOn);
    
    if (models.tv) {
        models.tv.traverse(child => {
            if (child.name === "Mesh003_1") {
                console.log("Found Mesh003_1 in model");
                const box = new THREE.Box3().setFromObject(child);
                const size = box.getSize(new THREE.Vector3());
                console.log(`Size: ${size.x} x ${size.y} x ${size.z}`);
            }
        });
    }
    console.log("==========================");
}

// First, let's analyze the specific fridge model
function analyzeFridgeModel() {
    if (!models.fridge) {
        console.error("Fridge model not loaded");
        return;
    }
    
    console.log("-------------- FRIDGE MODEL ANALYSIS --------------");
    
    // Look specifically for the meshes you mentioned
    const targetDoorNames = ['Object_18.003', 'Object_18003', 'Plane', 'object_13', 'Object_13'];
    const problematicMeshNames = ['nodes[0]', 'nodes0', 'nodes'];
    
    let doorMeshes = [];
    let problematicMeshes = [];
    
    // Collect all meshes for inspection
    models.fridge.traverse(child => {
        if (child.isMesh) {
            console.log(`Found mesh: ${child.name}`);
            
            // Check if this is one of our target door meshes
            for (const doorName of targetDoorNames) {
                if (child.name.includes(doorName)) {
                    const box = new THREE.Box3().setFromObject(child);
                    const size = box.getSize(new THREE.Vector3());
                    const center = box.getCenter(new THREE.Vector3());
                    
                    doorMeshes.push({
                        name: child.name,
                        mesh: child,
                        size: size,
                        center: center
                    });
                    
                    console.log(`Found door mesh: ${child.name}`);
                    console.log(`  Size: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
                    console.log(`  Position: ${center.x.toFixed(2)}, ${center.y.toFixed(2)}, ${center.z.toFixed(2)}`);
                    break;
                }
            }
            
            // Check for problematic meshes that should not move
            for (const meshName of problematicMeshNames) {
                if (child.name.includes(meshName)) {
                    problematicMeshes.push({
                        name: child.name,
                        mesh: child
                    });
                    console.log(`Found problematic mesh (should not move): ${child.name}`);
                    break;
                }
            }
        }
    });
    
    console.log(`Found ${doorMeshes.length} door meshes and ${problematicMeshes.length} problematic meshes`);
    console.log("---------------------------------------------------");
    
    return { doorMeshes, problematicMeshes };
}

// Initialise door position tracking
let initialDoorStates = {};

// Enhanced toggle function specifically for the model

function toggleFridgeDoor() {
    fridgeDoorOpen = !fridgeDoorOpen;
    
    if (!models.fridge) {
        console.error("Fridge model not loaded");
        return;
    }
    
    console.log(`Toggling fridge door, new state: ${fridgeDoorOpen ? "Open" : "Closed"}`);
    
    // Store initial states if not already saved
    if (!window.fridgeInitialStates) {
        window.fridgeInitialStates = {};
        
        models.fridge.traverse(child => {
            if (child.isMesh) {
                window.fridgeInitialStates[child.name] = {
                    rotationX: child.rotation.x,
                    rotationY: child.rotation.y,
                    rotationZ: child.rotation.z,
                    positionX: child.position.x,
                    positionY: child.position.y,
                    positionZ: child.position.z
                };
            }
        });
    }
    
    // 1. Door animation
    let doorMesh = null;
    
    models.fridge.traverse(child => {
        if (child.isMesh && child.name === "Object_18003_1") {
            doorMesh = child;
            console.log(`Found main door: ${child.name}`);
        }
    });
    
    if (doorMesh) {
        const initialState = window.fridgeInitialStates[doorMesh.name] || {
            rotationX: 0, rotationY: 0, rotationZ: 0
        };
        
        if (fridgeDoorOpen) {
            if (window.gsap) {
                gsap.to(doorMesh.rotation, {
                    y: Math.PI/2,
                    duration: 0.8,
                    ease: "power2.out"
                });
            } else {
                doorMesh.rotation.y = Math.PI/2;
            }
        } else {
            if (window.gsap) {
                gsap.to(doorMesh.rotation, {
                    x: initialState.rotationX,
                    y: initialState.rotationY,
                    z: initialState.rotationZ,
                    duration: 0.6,
                    ease: "power2.inOut"
                });
            } else {
                doorMesh.rotation.set(
                    initialState.rotationX,
                    initialState.rotationY,
                    initialState.rotationZ
                );
            }
        }
    }
    
    // 2. Cup animation with proper cleanup
    let cupMesh = null;
    
    models.fridge.traverse(child => {
        if (child.isMesh && child.name === "nodes0_2") {
            cupMesh = child;
            console.log(`Found cup: ${child.name}`);
        }
    });
    
    if (cupMesh) {
        const initialState = window.fridgeInitialStates[cupMesh.name] || {
            positionX: 0, positionY: 0, positionZ: 0
        };
        
        // Clean up any lingering visual effects
        scene.traverse(obj => {
            if (obj.name === "CupHighlight") {
                obj.parent.remove(obj);
            }
        });
        
        if (fridgeDoorOpen) {
            // Reduced movement: Only move up by 0.05 units
            if (window.gsap) {
                gsap.to(cupMesh.position, {
                    y: initialState.positionY + 0.05, // Further reduced from 0.1 to 0.05
                    duration: 0.8,
                    ease: "power2.out"
                });
            } else {
                cupMesh.position.y = initialState.positionY + 0.05;
            }
        } else {
            // Return cup to original position
            if (window.gsap) {
                gsap.to(cupMesh.position, {
                    x: initialState.positionX,
                    y: initialState.positionY,
                    z: initialState.positionZ,
                    duration: 0.6,
                    ease: "power2.inOut"
                });
            } else {
                cupMesh.position.set(
                    initialState.positionX,
                    initialState.positionY,
                    initialState.positionZ
                );
            }
        }
    }
    
    // Add/remove interior light
    if (fridgeDoorOpen) {
        addFridgeInteriorLight();
        playSound('audio/fridge_open.mp3');
    } else {
        removeFridgeInteriorLight();
        playSound('audio/fridge_close.mp3');
    }
}

// Cleanup function to remove wireframe artifacts
function cleanupWireframes() {
    scene.traverse(obj => {
        if (obj.name === "Highlight" || obj.name === "CupHighlight") {
            if (obj.parent) {
                obj.parent.remove(obj);
            }
        }
    });
}

// Modified highlight function with auto-cleanup
function highlightMesh(mesh, color = 0x00ff00, duration = 1000) {
    // First, clean up any existing highlights
    cleanupWireframes();
    
    // Create a wireframe copy of the mesh
    const wireGeometry = mesh.geometry.clone();
    const wireMaterial = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.7
    });
    
    const highlight = new THREE.Mesh(wireGeometry, wireMaterial);
    highlight.name = "Highlight";
    
    // Match position, rotation, and scale
    highlight.position.copy(mesh.position);
    highlight.rotation.copy(mesh.rotation);
    highlight.scale.copy(mesh.scale);
    highlight.scale.multiplyScalar(1.01); // Make slightly larger
    
    // Add to parent
    if (mesh.parent) {
        mesh.parent.add(highlight);
    } else {
        scene.add(highlight);
    }
    
    // Remove after specified duration
    setTimeout(() => {
        if (highlight.parent) {
            highlight.parent.remove(highlight);
        }
    }, duration);
}

// Helper to create text texture for placeholders
function createTextTexture(text, material) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 288;
    const ctx = canvas.getContext('2d');
    
    // Fill background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add text
    ctx.fillStyle = 'red';
    ctx.font = 'bold 72px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width/2, canvas.height/2);
    
    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    material.map = texture;
    material.needsUpdate = true;
}

// Call this once after everything is loaded to ensure clean state
setTimeout(() => {
    cleanupWireframes();
}, 2000);

// Light functions remain the same
function addFridgeInteriorLight() {
    removeFridgeInteriorLight();
    
    if (!models.fridge) return;
    
    const box = new THREE.Box3().setFromObject(models.fridge);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    const fridgeLight = new THREE.PointLight(0xffffee, 1.0, size.x * 2);
    fridgeLight.name = "fridgeInteriorLight";
    fridgeLight.position.set(center.x, center.y, center.z);
    
    scene.add(fridgeLight);
}

function removeFridgeInteriorLight() {
    scene.traverse(child => {
        if (child.name === "fridgeInteriorLight") {
            scene.remove(child);
        }
    });
}

// Make sure interior components don't move
function preventInternalMovement() {
    // List of components that should not move (including the ones you mentioned)
    const fixedComponentNames = ['nodes[0]', 'nodes0', 'cup', 'interior', 'shelf', 'drawer'];
    
    models.fridge.traverse(child => {
        if (child.isMesh) {
            // Check if this is an internal component that should be fixed
            let shouldBeFixed = false;
            for (const name of fixedComponentNames) {
                if (child.name.toLowerCase().includes(name.toLowerCase())) {
                    shouldBeFixed = true;
                    break;
                }
            }
            
            if (shouldBeFixed) {
                // Reset rotation to prevent movement
                child.rotation.set(0, 0, 0);
                console.log(`Fixed component to prevent movement: ${child.name}`);
            }
        }
    });
}

// Helper function to highlight a door mesh temporarily (with shorter duration)
function highlightDoorMesh(doorMesh, color = 0x00ff00, duration = 250) {
    // Remove any previous highlights first
    models.fridge.traverse(child => {
        if (child.name === "DoorHighlight") {
            if (child.parent) child.parent.remove(child);
        }
    });
    
    // Create a wireframe copy of the door mesh
    const wireGeometry = doorMesh.geometry.clone();
    const wireMaterial = new THREE.MeshBasicMaterial({
        color: color,
        wireframe: true,
        transparent: true,
        opacity: 0.3  // Lower opacity to be less distracting
    });
    
    const highlight = new THREE.Mesh(wireGeometry, wireMaterial);
    highlight.name = "DoorHighlight";
    
    // Match position, rotation, and scale
    highlight.position.copy(doorMesh.position);
    highlight.rotation.copy(doorMesh.rotation);
    highlight.scale.copy(doorMesh.scale);
    
    // Make it slightly larger to stand out
    highlight.scale.multiplyScalar(1.01);
    
    // Add to the door mesh
    doorMesh.add(highlight);
    
    // Remove highlight after specified duration
    setTimeout(() => {
        if (highlight.parent) {
            highlight.parent.remove(highlight);
        }
    }, duration);
}

// Enhanced fridge interior light
function addFridgeInteriorLight() {
    // Remove any existing lights first
    removeFridgeInteriorLight();
    
    if (!models.fridge) return;
    
    // Get fridge dimensions
    const box = new THREE.Box3().setFromObject(models.fridge);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Create a point light
    const fridgeLight = new THREE.PointLight(0xffffee, 1.0, size.x * 2);
    fridgeLight.name = "fridgeInteriorLight";
    
    // Position the light inside the fridge
    fridgeLight.position.set(
        center.x,        // X center 
        center.y,        // Y center
        center.z         // Z center
    );
    
    // Add to the scene, not the fridge model
    scene.add(fridgeLight);
    
    console.log(`Added interior fridge light at position: (${fridgeLight.position.x.toFixed(2)}, ${fridgeLight.position.y.toFixed(2)}, ${fridgeLight.position.z.toFixed(2)})`);
}

// Remove fridge interior light
function removeFridgeInteriorLight() {
    scene.traverse(child => {
        if (child.name === "fridgeInteriorLight") {
            scene.remove(child);
            console.log("Removed interior fridge light");
        }
    });
}

// Helper function to animate a door with testing multiple rotation axes
function animateDoor(doorMesh) {
    // Get initial state
    const initialState = window.initialDoorStates[doorMesh.name] || {
        rotationX: 0, rotationY: 0, rotationZ: 0
    };
    
    // Determine which side the door is on to set rotation direction
    const box = new THREE.Box3().setFromObject(doorMesh);
    const center = box.getCenter(new THREE.Vector3());
    const isLeftSide = center.x < 0;
    
    // Set rotation values for each possible axis
    const openRotations = {
        x: isLeftSide ? -Math.PI/2 : Math.PI/2,
        y: isLeftSide ? -Math.PI/2 : Math.PI/2,
        z: isLeftSide ? -Math.PI/2 : Math.PI/2
    };
    
    // For the specific model - focus on Y axis rotation which is most common
    const primaryAxis = 'y';
    const openAngle = openRotations[primaryAxis];
    
    if (fridgeDoorOpen) {
        console.log(`Opening door ${doorMesh.name} on ${primaryAxis} axis to ${openAngle} radians`);
        
        if (window.gsap) {
            gsap.to(doorMesh.rotation, {
                [primaryAxis]: openAngle,
                duration: 0.8,
                ease: "power2.out"
            });
        } else {
            doorMesh.rotation[primaryAxis] = openAngle;
        }
    } else {
        console.log(`Closing door ${doorMesh.name} to original rotation`);
        
        if (window.gsap) {
            gsap.to(doorMesh.rotation, {
                x: initialState.rotationX,
                y: initialState.rotationY,
                z: initialState.rotationZ,
                duration: 0.6,
                ease: "power2.inOut"
            });
        } else {
            doorMesh.rotation.set(
                initialState.rotationX,
                initialState.rotationY,
                initialState.rotationZ
            );
        }
    }
    
    // Create a visual indicator to show which part is being rotated
    highlightDoorMesh(doorMesh);
}

// Helper function to highlight the door mesh for debugging
function highlightDoorMesh(doorMesh) {
    // Remove any previous highlights
    models.fridge.traverse(child => {
        if (child.name === "DoorHighlight") {
            models.fridge.remove(child);
        }
    });
    
    // Create a wireframe box to show which mesh is the door
    const geometry = doorMesh.geometry.clone();
    const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        transparent: true,
        opacity: 0.5
    });
    
    const highlight = new THREE.Mesh(geometry, material);
    highlight.name = "DoorHighlight";
    
    // Copy the position, rotation and scale
    highlight.position.copy(doorMesh.position);
    highlight.rotation.copy(doorMesh.rotation);
    highlight.scale.copy(doorMesh.scale);
    
    // Make it slightly larger to stand out
    highlight.scale.multiplyScalar(1.01);
    
    // Add to the door mesh
    doorMesh.add(highlight);
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
        if (highlight.parent) {
            highlight.parent.remove(highlight);
        }
    }, 3000);
}

// Enhanced fridge interior light
function addFridgeInteriorLight() {
    // Remove any existing lights first
    removeFridgeInteriorLight();
    
    if (!models.fridge) return;
    
    // Get fridge dimensions
    const box = new THREE.Box3().setFromObject(models.fridge);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Create a point light
    const fridgeLight = new THREE.PointLight(0xffffee, 1.0, size.x * 2);
    fridgeLight.name = "fridgeInteriorLight";
    
    // Position the light inside the fridge
    fridgeLight.position.set(
        center.x,        // X center 
        center.y,        // Y center
        center.z         // Z center
    );
    
    // Add to the scene, not the fridge model
    scene.add(fridgeLight);
    
    console.log(`Added interior fridge light at position: (${fridgeLight.position.x.toFixed(2)}, ${fridgeLight.position.y.toFixed(2)}, ${fridgeLight.position.z.toFixed(2)})`);
}

// Adjust fridge temperature
function adjustFridgeTemp(isUp) {
    // Create temperature display if it doesn't exist
    let tempDisplay = document.querySelector('.temp-display');
    
    if (!tempDisplay) {
        tempDisplay = document.createElement('div');
        tempDisplay.className = 'temp-display';
        tempDisplay.dataset.temp = '4';
        document.getElementById('fridge-controls').appendChild(tempDisplay);
    }
    
    // Get current temperature
    let currentTemp = parseInt(tempDisplay.dataset.temp);
    
    // Adjust temperature
    if (isUp) {
        currentTemp = Math.min(8, currentTemp + 1);
    } else {
        currentTemp = Math.max(1, currentTemp - 1);
    }
    
    // Save new temperature
    tempDisplay.dataset.temp = currentTemp;
    
    // Update display with animation
    if (window.gsap) {
        gsap.fromTo(tempDisplay, 
            { scale: 1.2, color: isUp ? '#FF5722' : '#2196F3' },
            { scale: 1, color: '#333', duration: 0.5 }
        );
    }
    
    tempDisplay.textContent = `${currentTemp}°C`;
    
    playSound('audio/beep.mp3');
}

// Change fridge color
function changeFridgeColor(colorName) {
    if (!models.fridge) return;
    
    let color;
    switch (colorName) {
        case 'white': color = new THREE.Color(0xf2f2f2); break;
        case 'black': color = new THREE.Color(0x333333); break;
        case 'steel': color = new THREE.Color(0x7f7f7f); break;
        case 'silver': color = new THREE.Color(0xc0c0c0); break;
        default: color = new THREE.Color(0xf2f2f2);
    }
    
    models.fridge.traverse(child => {
        if (child.isMesh && !child.name.includes('Interior') && !child.name.includes('Handle')) {
            if (window.gsap) {
                const currentColor = child.material.color.clone();
                
                gsap.to(child.material.color, {
                    r: color.r,
                    g: color.g,
                    b: color.b,
                    duration: 0.5,
                    ease: "power2.out"
                });
            } else {
                // Fallback without animation
                child.material.color.set(color);
            }
            
            child.material.needsUpdate = true;
        }
    });
    
    playSound('audio/click.mp3');
}

// Lamp specific controls
// Enhanced lamp control functions

// Toggle lamp on/off
function toggleLamp() {
    lampOn = !lampOn;
    
    if (!models.lamp) {
        console.error("Lamp model not loaded");
        return;
    }
    
    console.log("Toggling lamp:", lampOn ? "On" : "Off");
    
    // Find bulb meshes and apply emissive shader
    let bulbFound = false;
    models.lamp.traverse(child => {
        if (child.isMesh && (
            child.name.includes('Bulb') || 
            child.name.includes('bulb') ||
            child.name.includes('Light') ||
            child.name.includes('light')
        )) {
            bulbFound = true;
            console.log("Found lamp bulb mesh:", child.name);
            
            // Create shader if not already done
            if (!child.userData.emissiveShader) {
                child.userData.emissiveShader = createCustomShader('emissive');
                child.userData.emissiveShader.uniforms.color.value = new THREE.Color(0xffffee);
                console.log("Created emissive shader for lamp");
            }
            
            // Save original material if not already stored
            if (!child.userData.originalMaterial) {
                child.userData.originalMaterial = child.material.clone();
                console.log("Saved original bulb material");
            }
            
            if (lampOn) {
                // Use emissive shader with animation
                child.material = child.userData.emissiveShader;
                
                if (window.gsap) {
                    // Animate intensity from 0 to 1
                    gsap.to(child.material.uniforms.intensity, {
                        value: 1.0,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                } else {
                    child.material.uniforms.intensity.value = 1.0;
                }
                console.log("Activated emissive shader");
            } else {
                // Turn off - either animate down or restore original
                if (child.material.isShaderMaterial && child.material.uniforms.intensity) {
                    if (window.gsap) {
                        // Animate intensity down to 0
                        gsap.to(child.material.uniforms.intensity, {
                            value: 0.0,
                            duration: 0.3,
                            ease: "power2.in"
                        });
                    } else {
                        child.material.uniforms.intensity.value = 0.0;
                    }
                } else {
                    // Restore original material
                    if (child.userData.originalMaterial) {
                        child.material = child.userData.originalMaterial.clone();
                    }
                }
            }
        }
    });
    
    // Handle lamp light source
    if (!lights.lampLight) {
        // Create a new point light for the lamp
        const lampLight = new THREE.PointLight(0xffffee, lampOn ? 1.5 : 0, 10);
        lampLight.name = "lampLight";
        
        // Position the light at the top of the lamp
        const box = new THREE.Box3().setFromObject(models.lamp);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        
        lampLight.position.set(center.x, center.y + size.y * 0.4, center.z);
        
        scene.add(lampLight);
        lights.lampLight = lampLight;
        
        console.log("Created new lamp light at position:", lampLight.position);
    } else {
        // Update existing lamp light
        lights.lampLight.visible = lampOn;
        lights.lampLight.intensity = lampOn ? 1.5 : 0;
        console.log("Updated existing lamp light - visible:", lights.lampLight.visible);
    }
    
    // Play sound effect
    playSound(lampOn ? 'audio/lamp_on.mp3' : 'audio/lamp_off.mp3');
}

// Change lamp brightness
function changeLampBrightness(value) {
    if (!lampOn || !models.lamp) {
        console.log("Lamp is off or not loaded - can't change brightness");
        return;
    }
    
    console.log("Changing lamp brightness to:", value);
    
    const brightness = value / 100; // Convert to 0-1 range
    
    // Update bulb material brightness
    models.lamp.traverse(function(child) {
        if (child.isMesh && (
            child.name.includes('Bulb') || 
            child.name.includes('bulb') || 
            child.name.includes('Light') ||
            child.name.includes('light')
        )) {
            // Only adjust if we have emissive material
            if (child.material.emissive) {
                console.log("Adjusting bulb emissive intensity to:", brightness);
                child.material.emissiveIntensity = brightness;
                child.material.needsUpdate = true;
            }
        }
    });
    
    // Adjust point light intensity
    if (lights.lampLight) {
        console.log("Adjusting lamp light intensity to:", brightness * 2);
        lights.lampLight.intensity = brightness * 2;
    }
    
    // Subtle feedback sound
    playSound('audio/click.mp3');
}

// Change lamp color temperature
function changeLampColor(temperature) {
    if (!lampOn || !models.lamp) {
        console.log("Lamp is off or not loaded - can't change color");
        return;
    }
    
    console.log("Changing lamp color temperature to:", temperature);
    
    // Define colors for different temperatures
    let color;
    switch (temperature) {
        case 'warm':
            color = new THREE.Color(0.9, 0.7, 0.3); // Warm yellow
            break;
        case 'neutral':
            color = new THREE.Color(0.9, 0.9, 0.8); // Natural white
            break;
        case 'cool':
            color = new THREE.Color(0.8, 0.9, 1.0); // Cool blue-white
            break;
        default:
            color = new THREE.Color(0.9, 0.9, 0.8); // Default to neutral
    }
    
    // Update bulb material color
    models.lamp.traverse(function(child) {
        if (child.isMesh && (
            child.name.includes('Bulb') || 
            child.name.includes('bulb') || 
            child.name.includes('Light') ||
            child.name.includes('light')
        )) {
            // Only adjust if we have emissive material
            if (child.material.emissive) {
                console.log("Adjusting bulb emissive color:", color);
                
                if (window.gsap) {
                    // Smooth transition with GSAP
                    gsap.to(child.material.emissive, {
                        r: color.r,
                        g: color.g,
                        b: color.b,
                        duration: 0.5,
                        ease: "power2.out"
                    });
                } else {
                    // Direct change without animation
                    child.material.emissive.copy(color);
                    child.material.needsUpdate = true;
                }
            }
        }
    });
    
    // Update point light color
    if (lights.lampLight) {
        console.log("Adjusting lamp light color:", color);
        
        if (window.gsap) {
            // Smooth transition with GSAP
            gsap.to(lights.lampLight.color, {
                r: color.r,
                g: color.g,
                b: color.b,
                duration: 0.5
            });
        } else {
            // Direct change without animation
            lights.lampLight.color.copy(color);
        }
    }
    
    // Highlight the active button
    document.querySelectorAll('.light-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`lamp-${temperature}`).classList.add('active');
    
    // Play feedback sound
    playSound('audio/click.mp3');
}

// Set lamp lighting mode (day, night, mood)
function setLampMode(mode) {
    if (!models.lamp || !lampOn) {
        console.log("Lamp is off or not loaded - can't change mode");
        return;
    }
    
    console.log("Setting lamp mode to:", mode);
    
    // Define properties for each mode
    const modes = {
        day: {
            color: new THREE.Color(0.9, 0.9, 1.0),
            intensity: 1.0,
            angle: Math.PI / 3
        },
        night: {
            color: new THREE.Color(0.5, 0.3, 0.1),
            intensity: 0.6,
            angle: Math.PI / 4
        },
        mood: {
            color: new THREE.Color(0.7, 0.3, 0.8),
            intensity: 0.8,
            angle: Math.PI / 2.5
        }
    };
    
    const modeSettings = modes[mode] || modes.day;
    
    // Apply to bulb
    models.lamp.traverse(child => {
        if (child.isMesh && (
            child.name.includes('Bulb') || 
            child.name.includes('bulb') || 
            child.name.includes('Light') ||
            child.name.includes('light')
        )) {
            if (child.material.emissive) {
                if (window.gsap) {
                    gsap.to(child.material.emissive, {
                        r: modeSettings.color.r,
                        g: modeSettings.color.g,
                        b: modeSettings.color.b,
                        duration: 0.8,
                        ease: "power2.out"
                    });
                    
                    gsap.to(child.material, {
                        emissiveIntensity: modeSettings.intensity,
                        duration: 0.8,
                        ease: "power2.out"
                    });
                } else {
                    child.material.emissive.copy(modeSettings.color);
                    child.material.emissiveIntensity = modeSettings.intensity;
                    child.material.needsUpdate = true;
                }
            }
        }
    });
    
    // Apply to light
    if (lights.lampLight) {
        if (window.gsap) {
            gsap.to(lights.lampLight, {
                intensity: modeSettings.intensity * 2,
                duration: 0.8,
                ease: "power2.out"
            });
            
            gsap.to(lights.lampLight.color, {
                r: modeSettings.color.r,
                g: modeSettings.color.g,
                b: modeSettings.color.b,
                duration: 0.8,
                ease: "power2.out"
            });
        } else {
            lights.lampLight.intensity = modeSettings.intensity * 2;
            lights.lampLight.color.copy(modeSettings.color);
        }
    }
    
    playSound('audio/click.mp3');
    
    // Highlight active mode button
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`lamp-mode-${mode}`).classList.add('active');
}

function changeLampBrightness(value) {
    if (!lampOn || !models.lamp) return;
    
    const brightness = value / 100; // Convert to 0-1 range
    
    models.lamp.traverse(function(child) {
        if (child.isMesh && child.name.includes('Bulb')) {
            child.material.emissiveIntensity = brightness;
            child.material.needsUpdate = true;
        }
    });
    
    // Also adjust point light intensity if it exists
    if (lights.lampLight) {
        lights.lampLight.intensity = brightness * 2;
    }
}

function changeLampColor(temperature) {
    if (!lampOn || !models.lamp) return;
    
    let color;
    switch (temperature) {
        case 'warm':
            color = new THREE.Color(0xffcc88); // Warm yellow
            break;
        case 'neutral':
            color = new THREE.Color(0xffffee); // Natural white
            break;
        case 'cool':
            color = new THREE.Color(0xe6f0ff); // Cool blue-white
            break;
        default:
            color = new THREE.Color(0xffffee);
    }
    
    models.lamp.traverse(function(child) {
        if (child.isMesh && child.name.includes('Bulb')) {
            if (window.gsap) {
                gsap.to(child.material.emissive, {
                    r: color.r,
                    g: color.g,
                    b: color.b,
                    duration: 0.5,
                    ease: "power2.out"
                });
            } else {
                child.material.emissive.copy(color);
            }
            child.material.needsUpdate = true;
        }
    });
    
    // Also change point light color if it exists
    if (lights.lampLight) {
        if (window.gsap) {
            gsap.to(lights.lampLight.color, {
                r: color.r,
                g: color.g,
                b: color.b,
                duration: 0.5
            });
        } else {
            lights.lampLight.color.copy(color);
        }
    }
    
    playSound('audio/click.mp3');
}

// Set lamp lighting mode
function setLampMode(mode) {
    if (!models.lamp || !lampOn) return;
    
    // Define properties for each mode
    const modes = {
        day: {
            color: new THREE.Color(0.9, 0.9, 1.0),
            intensity: 1.0,
            angle: Math.PI / 3
        },
        night: {
            color: new THREE.Color(0.5, 0.3, 0.1),
            intensity: 0.6,
            angle: Math.PI / 4
        },
        mood: {
            color: new THREE.Color(0.7, 0.3, 0.8),
            intensity: 0.8,
            angle: Math.PI / 2.5
        }
    };
    
    const modeSettings = modes[mode] || modes.day;
    
    // Apply to bulb
    models.lamp.traverse(child => {
        if (child.isMesh && child.name.includes('Bulb')) {
            if (window.gsap) {
                gsap.to(child.material.emissive, {
                    r: modeSettings.color.r,
                    g: modeSettings.color.g,
                    b: modeSettings.color.b,
                    duration: 0.8,
                    ease: "power2.out"
                });
            } else {
                child.material.emissive.copy(modeSettings.color);
            }
            
            child.material.emissiveIntensity = modeSettings.intensity;
            child.material.needsUpdate = true;
        }
    });
    
    // Apply to light
    if (lights.lampLight) {
        if (window.gsap) {
            gsap.to(lights.lampLight, {
                intensity: modeSettings.intensity * 2,
                duration: 0.8,
                ease: "power2.out"
            });
            
            gsap.to(lights.lampLight.color, {
                r: modeSettings.color.r,
                g: modeSettings.color.g,
                b: modeSettings.color.b,
                duration: 0.8,
                ease: "power2.out"
            });
        } else {
            lights.lampLight.intensity = modeSettings.intensity * 2;
            lights.lampLight.color.copy(modeSettings.color);
        }
    }
    
    playSound('audio/click.mp3');
    
    // Highlight active mode button
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`lamp-mode-${mode}`).classList.add('active');
}

// Utility functions
function toggleFullscreen() {
    const viewerContainer = document.querySelector('.model-viewer-container');
    
    if (!isFullscreen) {
        // Enter fullscreen
        if (viewerContainer.requestFullscreen) {
            viewerContainer.requestFullscreen();
        }
        isFullscreen = true;
    } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
        isFullscreen = false;
    }
    
    // Resize renderer to fit new container size
    setTimeout(onWindowResize, 100);
}

// Show floating indicator for brief actions
function showFloatingIndicator(icon, color) {
    // Create indicator element
    const indicator = document.createElement('div');
    indicator.className = 'floating-indicator';
    indicator.style.position = 'absolute';
    indicator.style.top = '20px';
    indicator.style.right = '20px';
    indicator.style.backgroundColor = color || 'rgba(0,0,0,0.7)';
    indicator.style.color = 'white';
    indicator.style.padding = '15px';
    indicator.style.borderRadius = '50%';
    indicator.style.zIndex = '1000';
    indicator.style.opacity = '0';
    indicator.style.transform = 'scale(0.5)';
    indicator.style.transition = 'all 0.3s ease';
    indicator.innerHTML = icon;
    
    modelContainer.appendChild(indicator);
    
    // Animate in
    setTimeout(() => {
        indicator.style.opacity = '1';
        indicator.style.transform = 'scale(1)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        indicator.style.opacity = '0';
        indicator.style.transform = 'scale(0.5)';
        
        setTimeout(() => {
            indicator.remove();
        }, 300);
    }, 1500);
}

// Play audio helper function
// Play audio helper function
function playSound(src) {
    console.log("Attempting to play sound:", src);
    
    try {
        // Create an audio element
        const audio = new Audio(src);
        audio.volume = 0.3; // Lower volume to be less intrusive
        
        // Attempt to play
        const playPromise = audio.play();
        
        // Handle play promise (required for some browsers)
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Audio play prevented (common in some browsers until user interaction):", error);
            });
        }
    } catch (error) {
        console.error("Error playing audio:", error);
    }
}

// Handle window resize
function onWindowResize() {
    if (!camera || !renderer || !modelContainer) return;
    
    camera.aspect = modelContainer.clientWidth / modelContainer.clientHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
}

// Animate the hero content on page load
function animateHeroContent() {
    const heroTitle = document.querySelector('.hero-title');
    const heroSubtitle = document.querySelector('.hero-subtitle');
    const heroButtons = document.querySelector('.hero-buttons');
    
    if (window.gsap) {
        gsap.from(heroTitle, {
            y: 50,
            opacity: 0,
            duration: 0.8,
            delay: 0.2
        });
        
        gsap.from(heroSubtitle, {
            y: 30,
            opacity: 0,
            duration: 0.8,
            delay: 0.4
        });
        
        gsap.from(heroButtons, {
            y: 20,
            opacity: 0,
            duration: 0.8,
            delay: 0.6
        });
    }
}

// Handle scroll animations
function handleScroll() {
    // Add scrolled class to navbar when scrolled down
    const navbar = document.querySelector('.navbar');
    if (navbar) {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    
    // Animate sections as they come into view
    const sections = document.querySelectorAll('.model-explorer, .features-section, .cta-section');
    
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.8 && !section.classList.contains('animated')) {
            section.classList.add('animated');
            
            if (window.gsap) {
                // Animate section header
                const header = section.querySelector('.section-header');
                if (header) {
                    gsap.fromTo(header, 
                        { opacity: 0, y: 30 },
                        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
                    );
                }
                
                // Animate cards with stagger
                const cards = section.querySelectorAll('.card, .feature-card');
                if (cards.length) {
                    gsap.fromTo(cards, 
                        { opacity: 0, y: 30 },
                        { 
                            opacity: 1, 
                            y: 0, 
                            duration: 0.6, 
                            stagger: 0.15, 
                            ease: "power2.out" 
                        }
                    );
                }
            }
        }
    });
}

// Create a custom GLSL shader material (advanced feature)
function createCustomShader(type) {
    let vertexShader, fragmentShader;
    
    // Base vertex shader for all materials
    vertexShader = `
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying vec2 vUv;
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;
    
    // Different fragment shaders based on material type
    switch (type) {
        case 'glass':
            fragmentShader = `
                uniform vec3 color;
                uniform float opacity;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(-vPosition);
                    
                    // Simple fresnel effect
                    float fresnel = pow(1.0 - dot(normal, viewDir), 3.0);
                    
                    // Combine base color with fresnel effect
                    vec3 finalColor = mix(color, vec3(1.0), fresnel * 0.7);
                    
                    gl_FragColor = vec4(finalColor, opacity);
                }
            `;
            break;
        case 'metal':
            fragmentShader = `
                uniform vec3 color;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(-vPosition);
                    
                    // Simple reflection calculation
                    float reflection = pow(dot(normal, viewDir), 2.0);
                    
                    // Add some metallic highlights
                    vec3 finalColor = color + reflection * 0.5;
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `;
            break;
        case 'emissive':
            fragmentShader = `
                uniform vec3 color;
                uniform float intensity;
                varying vec2 vUv;
                
                void main() {
                    // Create pulsing effect
                    float pulse = sin(vUv.x * 10.0 + vUv.y * 10.0) * 0.5 + 0.5;
                    vec3 glow = color * (intensity + pulse * 0.3);
                    
                    gl_FragColor = vec4(glow, 1.0);
                }
            `;
            break;
        default:
            // Default phong-like shader
            fragmentShader = `
                uniform vec3 color;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    vec3 normal = normalize(vNormal);
                    vec3 viewDir = normalize(-vPosition);
                    
                    // Basic diffuse lighting
                    float diffuse = max(dot(normal, vec3(0.0, 1.0, 0.5)), 0.0);
                    
                    vec3 finalColor = color * (0.3 + diffuse * 0.7);
                    
                    gl_FragColor = vec4(finalColor, 1.0);
                }
            `;
    }
    
    return new THREE.ShaderMaterial({
        uniforms: {
            color: { value: new THREE.Color(0x888888) },
            opacity: { value: 0.8 },
            intensity: { value: 1.0 }
        },
        vertexShader: vertexShader,
        fragmentShader: fragmentShader,
        transparent: type === 'glass',
        lights: false
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update controls
    controls.update();
    
    // Handle model rotation if enabled
    if (autoRotate && currentModel) {
        currentModel.rotation.y += 0.005;
    }
    
    // Update animation mixer if available
    if (mixer) {
        mixer.update(clock.getDelta());
    }
    
    // Update FPS counter
    const now = performance.now();
    frameCount++;
    
    if (now > lastTime + 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;
        
        const fpsCounter = document.getElementById('fps-counter');
        if (fpsCounter) fpsCounter.textContent = fps;
    }
    
    // Render scene
    renderer.render(scene, camera);
}

// Save settings to PHP backend
function saveSettingsToServer(settings) {
    fetch('database.php?action=save_preference', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            preference_name: 'user_settings',
            preference_value: JSON.stringify(settings)
        })
    })
    .then(response => response.json())
    .then(data => {
        console.log('Settings saved:', data);
    })
    .catch(error => {
        console.error('Error saving settings:', error);
    });
}

// Load settings from PHP backend
function loadSettingsFromServer() {
    fetch('database.php?action=get_preferences', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        if (data && data.user_settings) {
            const settings = JSON.parse(data.user_settings);
            console.log('Settings loaded:', settings);
            
            // Apply loaded settings
            applyUserSettings(settings);
        }
    })
    .catch(error => {
        console.error('Error loading settings:', error);
    });
}

// Apply user settings to UI and models
function applyUserSettings(settings) {
    // Apply model selection
    if (settings.currentModel) {
        loadModel(settings.currentModel);
    }
    
    // Apply wireframe setting
    if (wireframeToggle && settings.wireframe !== undefined) {
        wireframeToggle.checked = settings.wireframe;
        toggleWireframe(settings.wireframe);
    }
    
    // Apply auto-rotation setting
    if (rotationToggle && settings.autoRotate !== undefined) {
        rotationToggle.checked = settings.autoRotate;
        controls.autoRotate = settings.autoRotate;
    }
    
    // Apply light settings
    if (settings.lights) {
        if (ambientLightToggle && settings.lights.ambient !== undefined) {
            ambientLightToggle.checked = settings.lights.ambient;
            lights.ambient.visible = settings.lights.ambient;
        }
        
        if (directionalLightToggle && settings.lights.directional !== undefined) {
            directionalLightToggle.checked = settings.lights.directional;
            lights.directional.visible = settings.lights.directional;
        }
        
        if (spotlightToggle && settings.lights.spot !== undefined) {
            spotlightToggle.checked = settings.lights.spot;
            lights.spot.visible = settings.lights.spot;
        }
        
        if (lightIntensity && settings.lights.intensity !== undefined) {
            lightIntensity.value = settings.lights.intensity;
            if (lights.ambient) lights.ambient.intensity = settings.lights.intensity * 0.5;
            if (lights.directional) lights.directional.intensity = settings.lights.intensity;
            if (lights.spot) lights.spot.intensity = settings.lights.intensity * 0.8;
        }
    }
}

// Log user interaction
function logInteraction(modelName, interactionType, data = {}) {
    fetch('database.php?action=log_interaction', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model_name: modelName,
            interaction_type: interactionType,
            interaction_data: data
        })
    })
    .catch(error => {
        console.error('Error logging interaction:', error);
    });
}

// Initialise on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Setup loading manager with progress tracking
function setupLoadingManager() {
    loadingManager = new THREE.LoadingManager();
    
    // Make sure loading screen is visible initially
    if (loadingScreen) {
        loadingScreen.style.display = 'flex';
        loadingScreen.style.opacity = '1';
    }
    
    // Update loading progress
    loadingManager.onProgress = function(url, itemsLoaded, itemsTotal) {
        const progress = (itemsLoaded / itemsTotal) * 100;
        if (loadingBar) {
            loadingBar.style.width = progress + '%';
        }
        console.log(`Loading: ${progress.toFixed(0)}% (${url})`);
    };
    
    // Hide loading screen when complete
    loadingManager.onLoad = function() {
        console.log("All models loaded successfully!");
        if (loadingScreen) {
            // Delay hiding to ensure models are rendered
            setTimeout(() => {
                // Use GSAP for smooth fade out if available
                if (window.gsap) {
                    gsap.to(loadingScreen, {
                        opacity: 0,
                        duration: 1,
                        onComplete: function() {
                            loadingScreen.style.display = 'none';
                            animateHeroContent();
                        }
                    });
                } else {
                    // Fallback without GSAP
                    loadingScreen.style.opacity = '0';
                    setTimeout(() => {
                        loadingScreen.style.display = 'none';
                        animateHeroContent();
                    }, 1000);
                }
            }, 500);
        }
    }
    
    // Add error handler
    loadingManager.onError = function(url) {
        console.error('Error loading: ' + url);
        // Show error message on loading screen
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.innerHTML = 'Error loading models. Please refresh the page.';
            loadingText.style.color = '#ff3333';
        }
    };
}

// Initialise hero section model
function initHeroModel() {
    // Create scene
    const heroScene = new THREE.Scene();
    heroScene.background = null; // Transparent background
    
    // Create camera
    heroCamera = new THREE.PerspectiveCamera(
        60, // Field of view - increase from 45 to 60
        modelContainer.clientWidth / modelContainer.clientHeight,
        0.1,
        1000
    );
    heroCamera.position.set(0, 2.5, 5);
    heroCamera.lookAt(0, 1, 0);

    
    // Create renderer with alpha
    const heroRenderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true
    });
    heroRenderer.setSize(
        heroModelContainer.clientWidth,
        heroModelContainer.clientHeight
    );
    heroRenderer.setClearColor(0x000000, 0);
    heroRenderer.shadowMap.enabled = true;
    
    // Add renderer to container
    heroModelContainer.appendChild(heroRenderer.domElement);

    const heroControls = new THREE.OrbitControls(heroCamera, heroRenderer.domElement);
    heroControls.enableDamping = true;
    heroControls.dampingFactor = 0.05;
    heroControls.autoRotate = true;
    heroControls.autoRotateSpeed = 2.0;
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    heroScene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    heroScene.add(directionalLight);
    
    // Add point light for highlights
    const pointLight = new THREE.PointLight(0x00bcd4, 1, 10);
    pointLight.position.set(2, 3, 4);
    heroScene.add(pointLight);

    
    // Animate point light
    function pointLightAnimation() {
        const time = Date.now() * 0.001;
        pointLight.position.x = Math.sin(time) * 3;
        pointLight.position.z = Math.cos(time) * 3;
    }
    
    // Load a random model for hero section
    const modelOptions = ['tv', 'fridge', 'lamp'];
    const randomModel = modelOptions[Math.floor(Math.random() * modelOptions.length)];
    
    const loader = new THREE.GLTFLoader(loadingManager);
    loader.load(
        `models/${randomModel}.glb`,
        function(gltf) {
            const model = gltf.scene;
            
            // Setup model
            model.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            // Scale and position
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 5 / maxDim;
            model.scale.set(scale, scale, scale);
            
            // Center model
            box.setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x * scale;
            model.position.y = -center.y * scale + 3.0;
            model.position.z = -center.z * scale;
            
            // Add to scene
            heroScene.add(model);
            isHeroModelLoaded = true;
            
            // If it's the lamp, add a glow effect
            if (randomModel === 'lamp') {
                model.traverse(child => {
                    if (child.isMesh && child.name.includes('Bulb')) {
                        child.material.emissive = new THREE.Color(0.8, 0.7, 0.3);
                        child.material.emissiveIntensity = 0.8;
                    }
                });
            }
        },
        undefined,
        function(error) {
            console.error('Error loading hero model:', error);
        }
    );
    
    // Hero animation loop
    function animateHero() {
        requestAnimationFrame(animateHero);
        
        heroControls.update();
        pointLightAnimation();
        
        heroRenderer.render(heroScene, heroCamera);
    }
    
    // Start hero animation loop
    animateHero();
    
    // Handle resize
    window.addEventListener('resize', function() {
        if (isHeroModelLoaded) {
            heroCamera.aspect = heroModelContainer.clientWidth / heroModelContainer.clientHeight;
            heroCamera.updateProjectionMatrix();
            heroRenderer.setSize(heroModelContainer.clientWidth, heroModelContainer.clientHeight);
        }
    });
}

// Enhanced sound handling with fallbacks

// Create a sound library with fallback options
const soundLibrary = {
    // Object to store pre-created audio contexts and oscillators
    audioElements: {},
    
    // Sound definitions (frequency, type, duration in ms)
    definitions: {
        'click.mp3': { freq: 800, type: 'sine', duration: 100 },
        'switch.mp3': { freq: 600, type: 'square', duration: 150 },
        'beep.mp3': { freq: 1200, type: 'sine', duration: 80 },
        'tv_on.mp3': { freq: 440, type: 'sine', duration: 300 },
        'tv_off.mp3': { freq: 220, type: 'sine', duration: 300 },
        'lamp_on.mp3': { freq: 880, type: 'sine', duration: 200 },
        'lamp_off.mp3': { freq: 440, type: 'sine', duration: 200 },
        'fridge_open.mp3': { freq: 300, type: 'sine', duration: 400 },
        'fridge_close.mp3': { freq: 400, type: 'sine', duration: 300 },
        'volume_up.mp3': { freq: 880, type: 'sine', duration: 100 },
        'volume_down.mp3': { freq: 660, type: 'sine', duration: 100 }
    },
    
    // Generate a synthetic sound using Web Audio API
    generateSound: function(soundKey) {
        const def = this.definitions[soundKey] || this.definitions['click.mp3'];
        
        try {
            // Create audio context if not available
            if (!window.AudioContext && !window.webkitAudioContext) {
                console.warn("Web Audio API not supported");
                return;
            }
            
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            const audioContext = new AudioContextClass();
            
            // Create oscillator
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            // Configure sound
            oscillator.type = def.type;
            oscillator.frequency.value = def.freq; 
            
            // Create fade in/out to avoid clicks
            gainNode.gain.setValueAtTime(0, audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + (def.duration / 1000));
            
            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Start and stop
            oscillator.start();
            oscillator.stop(audioContext.currentTime + (def.duration / 1000));
            
            // Cleanup when done
            setTimeout(() => {
                audioContext.close();
            }, def.duration + 100);
            
            return true;
        } catch (e) {
            console.warn("Error generating fallback sound:", e);
            return false;
        }
    }
};

// Improved play sound function with fallback
function playSound(src) {
    console.log("Attempting to play sound:", src);
    
    // Try to extract the sound name from the path
    const soundFileName = src.split('/').pop();
    
    try {
        // First try to play the actual sound file
        const audio = new Audio(src);
        audio.volume = 0.3; // Lower volume
        
        const playPromise = audio.play();
        
        // Handle promise (required for modern browsers)
        if (playPromise !== undefined) {
            playPromise.catch(error => {
                console.warn("Audio play prevented or file not found:", error);
                // Try to use fallback synthetic sound
                console.log("Trying fallback synthetic sound for:", soundFileName);
                soundLibrary.generateSound(soundFileName);
            });
        }
    } catch (error) {
        console.error("Error playing audio:", error);
        // Try fallback
        soundLibrary.generateSound(soundFileName);
    }
}

// Initialise the 3D scene for main model viewer
function init() {
    setTimeout(function() {
        if (loadingScreen && loadingScreen.classList.contains('hidden') === false) {
            console.log("Forcing loading screen to hide after timeout");
            loadingScreen.classList.add('hidden');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }, 5000);
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0f0);
    
    // Add subtle fog for depth
    scene.fog = new THREE.FogExp2(0xf0f0f0, 0.01);

    while (modelContainer.firstChild) {
        modelContainer.removeChild(modelContainer.firstChild);
    }
    
    
    // Create camera
        camera = new THREE.PerspectiveCamera(60, modelContainer.clientWidth / modelContainer.clientHeight, 0.1, 1000);
        camera.position.set(0, 1.5, 5); // Good default
        camera.lookAt(0, 1, 0); // Optional, but helps initially

        // Create renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(modelContainer.clientWidth, modelContainer.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        modelContainer.appendChild(renderer.domElement);


        // Create controls **after** renderer is ready
        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 1, 0); 
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.autoRotate = autoRotate;
        controls.update();
    
    // Setup lighting
    setupLights();
    
    // Add environment
    addEnvironment();
    
    // Initialise animation clock
    clock = new THREE.Clock();
    
    // Start animation loop
    animate();
}

// Setup lighting
// Setup scene lighting
function setupLights() {
    // Ambient light for overall scene illumination
    lights.ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(lights.ambient);
    
    // Directional light (like the sun)
    lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
    lights.directional.position.set(5, 10, 7);
    lights.directional.castShadow = true;
    scene.add(lights.directional);
    
    // Spotlight for focused illumination
    lights.spot = new THREE.SpotLight(0xffffff, 0.6);
    lights.spot.position.set(-5, 8, 5);
    lights.spot.angle = Math.PI / 6;
    lights.spot.penumbra = 0.3;
    lights.spot.castShadow = true;
    scene.add(lights.spot);
    
    console.log("Lights setup complete:", lights);
}

// In setupEventListeners()
function setupLightingControls() {
    const ambientLightToggle = document.getElementById('ambient-light-toggle');
    if (ambientLightToggle) {
        console.log("Found ambient light toggle");
        ambientLightToggle.addEventListener('change', function() {
            console.log("Ambient light toggle:", this.checked);
            if (lights.ambient) lights.ambient.visible = this.checked;
        });
    }
    
    // Similar for other lighting controls...
}

// Add environment (ground plane, etc.)
function addEnvironment() {
    // Create reflective ground plane
    const groundGeometry = new THREE.PlaneGeometry(30, 30);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xeeeeee,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2; // Rotate to be horizontal
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Add subtle grid for better spatial awareness
    const gridHelper = new THREE.GridHelper(30, 60, 0xcccccc, 0xdddddd);
    gridHelper.position.y = -0.99;
    gridHelper.material.opacity = 0.2;
    gridHelper.material.transparent = true;
    scene.add(gridHelper);
}

// Load the environment model
function loadEnvironment() {
    const loader = new THREE.GLTFLoader(loadingManager);
    
    loader.load('models/environment.glb', function(gltf) {
        const environment = gltf.scene;
        
        // Apply shadows
        environment.traverse(function(child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        // Position the environment
        environment.position.y = -1;
        environment.scale.set(2, 2, 2);
        
        // Add to scene
        scene.add(environment);
    });
}

// Load all 3D models
function loadModels() {
    console.log("Starting to load models...");
    
    // Use the loading manager for all model loading
    const loader = new THREE.GLTFLoader(loadingManager);
    
    // Load TV model
    console.log("Loading TV model...");
    loader.load(
        'models/tv.glb',
        function(gltf) {
            console.log("TV model loaded successfully!");
            models.tv = gltf.scene;
            
            // Make it initially visible
            models.tv.visible = true;
            scene.add(models.tv);
            currentModel = models.tv;
            currentModelName = 'tv';
            
            // Position and scale the model
            positionModel('tv', models.tv);
            
            // Apply shadows and store original materials
            models.tv.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData.originalMaterial = child.material.clone();
                }
            });
            
            // Apply model-specific enhancements
            enhanceModel('tv');
            
            // Update model stats
            updateModelStats(models.tv);
            
            // Log success
            console.log("TV model setup complete");
        },
        function(xhr) {
            console.log("TV loading: " + (xhr.loaded / xhr.total * 100).toFixed(0) + "%");
        },
        function(error) {
            console.error("Error loading TV model:", error);
            createPlaceholderModel('tv');
        }
    );
    
    // Load Fridge model
    console.log("Loading Fridge model...");
    loader.load(
        'models/fridge.glb',
        function(gltf) {
            console.log("Fridge model loaded successfully!");
            models.fridge = gltf.scene;
            
            // Hide initially and add to scene
            models.fridge.visible = false;
            scene.add(models.fridge);
            
            // Position and scale the model
            positionModel('fridge', models.fridge);
            
            // Apply shadows and store original materials
            models.fridge.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData.originalMaterial = child.material.clone();
                }
            });
            
            // Apply model-specific enhancements
            currentModel = models.fridge;
        enhanceModel('fridge');

            
            console.log("Fridge model setup complete");
        },
        function(xhr) {
            console.log("Fridge loading: " + (xhr.loaded / xhr.total * 100).toFixed(0) + "%");
        },
        function(error) {
            console.error("Error loading Fridge model:", error);
            createPlaceholderModel('fridge');
        }
    );
    
    // Load Lamp model
    console.log("Loading Lamp model...");
    loader.load(
        'models/lamp.glb',
        function(gltf) {
            console.log("Lamp model loaded successfully!");
            models.lamp = gltf.scene;
            
            // Hide initially and add to scene
            models.lamp.visible = false;
            scene.add(models.lamp);
            
            // Position and scale the model
            positionModel('lamp', models.lamp);
            
            // Apply shadows and store original materials
            models.lamp.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    child.userData.originalMaterial = child.material.clone();
                }
            });
            
            // Apply model-specific enhancements
            enhanceModel('lamp');
            
            console.log("Lamp model setup complete");
        },
        function(xhr) {
            console.log("Lamp loading: " + (xhr.loaded / xhr.total * 100).toFixed(0) + "%");
        },
        function(error) {
            console.error("Error loading Lamp model:", error);
            createPlaceholderModel('lamp');
        }
    );
    setTimeout(() => {
        debugModels();
    }, 1000);
}


// Function to switch between loaded models
function loadModel(modelName) {
    console.log(`Switching to model: ${modelName}`);

    // Remove previous model
    if (currentModel) {
        scene.remove(currentModel);
    }

    // If model is already loaded
    if (models[modelName]) {
        currentModel = models[modelName];
        currentModel.visible = true;
        scene.add(currentModel);
        finalizeModelSetup(modelName);
        return;
    }
    // Else, load model for the first time
    const loader = new THREE.GLTFLoader(loadingManager);
    loader.load(`models/${modelName}.glb`, function (gltf) {
        const model = gltf.scene;
        models[modelName] = model;
        currentModel = model;
        scene.add(model);
        finalizeModelSetup(modelName);
    }, undefined, function (error) {
        console.error(`Error loading ${modelName}:`, error);
    })

    // Hide all models
    Object.keys(models).forEach(key => {
        if (models[key]) {
            models[key].visible = false;
        }
    });

    // Show only the selected model
    if (models[modelName]) {
        currentModel = models[modelName];
        currentModel.visible = true;
        if (!scene.children.includes(currentModel)) {
            scene.add(currentModel);
        }
        currentModelName = modelName;

        updateModelInfo(modelName);
        updateModelStats(currentModel);
        updateModelControls(modelName);

        // Reposition camera target
        const box = new THREE.Box3().setFromObject(currentModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());

        // Adjust scale
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        currentModel.scale.set(scale, scale, scale);

        // Recalculate box after scaling
        box.setFromObject(currentModel);
        box.getCenter(center);

        // Center model at scene origin
        currentModel.position.x = -center.x;
        currentModel.position.y = -center.y + 1;  // Lift slightly off ground
        currentModel.position.z = -center.z;

    

        console.log(`Model switched to: ${modelName}`);
        playSound('audio/switch.mp3');
    } else {
        console.error(`Model ${modelName} not found`);
    }
}


// Create a placeholder model when loading fails
function createPlaceholderModel(modelName) {
    let geometry, material;
    
    // Create different placeholder shapes based on model type
    if (modelName === 'tv') {
        // TV placeholder - flat screen with base
        const group = new THREE.Group();
        
        // Screen
        const screenGeom = new THREE.BoxGeometry(3, 2, 0.1);
        const screenMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            roughness: 0.2,
            metalness: 0.8
        });
        const screen = new THREE.Mesh(screenGeom, screenMat);
        screen.name = "Screen";
        group.add(screen);
        
        // Base
        const baseGeom = new THREE.BoxGeometry(1.5, 0.2, 0.5);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x111111,
            roughness: 0.5,
            metalness: 0.5
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = -1.1;
        base.position.z = 0.2;
        group.add(base);
        
        // Stand
        const standGeom = new THREE.BoxGeometry(0.2, 1, 0.2);
        const stand = new THREE.Mesh(standGeom, baseMat);
        stand.position.y = -0.6;
        stand.position.z = 0.2;
        group.add(stand);
        
        currentModel = group;
    } else if (modelName === 'fridge') {
        // Fridge placeholder - tall cabinet with door
        const group = new THREE.Group();
        
        // Main body
        const bodyGeom = new THREE.BoxGeometry(2, 4, 1.5);
        const bodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xcccccc,
            roughness: 0.2,
            metalness: 0.6
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        group.add(body);
        
        // Door
        const doorGeom = new THREE.BoxGeometry(1.9, 3.8, 0.1);
        const doorMat = new THREE.MeshStandardMaterial({ 
            color: 0xdddddd,
            roughness: 0.2,
            metalness: 0.8
        });
        const door = new THREE.Mesh(doorGeom, doorMat);
        door.position.z = 0.8;
        door.name = "Door";
        group.add(door);
        
        // Handle
        const handleGeom = new THREE.CylinderGeometry(0.05, 0.05, 1);
        const handleMat = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.1,
            metalness: 0.9
        });
        const handle = new THREE.Mesh(handleGeom, handleMat);
        handle.rotation.x = Math.PI / 2;
        handle.position.z = 1;
        handle.position.x = 0.8;
        group.add(handle);
        
        currentModel = group;
    } else if (modelName === 'lamp') {
        // Lamp placeholder - base, stem and shade
        const group = new THREE.Group();
        
        // Base
        const baseGeom = new THREE.CylinderGeometry(0.5, 0.6, 0.2, 32);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333,
            roughness: 0.5,
            metalness: 0.7
        });
        const base = new THREE.Mesh(baseGeom, baseMat);
        base.position.y = -1.5;
        group.add(base);
        
        // Stem
        const stemGeom = new THREE.CylinderGeometry(0.08, 0.08, 3, 16);
        const stemMat = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            roughness: 0.2,
            metalness: 0.8
        });
        const stem = new THREE.Mesh(stemGeom, stemMat);
        group.add(stem);
        
        // Shade
        const shadeGeom = new THREE.ConeGeometry(1, 1.2, 32, 1, true);
        const shadeMat = new THREE.MeshStandardMaterial({ 
            color: 0xeeeeee,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        const shade = new THREE.Mesh(shadeGeom, shadeMat);
        shade.position.y = 1.5;
        shade.rotation.x = Math.PI;
        group.add(shade);
        
        // Bulb
        const bulbGeom = new THREE.SphereGeometry(0.2, 16, 16);
        const bulbMat = new THREE.MeshStandardMaterial({ 
            color: 0xffffee,
            roughness: 0.1,
            metalness: 0.1,
            emissive: 0x000000
        });
        const bulb = new THREE.Mesh(bulbGeom, bulbMat);
        bulb.position.y = 1.2;
        bulb.name = "Bulb";
        group.add(bulb);
        
        currentModel = group;
    } else {
        // Default placeholder - cube
        geometry = new THREE.BoxGeometry(2, 2, 2);
        material = new THREE.MeshStandardMaterial({ 
            color: 0x888888,
            wireframe: true
        });
        currentModel = new THREE.Mesh(geometry, material);
    }
    
    // Apply shadows
    currentModel.traverse(child => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    })
    
    // Position and add to scene
    positionModel(modelName, currentModel);
    scene.add(currentModel);
    
    // Store reference
    models[modelName] = currentModel;
    
    // Display warning about placeholder model
    console.warn(`Using placeholder model for ${modelName}. Please check the model file.`);
    
    // Add on-screen notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-warning position-absolute';
    notification.style.top = '10px';
    notification.style.left = '10px';
    notification.style.zIndex = '1000';
    notification.innerHTML = `
        <strong>Using placeholder model.</strong><br>
        Could not load "${modelName}.glb". <br>
        <small>Check console for details.</small>
    `;
    modelContainer.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.remove();
    }, 5000);
}

// Apply model-specific enhancements
function enhanceModel(modelName) {
    if (!currentModel) {
        console.warn(`No model loaded to enhance for: ${modelName}`);
        return;
    }
    if (modelName === 'tv') {
        // Find TV screen and apply special materials
        currentModel.traverse(child => {
            if (child.isMesh && child.name.includes('Screen')) {
                // Create emissive material for screen
                const screenMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0x000000,
                    roughness: 0.2,
                    metalness: 0.1,
                    map: new THREE.TextureLoader().load('textures/tv_off.png')
                });
                
                child.material = screenMaterial;
            }
        });
    } else if (modelName === 'lamp') {
        // Enhance lamp with glowing effect
        currentModel.traverse(child => {
            if (child.isMesh && child.name.includes('Bulb')) {
                // Create emissive material for bulb
                const bulbMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0x000000, // Start off
                    roughness: 0.1,
                    metalness: 0.1
                });
                
                child.material = bulbMaterial;
                
                // Prepare point light for lamp but don't enable yet
                const bulbLight = new THREE.PointLight(0xffffee, 1, 10);
                bulbLight.position.copy(child.position);
                bulbLight.visible = false;
                lights.lampLight = bulbLight;
                currentModel.add(bulbLight);
            }
        });
    }
}

// Position model based on type
function positionModel(modelName, model) {
    // Reset position and rotation first
    model.position.set(0, 0, 0);
    model.rotation.set(0, 0, 0);
    
    // Compute bounding box to find model dimensions
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    
    // Scale model to reasonable size
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = 2.5 / maxDim; // Adjust this value as needed
    model.scale.set(scale, scale, scale);
    
    // Center model
    model.position.x = -center.x * scale;
    model.position.y = -center.y * scale + 1; // Add offset to raise model
    model.position.z = -center.z * scale;
    
    console.log(`Positioned ${modelName}: scale=${scale}, pos=${model.position.x},${model.position.y},${model.position.z}`);

}

// Update which control panel is visible based on the selected model
function updateModelControls(modelName) {
    // Hide all control panels
    document.querySelectorAll('.model-controls').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Show only the relevant control panel
    const activeControl = document.getElementById(`${modelName}-controls`);
    if (activeControl) {
        activeControl.classList.add('active');
        
        // Add entrance animation
        if (window.gsap) {
            gsap.fromTo(activeControl, 
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
        }
    }
    
    // Update model selection buttons
    document.querySelectorAll('.model-item').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`.model-item[data-model="${modelName}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
}

// Update model information display
function updateModelInfo(modelName) {
    const modelTitle = document.getElementById('model-title');
    const modelDescription = document.getElementById('model-description');
    
    if (!modelTitle || !modelDescription) return;
    
    // Animate text change
    if (window.gsap) {
        gsap.to([modelTitle, modelDescription], { opacity: 0, y: -10, duration: 0.3, onComplete: () => {
            modelTitle.textContent = `Smart ${modelName.charAt(0).toUpperCase() + modelName.slice(1)}`;
            modelDescription.textContent = modelDescriptions[modelName];
            gsap.to([modelTitle, modelDescription], { opacity: 1, y: 0, duration: 0.3 });
        }});
    } else {
        modelTitle.textContent = `Smart ${modelName.charAt(0).toUpperCase() + modelName.slice(1)}`;
        modelDescription.textContent = modelDescriptions[modelName];
    }}

    function finalizeModelSetup(modelName) {
        positionModel(modelName, currentModel);
        enhanceModel(modelName);
        updateModelStats(currentModel);
        updateModelInfo(modelName);
        updateModelControls(modelName);
    
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        controls.target.copy(center);
        controls.update();
    }
    

    // Model
const SmartHomeModel = {
    devices: {},
    settings: {},
    loadFromDatabase() { /* API calls */ },
    saveToDatabase() { /* API calls */ }
};

// View
const SmartHomeView = {
    updateDevice(deviceId, state) { /* UI updates */ },
    showNotification(message) { /* UI feedback */ }
};

// Controller
const SmartHomeController = {
    toggleDevice(deviceId) {
        const device = SmartHomeModel.devices[deviceId];
        device.toggle();
        SmartHomeView.updateDevice(deviceId, device.state);
        SmartHomeModel.saveToDatabase();
    }
};
