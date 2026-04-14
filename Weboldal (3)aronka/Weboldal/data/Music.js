document.addEventListener('DOMContentLoaded', () => {
    const controls = getMusicControls();
    if (!controls) return;

    const { audio, toggle, volumeSlider } = controls;
    let isMuted = true;

    const updateButton = () => {
        const muted = isMuted || audio.paused;
        toggle.classList.toggle('muted', muted);
        toggle.textContent = muted ? '🔇' : '🔊';
        toggle.title = muted ? 'Zene bekapcsolása' : 'Zene kikapcsolása';
    };

    const updateVolumeDisplay = () => {
        controls.volumeDisplay && (controls.volumeDisplay.textContent = `${volumeSlider.value}%`);
    };

    volumeSlider.addEventListener('input', () => {
        audio.volume = volumeSlider.value / 100;
        updateVolumeDisplay();
        if (audio.volume > 0 && !isMuted && audio.paused) {
            const promise = audio.play();
            promise?.catch(console.error);
        }
    });

    toggle.addEventListener('click', () => {
        if (isMuted || audio.paused) {
            audio.volume = volumeSlider.value / 100;
            const promise = audio.play();
            if (promise?.then) {
                promise
                    .then(() => {
                        isMuted = false;
                        updateButton();
                    })
                    .catch(error => {
                        console.error('Audio playback failed:', error);
                        isMuted = true;
                        updateButton();
                    });
            } else {
                isMuted = false;
                updateButton();
            }
        } else {
            audio.pause();
            isMuted = true;
            updateButton();
        }
    });

    audio.addEventListener('ended', () => {
        if (!isMuted) {
            audio.currentTime = 0;
            const promise = audio.play();
            promise?.catch(console.error);
        }
    });

    updateButton();
    updateVolumeDisplay();
});

function getMusicControls() {
    const audio = document.getElementById('backgroundMusic');
    const toggle = document.getElementById('musicToggleBtn');
    const volumeSlider = document.getElementById('volumeSlider');
    if (!audio || !toggle || !volumeSlider) {
        return null;
    }
    return {
        audio,
        toggle,
        volumeSlider,
        volumeDisplay: document.getElementById('volumeDisplay')
    };
}
