<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_auth();

try {
    $db = db();
    $stmt = $db->prepare('
        SELECT fr.id, u.id AS sender_id, u.username, u.avatar
        FROM friend_requests fr
        JOIN users u ON fr.sender_id = u.id
        WHERE fr.receiver_id = ? AND fr.status = "pending"
        ORDER BY fr.created_at DESC
    ');
    $stmt->bind_param('i', $auth['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();

    $requests = [];
    while ($row = $result->fetch_assoc()) {
        $requests[] = [
            'request_id' => (int)$row['id'],
            'sender_id' => (int)$row['sender_id'],
            'username' => $row['username'],
            'avatar' => $row['avatar']
        ];
    }
    $stmt->close();

    json_success(['requests' => $requests]);
} catch (Throwable $exception) {
    error_log('Get friend requests error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
