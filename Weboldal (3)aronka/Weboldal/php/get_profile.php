<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('GET');
$auth = require_auth();

try {
    $db = db();
    $stmt = $db->prepare('SELECT first_name, last_name, email, bio, avatar FROM users WHERE id = ?');
    $stmt->bind_param('i', $auth['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    $stmt->close();

    if (!$user) {
        json_error('user_not_found', 'Felhasználó nem található', 404);
    }

    json_success(['user' => $user]);
} catch (Throwable $exception) {
    error_log('Get profile error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
