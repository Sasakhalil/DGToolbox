// Init
        window.app = new StudioEngine();

        function nav(view) {
            // UI Switch
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            // Simple match
            const items = document.querySelectorAll('.nav-item');
            if (view === 'merge') items[0].classList.add('active');
            if (view === 'split') items[1].classList.add('active');
            if (view === 'secure') items[2].classList.add('active');
            if (view === 'watermark') items[3].classList.add('active');

            // View Switch
            document.querySelectorAll('.view-panel').forEach(el => el.classList.remove('active'));
            document.getElementById('view-' + view).classList.add('active');

            // Context Info Panel visibility logic (Show only for active view)
            // Actually, the structure assumes panels are inside view-panel or handled by it. 
            // Since we moved content panels INSIDE the view-panel divs in the HTML refactor, 
            // they will automatically show/hide with the parent view-panel. 
            // So no extra JS needed here for info panels if they are children of #view-X.

            // Header Title Update
            const titles = {
                'merge': 'Merger <span>Combine multiple files</span>',
                'split': 'Splitter <span>Extract specific pages</span>',
                'secure': 'Security <span>Encrypt & Decrypt</span>',
                'watermark': 'Watermark <span>Add text overlay</span>'
            };
            document.getElementById('page-header').innerHTML = titles[view];
        }