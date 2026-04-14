document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const messageBox = document.getElementById('error-message');
  const passwordField = document.getElementById('passwordField');
  const togglePassword = document.getElementById('togglePassword');

  if (loginForm && messageBox) {
    loginForm.addEventListener('submit', event => handleLogin(event, loginForm, messageBox));
  }

  togglePassword?.addEventListener('click', event => {
    event.preventDefault();
    if (!passwordField) return;
    passwordField.type = passwordField.type === 'password' ? 'text' : 'password';
  });
});

async function handleLogin(event, form, messageBox) {
  event.preventDefault();

  try {
    const response = await fetch('php/login_process.php', {
      method: 'POST',
      body: new FormData(form),
      credentials: 'same-origin',
      headers: { Accept: 'application/json' }
    });

    if (!response.ok) {
      throw new Error('Hálózati hiba történt');
    }

    const data = await response.json();
    if (data.success) {
      window.location.href = 'main.php';
      return;
    }

    showLoginError(messageBox, data.error);
  } catch (error) {
    console.error('Login hiba:', error);
    showLoginError(messageBox, 'network');
  }
}

function showLoginError(box, code) {
  const messages = {
    invalid_credentials: 'Helytelen felhasználónév vagy jelszó.',
    missing_fields: 'Mindkét mező kitöltése kötelező.',
    invalid_method: 'Hiba történt a feldolgozás során.',
    server_error: 'Szerverhiba történt, próbáld újra később.',
    account_disabled: 'A fiók jelenleg le van tiltva.',
    network: 'Váratlan hiba történt, próbáld meg később.'
  };

  box.textContent = messages[code] || 'Ismeretlen hiba történt.';
  box.style.display = 'block';
}