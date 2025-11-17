<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);  // cacher notices/warnings
ini_set('log_errors', 1);      // log dans error.log


header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

require_once '../config/database.php';
require_once '../model/task.php';

// Gérer CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Démarrer la session pour récupérer l'user_id
session_start();

// Vérifier si l'utilisateur est connecté
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Non authentifié']);
    exit();
}

$user_id = $_SESSION['user_id'];
$method = $_SERVER['REQUEST_METHOD'];

try {
    $task = new Task();

    switch ($method) {
        case 'GET':
            handleGetTasks($task, $user_id);
            break;
            
        case 'POST':
            handleCreateTask($task, $user_id);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}

function handleGetTasks($task, $user_id) {
    $filters = [
        'status' => $_GET['status'] ?? 'all',
        'project_id' => $_GET['project_id'] ?? null,
        'priority' => $_GET['priority'] ?? [],
        'search' => $_GET['search'] ?? ''
    ];

    // Convertir les priorités en array si string
    if (isset($_GET['priority']) && is_string($_GET['priority'])) {
        $filters['priority'] = explode(',', $_GET['priority']);
    }

    $tasks = $task->getByUser($user_id, $filters);
    
    echo json_encode([
        'success' => true,
        'data' => $tasks,
        'count' => count($tasks)
    ]);
}

function handleCreateTask($task, $user_id) {
    $input = json_decode(file_get_contents("php://input"), true);

    // Validation des données requises
    if (empty($input['title'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Le titre est obligatoire']);
        return;
    }

    // Hydrater l'objet tâche
    $task->user_id = $user_id;
    $task->project_id = $input['project_id'] ?? null;
    $task->title = $input['title'];
    $task->description = $input['description'] ?? '';
    $task->status = $input['status'] ?? 'todo';
    $task->priority = $input['priority'] ?? 'medium';
    $task->due_date = $input['due_date'] ?? null;
    $task->due_time = $input['due_time'] ?? null;
    $task->reminder = $input['reminder'] ?? null;
    $task->estimated_duration = $input['estimated_duration'] ?? null;
    $task->is_recurring = $input['is_recurring'] ?? false;

    // Traiter les tags
    if (!empty($input['tags'])) {
        if (is_array($input['tags'])) {
            $task->tags = json_encode($input['tags']);
        } else {
            $task->tags = $input['tags']; // Déjà en JSON
        }
    } else {
        $task->tags = null;
    }

    if ($task->create()) {
        http_response_code(201);
        echo json_encode([
            'success' => true,
            'message' => 'Tâche créée avec succès',
            'task' => [
                'id' => $task->id,
                'uuid' => $task->uuid,
                'title' => $task->title
            ]
        ]);
    } else {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'Erreur création tâche']);
    }
}
?>