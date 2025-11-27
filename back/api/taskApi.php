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
$action = $_GET['action'] ?? '';



try {
    $task = new Task();

    switch ($action) {
        case 'getDueReminders':
            handleGetDueReminders($task, $user_id);
            break;
            case 'list':
            handleGetTasks($task, $user_id);
            break;
            
        case 'taskSave':
            handleCreateTask($task, $user_id);
            break;

        case 'delete':
            handleDeleteTask($task, $user_id);
            break;
        case 'get':
            handleGetTask($task, $user_id);
            break;
        case 'toggle_favorite':  // ⚠️ AJOUTER cette action manquante
             handleToggleFavorite($task, $user_id);
             break;
        case 'update':
            handleUpdateTask($task, $user_id);
            break;
          default:
          if($method == 'GET'){
              handleGetTasks($task, $user_id);
              break;

          } elseif($method == 'POST'){
                   handleCreateTask($task, $user_id);
                   break;

          } else{

              http_response_code(405);
              echo json_encode(['success' => false, 'error' => 'Méthode non autorisée']);
          }
       
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}


function handleGetTasks($task, $user_id)
{
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

function calculateReminder($dueDate, $dueTime, $reminderType)
{
    if (empty($dueDate) || empty($reminderType) || $reminderType === 'custom') {
        return null;
    }

    try {
        // Créer l'objet DateTime pour l'échéance
        $dueDateTime = new DateTime($dueDate . ($dueTime ? ' ' . $dueTime : ' 00:00:00'));

        // Convertir le type de rappel en minutes
        $minutesToSubtract = intval($reminderType);

        // Soustraire les minutes
        $dueDateTime->sub(new DateInterval('PT' . $minutesToSubtract . 'M'));

        // Retourner au format MySQL
        return $dueDateTime->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        error_log("Erreur calcul rappel: " . $e->getMessage());
        return null;
    }
}

function handleCreateTask($task, $user_id)
{
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
    // Calculer le rappel automatiquement
    $task->reminder = calculateReminder(
        $input['due_date'] ?? null,
        $input['due_time'] ?? null,
        $input['reminder'] ?? null
    );
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
// 🗑️ FONCTION POUR LA SUPPRESSION LOGIQUE
function handleDeleteTask($task, $user_id) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        // Validation des données
        if (!isset($data->task_id)) {
            throw new Exception("ID de tâche manquant");
        }

        // Appeler la méthode de suppression logique
        $success = $task->softDelete($data->task_id, $user_id);

        if ($success) {
            echo json_encode([
                "success" => true,
                "message" => "Tâche supprimée avec succès"
            ]);
        } else {
            throw new Exception("Tâche non trouvée ou déjà supprimée");
        }

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}
// 👁️ FONCTION POUR RÉCUPÉRER UNE TÂCHE SPÉCIFIQUE
function handleGetTask($task, $user_id) {
    try {
        $task_id = $_GET['task_id'] ?? null;
        
        if (!$task_id) {
            throw new Exception("ID de tâche manquant");
        }

        // Implémentez cette méthode dans votre classe Task
        $task_data = $task->getById($task_id, $user_id);
        
        if ($task_data) {
            echo json_encode([
                "success" => true,
                "task" => $task_data
            ]);
        } else {
            throw new Exception("Tâche non trouvée");
        }

    } catch (Exception $e) {
        http_response_code(404);
        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}


// ⭐ FONCTION POUR FAVORIS
function handleToggleFavorite($task, $user_id) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->task_id)) {
            throw new Exception("ID de tâche manquant");
        }

        // Implémentez cette méthode dans votre classe Task
        $success = $task->toggleFavorite($data->task_id, $user_id);

        if ($success) {
            echo json_encode([
                "success" => true,
                "message" => "Favori mis à jour"
            ]);
        } else {
            throw new Exception("Erreur lors de la mise à jour");
        }

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}

// ✏️ FONCTION POUR MODIFIER UNE TÂCHE
function handleUpdateTask($task, $user_id) {
    try {
        $data = json_decode(file_get_contents("php://input"));
        
        // Validation des données obligatoires
        if (!isset($data->task_id) || !isset($data->title)) {
            throw new Exception("Données manquantes (task_id et titre requis)");
        }

        // Assigner les propriétés
        $task->project_id = $data->project_id ?? null;
        $task->title = $data->title;
        $task->description = $data->description ?? '';
        $task->status = $data->status ?? 'todo';
        $task->priority = $data->priority ?? 'medium';
        $task->due_date = $data->due_date ?? null;
        $task->due_time = $data->due_time ?? null;
        $task->reminder = $data->reminder ?? null;
        $task->estimated_duration = $data->estimated_duration ?? null;
        $task->tags = $data->tags ?? null;
        $task->is_recurring = $data->is_recurring ?? false;

        // Appeler la méthode de modification
        $success = $task->update($data->task_id, $user_id);

        if ($success) {
            echo json_encode([
                "success" => true,
                "message" => "Tâche modifiée avec succès"
            ]);
        } else {
            throw new Exception("Tâche non trouvée ou aucune modification");
        }

    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            "success" => false,
            "error" => $e->getMessage()
        ]);
    }
}





function handleGetDueReminders($task, $user_id) {
    try {
        $reminders = $task->getDueReminders($user_id);
        
        // ⚠️ DEBUG ULTIME
        error_log("=== DEBUG API ===");
        error_log("User ID: " . $user_id);
        error_log("Heure serveur: " . date('Y-m-d H:i:s'));
        error_log("Rappels bruts: " . print_r($reminders, true));
        
        echo json_encode([
            'success' => true,
            'data' => $reminders,
            'count' => count($reminders),
            'debug' => [ // ⚠️ Info de debug
                'server_time' => date('Y-m-d H:i:s'),
                'query_range' => [
                    'start' => date('Y-m-d H:i:s', strtotime('-1 minute')),
                    'end' => date('Y-m-d H:i:s')
                ]
            ]
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
}