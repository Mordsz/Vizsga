<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_auth();

$username = trim($_POST['username'] ?? '');
if ($username === '') {
    json_error('invalid_username', 'Felhasználónév megadása kötelező');
}

try {
    $db = db();

    $stmt = $db->prepare('SELECT id FROM users WHERE username = ? LIMIT 1');
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $stmt->close();
        json_error('user_not_found', 'A megadott felhasználó nem található');
    }

    $receiverId = (int)$result->fetch_assoc()['id'];
    $stmt->close();

    if ($receiverId === $auth['user_id']) {
        json_error('self_request', 'Magadat nem veheted fel');
    }

    $stmt = $db->prepare('SELECT id FROM friends WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?) LIMIT 1');
    $stmt->bind_param('iiii', $auth['user_id'], $receiverId, $receiverId, $auth['user_id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $stmt->close();
        json_error('already_friends', 'Már barátok vagytok');
    }
    $stmt->close();

    // Ha a másik fél már küldött neked egy függőben lévő kérést, ne hozzunk létre még egyet.
    $stmt = $db->prepare("SELECT id FROM friend_requests WHERE sender_id = ? AND receiver_id = ? AND status = 'pending' LIMIT 1");
    $stmt->bind_param('ii', $receiverId, $auth['user_id']);
    $stmt->execute();
    if ($stmt->get_result()->num_rows > 0) {
        $stmt->close();
        json_error('request_exists', 'Már van függőben lévő kérés köztetek');
    }
    $stmt->close();

    // Ha már van korábbi kérelem ugyanebben az irányban (pending/accepted/rejected),
    // akkor ne hibázzunk: frissítsük a kérést (pending + új időbélyeg).
    $stmt = $db->prepare(
        "INSERT INTO friend_requests (sender_id, receiver_id, status, created_at)
         VALUES (?, ?, 'pending', CURRENT_TIMESTAMP)
         ON DUPLICATE KEY UPDATE status = 'pending', created_at = CURRENT_TIMESTAMP"
    );
    $stmt->bind_param('ii', $auth['user_id'], $receiverId);
    $stmt->execute();
    $affected = $stmt->affected_rows;
    $stmt->close();

    $message = $affected === 1 ? 'Barátkérelem elküldve' : 'Barátkérelem újraküldve';
    json_success(['message' => $message]);
} catch (Throwable $exception) {
    error_log('Send friend request error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
