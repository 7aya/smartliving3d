<?php
/**
 * Smart Living 3D Application - Database Handler
 * Web 3D Applications Assignment 2025
 * 
 * This file handles database operations using SQLite.
 */

// Enable error reporting for development
// Comment these lines out for production
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Set appropriate headers for JSON response
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database configuration
$db_file = 'data/smartliving3d.db';
$db_dir = dirname($db_file);

// Ensure data directory exists
if (!file_exists($db_dir)) {
    if (!mkdir($db_dir, 0777, true)) {
        sendResponse(false, 'Failed to create data directory');
        exit;
    }
}

// Function to create/get database connection
function getDbConnection() {
    global $db_file;
    
    try {
        $db = new PDO('sqlite:' . $db_file);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        
        // Initialise database tables
        initDatabase($db);
        
        return $db;
    } catch (PDOException $e) {
        throw new Exception('Database connection error: ' . $e->getMessage());
    }
}

// Initialise database tables if they don't exist
function initDatabase($db) {
    try {
        // Preferences table
        $db->exec('
            CREATE TABLE IF NOT EXISTS preferences (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                preference_name TEXT NOT NULL UNIQUE,
                preference_value TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');
        
        // Interactions table for tracking user actions
        $db->exec('
            CREATE TABLE IF NOT EXISTS interactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                device_id TEXT NOT NULL,
                action TEXT NOT NULL,
                interaction_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');
        
        // States table for device states
        $db->exec('
            CREATE TABLE IF NOT EXISTS states (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                state_name TEXT NOT NULL UNIQUE,
                state_data TEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ');
        
        return true;
    } catch (PDOException $e) {
        throw new Exception('Error initialising database: ' . $e->getMessage());
    }
}

// Function to send JSON response
function sendResponse($success, $message = '', $data = null) {
    $response = [
        'success' => $success,
        'message' => $message,
        'data' => $data
    ];
    
    echo json_encode($response);
    exit;
}

// Get the action parameter
$action = isset($_GET['action']) ? $_GET['action'] : '';

// Get request data
$requestData = json_decode(file_get_contents('php://input'), true);
if (json_last_error() !== JSON_ERROR_NONE) {
    // Try to get form data if JSON parsing fails
    $requestData = $_POST;
}

try {
    // Get database connection
    $db = getDbConnection();
    
    // Process the action
    switch ($action) {
        case 'save_preference':
            // Save a user preference
            if (isset($requestData['preference_name']) && isset($requestData['preference_value'])) {
                $stmt = $db->prepare('
                    INSERT OR REPLACE INTO preferences 
                    (preference_name, preference_value, updated_at) 
                    VALUES (:name, :value, CURRENT_TIMESTAMP)
                ');
                
                $stmt->bindParam(':name', $requestData['preference_name'], PDO::PARAM_STR);
                $stmt->bindParam(':value', $requestData['preference_value'], PDO::PARAM_STR);
                $stmt->execute();
                
                sendResponse(true, 'Preference saved successfully');
            } else {
                sendResponse(false, 'Missing preference data');
            }
            break;
            
        case 'get_preferences':
            // Get all user preferences
            $stmt = $db->query('SELECT preference_name, preference_value FROM preferences');
            $preferences = [];
            
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $preferences[$row['preference_name']] = $row['preference_value'];
            }
            
            sendResponse(true, 'Preferences retrieved', $preferences);
            break;
            
        case 'save_state':
            // Save current application state
            if (isset($requestData['devices']) && isset($requestData['settings'])) {
                $stateData = json_encode([
                    'devices' => $requestData['devices'],
                    'settings' => $requestData['settings'],
                    'timestamp' => time()
                ]);
                
                $stmt = $db->prepare('
                    INSERT OR REPLACE INTO states
                    (state_name, state_data, updated_at)
                    VALUES ("current_state", :state_data, CURRENT_TIMESTAMP)
                ');
                
                $stmt->bindParam(':state_data', $stateData, PDO::PARAM_STR);
                $stmt->execute();
                
                sendResponse(true, 'State saved successfully');
            } else {
                sendResponse(false, 'Missing state data');
            }
            break;
            
        case 'load_state':
            // Load current application state
            $stmt = $db->query('
                SELECT state_data FROM states
                WHERE state_name = "current_state"
                ORDER BY updated_at DESC
                LIMIT 1
            ');
            
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($row) {
                sendResponse(true, 'State loaded successfully', json_decode($row['state_data'], true));
            } else {
                // Return empty state data if not found
                sendResponse(true, 'No saved state found', null);
            }
            break;
            
        case 'log_interaction':
            // Log user interaction
            if (isset($requestData['deviceId']) && isset($requestData['action'])) {
                $interactionData = isset($requestData['details']) ? json_encode($requestData['details']) : null;
                
                $stmt = $db->prepare('
                    INSERT INTO interactions
                    (device_id, action, interaction_data)
                    VALUES (:device_id, :action, :interaction_data)
                ');
                
                $stmt->bindParam(':device_id', $requestData['deviceId'], PDO::PARAM_STR);
                $stmt->bindParam(':action', $requestData['action'], PDO::PARAM_STR);
                $stmt->bindParam(':interaction_data', $interactionData, PDO::PARAM_STR);
                $stmt->execute();
                
                sendResponse(true, 'Interaction logged successfully');
            } else {
                sendResponse(false, 'Missing interaction data');
            }
            break;
            
        case 'get_statistics':
            // Get usage statistics
            // Most popular device
            $popularDevice = $db->query('
                SELECT device_id, COUNT(*) as count
                FROM interactions
                GROUP BY device_id
                ORDER BY count DESC
                LIMIT 1
            ')->fetch(PDO::FETCH_ASSOC);
            
            // Most popular action
            $popularAction = $db->query('
                SELECT action, COUNT(*) as count
                FROM interactions
                GROUP BY action
                ORDER BY count DESC
                LIMIT 1
            ')->fetch(PDO::FETCH_ASSOC);
            
            // Total interactions
            $totalInteractions = $db->query('
                SELECT COUNT(*) as count FROM interactions
            ')->fetch(PDO::FETCH_ASSOC);
            
            // Interactions by device
            $stmt = $db->query('
                SELECT device_id, COUNT(*) as count
                FROM interactions
                GROUP BY device_id
            ');
            $deviceStats = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $statistics = [
                'total_interactions' => $totalInteractions ? $totalInteractions['count'] : 0,
                'most_popular_device' => $popularDevice ? $popularDevice : null,
                'most_popular_action' => $popularAction ? $popularAction : null,
                'device_stats' => $deviceStats
            ];
            
            sendResponse(true, 'Statistics retrieved', $statistics);
            break;
            
        case 'test':
            // Test database connection
            sendResponse(true, 'Database connection successful', [
                'php_version' => PHP_VERSION,
                'database_file' => $db_file,
                'timestamp' => date('Y-m-d H:i:s')
            ]);
            break;
            
        default:
            sendResponse(false, 'Invalid action specified');
            break;
    }
    
} catch (Exception $e) {
    sendResponse(false, 'Error: ' . $e->getMessage());
}