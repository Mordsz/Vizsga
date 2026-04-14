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
    $stmt = $db->prepare("UPDATE friend_requests SET status = 'rejected' WHERE id = ? AND receiver_id = ? AND status = 'pending'");
    $stmt->bind_param('ii', $requestId, $auth['user_id']);
    $stmt->execute();

    if ($stmt->affected_rows === 0) {
        $stmt->close();
        json_error('not_found', 'A kérelem nem található vagy már feldolgozták.');
    }

    $stmt->close();
    json_success(['message' => 'Barátkérelem elutasítva']);
} catch (Throwable $exception) {
    error_log('Reject friend request error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
