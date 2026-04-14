<?php
declare(strict_types=1);

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require __DIR__ . '/config.php';
require_once __DIR__ . '/schema_helpers.php';

function db(): mysqli
{
    global $appDbConnection;

    if ($appDbConnection instanceof mysqli) {
        return $appDbConnection;
    }

    $appDbConnection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $appDbConnection->set_charset('utf8mb4');

    return $appDbConnection;
}

function close_db(): void
{
    global $appDbConnection;

    if ($appDbConnection instanceof mysqli) {
        $appDbConnection->close();
        $appDbConnection = null;
    }
}

register_shutdown_function('close_db');

function json_response(array $payload, int $status = 200): void
{
    header('Content-Type: application/json');
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function json_success(array $data = [], int $status = 200): void
{
    json_response(['success' => true] + $data, $status);
}

function json_error(string $code, string $message, int $status = 400, array $extra = []): void
{
    json_response(array_merge(['success' => false, 'error' => $code, 'message' => $message], $extra), $status);
}

function require_method(string $method): void
{
    if (strtoupper($_SERVER['REQUEST_METHOD'] ?? '') !== strtoupper($method)) {
        json_error('invalid_method', 'Hibás HTTP metódus', 405);
    }
}

function require_auth(): array
{
    if (empty($_SESSION['user_id'])) {
        json_error('not_authenticated', 'Bejelentkezés szükséges', 401);
    }

    $auth = [
        'user_id' => (int)$_SESSION['user_id'],
        'username' => (string)($_SESSION['user'] ?? ''),
        'is_admin' => !empty($_SESSION['is_admin'])
    ];

    try {
        $connection = db();

        if (usersColumnExists($connection, 'account_status')) {
            $stmt = $connection->prepare('SELECT account_status FROM users WHERE id = ? LIMIT 1');
            $stmt->bind_param('i', $auth['user_id']);
            $stmt->execute();
            $stmt->bind_result($accountStatus);
            $found = $stmt->fetch();
            $stmt->close();

            if (!$found) {
                $_SESSION = [];
                session_destroy();
                json_error('not_authenticated', 'Bejelentkezés szükséges', 401);
            }

            if ($accountStatus !== 'active') {
                $_SESSION = [];
                session_destroy();
                json_error('account_disabled', 'Ez a fiók le van tiltva', 403);
            }
        }
    } catch (Throwable $exception) {
        error_log('Auth status check error: ' . $exception->getMessage());
        json_error('server_error', 'Szerverhiba történt', 500);
    }

    return $auth;
}

function require_admin(): array
{
    $auth = require_auth();

    if (empty($auth['is_admin'])) {
        json_error('forbidden', 'Hozzáférés megtagadva', 403);
    }

    try {
        $connection = db();
        if (!usersColumnExists($connection, 'is_admin')) {
            json_error('forbidden', 'Hozzáférés megtagadva', 403);
        }

        $stmt = $connection->prepare('SELECT is_admin FROM users WHERE id = ? LIMIT 1');
        $stmt->bind_param('i', $auth['user_id']);
        $stmt->execute();
        $stmt->bind_result($isAdmin);
        $found = $stmt->fetch();
        $stmt->close();

        if (!$found || (int)$isAdmin !== 1) {
            json_error('forbidden', 'Hozzáférés megtagadva', 403);
        }
    } catch (Throwable $exception) {
        error_log('Admin auth error: ' . $exception->getMessage());
        json_error('server_error', 'Szerverhiba történt', 500);
    }

    return $auth;
}

function ensure_user_columns(array $columns): void
{
    $connection = db();
    foreach ($columns as $definition) {
        ensureUsersColumn($connection, $definition['name'], $definition['definition']);
    }
}
