<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_auth();

try {
    $db = db();
    ensure_user_columns([
        ['name' => 'last_active', 'definition' => 'DATETIME NULL DEFAULT NULL'],
        ['name' => 'online_since', 'definition' => 'DATETIME NULL DEFAULT NULL'],
        ['name' => 'created_at', 'definition' => 'DATETIME DEFAULT CURRENT_TIMESTAMP']
    ]);

    $stmt = $db->prepare('
        UPDATE users
        SET
            online_since = CASE
                WHEN online_since IS NULL
                    OR last_active IS NULL
                    OR last_active < DATE_SUB(NOW(), INTERVAL 3 MINUTE)
                THEN NOW()
                ELSE online_since
            END,
            last_active = NOW()
        WHERE id = ?
    ');
    $stmt->bind_param('i', $auth['user_id']);
    $stmt->execute();
    $stmt->close();

    json_success();
} catch (Throwable $exception) {
    error_log('Activity ping error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
