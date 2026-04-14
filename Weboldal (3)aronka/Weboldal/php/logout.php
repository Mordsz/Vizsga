<?php
declare(strict_types=1);

session_start();

if (isset($_SESSION['user_id'])) {
	mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);
	require __DIR__ . '/config.php';
	require __DIR__ . '/schema_helpers.php';

	try {
		$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
		$db->set_charset('utf8mb4');
		ensureUsersColumn($db, 'last_active', 'DATETIME NULL DEFAULT NULL');
		ensureUsersColumn($db, 'online_since', 'DATETIME NULL DEFAULT NULL');

		$stmt = $db->prepare('UPDATE users SET last_active = DATE_SUB(NOW(), INTERVAL 15 MINUTE), online_since = NULL WHERE id = ?');
		$stmt->bind_param('i', $_SESSION['user_id']);
		$stmt->execute();
		$stmt->close();
		$db->close();
	} catch (Exception $e) {
		error_log('Logout update error: ' . $e->getMessage());
	}
}

session_destroy();
header('Location: ../index.html');
exit;

