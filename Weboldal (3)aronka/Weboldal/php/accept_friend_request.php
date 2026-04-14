<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_auth();

$requestId = (int)($_POST['request_id'] ?? 0);
if ($requestId <= 0) {
    json_error('invalid_request', 'Érvénytelen kérés azonosító');
}

try {
    $db = db();
    $inTransaction = false;

    $stmt = $db->prepare("SELECT sender_id FROM friend_requests WHERE id = ? AND receiver_id = ? AND status = 'pending'");
    $stmt->bind_param('ii', $requestId, $auth['user_id']);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        $stmt->close();
        json_error('not_found', 'A kérelem nem található vagy már feldolgozták.');
    }

    $senderId = (int)$result->fetch_assoc()['sender_id'];
    $stmt->close();

    $db->begin_transaction();
    $inTransaction = true;

    $stmt = $db->prepare("UPDATE friend_requests SET status = 'accepted' WHERE id = ?");
    $stmt->bind_param('i', $requestId);
    $stmt->execute();
    $stmt->close();

    $stmt = $db->prepare('INSERT INTO friends (user_id, friend_id) VALUES (?, ?), (?, ?)');
    $stmt->bind_param('iiii', $senderId, $auth['user_id'], $auth['user_id'], $senderId);
    $stmt->execute();
    $stmt->close();

    $db->commit();

    json_success(['message' => 'Barátkérelem elfogadva']);
} catch (Throwable $exception) {
    if (isset($db) && $inTransaction) {
        $db->rollback();
    }
    error_log('Accept friend request error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
