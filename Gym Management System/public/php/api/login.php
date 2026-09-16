<?php
/**
 * ============================================================================
 * Iron & Lime Gym Management System - Student Backend
 * File: api/login.php
 * Description: Secure User Authentication with BCrypt Verification & Session Security
 * ============================================================================
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed. Use POST."]);
    exit();
}

// 1. Get raw input data (supports JSON payload or FormData)
$inputJSON = file_get_contents('php://input');
$input = json_decode($inputJSON, true);

$username = trim($input['username'] ?? $_POST['username'] ?? '');
$password = trim($input['password'] ?? $_POST['password'] ?? '');

// 2. Input validation: prevent empty queries
if (empty($username) || empty($password)) {
    http_response_code(400);
    echo json_encode(["status" => "error", "message" => "Please provide both username and password."]);
    exit();
}

try {
    $pdo = Database::getConnection();

    // 3. SECURE PDO PREPARED STATEMENT (Prevents SQL Injection!)
    // Parameters are separated from SQL query logic.
    $stmt = $pdo->prepare("SELECT id, name, username, password_hash, role, email, phone, status FROM users WHERE username = :username LIMIT 1");
    $stmt->execute([':username' => $username]);
    $user = $stmt->fetch();

    // 4. BCRYPT PASSWORD VERIFICATION
    // Verifies against modern hashed password (never store plain text passwords!)
    if ($user && password_verify($password, $user['password_hash'])) {

        // Check if account status is active
        if ($user['status'] !== 'Active') {
            http_response_code(403);
            echo json_encode(["status" => "error", "message" => "Account is currently inactive. Contact your admin."]);
            exit();
        }

        // 5. SESSION FIXATION DEFENSE
        // Regenerates the session ID upon successful login
        session_regenerate_id(true);

        // Store user in session
        $_SESSION['user_id']  = $user['id'];
        $_SESSION['username'] = $user['username'];
        $_SESSION['name']     = $user['name'];
        $_SESSION['role']     = $user['role'];
        $_SESSION['logged_in']= true;
        $_SESSION['login_at'] = time();

        // Remove sensitive password hash before returning user object
        unset($user['password_hash']);

        echo json_encode([
            "status" => "success",
            "message" => "Login successful",
            "user" => $user
        ]);
        exit();

    } else {
        // Generic failure message prevents attackers from enumerating usernames
        http_response_code(401);
        echo json_encode([
            "status" => "error",
            "message" => "Incorrect username or password. Please try again."
        ]);
        exit();
    }

} catch (PDOException $e) {
    error_log("Login Query Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["status" => "error", "message" => "Internal server error occurred."]);
    exit();
}
?>
