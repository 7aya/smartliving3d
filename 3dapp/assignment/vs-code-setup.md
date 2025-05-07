# Smart Living 3D - VS Code Setup Guide

This guide will help you set up Visual Studio Code for optimal development of the Smart Living 3D application.

## Quick Setup

1. Install [Visual Studio Code](https://code.visualstudio.com/)
2. Open the project with the workspace file:
   - File > Open Workspace from File...
   - Select `smart-living-3d.code-workspace`
3. Install recommended extensions when prompted

## Detailed Setup Instructions

### 1. Prerequisites

Make sure you have the following installed:
- [Visual Studio Code](https://code.visualstudio.com/) (version 1.70 or later)
- [PHP](https://www.php.net/) (version 7.4 or later) for database functionality
- A modern web browser (Chrome, Firefox, or Edge)

### 2. Opening the Project

There are two ways to open the project:

**Option 1: Open via Workspace File (Recommended)**
1. Launch VS Code
2. Select File > Open Workspace from File...
3. Navigate to the project folder
4. Select `smart-living-3d.code-workspace`

**Option 2: Open Project Folder**
1. Launch VS Code
2. Select File > Open Folder...
3. Navigate to and select the project folder

### 3. Installing Extensions

When you open the workspace, VS Code will prompt you to install recommended extensions. Click "Install" to install them all at once.

Alternatively, you can install them manually:
1. Open the Extensions view (View > Extensions or Ctrl+Shift+X)
2. Search for and install each of these extensions:
   - Live Server
   - Prettier - Code formatter
   - ESLint
   - Path Intellisense
   - GitLens
   - Material Icon Theme
   - PHP Debug
   - PHP Intelephense

### 4. Running the Project

**For HTML/CSS/JavaScript Development:**
1. Open the project in VS Code
2. Click on "Go Live" in the status bar (bottom right)
3. The project will open in your default browser at `http://localhost:5500`
4. Changes to HTML, CSS, and JS files will automatically refresh the browser

**For PHP/Database Development:**
1. Open the project in VS Code
2. Open the Terminal (View > Terminal or Ctrl+`)
3. Run the PHP server task:
   - View > Command Palette (Ctrl+Shift+P)
   - Type "Tasks: Run Task"
   - Select "Start PHP Server"
4. Access the project at `http://localhost:8000`

### 5. Useful VS Code Features

**Task Runner:**
The project includes several pre-configured tasks:
- Start PHP Server - Starts a PHP development server
- Validate HTML - Opens the W3C validator
- Optimise Images - Placeholder for image optimisation
- Create Documentation - Placeholder for documentation generation
- Prepare for Deployment - Creates a deployment package

To run a task:
1. Press Ctrl+Shift+P
2. Type "Tasks: Run Task"
3. Select the task you want to run

**Debugging:**
The project includes debugging configurations for:
- Chrome
- Firefox
- PHP (Xdebug)

To start debugging:
1. Open the Debug panel (Ctrl+Shift+D)
2. Select a debug configuration from the dropdown
3. Click the green Play button or press F5

**Code Formatting:**
The project uses Prettier for code formatting:
- Files are automatically formatted when you save them
- You can manually format a file with Shift+Alt+F
- Format settings are configured in `.prettierrc`

### 6. Project Structure

The VS Code workspace is configured to work with the following project structure:

```
assignment/
├── index.html                # Main interactive experience page
├── about.html                # Project documentation and details
├── gallery.html              # Model gallery with various views
├── references.html           # Credits and acknowledgments
├── database.php              # Backend database handler
├── README.MD                 # Information for the project
├── css/                      # CSS styles
├── js/                       # JavaScript files
├── models/                   # 3D models
├── textures/                 # Textures for models
├── audio/                    # Sound effects
├── images/                   # Images for UI
└── data/                     # Database files (created by PHP)
```

### 7. Troubleshooting

**Live Server Not Working:**
- Check if port 5500 is already in use
- You can change the port in settings.json

**PHP Server Not Starting:**
- Verify PHP is installed and in your PATH
- Check if port 8000 is already in use

**Extensions Not Installing:**
- Try installing them manually from the Extensions panel
- Check your internet connection

**Code Not Formatting:**
- Make sure Prettier is installed
- Check if the file type is supported by Prettier

### 8. Additional Resources

- [VS Code Documentation](https://code.visualstudio.com/docs)
- [Three.js Documentation](https://threejs.org/docs/)
- [PHP Documentation](https://www.php.net/docs.php)
