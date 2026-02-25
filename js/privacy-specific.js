document.getElementById('purgeBtn').addEventListener('click', function () {
            localStorage.clear();
            sessionStorage.clear();

            // Try to play sound if manager is loaded
            try { if (window.audioManager) window.audioManager.playSound('click'); } catch (e) { }

            // Visual feedback
            const btn = this;
            const msg = document.getElementById('statusMsg');

            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> CLEANING...';
            btn.style.opacity = '0.7';

            setTimeout(() => {
                msg.style.display = 'block';
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            }, 800);
        });