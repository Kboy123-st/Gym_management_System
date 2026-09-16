<?php
/**
 * ============================================================================
 * Iron & Lime Gym Management System - Student Backend
 * File: api/members.php
 * Description: CRUD operations for Members with Parameterized Queries, XSS sanitization,
 *              and Role-Based Access Control (RBAC)
 * ============================================================================
 */

session_start();
header('Content-Type: application/json; charset=utf-8');

require_once '../config/database.php';

// Role validation check
function checkAuth(array $allowedRoles = []): void {
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(["status" => "error", "message" => "Unauthorized access. Please login."]);
        exit();
    }
    if (!empty($allowedRoles) && !in_array($_SESSION['role'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(["status" => "error", "message" => "Permission denied for role: " . $_SESSION['role']]);
        exit();
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$pdo = Database::getConnection();

switch ($method) {
    // ------------------------------------------------------------------------
    // READ: GET /api/members.php?id=1 or /api/members.php?search=Liam
    // ------------------------------------------------------------------------
    case 'GET':
        checkAuth(['admin', 'receptionist', 'trainer']);

        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS);
        $search = filter_input(INPUT_GET, 'search', FILTER_SANITIZE_SPECIAL_CHARS);

        if ($id) {
            $stmt = $pdo->prepare("SELECT * FROM members WHERE id = :id LIMIT 1");
            $stmt->execute([':id' => $id]);
            $member = $stmt->fetch();
            echo json_encode(["status" => "success", "data" => $member]);
        } else if ($search) {
            // Anti-SQL Injection parameterized search with wildcards
            $stmt = $pdo->prepare("SELECT * FROM members WHERE full_name LIKE :search OR member_code LIKE :search OR phone LIKE :search ORDER BY registration_date DESC");
            $stmt->execute([':search' => '%' . $search . '%']);
            $members = $stmt->fetchAll();
            echo json_encode(["status" => "success", "data" => $members]);
        } else {
            $stmt = $pdo->query("SELECT * FROM members ORDER BY registration_date DESC");
            $members = $stmt->fetchAll();
            echo json_encode(["status" => "success", "data" => $members]);
        }
        break;

    // ------------------------------------------------------------------------
    // CREATE: POST /api/members.php
    // ------------------------------------------------------------------------
    case 'POST':
        checkAuth(['admin', 'receptionist']);

        $input = json_decode(file_get_contents('php://input'), true) ?: $_POST;

        $fullName = trim($input['fullName'] ?? '');
        $gender   = trim($input['gender'] ?? 'Other');
        $phone    = trim($input['phone'] ?? '');
        $email    = filter_var(trim($input['email'] ?? ''), FILTER_VALIDATE_EMAIL) ? trim($input['email']) : '';
        $dob      = trim($input['dob'] ?? null);
        $address  = trim($input['address'] ?? '');
        $emergencyContact = trim($input['emergencyContact'] ?? '');
        $emergencyPhone   = trim($input['emergencyPhone'] ?? '');
        $trainerId        = trim($input['trainerId'] ?? null);

        if (empty($fullName) || empty($phone)) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Full name and phone are required."]);
            exit();
        }

        // Generate unique member code (e.g. MEM-1001)
        $codeStmt = $pdo->query("SELECT COUNT(*) FROM members");
        $count = (int)$codeStmt->fetchColumn() + 1;
        $memberCode = "MEM-" . str_pad((string)$count, 4, '0', STR_PAD_LEFT);
        $id = "M-" . str_pad((string)$count, 4, '0', STR_PAD_LEFT);

        $insertStmt = $pdo->prepare("
            INSERT INTO members (id, member_code, full_name, gender, dob, phone, email, address, emergency_contact, emergency_phone, trainer_id, registration_date)
            VALUES (:id, :member_code, :full_name, :gender, :dob, :phone, :email, :address, :emergency_contact, :emergency_phone, :trainer_id, CURDATE())
        ");

        $insertStmt->execute([
            ':id' => $id,
            ':member_code' => $memberCode,
            ':full_name' => htmlspecialchars($fullName, ENT_QUOTES, 'UTF-8'),
            ':gender' => $gender,
            ':dob' => $dob ?: null,
            ':phone' => $phone,
            ':email' => $email,
            ':address' => htmlspecialchars($address, ENT_QUOTES, 'UTF-8'),
            ':emergency_contact' => htmlspecialchars($emergencyContact, ENT_QUOTES, 'UTF-8'),
            ':emergency_phone' => $emergencyPhone,
            ':trainer_id' => $trainerId ?: null,
        ]);

        echo json_encode(["status" => "success", "message" => "Member registered successfully.", "id" => $id, "member_code" => $memberCode]);
        break;

    // ------------------------------------------------------------------------
    // DELETE: DELETE /api/members.php?id=M-1001
    // ------------------------------------------------------------------------
    case 'DELETE':
        checkAuth(['admin']); // Only admin can delete

        $id = filter_input(INPUT_GET, 'id', FILTER_SANITIZE_SPECIAL_CHARS);
        if (!$id) {
            http_response_code(400);
            echo json_encode(["status" => "error", "message" => "Member ID required."]);
            exit();
        }

        $deleteStmt = $pdo->prepare("DELETE FROM members WHERE id = :id");
        $deleteStmt->execute([':id' => $id]);

        echo json_encode(["status" => "success", "message" => "Member deleted."]);
        break;

    default:
        http_response_code(405);
        echo json_encode(["status" => "error", "message" => "Method not supported."]);
        break;
}
?>
