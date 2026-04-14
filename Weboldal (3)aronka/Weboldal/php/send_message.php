<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_auth();

$receiverId = (int)($_POST['receiver_id'] ?? 0);
$message = trim($_POST['message'] ?? '');

if ($receiverId <= 0) {
    json_error('invalid_receiver', 'Érvénytelen címzett');
}

if ($message === '') {
    json_error('empty_message', 'Az üzenet nem lehet üres');
}

if (mb_strlen($message) > 5000) {
    json_error('message_too_long', 'Az üzenet túl hosszú');
}

try {
    $db = db();

    $stmt = $db->prepare('
        SELECT id FROM friends
        WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)
        LIMIT 1
    ');
    $stmt->bind_param('iiii', $auth['user_id'], $receiverId, $receiverId, $auth['user_id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows === 0) {
        $stmt->close();
        json_error('not_friends', 'Csak barátok között engedélyezett a chat');
    }
    $stmt->close();

    $stmt = $db->prepare('INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)');
    $stmt->bind_param('iis', $auth['user_id'], $receiverId, $message);
    $stmt->execute();
    $messageId = $stmt->insert_id;
    $stmt->close();

    json_success(['message_id' => $messageId]);
} catch (Throwable $exception) {
    error_log('Send message error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
