<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
require_admin();

try {
    $db = db();

    ensure_user_columns([
        ['name' => 'avatar', 'definition' => 'VARCHAR(255) DEFAULT NULL'],
        ['name' => 'bio', 'definition' => 'TEXT DEFAULT NULL'],
        ['name' => 'is_admin', 'definition' => 'TINYINT(1) NOT NULL DEFAULT 0'],
        ['name' => 'account_status', 'definition' => "ENUM('active','disabled') NOT NULL DEFAULT 'active'"],
        ['name' => 'last_active', 'definition' => 'DATETIME NULL DEFAULT NULL'],
        ['name' => 'online_since', 'definition' => 'DATETIME NULL DEFAULT NULL'],
        ['name' => 'last_login', 'definition' => 'DATETIME NULL DEFAULT NULL'],
        ['name' => 'created_at', 'definition' => 'DATETIME DEFAULT CURRENT_TIMESTAMP']
    ]);

    $result = $db->query('
        SELECT
            id,
            username,
            first_name,
            last_name,
            email,
            avatar,
            bio,
            is_admin,
            account_status,
            created_at,
            last_login,
            last_active,
            CASE
                WHEN last_active IS NOT NULL AND last_active >= DATE_SUB(NOW(), INTERVAL 3 MINUTE) THEN 1
                ELSE 0
            END AS is_online,
            CASE
                WHEN last_active IS NOT NULL AND last_active >= DATE_SUB(NOW(), INTERVAL 3 MINUTE) THEN online_since
                ELSE NULL
            END AS online_since
        FROM users
        ORDER BY id DESC
    ');

    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            'id' => (int)$row['id'],
            'username' => $row['username'],
            'first_name' => $row['first_name'],
            'last_name' => $row['last_name'],
            'email' => $row['email'],
            'avatar' => $row['avatar'],
            'bio' => $row['bio'],
            'is_admin' => ((int)$row['is_admin'] === 1),
            'account_status' => $row['account_status'],
            'created_at' => $row['created_at'],
            'last_login' => $row['last_login'],
            'last_active' => $row['last_active'],
            'is_online' => ((int)$row['is_online'] === 1),
            'online_since' => $row['online_since']
        ];
    }

    json_success(['users' => $users]);
} catch (Throwable $exception) {
    error_log('Admin get users error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
