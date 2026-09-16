<?php
/**
 * ============================================================================
 * Iron & Lime Gym Management System - Student Backend
 * File: config/database.php
 * Description: Secure Database connection with PDO and Anti-SQL Injection settings
 * ============================================================================
 */

define('DB_HOST', '127.0.0.1');
define('DB_NAME', 'gym_management_db');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

class Database {
    private static ?PDO $instance = null;

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            
            $options = [
                // 1. Error Mode: Throw exceptions so errors can be handled without leaking sensitive SQL details
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                
                // 2. Default Fetch Mode: Return associative array
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                
                // 3. CRITICAL SECURITY: Disable emulated prepared statements!
                // This forces the MySQL database engine to pre-compile the SQL statement first.
                // Prevents SQL Injection attacks like: ' OR '1'='1
                PDO::ATTR_EMULATE_PREPARES => false,
            ];

            try {
                self::$instance = new PDO($dsn, DB_USER, DB_PASS, $options);
            } catch (PDOException $e) {
                // Security: Log actual error to server logs, but display generic safe message to users
                error_log("Database Connection Error: " . $e->getMessage());
                die(json_encode([
                    "status" => "error",
                    "message" => "Database connection failed. Please contact your system administrator."
                ]));
            }
        }
        return self::$instance;
    }
}
?>
