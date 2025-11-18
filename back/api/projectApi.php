<?php
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

// ✅ DÉMARRER LA SESSION POUR RÉCUPÉRER L'USER_ID
session_start();

// Inclure la configuration et le modèle
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
        case 'create':
            handleProjectCreate();
            break;

        case 'list':
            handleProjectList();
            break;

        case 'stats':
            handleProjectStats();
            break;

        default:
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Action non spécifiée'
            ]);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Erreur serveur: ' . $e->getMessage()
    ]);
}

function handleProjectCreate()
{
    // ✅ VÉRIFIER SI L'UTILISATEUR EST CONNECTÉ
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Utilisateur non connecté'
        ]);
        return;
    }

    // Récupérer les données JSON
    $input = json_decode(file_get_contents("php://input"), true);

    if (!$input) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Données JSON invalides'
        ]);
        return;
    }

    // Validation des champs obligatoires
    if (empty($input['name'])) {
        http_response_code(400);
        echo json_encode([
            'success' => false,
            'error' => 'Le nom du projet est obligatoire'
        ]);
        return;
    }

    $project = new Project();

    try {
        // ✅ UTILISATION DE $_SESSION['user_id'] ICI
        if ($project->createProject(
            $_SESSION['user_id'], // ← ID UTILISATEUR CONNECTÉ
            $input['name'],
            $input['description'] ?? '',
            $input['color'] ?? '#4361ee',
            $input['icon'] ?? '',
            $input['is_favorite'] ?? false
        )) {
            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Projet créé avec succès',
                'project' => [
                    'id' => $project->id,
                    'uuid' => $project->uuid,
                    'name' => $project->name,
                    'description' => $project->description,
                    'color' => $project->color,
                    'icon' => $project->icon,
                    'is_favorite' => $project->is_favorite,
                ]
            ]);
        } else {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error' => 'Erreur lors de la création du projet'
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

function handleProjectList()
{
    // ✅ VÉRIFIER LA SESSION ICI AUSSI
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'Utilisateur non connecté'
        ]);
        return;
    }

    $project = new Project();

    try {
        $projects = $project->getUserProjects($_SESSION['user_id']);

        echo json_encode([
            'success' => true,
            'projects' => $projects
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}


function handleProjectStats() {
    if (!isset($_SESSION['user_id'])) {
        http_response_code(401);
        echo json_encode(['success' => false, 'error' => 'Utilisateur non connecté']);
        return;
    }

    $project = new Project();
    
    try {
        $stats = $project->getProjectsStats($_SESSION['user_id']);
        
        echo json_encode([
            'success' => true,
            'stats' => $stats
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage()
        ]);
    }
}