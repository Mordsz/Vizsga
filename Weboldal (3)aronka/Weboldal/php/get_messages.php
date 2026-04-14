<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_auth();

$friendId = (int)($_POST['friend_id'] ?? 0);
if ($friendId <= 0) {
    json_error('invalid_friend', 'Érvénytelen barát azonosító');
}

$limit = (int)($_POST['limit'] ?? 50);
$limit = max(1, min(500, $limit));

try {
    $db = db();
    $db->query('DELETE FROM messages WHERE expires_at < NOW()');

    $stmt = $db->prepare('
        SELECT id, sender_id, message, created_at
        FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC
        LIMIT ?
    ');
    $stmt->bind_param('iiiii', $auth['user_id'], $friendId, $friendId, $auth['user_id'], $limit);
    $stmt->execute();
    $result = $stmt->get_result();

    $messages = [];
    while ($row = $result->fetch_assoc()) {
        $messages[] = [
            'id' => (int)$row['id'],
            'sender_id' => (int)$row['sender_id'],
            'message' => $row['message'],
            'created_at' => $row['created_at'],
            'is_own' => ((int)$row['sender_id'] === $auth['user_id'])
        ];
    }
    $stmt->close();

    json_success(['messages' => array_reverse($messages)]);
} catch (Throwable $exception) {
    error_log('Get messages error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
