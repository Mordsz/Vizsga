<?php
declare(strict_types=1);

mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

require __DIR__ . '/config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../register.html');
    exit;
}

$firstName = trim($_POST['first_name'] ?? '');
$lastName = trim($_POST['last_name'] ?? '');
$username = trim($_POST['username'] ?? '');
$email = trim($_POST['email'] ?? '');
$password = $_POST['password'] ?? '';
$passwordConfirm = $_POST['password_confirm'] ?? '';

if ($firstName === '' || $lastName === '' || $username === '' || $email === '' || $password === '' || $passwordConfirm === '') {
    header('Location: ../register.html?error=missing');
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    header('Location: ../register.html?error=email');
    exit;
}

if ($password !== $passwordConfirm) {
    header('Location: ../register.html?error=password');
    exit;
}

try {
    $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    $db->set_charset('utf8mb4');

    $usernameExists = false;
    $emailExists = false;

    $usernameStmt = $db->prepare('SELECT id FROM users WHERE username = ? LIMIT 1');
    $usernameStmt->bind_param('s', $username);
    $usernameStmt->execute();
    $usernameStmt->store_result();
    if ($usernameStmt->num_rows > 0) {
        $usernameExists = true;
    }
    $usernameStmt->close();

    $emailStmt = $db->prepare('SELECT id FROM users WHERE email = ? LIMIT 1');
    $emailStmt->bind_param('s', $email);
    $emailStmt->execute();
    $emailStmt->store_result();
    if ($emailStmt->num_rows > 0) {
        $emailExists = true;
    }
    $emailStmt->close();

    if ($usernameExists || $emailExists) {
        $db->close();
        $params = ['error' => 'exists'];
        if ($usernameExists) {
            $params['usernameExists'] = '1';
        }
        if ($emailExists) {
            $params['emailExists'] = '1';
        }
        header('Location: ../register.html?' . http_build_query($params));
        exit;
    }

    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    $insertStmt = $db->prepare('INSERT INTO users (first_name, last_name, email, username, password) VALUES (?, ?, ?, ?, ?)');
    $insertStmt->bind_param('sssss', $firstName, $lastName, $email, $username, $hashedPassword);
    $insertStmt->execute();
    $insertStmt->close();

    $db->close();

    header('Location: ../login.html?registered=1');
    exit;
} catch (mysqli_sql_exception $exception) {
    error_log('Registration error: ' . $exception->getMessage());
    header('Location: ../register.html?error=server');
    exit;
}
