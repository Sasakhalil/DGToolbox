/**
 * Emoji Studio Engine v2.1 (Performance & Stability)
 * Updates:
 * - "Eager Background Loading": Loads categories in background to prevent fast-scroll lag.
 * - Optimized DOM Injection: Uses larger chunks and requestAnimationFrame.
 * - Hardware Acceleration logic via CSS.
 */

class EmojiStudio {
    constructor() {
        this.config = {
            lazyLoadRootMargin: '800px', // Pre-load far ahead
            searchDebounceMs: 250,
            maxSearchResults: 200 // Reduced slightly for instant feel
        };

        this.state = {
            recent: [],
            isSearching: false,
            activeCategory: 'recent',
            loadedCategories: new Set(),
            searchIndex: [] // Pre-computed search index
        };

        this.dom = {
            searchInput: document.getElementById('searchInput'),
            navList: document.getElementById('navList'),
            scrollArea: document.getElementById('scrollArea'),
            emojiContainer: document.getElementById('emojiContainer'),
            recentSection: document.getElementById('section-recent'),
            recentGrid: document.getElementById('recentGrid'),
            emptyState: document.getElementById('emptyState'),
            clearRecentBtn: document.getElementById('clearRecentBtn')
        };

        this.init();
    }

    init() {
        console.log('Emoji Studio v2.1: Booting...');

        // 1. Load Data
        this.loadRecentData();

        // 2. Initial Render
        this.renderSidebar();
        this.prepareLayoutSkeleton();

        // 3. Pre-compute Search Index (Idle Time)
        this.runIdleTask(() => this.buildSearchIndex());

        // 4. Eager Load Strategy
        // Load first screen immediately
        this.loadCategory('smileys');
        this.loadCategory('recent'); // Just UI update

        // Load rest in background sequence
        this.scheduleBackgroundLoading();

        // 5. Events
        this.setupEvents();
        this.setupScrollSpy();
    }

    /* -------------------------------------------------------------------------- */
    /*                               CORE LOADING                                 */
    /* -------------------------------------------------------------------------- */

    prepareLayoutSkeleton() {
        const fragment = document.createDocumentFragment();

        // Create skeletons for all categories
        Object.keys(EMOJI_DATA).forEach(key => {
            const section = document.createElement('div');
            section.id = `section-${key}`;
            section.className = 'category-section'; // removed 'lazy-section' as we handle it manually now
            section.dataset.category = key;
            section.dataset.status = 'pending';

            const header = document.createElement('div');
            header.className = 'section-header';
            header.innerHTML = `<i class="fas fa-layer-group"></i> ${this.formatName(key)}`;
            section.appendChild(header);

            const grid = document.createElement('div');
            grid.className = 'emoji-grid'; // Use grid class immediately
            // But leave it empty
            section.appendChild(grid);

            fragment.appendChild(section);
        });

        this.dom.emojiContainer.appendChild(fragment);
    }

    scheduleBackgroundLoading() {
        // Queue of categories to load
        const categories = Object.keys(EMOJI_DATA).filter(k => k !== 'smileys'); // smileys loaded first

        const loadNext = () => {
            if (categories.length === 0) return;
            const nextCat = categories.shift();

            this.runIdleTask(() => {
                this.loadCategory(nextCat);
                loadNext(); // Chain next
            });
        };

        // Start chain
        loadNext();
    }

    loadCategory(category) {
        if (this.state.loadedCategories.has(category)) return;

        const section = document.getElementById(`section-${category}`);
        if (!section) return;

        const grid = section.querySelector('.emoji-grid');
        const rawData = EMOJI_DATA[category];

        if (!rawData) return;

        // Create buttons
        const fragment = document.createDocumentFragment();
        // Limit to 1000 per chunk just in case, but data is usually smaller
        rawData.forEach(emoji => {
            fragment.appendChild(this.createEmojiButton(emoji));
        });

        // Insert
        requestAnimationFrame(() => {
            grid.appendChild(fragment);
            section.dataset.status = 'loaded';
            this.state.loadedCategories.add(category);
        });
    }

