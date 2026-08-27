CREATE DATABASE IF NOT EXISTS traceability_db;
USE traceability_db;

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fullname VARCHAR(100) NOT NULL,
    role VARCHAR(50) DEFAULT 'Inspector',
    default_group VARCHAR(50),
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shifts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    shift_code VARCHAR(20) NOT NULL UNIQUE,
    shift_name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    is_overnight BOOLEAN DEFAULT FALSE,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups_data (
    id INT AUTO_INCREMENT PRIMARY KEY,
    group_code VARCHAR(20) NOT NULL UNIQUE,
    group_name VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(50) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS components (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    stage_code VARCHAR(20) NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (stage_code) REFERENCES stages(code) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS variants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    takt_time INT DEFAULT 180,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cycle_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nik VARCHAR(100) NOT NULL,
    variant_code VARCHAR(50),
    pos VARCHAR(50),
    shift_name VARCHAR(50),
    group_name VARCHAR(50),
    inspector VARCHAR(50),
    start_time TIME,
    end_time TIME,
    cycle_sec INT,
    pause_sec INT,
    status VARCHAR(20),
    created_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS defects (
    id VARCHAR(50) PRIMARY KEY,
    nik VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50),
    pos VARCHAR(50),
    shift_name VARCHAR(50),
    group_name VARCHAR(50),
    inspector VARCHAR(50),
    status VARCHAR(20) DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP NULL
);

-- Insert mock data to match existing frontend state
INSERT IGNORE INTO users (username, password, fullname, role, default_group, active) VALUES
('INS001', 'password', 'Budi Santoso', 'Inspector', 'Group A', 1),
('INS002', 'password', 'Andi Wijaya', 'Inspector', 'Group B', 1),
('ADMIN01', 'password', 'Admin User', 'Admin', '', 1),
('QC001', 'password', 'Siti Rahayu', 'Quality', 'Group A', 1);

INSERT IGNORE INTO shifts (shift_code, shift_name, start_time, end_time, is_overnight, active) VALUES
('S1', 'Shift 1', '06:00:00', '14:00:00', 0, 1),
('S2', 'Shift 2 / Malam', '14:00:00', '22:00:00', 0, 1),
('S3', 'Shift 3 (Malam)', '22:00:00', '06:00:00', 1, 0);

INSERT IGNORE INTO groups_data (group_code, group_name, active) VALUES
('A', 'Group A', 1),
('B', 'Group B', 1),
('C', 'Group C', 0);

INSERT IGNORE INTO stages (code, name, active) VALUES
('STG-05', 'Stage 5', 1),
('STG-08', 'Stage 8', 1),
('STG-13', 'Stage 13', 1),
('STG-15', 'Stage 15', 0);

INSERT IGNORE INTO components (code, name, stage_code, active) VALUES
('COMP-001', 'Engine Assembly', 'STG-13', 1),
('COMP-002', 'Battery Pack', 'STG-05', 1),
('COMP-003', 'Wiring Harness', 'STG-08', 1);

INSERT IGNORE INTO variants (code, name, takt_time, active) VALUES
('VAR-X', 'N-Series X', 180, 1),
('VAR-Y', 'N-Series Y', 150, 1);
