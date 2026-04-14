<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_admin();

$userId = (int)($_POST['user_id'] ?? 0);
$email = array_key_exists('email', $_POST) ? trim((string)$_POST['email']) : null;
$newPassword = (string)($_POST['new_password'] ?? '');
$accountStatus = array_key_exists('account_status', $_POST) ? trim((string)$_POST['account_status']) : null;

if ($userId <= 0) {
    json_error('missing_user', 'Hiányzó felhasználó azonosító');
}

try {
    $db = db();

    ensure_user_columns([
        ['name' => 'account_status', 'definition' => "ENUM('active','disabled') NOT NULL DEFAULT 'active'"]
    ]);

    $stmt = $db->prepare('SELECT id, email, account_status FROM users WHERE id = ?');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        json_error('user_not_found', 'Felhasználó nem található', 404);
    }

    $updates = [];
    $types = '';
    $values = [];

    if ($accountStatus !== null) {
        if (!in_array($accountStatus, ['active', 'disabled'], true)) {
            json_error('invalid_status', 'Hibás státusz érték');
        }

        if ($accountStatus === 'disabled' && $userId === (int)$auth['user_id']) {
            json_error('cannot_disable_self', 'A saját fiókodat nem tilthatod le');
        }

        if ($accountStatus !== ($user['account_status'] ?? 'active')) {
            $updates[] = 'account_status = ?';
            $types .= 's';
            $values[] = $accountStatus;
        }
    }

    if ($email !== null) {
        if ($email === '') {
            json_error('invalid_email', 'Az email cím nem lehet üres');
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            json_error('invalid_email', 'Hibás email formátum');
        }

        if ($email !== $user['email']) {
            $check = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1');
            $check->bind_param('si', $email, $userId);
            $check->execute();
            $check->store_result();
            if ($check->num_rows > 0) {
                $check->close();
                json_error('email_exists', 'Ez az email cím már használatban van');
            }
            $check->close();

            $updates[] = 'email = ?';
            $types .= 's';
            $values[] = $email;
        }
    }

    if ($newPassword !== '') {
        if (strlen($newPassword) < 6) {
            json_error('password_short', 'Az új jelszó legyen legalább 6 karakter');
        }

        $updates[] = 'password = ?';
        $types .= 's';
        $values[] = password_hash($newPassword, PASSWORD_BCRYPT);
    }

    if ($updates === []) {
        json_success(['message' => 'Nincs mentendő változás']);
    }

    $values[] = $userId;
    $types .= 'i';

    $query = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $updateStmt = $db->prepare($query);
    $updateStmt->bind_param($types, ...$values);
    $updateStmt->execute();
    $updateStmt->close();

    json_success(['message' => 'Sikeres mentés']);
} catch (Throwable $exception) {
    error_log('Admin update user error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
