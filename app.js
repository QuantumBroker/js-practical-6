class ModalSystem {
    constructor() {
        this.activeModals = []; // Стек модальних вікон
        this.galleryImages = [
            "https://picsum.photos/id/10/800/500",
            "https://picsum.photos/id/11/800/500",
            "https://picsum.photos/id/12/800/500"
        ];
        this.currentImgIndex = 0;
        this.isZoomed = false;

        this.init();
    }

    init() {
        // 1. Event Delegation для кнопок відкриття
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('[data-modal]');
            if (trigger) {
                const modalId = trigger.getAttribute('data-modal');
                this.open(modalId);
            }
        });

        // 2. Глобальні слухачі для закриття та управління
        document.addEventListener('click', (e) => this.handleOverlayAndCloseClick(e));
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // 3. Ініціалізація внутрішніх фіч галереї
        this.initGallery();
    }

    // Метод ВІДКРИТТЯ модалки
    open(modalId, callbacks = {}) {
        const modal = document.getElementById(modalId);
        if (!modal || this.activeModals.includes(modal)) return;

        // Обробка специфічних типів модалок перед відкриттям
        if (modalId === 'modal-video') {
            document.getElementById('modal-iframe').src = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1";
        }

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        
        // Зберігаємо елемент, який тригернув вікно, щоб повернути фокус
        modal._returnFocusElement = document.activeElement;

        // Додаємо в стек
        this.activeModals.push(modal);

        // Focus trap: фокусуємось на першому елементі всередині
        this.focusFirstElement(modal);

        // Callbacks execution
        if (callbacks.onOpen) callbacks.onOpen();
        console.log(`Opened: ${modalId}. Current stack depth: ${this.activeModals.length}`);
    }

    // Метод ЗАКРИТТЯ верхньої модалки
    closeTop() {
        if (this.activeModals.length === 0) return;

        const modal = this.activeModals.pop();
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');

        // Очищення специфічного контенту
        if (modal.id === 'modal-video') {
            document.getElementById('modal-iframe').src = "";
        }
        if (modal.id === 'modal-gallery') {
            this.resetZoom();
        }

        // Повертаємо фокус назад на кнопку
        if (modal._returnFocusElement) {
            modal._returnFocusElement.focus();
        }

        console.log(`Closed top modal. Remaining in stack: ${this.activeModals.length}`);
    }

    // Обробка кліків по оверлею та хрестиках
    handleOverlayAndCloseClick(e) {
        if (this.activeModals.length === 0) return;
        const topModal = this.activeModals[this.activeModals.length - 1];

        // Клік по хрестику або спеціальній кнопці закриття
        if (e.target.classList.contains('modal-close') || e.target.classList.contains('btn-close-trigger')) {
            this.closeTop();
            return;
        }

        // Клік суто по оверлею (проміжком між вікном і екраном)
        if (e.target === topModal) {
            this.closeTop();
        }
    }

    // Обробка клавіатури (ESC та Focus Trap за допомогою Tab)
    handleKeyboard(e) {
        if (this.activeModals.length === 0) return;
        const topModal = this.activeModals[this.activeModals.length - 1];

        // 1. ESC key -> Закриття
        if (e.key === 'Escape') {
            this.closeTop();
            return;
        }

        // Навігація стрілочками для галереї
        if (topModal.id === 'modal-gallery') {
            if (e.key === 'ArrowRight') this.navigateGallery(1);
            if (e.key === 'ArrowLeft') this.navigateGallery(-1);
        }

        // 2. Focus Trap (Tab / Shift+Tab)
        if (e.key === 'Tab') {
            const focusableElements = topModal.querySelectorAll('button, [href], input, select, textarea, [tabindex="0"]');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }

    focusFirstElement(modal) {
        const focusable = modal.querySelectorAll('button, input, [tabindex="0"]');
        if (focusable.length > 0) focusable[0].focus();
    }

    /* --- ЛОГІКА ГАЛЕРЕЇ --- */
    initGallery() {
        document.querySelector('.gallery-nav.next').addEventListener('click', () => this.navigateGallery(1));
        document.querySelector('.gallery-nav.prev').addEventListener('click', () => this.navigateGallery(-1));
        
        const zoomBtn = document.getElementById('btn-zoom');
        const img = document.getElementById('gallery-img');

        zoomBtn.addEventListener('click', () => this.toggleZoom());
        img.addEventListener('click', () => this.toggleZoom());
    }

    navigateGallery(direction) {
        this.resetZoom();
        this.currentImgIndex = (this.currentImgIndex + direction + this.galleryImages.length) % this.galleryImages.length;
        document.getElementById('gallery-img').src = this.galleryImages[this.currentImgIndex];
        document.getElementById('gallery-counter').textContent = `${this.currentImgIndex + 1} of ${this.galleryImages.length}`;
    }

    toggleZoom() {
        const img = document.getElementById('gallery-img');
        const zoomBtn = document.getElementById('btn-zoom');
        this.isZoomed = !this.isZoomed;
        
        if (this.isZoomed) {
            img.classList.add('zoomed');
            zoomBtn.textContent = "Zoom Out";
        } else {
            this.resetZoom();
        }
    }

    resetZoom() {
        this.isZoomed = false;
        const img = document.getElementById('gallery-img');
        if(img) img.classList.remove('zoomed');
        const zoomBtn = document.getElementById('btn-zoom');
        if(zoomBtn) zoomBtn.textContent = "Zoom In";
    }
}

// Запуск системи після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    window.modals = new ModalSystem();

    // Приклад кастомного callback для кнопки "Підтвердити" у Confirm modal
    document.getElementById('confirm-action-btn').addEventListener('click', () => {
        alert('Дію підтверджено!');
        window.modals.closeTop();
    });
});