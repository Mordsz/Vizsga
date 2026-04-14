document.addEventListener('DOMContentLoaded', () => {
  showRegisterErrors();
  bindPasswordToggle('togglePassword1', 'passwordField');
  bindPasswordToggle('togglePassword2', 'passwordConfirmField');
});

function showRegisterErrors() {
  const params = new URLSearchParams(window.location.search);
  const messageBox = document.getElementById('error-message');
  if (!messageBox || !params.has('error')) return;

  const duplicates = [];
  if (params.has('usernameExists')) duplicates.push('Létező felhasználó név');
  if (params.has('emailExists')) duplicates.push('Létező email');

  if (duplicates.length) {
    messageBox.innerHTML = duplicates.join('<br><br>');
    messageBox.style.display = 'block';
    return;
  }

  const messages = {
    missing: 'Minden mezőt tölts ki.',
    email: 'Érvényes email címet adj meg.',
    password: 'A két jelszó nem egyezik.',
    server: 'Váratlan hiba történt, próbáld meg később.',
    exists: 'Már létezik ilyen felhasználó.'
  };

  const errorKey = params.get('error');
  messageBox.textContent = messages[errorKey] || 'Ismeretlen hiba történt.';
  messageBox.style.display = 'block';
}

function bindPasswordToggle(buttonId, inputId) {
  const button = document.getElementById(buttonId);
  const input = document.getElementById(inputId);
  if (!button || !input) return;

  button.addEventListener('click', event => {
    event.preventDefault();
    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';
    button.textContent = isPassword ? '👁️' : '👁️‍🗨️';
  });
}
