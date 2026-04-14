const onReady = callback => {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', callback, { once: true });
    } else {
        callback();
    }
};

const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

onReady(() => {
    initDownloadButton();
    initProfileAvatar();
    initProfileMenu();
    initProfileModal();
    initGallery();
    initActivityPing();
});

function initDownloadButton() {
    const button = qs('#DownloadBTN');
    const progressBar = button?.querySelector('.progress-bar');
    const link = button?.querySelector('a');

    if (!button || !progressBar || !link) {
        return;
    }

    button.addEventListener('click', event => {
        if (button.classList.contains('downloading')) {
            event.preventDefault();
            return;
        }

        button.classList.add('downloading');
        animateProgressBar(progressBar, () => {
            button.classList.remove('downloading');
            progressBar.style.width = '0%';
        });

        setTimeout(() => link.click(), 300);
    });
}

function animateProgressBar(bar, onComplete) {
    let progress = 0;
    const interval = setInterval(() => {
        progress = Math.min(progress + Math.random() * 30, 100);
        bar.style.width = progress + '%';

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(onComplete, 1000);
        }
    }, 200);
}

function initProfileAvatar() {
    const profilePic = qs('#profilePic');
    if (!profilePic) return;

    fetch('php/get_profile.php')
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
}

function setAvatarBackground(target, url) {
    target.style.setProperty('background-image', `url(${url})`, 'important');
    target.style.setProperty('background-size', 'cover', 'important');
    target.style.setProperty('background-position', 'center', 'important');
}

function setDefaultAvatar(target) {
    target.style.background = 'linear-gradient(135deg, #ceaf01, #ceaf01)';
}

function initProfileMenu() {
    const toggle = qs('#profileMenuBtn');
    const dropdown = qs('#profileDropdown');

    if (!toggle || !dropdown) return;

    toggle.addEventListener('click', event => {
        event.stopPropagation();
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', event => {
        if (!toggle.contains(event.target) && !dropdown.contains(event.target)) {
            dropdown.classList.remove('active');
        }
    });

    qsa('a', dropdown).forEach(link =>
        link.addEventListener('click', () => dropdown.classList.remove('active'))
    );
}

function initProfileModal() {
    const modal = qs('#profileModal');
    const profilePic = qs('#profilePic');
    const closeBtn = qs('#closeProfileModal');
    const form = qs('#profileEditForm');
    const avatarInput = qs('#avatarInput');
    const avatarPreview = qs('#avatarPreview');
    const messageBox = qs('#profileMessage');

    if (!modal || !profilePic || !form || !avatarInput || !avatarPreview || !messageBox) {
        return;
    }

    profilePic.addEventListener('click', () => openModal(modal, () => loadProfileData(avatarPreview, avatarInput, messageBox)));
    closeBtn?.addEventListener('click', () => closeModal(modal));

    modal.addEventListener('click', event => {
        if (event.target === modal) closeModal(modal);
    });

    avatarInput.addEventListener('change', event => previewAvatar(event.target, avatarPreview));
    avatarPreview.addEventListener('click', () => avatarInput.click());

    ['email', 'current', 'new', 'confirm'].forEach(type =>
        bindPasswordToggle(`toggle${capitalize(type)}Password`, `${type}Password`)
    );

    form.addEventListener('submit', event => {
        event.preventDefault();
        submitProfileForm(new FormData(form), messageBox);
    });
}

function openModal(modal, onOpen) {
    modal.classList.add('active');
    onOpen?.();
}

function closeModal(modal) {
    modal.classList.remove('active');
}

function previewAvatar(input, preview) {
    const [file] = input.files;
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event =>
        preview.style.setProperty('background-image', `url(${event.target.result})`, 'important');
    reader.readAsDataURL(file);
}

function bindPasswordToggle(buttonId, inputId) {
    const button = qs(`#${buttonId}`);
    const input = qs(`#${inputId}`);
    if (!button || !input) return;

    button.addEventListener('click', event => {
        event.preventDefault();
        const isPassword = input.type === 'password';
        input.type = isPassword ? 'text' : 'password';
        button.textContent = isPassword ? '👁️' : '👁️‍🗨️';
    });
}

function submitProfileForm(formData, messageBox) {
    fetch('php/update_profile.php', { method: 'POST', body: formData })
        .then(res => res.json())
        .then(data => {
            if (data?.success) {
                showProfileMessage(messageBox, 'Profil sikeresen frissítve!', 'success');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showProfileMessage(messageBox, data?.error ?? 'Hiba történt a profil frissítésekor!', 'error');
            }
        })
        .catch(() => showProfileMessage(messageBox, 'Hálózati hiba történt!', 'error'));
}

function loadProfileData(preview, input, messageBox) {
    fetch('php/get_profile.php')
        .then(res => res.json())
        .then(data => {
            if (!data?.success || !data.user) {
                throw new Error(data?.error ?? 'Hiba az adatok betöltésekor!');
            }

            const user = data.user;
            assignValue('#firstName', user.first_name);
            assignValue('#lastName', user.last_name);
            assignValue('#email', user.email);
            assignValue('#profileBio', user.bio);

            if (user.avatar) {
                setAvatarBackground(preview, user.avatar);
            }

            input.value = '';
        })
        .catch(error => showProfileMessage(messageBox, error.message, 'error'));
}

function assignValue(selector, value) {
    const element = qs(selector);
    if (element) {
        element.value = value || '';
    }
}

function showProfileMessage(box, text, type) {
    box.textContent = text;
    box.className = `message ${type}`;
    box.style.display = 'block';

    if (type === 'error') {
        setTimeout(() => {
            box.style.display = 'none';
        }, 5000);
    }
}

function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

function initGallery() {
    const mainImage = qs('#mainGalleryImage');
    const thumbnails = qsa('#galleryThumbnails .thumbnail');
    const prevBtn = qs('#prevGalleryBtn');
    const nextBtn = qs('#nextGalleryBtn');
    const currentIndexLabel = qs('#currentImageIndex');
    const totalImagesLabel = qs('#totalImages');

    if (!mainImage || thumbnails.length === 0 || !currentIndexLabel || !totalImagesLabel) {
        return;
    }

    let index = 0;
    let autoplayHandle;

    totalImagesLabel.textContent = thumbnails.length.toString();

    const update = () => {
        const thumbnail = thumbnails[index]?.querySelector('img');
        if (!thumbnail) return;

        mainImage.src = thumbnail.src;
        currentIndexLabel.textContent = (index + 1).toString();

        thumbnails.forEach((node, idx) => {
            node.classList.toggle('active', idx === index);
        });
    };

    const next = step => {
        index = (index + step + thumbnails.length) % thumbnails.length;
        update();
        restartAutoplay();
    };

    thumbnails.forEach((thumb, idx) => thumb.addEventListener('click', () => {
        index = idx;
        update();
        restartAutoplay();
    }));

    prevBtn?.addEventListener('click', () => next(-1));
    nextBtn?.addEventListener('click', () => next(1));

    document.addEventListener('keydown', event => {
        if (event.key === 'ArrowLeft') next(-1);
        if (event.key === 'ArrowRight') next(1);
    });

    const startAutoplay = () => {
        autoplayHandle = setInterval(() => next(1), 3000);
    };

    const restartAutoplay = () => {
        if (autoplayHandle) clearInterval(autoplayHandle);
        startAutoplay();
    };

    update();
    startAutoplay();
}

function initActivityPing() {
    const endpoint = 'php/update_activity.php';
    const ping = () => {
        fetch(endpoint, { method: 'POST', credentials: 'same-origin' }).catch(() => {});
    };

    ping();
    setInterval(ping, 60000);
}

