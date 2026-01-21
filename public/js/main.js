/**
 * Middleton Grange School - Public Website JavaScript
 *
 * Handles navigation, modals, and interactive elements.
 */

(function() {
    'use strict';

    // ============================================
    // Mobile Menu
    // ============================================
    const MobileMenu = {
        toggle: document.getElementById('mobile-menu-toggle'),
        menu: document.getElementById('mobile-menu'),
        overlay: null,

        init() {
            if (!this.toggle || !this.menu) return;

            // Create overlay
            this.overlay = document.createElement('div');
            this.overlay.className = 'mobile-menu-overlay';
            this.overlay.style.cssText = `
                position: fixed;
                inset: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            `;
            document.body.appendChild(this.overlay);

            // Bind events
            this.toggle.addEventListener('click', () => this.toggleMenu());
            this.overlay.addEventListener('click', () => this.closeMenu());

            // Section toggles
            this.menu.querySelectorAll('.mobile-menu-toggle-section').forEach(btn => {
                btn.addEventListener('click', () => {
                    const section = btn.parentElement;
                    const pages = section.querySelector('.mobile-menu-pages');

                    // Toggle active state
                    pages.classList.toggle('active');

                    // Rotate chevron
                    const icon = btn.querySelector('svg');
                    if (icon) {
                        icon.style.transform = pages.classList.contains('active')
                            ? 'rotate(180deg)'
                            : '';
                    }
                });
            });

            // Close on ESC
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.closeMenu();
            });
        },

        toggleMenu() {
            this.menu.classList.toggle('active');

            if (this.menu.classList.contains('active')) {
                this.overlay.style.opacity = '1';
                this.overlay.style.visibility = 'visible';
                document.body.style.overflow = 'hidden';
            } else {
                this.closeMenu();
            }
        },

        closeMenu() {
            this.menu.classList.remove('active');
            this.overlay.style.opacity = '0';
            this.overlay.style.visibility = 'hidden';
            document.body.style.overflow = '';
        }
    };


    // ============================================
    // Sticky Header
    // ============================================
    const StickyHeader = {
        header: document.querySelector('.site-header'),
        lastScroll: 0,
        threshold: 100,

        init() {
            if (!this.header) return;

            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
        },

        handleScroll() {
            const currentScroll = window.pageYOffset;

            // Add shadow when scrolled
            if (currentScroll > 10) {
                this.header.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
            } else {
                this.header.style.boxShadow = '';
            }

            this.lastScroll = currentScroll;
        }
    };


    // ============================================
    // Popup Modal
    // ============================================
    const PopupModal = {
        modal: document.getElementById('popup-modal'),
        closeBtn: document.getElementById('popup-close'),

        init() {
            if (!this.modal) return;

            const showOnce = this.modal.dataset.showOnce === 'true';
            const popupShown = sessionStorage.getItem('popupShown');

            // Check if we should show the popup
            if (showOnce && popupShown) {
                return;
            }

            // Show popup after a short delay
            setTimeout(() => {
                this.show();
            }, 1500);

            // Bind close events
            if (this.closeBtn) {
                this.closeBtn.addEventListener('click', () => this.hide());
            }

            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) this.hide();
            });

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.hide();
            });
        },

        show() {
            this.modal.classList.add('active');
            document.body.style.overflow = 'hidden';
            feather.replace();
        },

        hide() {
            this.modal.classList.remove('active');
            document.body.style.overflow = '';
            sessionStorage.setItem('popupShown', 'true');
        }
    };


    // ============================================
    // Smooth Scroll
    // ============================================
    const SmoothScroll = {
        init() {
            document.querySelectorAll('a[href^="#"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    const targetId = link.getAttribute('href');
                    if (targetId === '#') return;

                    const target = document.querySelector(targetId);
                    if (target) {
                        e.preventDefault();
                        const headerHeight = document.querySelector('.site-header')?.offsetHeight || 0;
                        const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;

                        window.scrollTo({
                            top: targetPosition,
                            behavior: 'smooth'
                        });
                    }
                });
            });
        }
    };


    // ============================================
    // Lazy Loading Images
    // ============================================
    const LazyLoad = {
        init() {
            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries, observer) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            if (img.dataset.src) {
                                img.src = img.dataset.src;
                                img.removeAttribute('data-src');
                            }
                            observer.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '50px 0px'
                });

                document.querySelectorAll('img[data-src]').forEach(img => {
                    imageObserver.observe(img);
                });
            } else {
                // Fallback for older browsers
                document.querySelectorAll('img[data-src]').forEach(img => {
                    img.src = img.dataset.src;
                });
            }
        }
    };


    // ============================================
    // Scroll Animations
    // ============================================
    const ScrollAnimations = {
        init() {
            if ('IntersectionObserver' in window) {
                const animateObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('animate-in');
                        }
                    });
                }, {
                    threshold: 0.1,
                    rootMargin: '0px 0px -50px 0px'
                });

                document.querySelectorAll('.animate-on-scroll').forEach(el => {
                    animateObserver.observe(el);
                });
            }
        }
    };


    // ============================================
    // Form Validation
    // ============================================
    const FormValidation = {
        init() {
            document.querySelectorAll('form[data-validate]').forEach(form => {
                form.addEventListener('submit', (e) => {
                    if (!this.validateForm(form)) {
                        e.preventDefault();
                    }
                });

                // Real-time validation
                form.querySelectorAll('input, textarea, select').forEach(field => {
                    field.addEventListener('blur', () => this.validateField(field));
                    field.addEventListener('input', () => this.clearError(field));
                });
            });
        },

        validateForm(form) {
            let isValid = true;
            form.querySelectorAll('[required]').forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });
            return isValid;
        },

        validateField(field) {
            const value = field.value.trim();
            let isValid = true;
            let errorMessage = '';

            // Required check
            if (field.required && !value) {
                isValid = false;
                errorMessage = 'This field is required';
            }

            // Email check
            if (isValid && field.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid email address';
                }
            }

            // Phone check
            if (isValid && field.type === 'tel' && value) {
                const phoneRegex = /^[\d\s\-+()]+$/;
                if (!phoneRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Please enter a valid phone number';
                }
            }

            // Show/hide error
            if (!isValid) {
                this.showError(field, errorMessage);
            } else {
                this.clearError(field);
            }

            return isValid;
        },

        showError(field, message) {
            field.classList.add('error');

            let errorEl = field.parentElement.querySelector('.field-error');
            if (!errorEl) {
                errorEl = document.createElement('span');
                errorEl.className = 'field-error';
                errorEl.style.cssText = 'color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block;';
                field.parentElement.appendChild(errorEl);
            }
            errorEl.textContent = message;
        },

        clearError(field) {
            field.classList.remove('error');
            const errorEl = field.parentElement.querySelector('.field-error');
            if (errorEl) {
                errorEl.remove();
            }
        }
    };


    // ============================================
    // Back to Top Button
    // ============================================
    const BackToTop = {
        button: null,

        init() {
            // Create button
            this.button = document.createElement('button');
            this.button.className = 'back-to-top';
            this.button.setAttribute('aria-label', 'Back to top');
            this.button.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>';
            this.button.style.cssText = `
                position: fixed;
                bottom: 2rem;
                right: 2rem;
                width: 48px;
                height: 48px;
                background: var(--color-primary, #1e3a5f);
                color: white;
                border: none;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 999;
            `;
            document.body.appendChild(this.button);

            // Bind events
            window.addEventListener('scroll', () => this.handleScroll(), { passive: true });
            this.button.addEventListener('click', () => this.scrollToTop());
        },

        handleScroll() {
            if (window.pageYOffset > 500) {
                this.button.style.opacity = '1';
                this.button.style.visibility = 'visible';
            } else {
                this.button.style.opacity = '0';
                this.button.style.visibility = 'hidden';
            }
        },

        scrollToTop() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    };


    // ============================================
    // External Links
    // ============================================
    const ExternalLinks = {
        init() {
            document.querySelectorAll('a[href^="http"]').forEach(link => {
                // Check if it's an external link
                if (link.hostname !== window.location.hostname) {
                    link.setAttribute('target', '_blank');
                    link.setAttribute('rel', 'noopener noreferrer');
                }
            });
        }
    };


    // ============================================
    // Initialize All Modules
    // ============================================
    document.addEventListener('DOMContentLoaded', () => {
        MobileMenu.init();
        StickyHeader.init();
        PopupModal.init();
        SmoothScroll.init();
        LazyLoad.init();
        ScrollAnimations.init();
        FormValidation.init();
        BackToTop.init();
        ExternalLinks.init();

        // Initialize Feather Icons
        if (typeof feather !== 'undefined') {
            feather.replace();
        }
    });

})();
