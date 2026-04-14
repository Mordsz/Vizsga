<?php
declare(strict_types=1);

session_start();
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require __DIR__ . '/config.php';

// Bejelentkezés ellenőrzése
if (!isset($_SESSION['user_id'])) {
    header('Location: ../index.html');
    exit;
}

// POST kérés ellenőrzése
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../main.html');
    exit;
}

try {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');

    $user_id = $_SESSION['user_id'];

    // Felhasználó törlése az adatbázisból
    $deleteStmt = $db->prepare('DELETE FROM users WHERE id = ?');
    $deleteStmt->bind_param('i', $user_id);
    $deleteStmt->execute();
    $deleteStmt->close();

    // Session törlése
    session_destroy();

    // Átirányítás az index oldalra
    header('Location: ../index.html?deleted=1');
    exit;

} catch (Exception $e) {
    // Hiba naplózása
    error_log('Profil törlési hiba: ' . $e->getMessage());
    header('Location: ../main.html?error=delete');
    exit;
}
