<?php
class Database {
    private $host = "localhost";
    private $db_name = "app-todolist";
    private $username = "root";       // Change selon ton setup
    private $password = "";           // Change selon ton setup
    private $port = "3306";           // Port MySQL
    public $conn;

    // Méthode de connexion
    public function getConnection() {
        $this->conn = null;

        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . 
                ";port=" . $this->port . 
                ";dbname=" . $this->db_name . 
                ";charset=utf8mb4",
                $this->username, 
                $this->password
            );
            
            // Configurer PDO pour afficher les erreurs
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Optional: Éviter les émoluments numériques
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            
            echo "✅ Connexion à la base de données réussie!";

        } catch(PDOException $exception) {
            echo "❌ Erreur de connexion: " . $exception->getMessage();
            // En production, logger l'erreur au lieu de l'afficher
            error_log("Database connection failed: " . $exception->getMessage());
        }

        return $this->conn;
    }

    // Méthode pour fermer la connexion
    public function closeConnection() {
        $this->conn = null;
    }
}

// Test de connexion (à retirer en production)
try {
    $database = new Database();
    $db = $database->getConnection();
} catch(Exception $e) {
    die("Erreur critique: Impossible de se connecter à la base de données");
}
?>
