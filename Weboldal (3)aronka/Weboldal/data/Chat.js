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

const uniqueBy = (items, key) => {
    const seen = new Set();
    return items.filter(item => {
        const identifier = key(item);
        if (seen.has(identifier)) {
            return false;
        }
        seen.add(identifier);
        return true;
    });
};

const escapeHtml = text => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
};

const escapeAttr = text => String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const formatTime = dateString => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
};

const ChatModule = (() => {
    const LIST_REFRESH_MS = 15000;
    const MESSAGE_REFRESH_MS = 3000;

    const state = {
        friends: [],
        requests: [],
        currentFriend: null,
        unread: new Map(),
        listInterval: null,
        messageInterval: null
    };

    const dom = {};

    function init() {
        cacheDom();
        bindUI();
        refreshFriends();
        refreshRequests();
        scheduleListRefresh();
    }

    function cacheDom() {
        dom.chatPanel = document.getElementById('chatPanel');
        dom.addFriendBtn = document.getElementById('addFriendBtn');
        dom.addFriendModal = document.getElementById('addFriendModal');
        dom.addFriendForm = document.getElementById('addFriendForm');
        dom.chatIcon = document.getElementById('chatIcon');
        dom.closeChatBtn = document.getElementById('closeChatBtn');
        dom.friendsList = document.getElementById('friendsList');
        dom.requestsList = document.getElementById('friendRequestsList');
        dom.messagesContainer = document.getElementById('messagesContainer');
        dom.messageInput = document.getElementById('messageInput');
        dom.sendMessageBtn = document.getElementById('sendMessageBtn');
        dom.chatHeader = document.getElementById('chatHeader');
        dom.requestsBadge = document.getElementById('requestsNotificationBadge');
        dom.tabButtons = document.querySelectorAll('.chat-tab-btn');
    }

    function bindUI() {
        dom.chatIcon?.addEventListener('click', toggleChatPanel);
        dom.closeChatBtn?.addEventListener('click', toggleChatPanel);
        dom.addFriendBtn?.addEventListener('click', showAddFriendModal);

        dom.addFriendModal?.addEventListener('click', event => {
            if (event.target === dom.addFriendModal) {
                dom.addFriendModal.classList.remove('active');
            }
        });

        dom.addFriendForm?.addEventListener('submit', handleAddFriend);
        dom.sendMessageBtn?.addEventListener('click', sendMessage);
        dom.messageInput?.addEventListener('keypress', event => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });

        dom.tabButtons?.forEach(button => {
            button.addEventListener('click', event => {
                const tabName = event.currentTarget.getAttribute('data-tab');
                switchTab(tabName);
            });
        });

        dom.friendsList?.addEventListener('click', handleFriendsListClick);
        dom.requestsList?.addEventListener('click', handleRequestsListClick);
    }

    function refreshFriends() {
        postJson('php/get_friends.php')
            .then(data => {
                if (!data?.success) return;
                state.friends = data.friends ?? [];
                renderFriends();
            })
            .catch(console.error);
    }

    function refreshRequests() {
        postJson('php/get_friend_requests.php')
            .then(data => {
                if (!data?.success) return;
                state.requests = data.requests ?? [];
                renderRequests();
                updatePendingBadge();
            })
            .catch(console.error);
    }

    function scheduleListRefresh() {
        clearInterval(state.listInterval);
        state.listInterval = setInterval(() => {
            refreshFriends();
            refreshRequests();
            checkUnreadMessages();
        }, LIST_REFRESH_MS);
    }

    function checkUnreadMessages() {
        if (!state.friends.length) return;

        state.friends.forEach(friend => {
            if (state.currentFriend?.id === friend.id) return;

            postJson('php/get_messages.php', { friend_id: friend.id, limit: 1 })
                .then(data => {
                    const lastMessage = data?.messages?.[0];
                    if (data?.success && lastMessage && !lastMessage.is_own) {
                        state.unread.set(friend.id, 1);
                        updateUnreadBadges();
                    }
                })
                .catch(() => {});
        });
    }

    function renderFriends() {
        if (!dom.friendsList) return;
        const friends = uniqueBy(state.friends, friend => friend.id);

        if (!friends.length) {
            dom.friendsList.innerHTML = '<div class="no-friends">Nincsenek barátaid még</div>';
            return;
        }

        dom.friendsList.innerHTML = friends
            .map(friend => {
                const avatarStyle = friend.avatar ? `background-image: url(${friend.avatar})` : '';
                const initials = friend.avatar ? '' : friend.username.charAt(0).toUpperCase();
                const unread = state.unread.get(friend.id);

                return `
                    <div class="friend-item" data-friend-id="${friend.id}">
                        <div class="friend-avatar" style="${avatarStyle}">${initials}</div>
                        <div class="friend-info">
                            <div class="friend-name">${escapeHtml(friend.username)}</div>
                        </div>
                        ${unread ? `<div class="unread-indicator" title="${unread} új üzenet">🔴</div>` : ''}
                        <div class="friend-actions">
                            <button class="friend-delete-btn" data-action="delete" data-id="${friend.id}">✕</button>
                            <button class="friend-chat-btn" data-action="open-chat" data-id="${friend.id}" data-name="${escapeAttr(friend.username)}">💬</button>
                        </div>
                    </div>`;
            })
            .join('');
    }

    function renderRequests() {
        if (!dom.requestsList) return;
        const requests = uniqueBy(state.requests, req => req.request_id);

        if (!requests.length) {
            dom.requestsList.innerHTML = '<div class="no-requests">Nincsenek függőben lévő kérések</div>';
            return;
        }

        dom.requestsList.innerHTML = requests
            .map(request => {
                const avatarStyle = request.avatar ? `background-image: url(${request.avatar})` : '';
                const initials = request.avatar ? '' : request.username.charAt(0).toUpperCase();
                return `
                    <div class="request-item" data-request-id="${request.request_id}">
                        <div class="request-avatar" style="${avatarStyle}">${initials}</div>
                        <div class="request-info">
                            <div class="request-name">${escapeHtml(request.username)}</div>
                            <div class="request-text">Barátkérelem</div>
                        </div>
                        <div class="request-actions">
                            <button class="accept-btn" data-action="accept" data-id="${request.request_id}">✓</button>
                            <button class="reject-btn" data-action="reject" data-id="${request.request_id}">✕</button>
                        </div>
                    </div>`;
            })
            .join('');
    }

    function updatePendingBadge() {
        if (!dom.requestsBadge) return;
        if (state.requests.length) {
            dom.requestsBadge.style.display = 'inline-block';
            dom.requestsBadge.textContent = state.requests.length.toString();
        } else {
            dom.requestsBadge.style.display = 'none';
        }
    }

    function toggleChatPanel() {
        dom.chatPanel?.classList.toggle('active');
    }

    function showAddFriendModal() {
        dom.addFriendModal?.classList.add('active');
        const input = document.getElementById('usernameInput');
        input?.focus();
    }

    function handleAddFriend(event) {
        event.preventDefault();
        const form = event.currentTarget;
        const username = form.username?.value?.trim();

        if (!username) {
            alert('Kérjük add meg egy felhasználó felhasználónevét');
            return;
        }

        postJson('php/send_friend_request.php', new FormData(form))
            .then(data => {
                if (data?.success) {
                    alert(data?.message || 'Barátkérelem elküldve!');
                    form.reset();
                    dom.addFriendModal?.classList.remove('active');
                    refreshRequests();
                } else {
                    alert('Hiba: ' + (data?.message ?? data?.error ?? 'ismeretlen hiba'));
                }
            })
            .catch(err => {
                const message = err?.message || err?.error || 'Hiba történt!';
                alert('Hiba: ' + message);
            });
    }

    function switchTab(tabName) {
        document.querySelectorAll('.chat-tab').forEach(tab => {
            tab.classList.toggle('active', tab.id === `${tabName}Tab`);
        });

        dom.tabButtons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-tab') === tabName);
        });
    }

    function startMessageRefresh() {
        clearInterval(state.messageInterval);
        loadMessages();
        state.messageInterval = setInterval(() => {
            if (state.currentFriend) {
                loadMessages();
            }
        }, MESSAGE_REFRESH_MS);
    }

    function loadMessages() {
        if (!state.currentFriend) return;

        postJson('php/get_messages.php', { friend_id: state.currentFriend.id, limit: 100 })
            .then(data => {
                if (!data?.success) return;
                renderMessages(data.messages ?? []);
            })
            .catch(console.error);
    }

    function renderMessages(messages) {
        if (!dom.messagesContainer) return;
        const uniqueMessages = uniqueBy(messages, message => `${message.id}-${message.created_at}`);

        dom.messagesContainer.innerHTML = uniqueMessages
            .map(msg => `
                <div class="message ${msg.is_own ? 'own-message' : 'friend-message'}">
                    <div class="message-content">${escapeHtml(msg.message)}</div>
                    <div class="message-time">${formatTime(msg.created_at)}</div>
                </div>`)
            .join('');

        dom.messagesContainer.scrollTop = dom.messagesContainer.scrollHeight;
    }

    function sendMessage() {
        if (!state.currentFriend || !dom.messageInput) {
            alert('Válassz egy barátot!');
            return;
        }

        const message = dom.messageInput.value.trim();
        if (!message) return;

        postJson('php/send_message.php', { receiver_id: state.currentFriend.id, message })
            .then(data => {
                if (!data?.success) {
                    alert('Hiba: ' + (data?.error ?? 'ismeretlen hiba'));
                    return;
                }
                dom.messageInput.value = '';
                loadMessages();
            })
            .catch(() => alert('Hiba történt az üzenet küldésekor!'));
    }

    function handleFriendsListClick(event) {
        const button = event.target.closest('button');
        if (!button) return;
        const friendId = Number(button.dataset.id);
        if (!friendId) return;

        if (button.dataset.action === 'delete') {
            deleteFriend(friendId);
        } else if (button.dataset.action === 'open-chat') {
            openChat(friendId, button.dataset.name ?? '');
        }
    }

    function handleRequestsListClick(event) {
        const button = event.target.closest('button');
        if (!button) return;
        const requestId = Number(button.dataset.id);
        if (!requestId) return;

        if (button.dataset.action === 'accept') {
            acceptRequest(requestId);
        } else if (button.dataset.action === 'reject') {
            rejectRequest(requestId);
        }
    }

    function deleteFriend(friendId) {
        if (!window.confirm('Biztosan eltávolítod ezt a barátot?')) return;

        postJson('php/delete_friend.php', { friend_id: friendId })
            .then(data => {
                if (!data?.success) {
                    alert('Hiba: ' + (data?.error ?? 'ismeretlen hiba'));
                    return;
                }
                if (state.currentFriend?.id === friendId) {
                    state.currentFriend = null;
                }
                refreshFriends();
            })
            .catch(() => alert('Hiba történt a törlés során.'));
    }

    function acceptRequest(requestId) {
        postJson('php/accept_friend_request.php', { request_id: requestId })
            .then(data => {
                if (!data?.success) {
                    alert('Hiba: ' + (data?.error ?? 'ismeretlen hiba'));
                    return;
                }
                refreshRequests();
                refreshFriends();
            })
            .catch(() => alert('Hiba történt a kérés elfogadásakor.'));
    }

    function rejectRequest(requestId) {
        postJson('php/reject_friend_request.php', { request_id: requestId })
            .then(data => {
                if (!data?.success) {
                    alert('Hiba: ' + (data?.error ?? 'ismeretlen hiba'));
                    return;
                }
                refreshRequests();
            })
            .catch(() => alert('Hiba történt a kérés elutasításakor.'));
    }

    function updateUnreadBadges() {
        const chatTabBtn = document.querySelector('[data-tab="chat"]');
        if (!chatTabBtn) return;
        const totalUnread = Array.from(state.unread.values()).reduce((sum, value) => sum + value, 0);
        let badge = chatTabBtn.querySelector('.unread-badge');

        if (totalUnread > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.className = 'unread-badge';
                chatTabBtn.appendChild(badge);
            }
            badge.textContent = totalUnread.toString();
        } else if (badge) {
            badge.remove();
        }

        renderFriends();
    }

    function openChat(friendId, friendName) {
        state.currentFriend = { id: friendId, name: friendName };
        state.unread.delete(friendId);
        updateUnreadBadges();

        if (dom.chatPanel && !dom.chatPanel.classList.contains('active')) {
            dom.chatPanel.classList.add('active');
        }

        switchTab('chat');
        dom.chatHeader && (dom.chatHeader.textContent = `Csevegés: ${friendName}`);
        startMessageRefresh();
    }

    function cleanup() {
        clearInterval(state.listInterval);
        clearInterval(state.messageInterval);
    }

    return {
        init,
        openChat,
        deleteFriend,
        acceptRequest,
        rejectRequest,
        cleanup
    };
})();

let chatSystem;
document.addEventListener('DOMContentLoaded', () => {
    chatSystem = ChatModule;
    chatSystem.init();
});

window.addEventListener('beforeunload', () => {
    chatSystem?.cleanup();
});
