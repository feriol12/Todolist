<?php
require_once '../config/database.php';

class Task
{
    private $conn;
    private $table_name = "tasks";

    public $id;
    public $uuid;
    public $user_id;
    public $project_id;
    public $title;
    public $description;
    public $status;
    public $priority;
    public $due_date;
    public $due_time;
    public $reminder;
    public $estimated_duration;
    public $tags;
    public $is_recurring;

    public function __construct()
    {
        $database = new Database();
        $this->conn = $database->getConnection();
    }

    // ➕ CRÉER UNE TÂCHE
    public function create()
    {
        try {
            // Générer UUID
            $uuid = $this->generateUUID();

            // Préparer la requête
            $query = "INSERT INTO " . $this->table_name . " 
                     SET uuid = :uuid, user_id = :user_id, project_id = :project_id,
                         title = :title, description = :description, status = :status,
                         priority = :priority, due_date = :due_date, due_time = :due_time,
                         reminder = :reminder, estimated_duration = :estimated_duration,
                         tags = :tags, is_recurring = :is_recurring";

            $stmt = $this->conn->prepare($query);

            // Nettoyer et binder les données
            $stmt->bindParam(":uuid", $uuid);
            $stmt->bindParam(":user_id", $this->user_id);
            $stmt->bindParam(":project_id", $this->project_id);
            $stmt->bindParam(":title", htmlspecialchars(strip_tags($this->title)));
            $stmt->bindParam(":description", htmlspecialchars(strip_tags($this->description)));
            $stmt->bindParam(":status", $this->status);
            $stmt->bindParam(":priority", $this->priority);
            $stmt->bindParam(":due_date", $this->due_date);
            $stmt->bindParam(":due_time", $this->due_time);
            $stmt->bindParam(":reminder", $this->reminder);
            $stmt->bindParam(":estimated_duration", $this->estimated_duration);
            $stmt->bindParam(":tags", $this->tags);
            $stmt->bindParam(":is_recurring", $this->is_recurring);

            if ($stmt->execute()) {
                $this->id = $this->conn->lastInsertId();
                $this->uuid = $uuid;
                return true;
            }

            return false;
        } catch (PDOException $e) {
            throw new Exception("Erreur création tâche: " . $e->getMessage());
        }
    }

    // 📖 RÉCUPÉRER LES TÂCHES D'UN UTILISATEUR
    public function getByUser($user_id, $filters = [])
    {
        try {
            $query = "SELECT t.*, p.name as project_name, p.color as project_color 
                      FROM " . $this->table_name . " t
                      LEFT JOIN projects p ON t.project_id = p.id
                      WHERE t.user_id = :user_id AND t.is_active = TRUE";

            $params = [":user_id" => $user_id];

            // Appliquer les filtres
            if (!empty($filters['status']) && $filters['status'] !== 'all') {
                $query .= " AND t.status = :status";
                $params[":status"] = $filters['status'];
            }

            if (!empty($filters['project_id'])) {
                $query .= " AND t.project_id = :project_id";
                $params[":project_id"] = $filters['project_id'];
            }

            if (!empty($filters['priority']) && is_array($filters['priority'])) {
                $placeholders = implode(',', array_fill(0, count($filters['priority']), '?'));
                $query .= " AND t.priority IN ($placeholders)";
                $params = array_merge($params, $filters['priority']);
            }

            if (!empty($filters['search'])) {
                $query .= " AND (t.title LIKE :search OR t.description LIKE :search)";
                $params[":search"] = '%' . $filters['search'] . '%';
            }

            $query .= " ORDER BY t.due_date IS NULL, t.due_date, t.created_at DESC";

            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);

            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            throw new Exception("Erreur récupération tâches: " . $e->getMessage());
        }
    }


    // 📋 RÉCUPÉRER LES RAPPELS ÉCHUS

public function getDueReminders($user_id)
{
    try {
        $query = "SELECT t.id, t.uuid, t.title, t.due_date, t.due_time, t.reminder, t.project_id, t.status,
                  p.name as project_name
                  FROM tasks t
                  LEFT JOIN projects p ON t.project_id = p.id
                  WHERE t.user_id = :user_id
                  AND t.reminder IS NOT NULL
                  AND t.status != 'done'
                  AND t.is_active = 1";

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":user_id", $user_id);
        $stmt->execute();

        $allReminders = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $filteredReminders = [];

        $now = time();

        foreach ($allReminders as $r) {
            $ts = strtotime($r['reminder']);
            // Notification uniquement si on est dans la "seconde exacte" du reminder
            if ($ts !== false && $ts === $now) {
                $filteredReminders[] = $r;
            }
        }

        return $filteredReminders;

    } catch (PDOException $e) {
        throw new Exception("Erreur récupération rappels: " . $e->getMessage());
    }
}







    // 🆔 GÉNÉRER UUID
    private function generateUUID()
    {
        $data = random_bytes(16);
        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }

    public function __destruct()
    {
        $this->conn = null;
    }
}
