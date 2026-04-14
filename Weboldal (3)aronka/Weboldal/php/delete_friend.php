<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_auth();

$friendId = (int)($_POST['friend_id'] ?? 0);
if ($friendId <= 0) {
    json_error('invalid_friend', 'Érvénytelen barát azonosító');
}

if ($friendId === $auth['user_id']) {
    json_error('invalid_friend', 'Magadat nem törölheted');
}

try {
    $db = db();
    $stmt = $db->prepare('DELETE FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)');
    $stmt->bind_param('iiii', $auth['user_id'], $friendId, $friendId, $auth['user_id']);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        $stmt->close();
        json_error('not_found', 'A kapcsolat nem található');
    }

    $stmt->close();
    json_success(['message' => 'Barát eltávolítva']);
} catch (Throwable $exception) {
    error_log('Delete friend error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
