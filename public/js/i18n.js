class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('lang') || 'en';
        this.supportedLangs = ['ru', 'en'];
        if (!this.supportedLangs.includes(this.currentLang)) {
            this.currentLang = 'en';
        }
        this.translations = {};
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

        // Update switcher active state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === this.currentLang);
        });
    }

    getValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    }

    renderLanguageSwitcher() {
        const switcherContainer = document.createElement('div');
        switcherContainer.className = 'lang-switcher';

        this.supportedLangs.forEach(lang => {
            const btn = document.createElement('button');
            btn.textContent = lang.toUpperCase();
            btn.className = 'lang-btn';
            btn.dataset.lang = lang;
            if (lang === this.currentLang) btn.classList.add('active');

            btn.onclick = () => this.loadLanguage(lang);

            switcherContainer.appendChild(btn);
        });

        // Add to header (adjust selector as needed)
        const headerActions = document.querySelector('.header-actions');
        if (headerActions) {
            headerActions.prepend(switcherContainer);
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
const i18n = new I18n();
document.addEventListener('DOMContentLoaded', () => i18n.init());