    /* -------------------------------------------------------------------------- */
    /*                                SEARCH LOGIC                                */
    /* -------------------------------------------------------------------------- */

    buildSearchIndex() {
        // Flatten data for faster search
        this.state.searchIndex = [];
        Object.entries(EMOJI_DATA).forEach(([cat, list]) => {
            list.forEach(emoji => {
                const searchStr = (emoji.name + ' ' + (emoji.keywords || '')).toLowerCase();
                this.state.searchIndex.push({
                    char: emoji.char,
                    name: emoji.name,
                    searchStr: searchStr
                });
            });
        });
        console.log(`Search Index Built: ${this.state.searchIndex.length} items.`);
    }

    handleSearch(query) {
        const q = query.toLowerCase().trim();
        const wasSearching = this.state.isSearching;
        this.state.isSearching = !!q;

        const resultsView = this.getOrCreateResultsView();

        if (!q) {
            // Restore Main View
            this.dom.emojiContainer.style.display = 'block';
            if (this.state.recent.length > 0) this.dom.recentSection.classList.remove('hidden');

            resultsView.style.display = 'none';
            this.dom.emptyState.style.display = 'none';
            return;
        }

        // Hide Main Views
        this.dom.emojiContainer.style.display = 'none';
        this.dom.recentSection.classList.add('hidden');
        resultsView.style.display = 'grid';

        // Perform Search
        // Simple text match
        const matches = this.state.searchIndex.filter(item => item.searchStr.includes(q));

        if (matches.length === 0) {
            resultsView.style.display = 'none';
            this.dom.emptyState.style.display = 'block';
            return;
        }

        this.dom.emptyState.style.display = 'none';

        // Render Results
        resultsView.innerHTML = ''; // Clear prev

        // Safety Limit
        const displaySet = matches.slice(0, this.config.maxSearchResults);

        const fragment = document.createDocumentFragment();
        displaySet.forEach(item => {
            fragment.appendChild(this.createEmojiButton({ char: item.char, name: item.name }));
        });
        resultsView.appendChild(fragment);
    }

    getOrCreateResultsView() {
        let view = document.getElementById('searchResultsView');
        if (!view) {
            view = document.createElement('div');
            view.id = 'searchResultsView';
            view.className = 'search-results-grid';
            this.dom.scrollArea.appendChild(view);
        }
        return view;
    }

    /* -------------------------------------------------------------------------- */
    /*                                DATA & UI                                   */
    /* -------------------------------------------------------------------------- */

    loadRecentData() {
        try {
            this.state.recent = JSON.parse(localStorage.getItem('dg_recent_emojis')) || [];
        } catch (e) { this.state.recent = []; }
        this.updateRecentUI();
    }

    saveRecentData() {
        localStorage.setItem('dg_recent_emojis', JSON.stringify(this.state.recent));
        this.updateRecentUI();
    }

    addToRecent(emoji) {
        this.state.recent = this.state.recent.filter(e => e.char !== emoji.char);
        this.state.recent.unshift(emoji);
        if (this.state.recent.length > 24) this.state.recent.length = 24;
        this.saveRecentData();
    }

    clearRecent() {
        if (confirm('Clear history?')) {
            this.state.recent = [];
            this.saveRecentData();
            if (window.playSound) window.playSound('delete');
        }
    }

