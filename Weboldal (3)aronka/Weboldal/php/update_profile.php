<?php
declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

require_method('POST');
$auth = require_auth();

try {
    $db = db();
    $stmt = $db->prepare('SELECT email, password FROM users WHERE id = ?');
    $stmt->bind_param('i', $auth['user_id']);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$user) {
        json_error('user_not_found', 'Felhasználó nem található', 404);
    }

    $updates = [];
    $types = '';
    $values = [];

    if (isset($_POST['first_name']) && $_POST['first_name'] !== '') {
        $updates[] = 'first_name = ?';
        $types .= 's';
        $values[] = trim($_POST['first_name']);
    }

    if (isset($_POST['last_name']) && $_POST['last_name'] !== '') {
        $updates[] = 'last_name = ?';
        $types .= 's';
        $values[] = trim($_POST['last_name']);
    }

    if (isset($_POST['bio'])) {
        $updates[] = 'bio = ?';
        $types .= 's';
        $values[] = trim($_POST['bio']);
    }

    if (!empty($_POST['email'])) {
        $newEmail = trim($_POST['email']);
        $emailPassword = $_POST['email_password'] ?? '';

        if ($emailPassword === '') {
            json_error('password_required', 'Az email módosításához add meg a jelszavadat');
        }

        if (!password_verify($emailPassword, $user['password'])) {
            json_error('invalid_password', 'Helytelen jelszó');
        }

        if ($newEmail !== $user['email']) {
            $stmt = $db->prepare('SELECT id FROM users WHERE email = ? AND id != ?');
            $stmt->bind_param('si', $newEmail, $auth['user_id']);
            $stmt->execute();
            $stmt->store_result();
            if ($stmt->num_rows > 0) {
                $stmt->close();
                json_error('email_exists', 'Ez az email cím már használatban van');
            }
            $stmt->close();

            $updates[] = 'email = ?';
            $types .= 's';
            $values[] = $newEmail;
        }
    }

    if (!empty($_POST['new_password'])) {
        $currentPassword = $_POST['current_password'] ?? '';
        $newPassword = $_POST['new_password'] ?? '';
        $confirmPassword = $_POST['confirm_password'] ?? '';

        if ($currentPassword === '' || !password_verify($currentPassword, $user['password'])) {
            json_error('invalid_password', 'A jelenlegi jelszó hibás');
        }

        if ($newPassword !== $confirmPassword) {
            json_error('password_mismatch', 'Az új jelszavak nem egyeznek');
        }

        if (strlen($newPassword) < 6) {
            json_error('password_short', 'Az új jelszó legyen legalább 6 karakter');
        }

        $updates[] = 'password = ?';
        $types .= 's';
        $values[] = password_hash($newPassword, PASSWORD_BCRYPT);
    }

    if (isset($_FILES['avatar']) && $_FILES['avatar']['size'] > 0) {
        $file = $_FILES['avatar'];
        $allowed = ['image/jpeg', 'image/png', 'image/gif'];
        $maxSize = 5 * 1024 * 1024;

        if (!in_array($file['type'], $allowed, true)) {
            json_error('invalid_avatar', 'Csak JPG, PNG vagy GIF tölthető fel');
        }

        if ($file['size'] > $maxSize) {
            json_error('avatar_too_large', 'A fájl maximum 5MB lehet');
        }

        $uploadDir = __DIR__ . '/../uploads/avatars/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $fileExt = pathinfo($file['name'], PATHINFO_EXTENSION);
        $avatarFilename = sprintf('avatar_%d_%d.%s', $auth['user_id'], time(), $fileExt);
        $avatarPath = $uploadDir . $avatarFilename;

        if (!move_uploaded_file($file['tmp_name'], $avatarPath)) {
            json_error('avatar_upload_failed', 'Hiba történt a fájl feltöltésekor');
        }

        $updates[] = 'avatar = ?';
        $types .= 's';
        $values[] = 'uploads/avatars/' . $avatarFilename;
    }

    if ($updates === []) {
        json_success(['message' => 'Nincsenek módosítandó adatok']);
    }

    $values[] = $auth['user_id'];
    $types .= 'i';

    $query = 'UPDATE users SET ' . implode(', ', $updates) . ' WHERE id = ?';
    $stmt = $db->prepare($query);
    $stmt->bind_param($types, ...$values);
    $stmt->execute();
    $stmt->close();

    json_success(['message' => 'Profil sikeresen frissítve']);
} catch (Throwable $exception) {
    error_log('Profile update error: ' . $exception->getMessage());
    json_error('server_error', 'Szerverhiba történt', 500);
}
