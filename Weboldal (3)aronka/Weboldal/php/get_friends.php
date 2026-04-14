<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_auth();

try {
    $db = db();
    $stmt = $db->prepare('
        SELECT u.id, u.username, u.avatar
        FROM friends f
        JOIN users u ON (f.friend_id = u.id OR f.user_id = u.id)
        WHERE (f.user_id = ? OR f.friend_id = ?) AND u.id != ?
        ORDER BY u.username ASC
    ');
    $stmt->bind_param('iii', $auth['user_id'], $auth['user_id'], $auth['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();

    $friends = [];
    while ($row = $result->fetch_assoc()) {
        $friends[] = [
            'id' => (int)$row['id'],
            'username' => $row['username'],
            'avatar' => $row['avatar']
        ];
    }
    $stmt->close();

    json_success(['friends' => $friends]);
} catch (Throwable $exception) {
    error_log('Get friends error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