    updateRecentUI() {
        // Just rebuild the grid
        this.dom.recentGrid.innerHTML = '';
        if (this.state.recent.length === 0) {
            this.dom.recentSection.classList.add('hidden');
            this.dom.clearRecentBtn.classList.add('hidden');
        } else {
            this.dom.recentSection.classList.remove('hidden');
            this.dom.clearRecentBtn.classList.remove('hidden');
            const fragment = document.createDocumentFragment();
            this.state.recent.forEach(e => fragment.appendChild(this.createEmojiButton(e)));
            this.dom.recentGrid.appendChild(fragment);
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                                INTERACTIONS                                */
    /* -------------------------------------------------------------------------- */

    createEmojiButton(emoji) {
        const btn = document.createElement('button');
        btn.className = 'emoji-btn';
        btn.textContent = emoji.char;
        btn.title = emoji.name || '';
        btn.type = 'button'; // Explicit type

        // Touch/Click
        btn.addEventListener('click', (e) => this.handleEmojiClick(e, emoji));

        return btn;
    }

    handleEmojiClick(e, emoji) {
        // Visual
        this.triggerRipple(e);

        // Logic
        navigator.clipboard.writeText(emoji.char).then(() => {
            if (window.showToast) window.showToast(`${emoji.char} Copied!`, 'success');
            if (window.playSound) window.playSound('click');
            this.addToRecent(emoji);
        }).catch(() => {
            if (window.showToast) window.showToast('Failed copy', 'error');
        });
    }

    triggerRipple(e) {
        const btn = e.currentTarget;
        const circle = document.createElement('span');
        const d = Math.max(btn.clientWidth, btn.clientHeight);
        circle.style.width = circle.style.height = `${d}px`;
        circle.classList.add('ripple');
        const rect = btn.getBoundingClientRect();
        circle.style.left = `${e.clientX - rect.left - d / 2}px`;
        circle.style.top = `${e.clientY - rect.top - d / 2}px`;

        // Clean prev
        const old = btn.querySelector('.ripple');
        if (old) old.remove();

        btn.appendChild(circle);
    }

    /* -------------------------------------------------------------------------- */
    /*                              COMMON EVENTS                                 */
    /* -------------------------------------------------------------------------- */

    /* -------------------------------------------------------------------------- */
    /*                              COMMON EVENTS                                 */
    /* -------------------------------------------------------------------------- */

    setupEvents() {
        this.dom.searchInput.addEventListener('input', (e) => {
            if (this.searchTimeout) clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => this.handleSearch(e.target.value), this.config.searchDebounceMs);
        });

        this.dom.clearRecentBtn.addEventListener('click', () => this.clearRecent());
    }

    setupScrollSpy() {
        // Desktop Spy
        this.dom.scrollArea.addEventListener('scroll', () => this.onScroll(), { passive: true });

        // Mobile Spy (Window)
        window.addEventListener('scroll', () => this.onScroll(), { passive: true });
    }

    onScroll() {
        if (this.scrollTick) return;
        this.scrollTick = true;
        requestAnimationFrame(() => {
            this.detectActiveSection();
            this.scrollTick = false;
        });
    }

    detectActiveSection() {
        if (this.state.isSearching) return;

        const isMobile = window.innerWidth <= 768;

        // Determine Scroll Top and Container Offset
        let currentScroll, containerOffset;

        if (isMobile) {
            currentScroll = window.scrollY;
            containerOffset = 150; // Offset for Sticky Header (Search + Tabs)
        } else {
            currentScroll = this.dom.scrollArea.scrollTop;
            containerOffset = 0; // Relative to container
        }

        // Middle of viewport relative to scroll
        const mid = currentScroll + (window.innerHeight / 3);

        // Check sections
        // Note: Recent section check
        if (!this.dom.recentSection.classList.contains('hidden')) {
            const rTop = isMobile ? this.dom.recentSection.offsetTop : this.dom.recentSection.offsetTop;
            const rBot = rTop + this.dom.recentSection.offsetHeight;

            if (mid >= rTop && mid < rBot) {
                this.setActiveNav('section-recent');
                return;
            }
        }

        // Optimize: Don't querySelectorAll every time if cached, but DOM offsetTop changes so...
        // We know keys.
        for (const key of Object.keys(EMOJI_DATA)) {
            const sec = document.getElementById(`section-${key}`);
            if (!sec) continue;

            // OffsetTop is relative to PARENT.
            // Desktop: Parent is .scroll-area (positioned). OffsetTop is accurate inside valid scroll.
            // Mobile: Parent is Body/Wrapper. OffsetTop is page coordinate.
            const top = sec.offsetTop;
            const bot = top + sec.offsetHeight;

            if (mid >= top && mid < bot) {
                this.setActiveNav(`section-${key}`);
                return;
            }
        }
    }

    setActiveNav(id) {
        if (this.state.activeId === id) return;
        this.state.activeId = id;

        // Update Grid
        this.dom.navList.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const btn = this.dom.navList.querySelector(`[data-target="${id}"]`);

        if (btn) {
            btn.classList.add('active');
            // Mobile: Scroll tab into current view safely (Horizontal only)
            if (window.innerWidth <= 768) {
                this.safeScrollTabIntoView(btn);
            }
        }
    }

    safeScrollTabIntoView(targetBtn) {
        // Find scrollable parent (sidebar)
        const sidebar = this.dom.navList.closest('.sidebar');
        if (!sidebar) return;

        // Calculate center position
        // We need the button's position relative to the sidebar scrolling context

        const btnRect = targetBtn.getBoundingClientRect();
        const sidebarRect = sidebar.getBoundingClientRect();

        // Current scroll position
        const currentScroll = sidebar.scrollLeft;

        // Distance from sidebar left edge to button left edge
        const offsetLeft = btnRect.left - sidebarRect.left;

        // We want to center it:
        // NewScroll = CurrentScroll + OffsetLeft - (SidebarWidth/2) + (BtnWidth/2)

        const centerPos = currentScroll + offsetLeft - (sidebar.clientWidth / 2) + (targetBtn.offsetWidth / 2);

        sidebar.scrollTo({
            left: centerPos,
            behavior: 'smooth'
        });
    }

    scrollToCategory(category) {
        const sec = document.getElementById(`section-${category}`);
        if (!sec) return;

        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
            // Natural Window Scroll
            // Offset for Sticky Headers (Search 60 + Tabs 54 + Padding ~10) => ~124
            const headerOffset = 124;
            const targetPos = sec.offsetTop - headerOffset;

            window.scrollTo({
                top: targetPos,
                behavior: 'smooth'
            });
        } else {
            // Container Scroll
            this.dom.scrollArea.scrollTo({
                top: sec.offsetTop - 20,
                behavior: 'smooth'
            });
        }
    }

