/**
 * Smart Living 3D Application - MVC Architecture Implementation
 * Web 3D Assignment 2025
 * 
 * This file implements a simplified Model-View-Controller design pattern
 * that works without requiring a PHP server.
 */

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
<script src="https://cdn.jsdelivr.net/npm/three@0.152.2/examples/js/loaders/GLTFLoader.js"></script>
const loader = new GLTFLoader();

// Only define these classes if they don't already exist
if (typeof window.SmartHomeModel === 'undefined') {

    // ============= MODEL =============
    // The Model represents the data structures and business logic
    window.SmartHomeModel = class SmartHomeModel {
        constructor() {
            this.devices = {
                tv: {
                    id: 'tv',
                    name: 'Smart TV',
                    powerState: false,
                    channel: 'netflix',
                    volume: 50,
                    screenState: 'off',
                    lastInteraction: Date.now()
                },
                fridge: {
                    id: 'fridge',
                    name: 'Smart Refrigerator',
                    doorOpen: false,
                    temperature: 4, // in Celsius
                    color: 'white',
                    lastInteraction: Date.now()
                },
                lamp: {
                    id: 'lamp',
                    name: 'Smart Lamp',
                    powerState: false,
                    brightness: 70,
                    colorTemperature: 'neutral',
                    mode: 'day',
                    lastInteraction: Date.now()
                }
            };
            
            this.settings = {
                wireframeMode: false,
                autoRotate: true,
                lighting: {
                    ambient: true,
                    directional: true,
                    spot: true,
                    intensity: 0.8
                },
                viewerSettings: {
                    showStats: true,
                    cameraView: 'orbit'
                }
            };
            
            this.observers = [];
            
            console.log("SmartHomeModel initialised with default values");
        }
        
        // Observer pattern to notify view of changes
        addObserver(observer) {
            this.observers.push(observer);
        }
        
        notifyObservers(device, property, value) {
            this.observers.forEach(observer => {
                if (observer && typeof observer.update === 'function') {
                    observer.update(device, property, value);
                }
            });
        }
        
        // Device specific methods
        toggleTV() {
            this.devices.tv.powerState = !this.devices.tv.powerState;
            this.devices.tv.screenState = this.devices.tv.powerState ? 'on' : 'off';
            this.devices.tv.lastInteraction = Date.now();
            this.notifyObservers('tv', 'powerState', this.devices.tv.powerState);
            return this.devices.tv.powerState;
        }
        
        setTVChannel(channel) {
            if (!this.devices.tv.powerState) return false;
            this.devices.tv.channel = channel;
            this.devices.tv.lastInteraction = Date.now();
            this.notifyObservers('tv', 'channel', channel);
            return true;
        }
        
        adjustTVVolume(increase) {
            if (!this.devices.tv.powerState) return false;
            
            let newVolume = this.devices.tv.volume;
            if (increase) {
                newVolume = Math.min(100, newVolume + 5);
            } else {
                newVolume = Math.max(0, newVolume - 5);
            }
            
            this.devices.tv.volume = newVolume;
            this.devices.tv.lastInteraction = Date.now();
            this.notifyObservers('tv', 'volume', newVolume);
            return newVolume;
        }
        
        toggleFridgeDoor() {
            this.devices.fridge.doorOpen = !this.devices.fridge.doorOpen;
            this.devices.fridge.lastInteraction = Date.now();
            this.notifyObservers('fridge', 'doorOpen', this.devices.fridge.doorOpen);
            return this.devices.fridge.doorOpen;
        }
        
        setFridgeTemperature(value) {
            // Ensure temperature is within valid range (1-8°C)
            value = Math.max(1, Math.min(8, value));
            this.devices.fridge.temperature = value;
            this.devices.fridge.lastInteraction = Date.now();
            this.notifyObservers('fridge', 'temperature', value);
            return value;
        }
        
        adjustFridgeTemp(increase) {
            let newTemp = this.devices.fridge.temperature;
            if (increase) {
                newTemp = Math.min(8, newTemp + 1);
            } else {
                newTemp = Math.max(1, newTemp - 1);
            }
            return this.setFridgeTemperature(newTemp);
        }
        
        setFridgeColor(color) {
            this.devices.fridge.color = color;
            this.devices.fridge.lastInteraction = Date.now();
            this.notifyObservers('fridge', 'color', color);
            return color;
        }
        
        toggleLamp() {
            this.devices.lamp.powerState = !this.devices.lamp.powerState;
            this.devices.lamp.lastInteraction = Date.now();
            this.notifyObservers('lamp', 'powerState', this.devices.lamp.powerState);
            return this.devices.lamp.powerState;
        }
        
        setLampBrightness(value) {
            // Ensure brightness is within valid range (0-100%)
            value = Math.max(0, Math.min(100, value));
            this.devices.lamp.brightness = value;
            this.devices.lamp.lastInteraction = Date.now();
            this.notifyObservers('lamp', 'brightness', value);
            return value;
        }
        
        setLampColorTemperature(temp) {
            if (!['warm', 'neutral', 'cool'].includes(temp)) {
                return false;
            }
            this.devices.lamp.colorTemperature = temp;
            this.devices.lamp.lastInteraction = Date.now();
            this.notifyObservers('lamp', 'colorTemperature', temp);
            return temp;
        }
        
        setLampMode(mode) {
            if (!['day', 'night', 'mood'].includes(mode)) {
                return false;
            }
            this.devices.lamp.mode = mode;
            this.devices.lamp.lastInteraction = Date.now();
            this.notifyObservers('lamp', 'mode', mode);
            return mode;
        }
        
        // Settings methods
        toggleWireframe() {
            this.settings.wireframeMode = !this.settings.wireframeMode;
            this.notifyObservers('settings', 'wireframeMode', this.settings.wireframeMode);
            return this.settings.wireframeMode;
        }
        
        toggleAutoRotate() {
            this.settings.autoRotate = !this.settings.autoRotate;
            this.notifyObservers('settings', 'autoRotate', this.settings.autoRotate);
            return this.settings.autoRotate;
        }
        
        setCameraView(view) {
            this.settings.viewerSettings.cameraView = view;
            this.notifyObservers('settings', 'cameraView', view);
            return view;
        }
        
        toggleLight(type, state) {
            if (!['ambient', 'directional', 'spot'].includes(type)) {
                return false;
            }
            
            this.settings.lighting[type] = state;
            this.notifyObservers('settings', `lighting.${type}`, state);
            return state;
        }
        
        setLightIntensity(value) {
            // Ensure intensity is within valid range (0-1)
            value = Math.max(0, Math.min(1, value));
            this.settings.lighting.intensity = value;
            this.notifyObservers('settings', 'lighting.intensity', value);
            return value;
        }
        
        // Database methods (simplified without PHP)
        async saveToDatabase() {
            console.log("State saved (local storage only - no PHP required)");
            try {
                // Save to localStorage instead of database
                localStorage.setItem('smartliving3d_state', JSON.stringify({
                    devices: this.devices,
                    settings: this.settings,
                    timestamp: Date.now()
                }));
                return true;
            } catch (error) {
                console.error('Error saving state:', error);
                return false;
            }
        }
        
        async loadFromDatabase() {
            console.log("Loading state from local storage (no PHP required)");
            try {
                // Load from localStorage instead of database
                const storedData = localStorage.getItem('smartliving3d_state');
                
                if (storedData) {
                    const data = JSON.parse(storedData);
                    
                    if (data && data.devices) {
                        this.devices = data.devices;
                    }
                    
                    if (data && data.settings) {
                        this.settings = data.settings;
                    }
                    
                    // Notify observers
                    Object.keys(this.devices).forEach(deviceId => {
                        const device = this.devices[deviceId];
                        Object.keys(device).forEach(prop => {
                            if (prop !== 'id' && prop !== 'name') {
                                this.notifyObservers(deviceId, prop, device[prop]);
                            }
                        });
                    });
                    
                    console.log('State loaded from local storage:', data);
                } else {
                    console.log('No saved state found in local storage');
                }
                
                return true;
            } catch (error) {
                console.error('Error loading state:', error);
                return false;
            }
        }
        
        // Analytics (simplified without PHP)
        logInteraction(deviceId, action, details) {
            console.log(`Interaction logged (local only): ${deviceId}.${action}`, details);
            // In a real implementation, this would send data to the server
        }
    };
    
    // ============= VIEW =============
    // The View handles all UI rendering and user interface elements
    window.SmartHomeView = class SmartHomeView {
        constructor() {
            // UI element references
            this.elements = {
                // Model selection
                modelItems: document.querySelectorAll('.model-item'),
                
                // Controls for all models
                modelContainer: document.getElementById('model-container'),
                wireframeToggle: document.getElementById('wireframe-toggle'),
                rotationToggle: document.getElementById('rotation-toggle'),
                cameraSelect: document.getElementById('camera-select'),
                ambientLightToggle: document.getElementById('ambient-light-toggle'),
                directionalLightToggle: document.getElementById('directional-light-toggle'),
                spotlightToggle: document.getElementById('spotlight-toggle'),
                lightIntensity: document.getElementById('light-intensity'),
                
                // Stats displays
                verticesCount: document.getElementById('vertices-count'),
                facesCount: document.getElementById('faces-count'),
                materialsCount: document.getElementById('materials-count'),
                fpsCounter: document.getElementById('fps-counter'),
                
                // Device specific controls
                tvPowerBtn: document.getElementById('tv-power-btn'),
                tvNetflixBtn: document.getElementById('tv-netflix-btn'),
                tvYoutubeBtn: document.getElementById('tv-youtube-btn'),
                tvVolumeUp: document.getElementById('tv-volume-up'),
                tvVolumeDown: document.getElementById('tv-volume-down'),
                
                fridgeDoorBtn: document.getElementById('fridge-door-btn'),
                fridgeTempUp: document.getElementById('fridge-temp-up'),
                fridgeTempDown: document.getElementById('fridge-temp-down'),
                colorOptions: document.querySelectorAll('.color-option'),
                
                lampPowerBtn: document.getElementById('lamp-power-btn'),
                lampBrightness: document.getElementById('lamp-brightness'),
                lampWarm: document.getElementById('lamp-warm'),
                lampNeutral: document.getElementById('lamp-neutral'),
                lampCool: document.getElementById('lamp-cool'),
                lampModeDay: document.getElementById('lamp-mode-day'),
                lampModeNight: document.getElementById('lamp-mode-night'),
                lampModeMood: document.getElementById('lamp-mode-mood')
            };
            
            console.log("SmartHomeView initialised");
        }
        
        // Observer pattern - update UI when model changes
        update(deviceId, property, value) {
            console.log(`View update: ${deviceId}.${property} = ${value}`);
            
            // Update UI elements based on device and property
            switch(deviceId) {
                case 'tv':
                    if (property === 'powerState') {
                        // Update TV power button state
                        if (this.elements.tvPowerBtn) {
                            this.elements.tvPowerBtn.classList.toggle('active', value);
                        }
                        
                        // Call 3D model update via controller callback
                        if (this.updateTVPowerState) {
                            this.updateTVPowerState(value);
                        }
                    } 
                    else if (property === 'channel') {
                        // Update channel button states
                        const channelBtns = document.querySelectorAll('.channel-btn');
                        channelBtns.forEach(btn => {
                            btn.classList.toggle('active', btn.dataset.channel === value);
                        });
                        
                        // Call 3D model update
                        if (this.updateTVChannel) {
                            this.updateTVChannel(value);
                        }
                    }
                    break;
                    
                case 'fridge':
                    if (property === 'doorOpen') {
                        // Update door button state
                        if (this.elements.fridgeDoorBtn) {
                            this.elements.fridgeDoorBtn.classList.toggle('active', value);
                        }
                        
                        // Call 3D model update
                        if (this.updateFridgeDoor) {
                            this.updateFridgeDoor(value);
                        }
                    }
                    else if (property === 'temperature') {
                        // Update temperature display
                        const tempDisplay = document.querySelector('.temp-display');
                        if (tempDisplay) {
                            tempDisplay.textContent = `${value}°C`;
                            tempDisplay.dataset.temp = value;
                        }
                    }
                    else if (property === 'color') {
                        // Update color option buttons
                        if (this.elements.colorOptions) {
                            this.elements.colorOptions.forEach(option => {
                                option.classList.toggle('active', option.dataset.color === value);
                            });
                        }
                        
                        // Call 3D model update
                        if (this.updateFridgeColor) {
                            this.updateFridgeColor(value);
                        }
                    }
                    break;
                    
                case 'lamp':
                    if (property === 'powerState') {
                        // Update lamp power button state
                        if (this.elements.lampPowerBtn) {
                            this.elements.lampPowerBtn.classList.toggle('active', value);
                        }
                        
                        // Call 3D model update
                        if (this.updateLampPowerState) {
                            this.updateLampPowerState(value);
                        }
                    }
                    else if (property === 'brightness') {
                        // Update brightness slider
                        if (this.elements.lampBrightness) {
                            this.elements.lampBrightness.value = value;
                        }
                        
                        // Call 3D model update
                        if (this.updateLampBrightness) {
                            this.updateLampBrightness(value);
                        }
                    }
                    else if (property === 'colorTemperature') {
                        // Update color temperature buttons
                        document.querySelectorAll('.light-btn').forEach(btn => {
                            btn.classList.toggle('active', btn.id === `lamp-${value}`);
                        });
                        
                        // Call 3D model update
                        if (this.updateLampColorTemperature) {
                            this.updateLampColorTemperature(value);
                        }
                    }
                    else if (property === 'mode') {
                        // Update mode buttons
                        document.querySelectorAll('.mode-btn').forEach(btn => {
                            btn.classList.toggle('active', btn.id === `lamp-mode-${value}`);
                        });
                        
                        // Call 3D model update
                        if (this.updateLampMode) {
                            this.updateLampMode(value);
                        }
                    }
                    break;
                    
                case 'settings':
                    if (property === 'wireframeMode') {
                        // Update wireframe toggle
                        if (this.elements.wireframeToggle) {
                            this.elements.wireframeToggle.checked = value;
                        }
                        
                        // Call 3D model update
                        if (this.updateWireframeMode) {
                            this.updateWireframeMode(value);
                        }
                    }
                    else if (property === 'autoRotate') {
                        // Update auto-rotate toggle
                        if (this.elements.rotationToggle) {
                            this.elements.rotationToggle.checked = value;
                        }
                        
                        // Call 3D model update
                        if (this.updateAutoRotate) {
                            this.updateAutoRotate(value);
                        }
                    }
                    else if (property === 'cameraView') {
                        // Update camera view dropdown
                        if (this.elements.cameraSelect) {
                            this.elements.cameraSelect.value = value;
                        }
                        
                        // Call 3D model update
                        if (this.updateCameraView) {
                            this.updateCameraView(value);
                        }
                    }
                    else if (property.startsWith('lighting.')) {
                        const lightType = property.split('.')[1];
                        if (lightType === 'ambient' && this.elements.ambientLightToggle) {
                            this.elements.ambientLightToggle.checked = value;
                        }
                        else if (lightType === 'directional' && this.elements.directionalLightToggle) {
                            this.elements.directionalLightToggle.checked = value;
                        }
                        else if (lightType === 'spot' && this.elements.spotlightToggle) {
                            this.elements.spotlightToggle.checked = value;
                        }
                        else if (lightType === 'intensity' && this.elements.lightIntensity) {
                            this.elements.lightIntensity.value = value * 100; // Convert 0-1 to 0-100
                        }
                        
                        // Call 3D model update
                        if (this.updateLighting) {
                            this.updateLighting(lightType, value);
                        }
                    }
                    break;
            }
        }
        
        // These methods will be connected to the controller's callbacks
        // for updating the 3D models
        setUpdateCallbacks(callbacks) {
            this.updateTVPowerState = callbacks.updateTVPowerState;
            this.updateTVChannel = callbacks.updateTVChannel;
            this.updateFridgeDoor = callbacks.updateFridgeDoor;
            this.updateFridgeColor = callbacks.updateFridgeColor;
            this.updateLampPowerState = callbacks.updateLampPowerState;
            this.updateLampBrightness = callbacks.updateLampBrightness;
            this.updateLampColorTemperature = callbacks.updateLampColorTemperature;
            this.updateLampMode = callbacks.updateLampMode;
            this.updateWireframeMode = callbacks.updateWireframeMode;
            this.updateAutoRotate = callbacks.updateAutoRotate;
            this.updateCameraView = callbacks.updateCameraView;
            this.updateLighting = callbacks.updateLighting;
        }
        
        // Update model stats display
        updateModelStats(vertices, faces, materials) {
            if (this.elements.verticesCount) {
                this.animateCounter(this.elements.verticesCount, vertices);
            }
            
            if (this.elements.facesCount) {
                this.animateCounter(this.elements.facesCount, faces);
            }
            
            if (this.elements.materialsCount) {
                this.animateCounter(this.elements.materialsCount, materials);
            }
        }
        
        // Animate counter for stats
        animateCounter(element, target) {
            if (!element) return;
            
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
        
        // Update FPS counter
        updateFPS(fps) {
            if (this.elements.fpsCounter) {
                this.elements.fpsCounter.textContent = fps;
            }
        }
        
        // Update which control panel is visible based on the selected model
        updateModelControls(modelName) {
            // Hide all control panels
            document.querySelectorAll('.model-controls').forEach(panel => {
                panel.classList.remove('active');
            });
            
            // Show only the relevant control panel
            const activeControl = document.getElementById(`${modelName}-controls`);
            if (activeControl) {
                activeControl.classList.add('active');
                
                // Add entrance animation if GSAP is available
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
        updateModelInfo(modelName, title, description) {
            const modelTitle = document.getElementById('model-title');
            const modelDescription = document.getElementById('model-description');
            
            if (!modelTitle || !modelDescription) return;
            
            // Animate text change if GSAP is available
            if (window.gsap) {
                gsap.to([modelTitle, modelDescription], { 
                    opacity: 0, 
                    y: -10, 
                    duration: 0.3, 
                    onComplete: () => {
                        modelTitle.textContent = title;
                        modelDescription.textContent = description;
                        gsap.to([modelTitle, modelDescription], { 
                            opacity: 1, 
                            y: 0, 
                            duration: 0.3 
                        });
                    }
                });
            } else {
                modelTitle.textContent = title;
                modelDescription.textContent = description;
            }
        }
        
        // Play sound helper
        playSound(src) {
            try {
                const audio = new Audio(src);
                audio.volume = 0.3;
                audio.play().catch(error => {
                    console.warn("Audio play prevented:", error);
                });
            } catch (error) {
                console.error("Error playing audio:", error);
            }
        }
    };
    
    // ============= CONTROLLER =============
    // The Controller handles user interactions and connects Model with View
    window.SmartHomeController = class SmartHomeController {
        constructor(model, view) {
            this.model = model;
            this.view = view;
            
            // Add the view as an observer of the model
            this.model.addObserver(this.view);
            
            // Connect view's update callbacks to controller methods
            this.view.setUpdateCallbacks({
                updateTVPowerState: this.updateTVPowerState.bind(this),
                updateTVChannel: this.updateTVChannel.bind(this),
                updateFridgeDoor: this.updateFridgeDoor.bind(this),
                updateFridgeColor: this.updateFridgeColor.bind(this),
                updateLampPowerState: this.updateLampPowerState.bind(this),
                updateLampBrightness: this.updateLampBrightness.bind(this),
                updateLampColorTemperature: this.updateLampColorTemperature.bind(this),
                updateLampMode: this.updateLampMode.bind(this),
                updateWireframeMode: this.updateWireframeMode.bind(this),
                updateAutoRotate: this.updateAutoRotate.bind(this),
                updateCameraView: this.updateCameraView.bind(this),
                updateLighting: this.updateLighting.bind(this)
            });
            
            console.log("SmartHomeController initialised");
        }
        
        // Initialise the application
        async init() {
            try {
                // Load saved state
                await this.model.loadFromDatabase();
                
                // Set up event listeners
                this.setupEventListeners();
                
                // Load initial model
                this.loadModel('tv');
                
                // Set up periodic saving
                setInterval(() => {
                    this.model.saveToDatabase();
                }, 60000); // Save every minute
                
                console.log("Controller initialisation complete");
            } catch (error) {
                console.error("Error initialising controller:", error);
            }
        }
        
        // Event listeners setup
        setupEventListeners() {
            console.log("Setting up event listeners");
            
            // Model selection
            if (this.view.elements.modelItems) {
                this.view.elements.modelItems.forEach(item => {
                    const modelName = item.getAttribute('data-model');
                    if (modelName) {
                        item.addEventListener('click', () => {
                            this.loadModel(modelName);
                            this.view.playSound('audio/switch.mp3');
                        });
                    }
                });
            }
            
            // Wireframe toggle
            if (this.view.elements.wireframeToggle) {
                this.view.elements.wireframeToggle.addEventListener('change', () => {
                    const isEnabled = this.model.toggleWireframe();
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            // Auto-rotation toggle
            if (this.view.elements.rotationToggle) {
                this.view.elements.rotationToggle.addEventListener('change', () => {
                    const isEnabled = this.model.toggleAutoRotate();
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            // Camera view selection
            if (this.view.elements.cameraSelect) {
                this.view.elements.cameraSelect.addEventListener('change', e => {
                    this.model.setCameraView(e.target.value);
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            // Light controls
            if (this.view.elements.ambientLightToggle) {
                this.view.elements.ambientLightToggle.addEventListener('change', e => {
                    this.model.toggleLight('ambient', e.target.checked);
                });
            }
            
            if (this.view.elements.directionalLightToggle) {
                this.view.elements.directionalLightToggle.addEventListener('change', e => {
                    this.model.toggleLight('directional', e.target.checked);
                });
            }
            
            if (this.view.elements.spotlightToggle) {
                this.view.elements.spotlightToggle.addEventListener('change', e => {
                    this.model.toggleLight('spot', e.target.checked);
                });
            }
            
            if (this.view.elements.lightIntensity) {
                this.view.elements.lightIntensity.addEventListener('input', e => {
                    this.model.setLightIntensity(e.target.value / 100); // Convert to 0-1 range
                });
            }
            
            // TV controls
            if (this.view.elements.tvPowerBtn) {
                this.view.elements.tvPowerBtn.addEventListener('click', () => {
                    const isOn = this.model.toggleTV();
                    this.model.logInteraction('tv', 'power', { state: isOn });
                    this.view.playSound(isOn ? 'audio/tv_on.mp3' : 'audio/tv_off.mp3');
                });
            }
            
            if (this.view.elements.tvNetflixBtn) {
                this.view.elements.tvNetflixBtn.addEventListener('click', () => {
                    const success = this.model.setTVChannel('netflix');
                    if (success) {
                        this.model.logInteraction('tv', 'channel', { channel: 'netflix' });
                        this.view.playSound('audio/click.mp3');
                    }
                });
            }
            
            if (this.view.elements.tvYoutubeBtn) {
                this.view.elements.tvYoutubeBtn.addEventListener('click', () => {
                    const success = this.model.setTVChannel('youtube');
                    if (success) {
                        this.model.logInteraction('tv', 'channel', { channel: 'youtube' });
                        this.view.playSound('audio/click.mp3');
                    }
                });
            }
            
            if (this.view.elements.tvVolumeUp) {
                this.view.elements.tvVolumeUp.addEventListener('click', () => {
                    const newVolume = this.model.adjustTVVolume(true);
                    if (newVolume) {
                        this.model.logInteraction('tv', 'volume', { volume: newVolume });
                        this.view.playSound('audio/volume_up.mp3');
                    }
                });
            }
            
            if (this.view.elements.tvVolumeDown) {
                this.view.elements.tvVolumeDown.addEventListener('click', () => {
                    const newVolume = this.model.adjustTVVolume(false);
                    if (newVolume !== false) {
                        this.model.logInteraction('tv', 'volume', { volume: newVolume });
                        this.view.playSound('audio/volume_down.mp3');
                    }
                });
            }
            
            // Fridge controls
            if (this.view.elements.fridgeDoorBtn) {
                this.view.elements.fridgeDoorBtn.addEventListener('click', () => {
                    const isOpen = this.model.toggleFridgeDoor();
                    this.model.logInteraction('fridge', 'door', { state: isOpen });
                    this.view.playSound(isOpen ? 'audio/fridge_open.mp3' : 'audio/fridge_close.mp3');
                });
            }
            
            if (this.view.elements.fridgeTempUp) {
                this.view.elements.fridgeTempUp.addEventListener('click', () => {
                    const newTemp = this.model.adjustFridgeTemp(true);
                    this.model.logInteraction('fridge', 'temperature', { value: newTemp });
                    this.view.playSound('audio/beep.mp3');
                });
            }
            
            if (this.view.elements.fridgeTempDown) {
                this.view.elements.fridgeTempDown.addEventListener('click', () => {
                    const newTemp = this.model.adjustFridgeTemp(false);
                    this.model.logInteraction('fridge', 'temperature', { value: newTemp });
                    this.view.playSound('audio/beep.mp3');
                });
            }
            
            // Color options for fridge
            if (this.view.elements.colorOptions) {
                this.view.elements.colorOptions.forEach(option => {
                    option.addEventListener('click', () => {
                        const color = option.dataset.color;
                        if (color) {
                            this.model.setFridgeColor(color);
                            this.model.logInteraction('fridge', 'color', { color });
                            this.view.playSound('audio/click.mp3');
                        }
                    });
                });
            }
            
            // Lamp controls
            if (this.view.elements.lampPowerBtn) {
                this.view.elements.lampPowerBtn.addEventListener('click', () => {
                    const isOn = this.model.toggleLamp();
                    this.model.logInteraction('lamp', 'power', { state: isOn });
                    this.view.playSound(isOn ? 'audio/lamp_on.mp3' : 'audio/lamp_off.mp3');
                });
            }
            
            if (this.view.elements.lampBrightness) {
                this.view.elements.lampBrightness.addEventListener('input', e => {
                    const brightness = parseInt(e.target.value);
                    this.model.setLampBrightness(brightness);
                });
                
                // Also log interaction when finished changing
                this.view.elements.lampBrightness.addEventListener('change', e => {
                    this.model.logInteraction('lamp', 'brightness', { value: parseInt(e.target.value) });
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            if (this.view.elements.lampWarm) {
                this.view.elements.lampWarm.addEventListener('click', () => {
                    this.model.setLampColorTemperature('warm');
                    this.model.logInteraction('lamp', 'colorTemp', { value: 'warm' });
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            if (this.view.elements.lampNeutral) {
                this.view.elements.lampNeutral.addEventListener('click', () => {
                    this.model.setLampColorTemperature('neutral');
                    this.model.logInteraction('lamp', 'colorTemp', { value: 'neutral' });
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            if (this.view.elements.lampCool) {
                this.view.elements.lampCool.addEventListener('click', () => {
                    this.model.setLampColorTemperature('cool');
                    this.model.logInteraction('lamp', 'colorTemp', { value: 'cool' });
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            if (this.view.elements.lampModeDay) {
                this.view.elements.lampModeDay.addEventListener('click', () => {
                    this.model.setLampMode('day');
                    this.model.logInteraction('lamp', 'mode', { mode: 'day' });
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            if (this.view.elements.lampModeNight) {
                this.view.elements.lampModeNight.addEventListener('click', () => {
                    this.model.setLampMode('night');
                    this.model.logInteraction('lamp', 'mode', { mode: 'night' });
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            if (this.view.elements.lampModeMood) {
                this.view.elements.lampModeMood.addEventListener('click', () => {
                    this.model.setLampMode('mood');
                    this.model.logInteraction('lamp', 'mode', { mode: 'mood' });
                    this.view.playSound('audio/click.mp3');
                });
            }
            
            // Window resize handler
            window.addEventListener('resize', () => {
                // Forward to the 3D rendering system
                if (window.handleResize) {
                    window.handleResize();
                }
            });
            
            console.log("Event listeners setup complete");
        }
        
        // Load a specific model
        loadModel(modelName) {
            // Hide all models
            Object.values(this.threeManager.models).forEach(m => {
                if (m.scene) m.scene.visible = false;
            });
        
            // Show selected model
            if (this.threeManager.models[modelName]) {
                this.threeManager.models[modelName].scene.visible = true;
                this.view.updateModelControls(modelName);
                this.view.updateModelInfo(modelName, m.name, "Updated model description");
            }
        
            this.model.setCurrentModel(modelName); // (Optional)
        }
        
        
        getModelDescription(modelName) {
            // Get descriptions from a central source
            const descriptions = {
                tv: "A modern smart entertainment system with 4K display, integrated streaming services, and voice control capabilities.",
                fridge: "An energy-efficient smart refrigerator with temperature control, door sensors, and customisable appearance.",
                lamp: "An adjustable smart lamp with various lighting modes, color temperature settings, and energy-saving features."
            };
            
            return descriptions[modelName] || "";
        }
        
        // These methods integrate with the existing 3D functionality
        // They call the existing functions in script.js
        
        updateTVPowerState(isOn) {
            // Call existing function if available
            if (window.toggleTVPower) {
                window.toggleTVPower(isOn);
            }
        }
        
        updateTVChannel(channel) {
            // Call existing function if available
            if (window.changeTVChannel) {
                window.changeTVChannel(channel);
            }
        }
        
        updateFridgeDoor(isOpen) {
            // Call existing function if available
            if (window.toggleFridgeDoor) {
                window.toggleFridgeDoor(isOpen);
            }
        }
        
        updateFridgeColor(color) {
            // Call existing function if available
            if (window.changeFridgeColor) {
                window.changeFridgeColor(color);
            }
        }
        
        updateLampPowerState(isOn) {
            // Call existing function if available
            if (window.toggleLamp) {
                window.toggleLamp(isOn);
            }
        }
        
        updateLampBrightness(value) {
            // Call existing function if available
            if (window.changeLampBrightness) {
                window.changeLampBrightness(value);
            }
        }
        
        updateLampColorTemperature(temperature) {
            // Call existing function if available
            if (window.changeLampColor) {
                window.changeLampColor(temperature);
            }
        }
        
        updateLampMode(mode) {
            // Call existing function if available
            if (window.setLampMode) {
                window.setLampMode(mode);
            }
        }
        
        updateWireframeMode(enabled) {
            // Call existing function if available
            if (window.toggleWireframe) {
                window.toggleWireframe(enabled);
            }
        }
        
        updateAutoRotate(enabled) {
            // Update the global variable
            if (typeof window.autoRotate !== 'undefined') {
                window.autoRotate = enabled;
            }
            
            // Also update OrbitControls if available
            if (window.controls && typeof window.controls.autoRotate !== 'undefined') {
                window.controls.autoRotate = enabled;
            }
        }
        
        updateCameraView(view) {
            // Call existing function if available
            if (window.changeCameraView) {
                window.changeCameraView(view);
            }
        }
        
        updateLighting(type, value) {
            // Call existing functions if available
            if (type === 'intensity' && window.updateLightIntensity) {
                window.updateLightIntensity(value);
            } else if (window.toggleLight) {
                window.toggleLight(type, value);
            }
        }
    };
    
    } // End of the "if not defined" block
    
    // ============= INITIALISE APPLICATION =============
    // Function to initialise the application with MVC pattern
    function initSmartHomeApp() {
        console.log("Initialising Smart Home 3D Application with MVC pattern...");
        
        // Create model
        const model = new window.SmartHomeModel();
        
        // Create view
        const view = new window.SmartHomeView();
        
        // Create controller with model and view
        const controller = new window.SmartHomeController(model, view);
        
        // Initialise controller
        controller.init().catch(error => {
            console.error("Failed to initialise application:", error);
        });
        
        // Make app available globally for debugging if needed
        window.smartHomeApp = {
            model: model,
            view: view,
            controller: controller
        };
        
        return { model, view, controller };
    }
    
    // Start the application when the DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Wait a short time to make sure other scripts are loaded
        setTimeout(initSmartHomeApp, 500);
    });