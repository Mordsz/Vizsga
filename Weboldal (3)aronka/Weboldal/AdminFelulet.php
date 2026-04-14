<?php
session_start();

if (empty($_SESSION['user_id'])) {
    header('Location: login.html');
    exit;
}

if (empty($_SESSION['is_admin'])) {
    http_response_code(403);
    echo 'Hozzáférés megtagadva.';
    exit;
}
?>

<!DOCTYPE html>
<html lang="hu">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Adminfelület</title>
  <link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/style.css">
  <link rel="stylesheet" href="assets/admin.css">
</head>
<body>
  <div class="nav">
    <div class="nav-user">
      <div class="profile-pic" id="profilePic" style="cursor: default; background-size: cover; background-position: center;"></div>
      <div class="username"><?= htmlspecialchars((string)($_SESSION['user'] ?? '')) ?></div>

      <div class="profile-buttons">
        <a class="profile-menu-btn admin-link" href="main.php">Főoldal</a>
        <form action="php/logout.php" method="POST" style="margin: 0;">
          <button type="submit" class="profile-menu-btn">Kijelentkezés</button>
        </form>
      </div>
    </div>
  </div>

  <main class="main-content">
    <h2>Adminfelület</h2>

    <section class="box admin-box">
      <div id="adminMessage" class="message" style="display: none;"></div>

      <div class="admin-table-wrapper">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Felhasználó</th>
              <th>Név</th>
              <th>Email</th>
              <th>Státusz</th>
              <th>Online mióta</th>
              <th>Utolsó aktivitás</th>
              <th>Új jelszó</th>
              <th>Művelet</th>
            </tr>
          </thead>
          <tbody id="usersTbody">
            <tr>
              <td class="loading-row" colspan="8">Betöltés...</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>

  <script src="data/Admin.js"></script>
</body>
</html>
