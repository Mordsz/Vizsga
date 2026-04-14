<?php
/**
 * Database Migration Script
 * Ezt a fájlt csak egyszer kell futtatni az adatbázis frissítéséhez
 * Run this once: http://yourwebsite.hu/php/db_migration.php
 */

declare(strict_types=1);

require __DIR__ . '/config.php';

$runningFromCli = PHP_SAPI === 'cli';
if (!$runningFromCli) {
    session_start();
    if (empty($_SESSION['user_id']) || empty($_SESSION['is_admin'])) {
        http_response_code(403);
        echo 'Hozzáférés megtagadva: csak admin jogosultsággal futtatható a migráció.';
        exit;
    }
}

function ensureColumn(mysqli $db, string $table, string $column, string $definition): void {
    $schema = DB_NAME;
    $stmt = $db->prepare("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND COLUMN_NAME = ?");
    $stmt->bind_param('sss', $schema, $table, $column);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 0) {
        $db->query("ALTER TABLE {$table} ADD COLUMN {$column} {$definition}");
        echo "✓ {$column} column added<br>";
    } else {
        echo "✓ {$column} column already exists<br>";
    }
    $stmt->close();
}

try {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');

    // Avatar oszlop hozzáadása, ha még nem létezik
    $checkAvatarStmt = $db->prepare("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='avatar'");
    $checkAvatarStmt->execute();
    $checkAvatarStmt->store_result();

    if ($checkAvatarStmt->num_rows === 0) {
        $db->query("ALTER TABLE users ADD COLUMN avatar VARCHAR(255) DEFAULT NULL");
        echo "✓ Avatar column added<br>";
    } else {
        echo "✓ Avatar column already exists<br>";
    }
    $checkAvatarStmt->close();

    // Bio oszlop hozzáadása, ha még nem létezik
    $checkBioStmt = $db->prepare("SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='bio'");
    $checkBioStmt->execute();
    $checkBioStmt->store_result();

    if ($checkBioStmt->num_rows === 0) {
        $db->query("ALTER TABLE users ADD COLUMN bio TEXT DEFAULT NULL");
        echo "✓ Bio column added<br>";
    } else {
        echo "✓ Bio column already exists<br>";
    }
    $checkBioStmt->close();

    // Admin és státusz mezők
    ensureColumn($db, 'users', 'is_admin', "TINYINT(1) NOT NULL DEFAULT 0");
    ensureColumn($db, 'users', 'account_status', "ENUM('active','disabled') NOT NULL DEFAULT 'active'");
    ensureColumn($db, 'users', 'last_active', 'DATETIME NULL DEFAULT NULL');
    ensureColumn($db, 'users', 'last_login', 'DATETIME NULL DEFAULT NULL');

    // Friends tábla létrehozása, ha nem létezik
    $createFriendsTable = "CREATE TABLE IF NOT EXISTS friends (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        friend_id INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_friendship (user_id, friend_id)
    )";
    $db->query($createFriendsTable);
    echo "✓ Friends table ready<br>";

    // Friend requests tábla
    $createFriendRequestsTable = "CREATE TABLE IF NOT EXISTS friend_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_request (sender_id, receiver_id)
    )";
    $db->query($createFriendRequestsTable);
    echo "✓ Friend requests table ready<br>";

    // Messages tábla
    $createMessagesTable = "CREATE TABLE IF NOT EXISTS messages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sender_id INT NOT NULL,
        receiver_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        expires_at TIMESTAMP GENERATED ALWAYS AS (DATE_ADD(created_at, INTERVAL 10 HOUR)) STORED,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_conversation (sender_id, receiver_id),
        INDEX idx_expires (expires_at)
    )";
    $db->query($createMessagesTable);
    echo "✓ Messages table ready<br>";

    $db->close();
    echo "<br>Database migration completed successfully!<br>";
    echo "You can now delete this file.";

} catch (Exception $e) {
    echo "Migration error: " . $e->getMessage();
    error_log('Migration error: ' . $e->getMessage());
}
