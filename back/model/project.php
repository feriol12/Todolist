<?php
require_once '../config/database.php';

class Project
{
    private $conn;
    private $table_name = "projects";

    public $id;
    public $uuid;
    public $user_id;
    public $name;
    public $description;
    public $color;
    public $icon;
    public $is_favorite;
    public $created_at;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // ✅ MÉTHODE RENOMMÉE ET AMÉLIORÉE
    public function createProject($user_id, $name, $description, $color, $icon, $is_favorite)
    {
        try {
            // Validation
            if (empty($user_id) || empty($name)) {
                throw new Exception("User ID et nom du projet sont obligatoires");
            }

            // Générer UUID
            $uuid = $this->generateUUID();

            // Requête d'insertion avec user_id
            $query = "INSERT INTO " . $this->table_name . " 
                     SET uuid = :uuid, user_id = :user_id, name = :name, 
                         description = :description, color = :color, 
                         icon = :icon, is_favorite = :is_favorite";

            $stmt = $this->conn->prepare($query);

            // Nettoyer et binder les données
            $stmt->bindParam(":uuid", $uuid);
            $stmt->bindParam(":user_id", $user_id);
            $stmt->bindParam(":name", htmlspecialchars(strip_tags($name)));
            $stmt->bindParam(":description", htmlspecialchars(strip_tags($description)));
            $stmt->bindParam(":color", htmlspecialchars(strip_tags($color)));
            $stmt->bindParam(":icon", $icon);
            $stmt->bindParam(":is_favorite", $is_favorite, PDO::PARAM_BOOL);

            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                $this->uuid = $uuid;
                $this->user_id = $user_id;
                $this->name = $name;
                $this->description = $description;
                $this->color = $color;
                $this->icon = $icon;
                $this->is_favorite = $is_favorite;

                return true;
            }

            return false;
        } catch (PDOException $e) {
            throw new Exception("Erreur base de données: " . $e->getMessage());
        }
    }

    // ✅ NOUVELLE MÉTHODE POUR RÉCUPÉRER LES PROJETS D'UN UTILISATEUR
    // public function getUserProjects($user_id)
    // {
    //     try {
    //         $query = "SELECT id, uuid, name, description, color, icon, is_favorite, created_at 
    //                   FROM " . $this->table_name . " 
    //                   WHERE user_id = :user_id AND is_active = 1 
    //                   ORDER BY is_favorite DESC, sort_order ASC, created_at DESC";

    //         $stmt = $this->conn->prepare($query);
    //         $stmt->bindParam(":user_id", $user_id);
    //         $stmt->execute();

    //         return $stmt->fetchAll(PDO::FETCH_ASSOC);
    //     } catch (PDOException $e) {
    //         throw new Exception("Erreur lors de la récupération des projets: " . $e->getMessage());
    //     }
    // }

    public function getUserProjects($user_id)
    {
        try {
            $query = "SELECT 
                    p.id,
                    p.uuid,
                    p.name,
                    p.description,
                    p.color,
                    p.icon,
                    p.is_favorite,
                    p.created_at,

                    -- Nombre total de tâches
                    COUNT(t.id) AS task_count,

                    -- Nombre de tâches terminées
                    SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) AS total_done,

                    -- Nombre de tâches en cours
                    SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS total_in_progress,

                    -- Nombre de tâches à faire
                    SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS total_todo
                    
                FROM projects p
                LEFT JOIN tasks t ON t.project_id = p.id AND t.is_active = 1
                WHERE p.user_id = :user_id AND p.is_active = 1
                GROUP BY p.id
                ORDER BY p.is_favorite DESC, p.sort_order ASC, p.created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $user_id);
            $stmt->execute();

            $projects = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Calculer ici le pourcentage d'avancement pour chaque projet
            foreach ($projects as &$p) {
                if ($p['task_count'] > 0) {
                    $p['progress_percent'] = round(($p['total_done'] / $p['task_count']) * 100);
                } else {
                    $p['progress_percent'] = 0;
                }
            }

            return $projects;
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des projets: " . $e->getMessage());
        }
    }



    // ✅ AJOUTE CES MÉTHODES DANS TA CLASSE PROJECT

    public function deleteProject($project_id)
    {
        try {
            // Soft delete (recommandé)
            $query = "UPDATE " . $this->table_name . " 
                 SET is_active = 0 
                 WHERE id = :project_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":project_id", $project_id);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur suppression projet: " . $e->getMessage());
        }
    }

    public function toggleFavorite($project_id)
    {
        try {
            $query = "UPDATE " . $this->table_name . " 
                 SET is_favorite = NOT is_favorite 
                 WHERE id = :project_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":project_id", $project_id);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur mise à jour favori: " . $e->getMessage());
        }
    }



    // MODIFIER la méthode getProjectsStats dans project.php
    public function getProjectsStats($user_id)
    {
        try {
            $query = "
            SELECT 
                p.id,
                p.name,
                p.color,
                p.icon,
                p.created_at,
                COUNT(t.id) as total_tasks,
                SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) as todo_tasks,
                SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_tasks,
                SUM(CASE WHEN t.status = 'done' THEN 1 ELSE 0 END) as done_tasks
            FROM " . $this->table_name . " p
            LEFT JOIN tasks t ON p.id = t.project_id AND t.is_active = TRUE
            WHERE p.user_id = :user_id AND p.is_active = TRUE
            GROUP BY p.id, p.name, p.color, p.icon, p.created_at
            ORDER BY p.created_at DESC, p.id DESC
            LIMIT 1
        ";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();

            $result = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Retourner le dernier projet ou un tableau vide
            return $result;
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération stats dernier projet: " . $e->getMessage());
        }
    }

    // Dans project.php - MÉTHODE COMPLÈTE ET SÉCURISÉE
    public function softDelete($project_id, $user_id)
    {
        try {
            // 1. Vérifier que le projet existe et appartient à l'utilisateur
            $checkQuery = "SELECT id, name FROM " . $this->table_name . " 
                      WHERE id = :id AND user_id = :user_id AND is_active = TRUE";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':id', $project_id);
            $checkStmt->bindParam(':user_id', $user_id);
            $checkStmt->execute();

            $project = $checkStmt->fetch(PDO::FETCH_ASSOC);

            if (!$project) {
                throw new Exception("Projet non trouvé ou non autorisé");
            }

            // 2. Démarrer une transaction pour atomicité
            $this->conn->beginTransaction();

            // 3. Suppression logique du PROJET
            $projectQuery = "UPDATE " . $this->table_name . " 
                        SET is_active = FALSE, updated_at = NOW() 
                        WHERE id = :id AND user_id = :user_id";
            $projectStmt = $this->conn->prepare($projectQuery);
            $projectStmt->bindParam(':id', $project_id);
            $projectStmt->bindParam(':user_id', $user_id);
            $projectStmt->execute();

            // 4. Suppression logique des TÂCHES associées
            $tasksQuery = "UPDATE tasks 
                      SET is_active = FALSE, updated_at = NOW() 
                      WHERE project_id = :project_id AND user_id = :user_id";
            $tasksStmt = $this->conn->prepare($tasksQuery);
            $tasksStmt->bindParam(':project_id', $project_id);
            $tasksStmt->bindParam(':user_id', $user_id);
            $tasksStmt->execute();

            // 5. Compter le nombre de tâches supprimées
            $tasksCount = $tasksStmt->rowCount();

            // 6. Valider la transaction
            $this->conn->commit();

            // Retourner les infos pour le feedback
            return [
                'success' => true,
                'project_name' => $project['name'],
                'tasks_deleted' => $tasksCount
            ];
        } catch (PDOException $e) {
            // Annuler la transaction en cas d'erreur
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            throw new Exception("Erreur suppression projet: " . $e->getMessage());
        }
    }


    // AJOUTER dans la classe Project
    public function getById($project_id, $user_id)
    {
        try {
            $query = "SELECT id, name, description, color, icon, is_favorite 
                  FROM " . $this->table_name . " 
                  WHERE id = :id AND user_id = :user_id AND is_active = TRUE";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $project_id);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->execute();

            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération projet: " . $e->getMessage());
        }
    }

    public function updateProject($project_id, $user_id, $name, $description, $color, $icon, $is_favorite)
    {
        try {
            // Vérifier que le projet appartient à l'utilisateur
            $checkQuery = "SELECT id FROM " . $this->table_name . " 
                      WHERE id = :id AND user_id = :user_id AND is_active = TRUE";
            $checkStmt = $this->conn->prepare($checkQuery);
            $checkStmt->bindParam(':id', $project_id);
            $checkStmt->bindParam(':user_id', $user_id);
            $checkStmt->execute();

            if ($checkStmt->rowCount() === 0) {
                throw new Exception("Projet non trouvé ou non autorisé");
            }

            // Mise à jour
            $query = "UPDATE " . $this->table_name . " 
                 SET name = :name, description = :description, color = :color, 
                     icon = :icon, is_favorite = :is_favorite, updated_at = NOW()
                 WHERE id = :id AND user_id = :user_id";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':id', $project_id);
            $stmt->bindParam(':user_id', $user_id);
            $stmt->bindParam(':name', htmlspecialchars(strip_tags($name)));
            $stmt->bindParam(':description', htmlspecialchars(strip_tags($description)));
            $stmt->bindParam(':color', htmlspecialchars(strip_tags($color)));
            $stmt->bindParam(':icon', $icon);
            $stmt->bindParam(':is_favorite', $is_favorite, PDO::PARAM_BOOL);

            return $stmt->execute();
        } catch (PDOException $e) {
            throw new Exception("Erreur modification projet: " . $e->getMessage());
        }
    }

    // Générer UUID
    private function generateUUID()
    {
        if (function_exists('com_create_guid')) {
            return trim(com_create_guid(), '{}');
        }

        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
