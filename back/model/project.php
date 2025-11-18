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
    public function getUserProjects($user_id)
    {
        try {
            $query = "SELECT id, uuid, name, description, color, icon, is_favorite, created_at 
                      FROM " . $this->table_name . " 
                      WHERE user_id = :user_id AND is_active = 1 
                      ORDER BY is_favorite DESC, sort_order ASC, created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(":user_id", $user_id);
            $stmt->execute();

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Erreur lors de la récupération des projets: " . $e->getMessage());
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