    /* -------------------------------------------------------------------------- */
    /*                                HELPERS                                     */
    /* -------------------------------------------------------------------------- */

    renderSidebar() {
        const icons = {
            recent: 'fa-clock',
            smileys: 'fa-smile',
            animals: 'fa-paw',
            food: 'fa-hamburger',
            activities: 'fa-futbol',
            travel: 'fa-plane',
            objects: 'fa-lightbulb',
            symbols: 'fa-icons',
            flags: 'fa-flag'
        };

        // Clean
        this.dom.navList.innerHTML = '';

        // Recent
        this.dom.navList.appendChild(this.createNavNode('recent', 'Recent', icons.recent));

        // Others
        Object.keys(EMOJI_DATA).forEach(key => {
            this.dom.navList.appendChild(this.createNavNode(key, this.formatName(key), icons[key] || 'fa-smile'));
        });
    }

    createNavNode(id, name, icon) {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'nav-btn';
        btn.dataset.target = `section-${id}`;
        btn.innerHTML = `<i class="fas ${icon}"></i> <span>${name}</span>`;
        btn.onclick = () => this.scrollToCategory(id);
        li.appendChild(btn);
        return li;
    }

    formatName(str) {
        return str.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    // Idle Helper
    runIdleTask(task) {
        if ('requestIdleCallback' in window) {
            requestIdleCallback(task, { timeout: 1000 });
        } else {
            setTimeout(task, 50);
        }
    }
}

// Init
const app = new EmojiStudio();
