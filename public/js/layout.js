/**
 * layout.js - Common Header and Footer for all pages
 */

const HEADER_HTML = `
    <a href="/index.html" class="logo">
        <span class="logo-icon"></span>
        <span data-i18n="header.logo">Nonogram World</span>
    </a>
    <nav>
        <ul>
            <li><a href="/index.html?mode=daily" data-nav="daily">
                <span data-i18n="nav.daily">Daily Puzzle</span>
                <span class="daily-badge">NEW</span>
            </a></li>
            <li><a href="/index.html" data-nav="play" data-i18n="nav.play">Play</a></li>
            <li><a href="/map.html" data-nav="map" data-i18n="nav.map">Map</a></li>
            <li><a href="/rules.html" data-nav="rules" data-i18n="nav.rules">Rules</a></li>
        </ul>
    </nav>
    <div class="header-actions">
        <!-- Placeholders to prevent CLS -->
        <div id="lang-switcher-root" class="lang-switcher-container" style="min-width: 80px;"></div>
        <div id="game-selectors-root" class="game-selectors-container"></div>
        <div id="theme-toggle-root" class="theme-toggle-container" style="min-width: 40px; min-height: 40px;"></div>
    </div>
`;

const FOOTER_HTML = `
    <p data-i18n="footer.copy">&copy; 2026 Nonogram World. All rights reserved.</p>
    <p style="margin-top: 5px;">
        <a href="/privacy.html" data-i18n="footer.privacy">Privacy Policy</a> |
        <a href="/terms.html" data-i18n="footer.terms">Terms of Use</a> |
        <a href="/contacts.html" data-i18n="footer.contacts">Contacts</a>
    </p>
    <p class="version-display" style="margin-top: 10px; font-size: 0.8rem; opacity: 0.6; font-family: monospace;" data-i18n="footer.version"></p>
`;

function updateThemeIcon() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;
    const isDark = document.documentElement.classList.contains('dark');
    btn.innerHTML = isDark ? '☀️' : '🌙';
    btn.title = isDark ? 'Switch to light theme' : 'Switch to dark theme';
}

function toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    const newTheme = isDark ? 'dark' : 'light';
    localStorage.setItem('nomo7-theme', newTheme);
    updateThemeIcon();
}

/**
 * Initialize Google Analytics
 */
function initGA() {
    const gaId = 'G-M0ERRD26L6';

    // 1. Create the async script tag
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
    document.head.appendChild(script);

    // 2. Initialize dataLayer and gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
        window.dataLayer.push(arguments);
    }
    window.gtag = gtag; // Expose globally

    gtag('js', new Date());
    gtag('config', gaId);
}

function injectLayout() {
    // ... rest of the function or call it at the start
    const header = document.querySelector('header');
    const footer = document.querySelector('footer');

    // Run GA once
    if (!window.gtagInitDone) {
        initGA();
        window.gtagInitDone = true;
    }

    if (header) {
        header.innerHTML = HEADER_HTML;

        // Mark active link
        const path = window.location.pathname;
        let activeNav = '';
        if (path.includes('index.html') || path === '/') {
            const params = new URLSearchParams(window.location.search);
            activeNav = params.get('mode') === 'daily' ? 'daily' : 'play';
        }
        else if (path.includes('map.html')) activeNav = 'map';
        else if (path.includes('rules.html')) activeNav = 'rules';
        // Add more as needed

        if (activeNav) {
            const activeLink = header.querySelector(`[data-nav="${activeNav}"]`);
            if (activeLink) activeLink.classList.add('active');
        }

        // Hide Daily Link if already solved today
        const todayStr = new Date().getUTCFullYear() + '-' + (new Date().getUTCMonth() + 1) + '-' + new Date().getUTCDate();
        if (localStorage.getItem('lastDailySolved') === todayStr) {
            const dailyLinkLi = header.querySelector('[data-nav="daily"]')?.closest('li');
            if (dailyLinkLi) dailyLinkLi.style.display = 'none';
        }

        // Synchronize selectors with URL params
        const params = new URLSearchParams(window.location.search);
        const sizeParam = params.get('size');
        const diffParam = params.get('difficulty');
        if (sizeParam) {
            const sizeSel = header.querySelector('#size-selector');
            if (sizeSel) sizeSel.value = sizeParam;
        }
        if (diffParam) {
            const diffSel = header.querySelector('#difficulty-selector');
            if (diffSel) diffSel.value = diffParam;
        }

        // If not a React page, inject the default selectors and theme toggle button
        const isReactPage = !!document.getElementById('root');
        const gameSelectorsRoot = header.querySelector('#game-selectors-root');
        const themeToggleRoot = header.querySelector('#theme-toggle-root');

        if (!isReactPage) {
            if (gameSelectorsRoot) {
                gameSelectorsRoot.innerHTML = `
                    <div class="flex gap-2">
                        <select id="size-selector">
                            <option value="5">5x5</option>
                            <option value="8">8x8</option>
                            <option value="10" selected>10x10</option>
                            <option value="15">15x15</option>
                            <option value="20">20x20</option>
                        </select>
                        <select id="difficulty-selector">
                            <option value="VERY_EASY">Very Easy</option>
                            <option value="EASY">Easy</option>
                            <option value="MEDIUM" selected>Medium</option>
                            <option value="HARD">Hard</option>
                            <option value="VERY_HARD">Very Hard</option>
                        </select>
                    </div>
                `;
            }

            if (themeToggleRoot) {
                themeToggleRoot.innerHTML = `
                    <button id="theme-toggle-btn" onclick="toggleTheme()" class="theme-toggle-btn">
                        🌙
                    </button>
                `;
                updateThemeIcon();
            }

            // Also attach simple events to selectors to redirect back to index.html with params if needed
            const sizeSel = header.querySelector('#size-selector');
            const diffSel = header.querySelector('#difficulty-selector');

            const handleChange = () => {
                const size = sizeSel.value;
                const diff = diffSel.value;
                const url = new URL(window.location.origin + '/index.html');
                url.searchParams.set('size', size);
                url.searchParams.set('difficulty', diff);
                window.location.href = url.toString();
            };

            if (sizeSel) sizeSel.addEventListener('change', handleChange);
            if (diffSel) diffSel.addEventListener('change', handleChange);
        }
    }

    if (footer) {
        footer.innerHTML = FOOTER_HTML;
    }
}

// Run immediately to avoid flicker if script is at bottom, 
// or early enough if in head.
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectLayout);
} else {
    injectLayout();
}
