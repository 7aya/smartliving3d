# Smart Living 3D

An interactive 3D web application showcasing smart home technology models with Three.js

## Project Overview

This project is an interactive 3D web application that allows users to explore and interact with three smart home appliance models: a Smart TV, a Smart Refrigerator, and a Smart Lamp. The application is built using Three.js for 3D rendering, along with modern web technologies like HTML5, CSS3, and JavaScript.

### Key Features

- **Interactive 3D Models**: Three detailed models with realistic textures and materials
- **Real-time Controls**: Manipulate each model with specific interactive features
- **Dynamic Lighting**: Adjustable lighting conditions to see models in different settings
- **Customisable Display**: Options for wireframe mode, camera angles, and more
- **Custom GLSL Shaders**: Advanced material effects for realistic rendering
- **Responsive Design**: Works seamlessly across devices with Bootstrap framework
- **PHP/SQLite Backend**: Stores user preferences and interaction data
- **MVC Architecture**: Well-organised code using the Model-View-Controller pattern

## Live Demo

Check out the live demo: [Smart Living 3D Demo](https://users.sussex.ac.uk/~ab2290/3dapp/assignment/index.html)

# GitHub Repository

This project is available on GitHub at: https://github.com/7aya/smartliving3d

## Important Usage Notes

### Viewing the Models
- **Select a Model**: Although the TV appears selected by default in the interface, please click on each model in the selector panel to fully load and view them.
- **Loading Time**: Please allow 1-2 minutes for each model to completely load after selection. The 3D models are detailed and may require some time to initialise properly, especially on first load.
- **Controls**: Once loaded, you can use the various controls in the interface to:
  - Toggle wireframe mode
  - Change camera views
  - Adjust lighting
  - Interact with model-specific features (TV power, fridge door, lamp brightness)

### Best Experience
- For optimal performance, the application is recommended to be viewed on Chrome or Firefox browsers
- If models don't appear to load, try refreshing the page and allowing more time
- All interactive elements become available once the models are fully loaded

Thank you for your patience while exploring this Web 3D application!

## Technologies Used

### Frontend
- HTML5 & CSS3
- JavaScript (ES6+)
- Three.js for 3D rendering
- GSAP for animations
- Bootstrap for responsive layout

### 3D Modeling
- Blender for model creation
- GLTF format for web optimisation

### Backend
- PHP for server-side processing
- SQLite for database storage

## Project Structure

```
smart-living-3d/
├── index.html                # Main interactive experience page
├── about.html                # Project documentation and details
├── gallery.html              # Model gallery with various views
├── references.html           # Credits and acknowledgments
├── database.php              # Backend database handler
├── css/
│   └── styles.css            # Custom styles for the application
├── js/
│   ├── script.js             # Main JavaScript functionality
│   ├── mvc.js                # MVC implementation
│   └── post-processing.js    # GLSL shaders and effects
├── models/                   # 3D models in GLTF/GLB format
│   ├── tv.glb                # Smart TV model
│   ├── fridge.glb            # Smart Refrigerator model
│   ├── lamp.glb              # Smart Lamp model
│   └── environment.glb       # Optional environment model
├── textures/                 # Texture files for the models
├── audio/                    # Sound effects for interactions
├── images/                   # Images for gallery and UI elements
└── data/                     # Database files (created by PHP)
```

## Setup Instructions

1. **Server Setup**:
   - Deploy to a PHP-enabled web server (like Apache)
   - Ensure the server has write permissions for the `data/` directory
   - For local development, you can use tools like XAMPP or PHP's built-in server

2. **Running Locally with PHP's built-in server**:
   ```bash
   php -S localhost:8000
   ```

3. **Open in Browser**:
   - Navigate to `http://localhost:8000` in web browser
   - For best performance, use a modern browser with WebGL support

## Model Interaction Guide

### Smart TV
- Toggle power on/off
- Change content (Netflix/YouTube)
- Adjust volume

### Smart Refrigerator
- Open/close door
- Adjust temperature
- Change color

### Smart Lamp
- Toggle lamp on/off
- Adjust brightness
- Change color temperature
- Select lighting mode

## Deeper Understanding Features

This project implements several advanced features:

1. **MVC Architecture**: Clear separation of data, presentation, and business logic
2. **Custom GLSL Shaders**: Enhanced material rendering with custom shaders
3. **Post-Processing Effects**: Bloom, ambient occlusion, and film grain effects
4. **Database Integration**: User preferences and analytics storage

## Project Requirements

This project was created to fulfill the requirements of the Web 3D Applications module, which included:

1. **3D Models**: Creating at least three detailed 3D models with appropriate materials and textures
2. **3D App Implementation**: Building a responsive web application with interactive features
3. **Deeper Understanding**: Implementing advanced features like custom shaders and animations
4. **Implementation & Publication**: Properly documenting and deploying the project

## Acknowledgments

- Three.js documentation and examples
- Blender tutorials from Blender Guru
- Web 3D Applications module professors, ta's and materials

## License

This project is created for educational purposes as part of a university assignment.

---

© 2025 Smart Living 3D | Created for Web 3D Applications Course
