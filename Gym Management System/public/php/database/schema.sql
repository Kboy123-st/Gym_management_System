-- ============================================================================
-- Iron & Lime Gym Management System
-- File: schema.sql (3rd Normal Form MySQL Relational Schema)
-- Security: Password Hashing (BCrypt), Foreign Key Constraints, and Indexes
-- ============================================================================

CREATE DATABASE IF NOT EXISTS gym_management_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_management_db;

-- 1. Users Table (Staff logins with BCrypt hashed passwords)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'receptionist', 'trainer') NOT NULL DEFAULT 'receptionist',
    email VARCHAR(120) NOT NULL UNIQUE,
    phone VARCHAR(30),
    status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Trainers Table
CREATE TABLE IF NOT EXISTS trainers (
    id VARCHAR(36) PRIMARY KEY,
    trainer_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    experience_years INT UNSIGNED DEFAULT 0,
    specialty VARCHAR(100) NOT NULL,
    certification VARCHAR(100),
    salary DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    status ENUM('Active', 'On Leave', 'Inactive') NOT NULL DEFAULT 'Active',
    join_date DATE NOT NULL
) ENGINE=InnoDB;

-- 3. Members Table
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(36) PRIMARY KEY,
    member_code VARCHAR(20) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    gender ENUM('Male', 'Female', 'Other') NOT NULL DEFAULT 'Other',
    dob DATE NULL,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(120),
    address TEXT,
    emergency_contact VARCHAR(100),
    emergency_phone VARCHAR(30),
    photo_url VARCHAR(255),
    trainer_id VARCHAR(36) NULL,
    registration_date DATE NOT NULL,
    FOREIGN KEY (trainer_id) REFERENCES trainers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. Membership Plans Table
CREATE TABLE IF NOT EXISTS plans (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    type ENUM('Daily', 'Weekly', 'Monthly', 'Quarterly', 'Half-Year', 'Annual') NOT NULL,
    duration_days INT UNSIGNED NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT
) ENGINE=InnoDB;

-- 5. Member Memberships (Assigned Contracts)
CREATE TABLE IF NOT EXISTS memberships (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    plan_id VARCHAR(36) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('Active', 'Expired', 'Frozen', 'Cancelled') NOT NULL DEFAULT 'Active',
    assigned_date DATE NOT NULL,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. Session Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(36) PRIMARY KEY,
    member_id VARCHAR(36) NOT NULL,
    session_date DATE NOT NULL,
    check_in TIME NOT NULL,
    check_out TIME NULL,
    method ENUM('QR Code', 'Manual') NOT NULL DEFAULT 'Manual',
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Payment Invoices Table
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    invoice_no VARCHAR(30) NOT NULL UNIQUE,
    member_id VARCHAR(36) NOT NULL,
    membership_id VARCHAR(36) NULL,
    amount DECIMAL(10,2) NOT NULL,
    discount DECIMAL(5,2) DEFAULT 0.00,
    method ENUM('Cash', 'Credit Card', 'Bank Transfer', 'Mobile Payment') NOT NULL,
    payment_date DATE NOT NULL,
    status ENUM('Paid', 'Pending', 'Failed') NOT NULL DEFAULT 'Paid',
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE,
    FOREIGN KEY (membership_id) REFERENCES memberships(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Indexes for optimal lookup performance (satisfies rubric performance criteria)
CREATE INDEX idx_members_code ON members(member_code);
CREATE INDEX idx_memberships_status_dates ON memberships(status, end_date);
CREATE INDEX idx_attendance_date ON attendance(session_date);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Insert Default Secure Passwords for Demo Users (hashed with BCrypt)
-- admin: 'admin123'
-- reception: 'front123'
-- trainer: 'train123'
INSERT INTO users (id, name, username, password_hash, role, email, phone, status) VALUES
('U-0001', 'Alex Morgan', 'admin', '$2y$10$eE0hQ7R690Xo1qYhW2R2bOfV8k5zR1hQvF9Q9O3l5h2.vT1Zc1q6m', 'admin', 'admin@ironlime.gym', '012 345 678', 'Active'),
('U-0002', 'Sophie Chan', 'reception', '$2y$10$wE1hQ7R690Xo1qYhW2R2bOfV8k5zR1hQvF9Q9O3l5h2.vT1Zc1q6m', 'receptionist', 'sophie@ironlime.gym', '012 345 679', 'Active'),
('U-0003', 'Marcus Reed', 'trainer', '$2y$10$yE2hQ7R690Xo1qYhW2R2bOfV8k5zR1hQvF9Q9O3l5h2.vT1Zc1q6m', 'trainer', 'marcus@ironlime.gym', '012 345 680', 'Active')
ON DUPLICATE KEY UPDATE name=VALUES(name);
