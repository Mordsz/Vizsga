const formDataFrom = data => {
    if (data instanceof FormData) {
        return data;
    }
    const form = new FormData();
    Object.entries(data || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            form.append(key, value);
        }
    });
    return form;
};

const postJson = async (url, payload) => {
    const response = await fetch(url, { method: 'POST', body: formDataFrom(payload) });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw data || new Error('Hálózati hiba');
    }
    return data;
};

const escapeHtml = text => {
    const div = document.createElement('div');
    div.textContent = text ?? '';
    return div.innerHTML;
};

const escapeAttr = text => String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const parseMysqlDateTime = value => {
    if (!value) return null;
    const [datePart, timePart] = String(value).split(' ');
    if (!datePart || !timePart) return null;

    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute, second] = timePart.split(':').map(Number);

    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, hour || 0, minute || 0, second || 0);
};

const formatDateTime = value => {
    const date = parseMysqlDateTime(value);
    if (!date) return '-';
    return date.toLocaleString('hu-HU', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const setAvatarBackground = (target, url) => {
    if (!target || !url) return;
    target.style.setProperty('background-image', `url(${url})`, 'important');
    target.style.setProperty('background-size', 'cover', 'important');
    target.style.setProperty('background-position', 'center', 'important');
};

const setDefaultAvatar = target => {
    if (!target) return;
    target.style.background = 'linear-gradient(135deg, #ceaf01, #ceaf01)';
};

const initProfileAvatar = () => {
    const profilePic = document.getElementById('profilePic');
    if (!profilePic) return;

    fetch('php/get_profile.php', { credentials: 'same-origin' })
        .then(res => res.json())
        .then(data => {
            const avatar = data?.user?.avatar;
            if (data?.success && avatar) {
                setAvatarBackground(profilePic, avatar);
            } else {
                setDefaultAvatar(profilePic);
            }
        })
        .catch(() => setDefaultAvatar(profilePic));
};

document.addEventListener('DOMContentLoaded', () => {
    initProfileAvatar();

    const tbody = document.getElementById('usersTbody');
    const message = document.getElementById('adminMessage');

    const showMessage = (text, kind = 'info') => {
        if (!message) return;
        message.textContent = text;
        message.style.display = 'block';
        message.dataset.kind = kind;

        message.classList.remove('success', 'error');
        if (kind === 'success') {
            message.classList.add('success');
        }
        if (kind === 'error') {
            message.classList.add('error');
        }
    };

    const clearMessage = () => {
        if (!message) return;
        message.style.display = 'none';
        message.textContent = '';
        delete message.dataset.kind;
        message.classList.remove('success', 'error');
    };

    const render = users => {
        if (!tbody) return;

        if (!Array.isArray(users) || users.length === 0) {
            tbody.innerHTML = '<tr><td class="no-results" colspan="8">Nincs megjeleníthető felhasználó</td></tr>';
            return;
        }

        tbody.innerHTML = users
            .map(user => {
                const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim() || '-';
                const status = user.account_status === 'disabled'
                    ? { cls: 'disabled', label: 'Letiltva' }
                    : user.is_online
                        ? { cls: 'online', label: 'Fent' }
                        : { cls: 'offline', label: 'Offline' };

                const toggleStatusLabel = user.account_status === 'disabled'
                    ? 'Tiltás feloldása'
                    : 'Letiltás';

                const toggleStatusClass = user.account_status === 'disabled'
                    ? 'ghost-btn'
                    : 'ghost-btn danger';

                const onlineSince = user.is_online ? formatDateTime(user.online_since) : '-';
                const lastActive = formatDateTime(user.last_active);

                // Avatar megjelenítés
                let avatarHtml = '';
                if (user.avatar) {
                    avatarHtml = `<div class="admin-avatar" style="background-image:url('${escapeAttr(user.avatar)}');"></div>`;
                } else {
                    // Alapértelmezett: színes blokk első betűvel
                    const initial = user.username ? escapeHtml(user.username.charAt(0).toUpperCase()) : '?';
                    avatarHtml = `<div class="admin-avatar admin-avatar-default">${initial}</div>`;
                }

                return `
                    <tr data-user-id="${escapeAttr(user.id)}" data-account-status="${escapeAttr(user.account_status)}">
                        <td>
                            <div class="user-col">
                                ${avatarHtml}
                                <strong>${escapeHtml(user.username)}</strong>
                                <span class="user-id">#${escapeHtml(user.id)}</span>
                            </div>
                        </td>
                        <td>${escapeHtml(name)}</td>
                        <td>
                            <input
                                class="table-input email-input"
                                type="email"
                                value="${escapeAttr(user.email)}"
                                data-original="${escapeAttr(user.email)}"
                                autocomplete="off">
                        </td>
                        <td><span class="status-pill ${status.cls}">${status.label}</span></td>
                        <td>${escapeHtml(onlineSince)}</td>
                        <td>${escapeHtml(lastActive)}</td>
                        <td>
                            <input
                                class="table-input password-input"
                                type="password"
                                placeholder="Új jelszó"
                                autocomplete="new-password">
                        </td>
                        <td>
                            <div class="actions">
                                <button class="ghost-btn primary" data-action="save">Mentés</button>
                                <button class="${toggleStatusClass}" data-action="toggle-status">${toggleStatusLabel}</button>
                            </div>
                        </td>
                    </tr>
                `;
            })
            .join('');
    };

    const loadUsers = async () => {
        clearMessage();
        if (tbody) {
            tbody.innerHTML = '<tr><td class="loading-row" colspan="8">Betöltés...</td></tr>';
        }

        try {
            const data = await postJson('php/admin_get_users.php');
            if (!data?.success) {
                showMessage(data?.message || 'Nem sikerült betölteni a felhasználókat', 'error');
                return;
            }
            render(data.users || []);
        } catch (error) {
            console.error(error);
            showMessage('Hálózati hiba történt a betöltés során', 'error');
        }
    };

    tbody?.addEventListener('click', async event => {
        const button = event.target?.closest('button[data-action]');
        if (!button) return;

        const action = button.getAttribute('data-action');
        const row = button.closest('tr[data-user-id]');
        const userId = row?.getAttribute('data-user-id');
        if (!row || !userId || !action) return;

        if (action === 'toggle-status') {
            const currentStatus = row.getAttribute('data-account-status') || 'active';
            const nextStatus = currentStatus === 'disabled' ? 'active' : 'disabled';

            button.disabled = true;
            try {
                const data = await postJson('php/admin_update_user.php', {
                    user_id: userId,
                    account_status: nextStatus
                });

                if (!data?.success) {
                    showMessage(data?.message || 'Művelet sikertelen', 'error');
                    return;
                }

                showMessage(data.message || 'Sikeres mentés', 'success');
                await loadUsers();
            } catch (error) {
                console.error(error);
                const errorText = error?.message || 'Hálózati hiba történt mentés közben';
                showMessage(errorText, 'error');
            } finally {
                button.disabled = false;
            }

            return;
        }

        if (action !== 'save') return;

        const emailInput = row.querySelector('.email-input');
        const passwordInput = row.querySelector('.password-input');

        const nextEmail = emailInput?.value?.trim();
        const originalEmail = emailInput?.getAttribute('data-original') ?? '';
        const newPassword = passwordInput?.value ?? '';

        const payload = { user_id: userId };
        if (typeof nextEmail === 'string' && nextEmail !== originalEmail) {
            payload.email = nextEmail;
        }
        if (newPassword.trim() !== '') {
            payload.new_password = newPassword;
        }

        if (!payload.email && !payload.new_password) {
            showMessage('Nincs mentendő változás');
            return;
        }

        button.disabled = true;
        try {
            const data = await postJson('php/admin_update_user.php', payload);
            if (!data?.success) {
                showMessage(data?.message || 'Mentés sikertelen', 'error');
                return;
            }

            if (payload.email && emailInput) {
                emailInput.setAttribute('data-original', payload.email);
            }
            if (passwordInput) {
                passwordInput.value = '';
            }

            showMessage(data.message || 'Sikeres mentés', 'success');
            await loadUsers();
        } catch (error) {
            console.error(error);
            const errorText = error?.message || 'Hálózati hiba történt mentés közben';
            showMessage(errorText, 'error');
        } finally {
            button.disabled = false;
        }
    });

    loadUsers();
});
