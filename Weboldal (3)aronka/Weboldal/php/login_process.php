<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');

$username = trim($_POST['username'] ?? '');
$password = $_POST['password'] ?? '';

if ($username === '' || $password === '') {
    json_error('missing_fields', 'Felhasználónév és jelszó megadása kötelező');
}

try {
    $db = db();

    $hasIsAdmin = usersColumnExists($db, 'is_admin');
    $hasAccountStatus = usersColumnExists($db, 'account_status');
    $hasLastActive = usersColumnExists($db, 'last_active');
    $hasLastLogin = usersColumnExists($db, 'last_login');

    $selectFields = ['id', 'password'];
    $selectFields[] = $hasIsAdmin ? 'is_admin' : '0 AS is_admin';
    $selectFields[] = $hasAccountStatus ? 'account_status' : "'active' AS account_status";
    $query = 'SELECT ' . implode(', ', $selectFields) . ' FROM users WHERE username = ? LIMIT 1';

    $stmt = $db->prepare($query);
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows === 0) {
        $stmt->close();
        json_error('invalid_credentials', 'Helytelen felhasználónév vagy jelszó');
    }

    $stmt->bind_result($userId, $hashedPassword, $isAdmin, $accountStatus);
    $stmt->fetch();
    $stmt->close();

    if ($accountStatus !== 'active') {
        json_error('account_disabled', 'Ez a fiók le van tiltva');
    }

    if (!password_verify($password, $hashedPassword)) {
        json_error('invalid_credentials', 'Helytelen felhasználónév vagy jelszó');
    }

    $updateParts = [];
    if ($hasLastActive) {
        $updateParts[] = 'last_active = NOW()';
    }
    if ($hasLastLogin) {
        $updateParts[] = 'last_login = NOW()';
    }

    if ($updateParts !== []) {
        $updateQuery = 'UPDATE users SET ' . implode(', ', $updateParts) . ' WHERE id = ?';
        $updateStmt = $db->prepare($updateQuery);
        $updateStmt->bind_param('i', $userId);
        $updateStmt->execute();
        $updateStmt->close();
    }

    $_SESSION['user'] = $username;
    $_SESSION['user_id'] = $userId;
    $_SESSION['is_admin'] = $hasIsAdmin ? ((int)$isAdmin === 1) : false;

    json_success([
        'username' => $username,
        'user_id' => $userId,
        'is_admin' => $_SESSION['is_admin']
    ]);
} catch (Throwable $exception) {
    error_log('Login error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}