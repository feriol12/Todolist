<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

session_start();

// Inclure les mêmes fichiers que projectApi.php
require_once '../config/database.php';
require_once '../model/project.php';

// Gérer les prérequis CORS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Récupérer l'action
$action = $_GET['action'] ?? '';

try {
    switch ($action) {
        case 'list_archived':
            handleListArchived();
            break;
            
        case 'restore':
            handleRestoreProject();
            break;
            
        case 'permanent_delete':
            handlePermanentDelete();
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Action non spécifiée pour les archives'
            ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur archives: ' . $e->getMessage()
    ]);
}

function handleListArchived() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté']);
        return;
    }

    $project = new Project();
    
    try {
        $archivedProjects = $project->getArchivedProjects($_SESSION['user_id']);
        
        echo json_encode([
            'success' => true,
            'projects' => $archivedProjects,
            'count' => count($archivedProjects)
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}

function handleRestoreProject() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté']);
        return;
    }

    $input = json_decode(file_get_contents("php://input"), true);
    $project_id = $input['project_id'] ?? null;
    
    if (!$project_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID projet manquant']);
        return;
    }

    $project = new Project();
    
    try {
        $result = $project->restoreProject($project_id, $_SESSION['user_id']);
        
        if ($result['success']) {
            $message = 'Projet restauré avec succès';
            if ($result['restored_tasks'] > 0) {
                $message .= " et " . $result['restored_tasks'] . " tâche(s) restaurée(s)";
            }
            
            echo json_encode([
                'success' => true,
                'message' => $message,
                'restored_tasks' => $result['restored_tasks']
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'Erreur lors de la restauration du projet'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
function handlePermanentDelete() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté']);
        return;
    }

    $input = json_decode(file_get_contents("php://input"), true);
    $project_id = $input['project_id'] ?? null;
    
    if (!$project_id) {
        http_response_code(400);
        echo json_encode(['success' => false, 'error' => 'ID projet manquant']);
        return;
    }

    $project = new Project();
    
    try {
        if ($project->permanentDelete($project_id, $_SESSION['user_id'])) {
            echo json_encode([
                'success' => true,
                'message' => 'Projet supprimé définitivement'
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false, 
                'error' => 'Erreur lors de la suppression définitive'
            ]);
        }
    } catch (Exception $e) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}
?>