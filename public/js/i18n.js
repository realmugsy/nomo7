class I18n {
    constructor() {
        this.supportedLangs = ['ru', 'en', 'es', 'de', 'fr', 'it'];
        this.currentLang = this.getInitialLanguage();
        this.translations = {};
    }

    getInitialLanguage() {
        // 1. Try localStorage
        const savedLang = localStorage.getItem('lang');
        if (savedLang && this.supportedLangs.includes(savedLang)) {
            return savedLang;
        }

        // 2. Try browser language
        const browserLang = (navigator.language || navigator.userLanguage || 'en').split('-')[0].toLowerCase();
        if (this.supportedLangs.includes(browserLang)) {
            return browserLang;
        }

        // 3. Fallback to English
        return 'en';
    }

    async init() {
        await this.loadLanguage(this.currentLang);
        this.renderLanguageSwitcher();
        this.setupEventListeners();
    }

    async loadLanguage(lang) {
        if (!this.supportedLangs.includes(lang)) {
            console.error(`Language ${lang} not supported`);
            return;
        }

        try {
            const response = await fetch(`lang/${lang}.json`);
            if (!response.ok) throw new Error('Failed to load language file');
            this.translations = await response.json();
            this.currentLang = lang;
            localStorage.setItem('lang', lang);
            this.updatePage();
            // Dispatch event for other scripts (e.g. canvas needs to redraw text)
            document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang, translations: this.translations } }));
        } catch (error) {
            console.error(error);
        }
    }

    updatePage() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const translation = this.getValue(this.translations, key);
            if (translation) {
                if (element.tagName === 'INPUT' && element.type === 'placeholder') {
                    element.placeholder = translation;
                } else {
                    element.innerHTML = translation;
                }
            }
        });
        document.title = this.translations.title || document.title;
        document.documentElement.lang = this.currentLang;

        // Update switcher value
        const select = document.querySelector('.lang-select');
        if (select) {
            select.value = this.currentLang;
        }
    }

    getValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    renderLanguageSwitcher() {
        const switcherContainer = document.createElement('div');
        switcherContainer.className = 'lang-switcher';

        const select = document.createElement('select');
        select.className = 'lang-select';

        this.supportedLangs.forEach(lang => {
            const option = document.createElement('option');
            option.value = lang;
            option.textContent = lang.toUpperCase();
            if (lang === this.currentLang) option.selected = true;
            select.appendChild(option);
        });

        select.onchange = (e) => this.loadLanguage(e.target.value);
        switcherContainer.appendChild(select);

        // Add to header
        const root = document.querySelector('#lang-switcher-root');
        if (root) {
            root.innerHTML = '';
            root.appendChild(switcherContainer);
        }
    }

    setupEventListeners() {
        // Handle dynamic content if needed
    }

    // Helper to get text for JS usage (like canvas)
    t(key) {
        return this.getValue(this.translations, key) || key;
    }
}

// Global instance
window.i18n = new I18n();
document.addEventListener('DOMContentLoaded', () => i18n.init());
