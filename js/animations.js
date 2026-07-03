/* ===== Scroll Reveal & Micro-interactions (IntersectionObserver) ===== */
document.addEventListener('DOMContentLoaded', () => {
    // Scroll reveal for elements with .reveal or .reveal-stagger
    const revealElements = document.querySelectorAll('.reveal, .reveal-stagger');

    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(el => revealObserver.observe(el));
    }

    // Auto-add reveal classes to form steps content on navigation
    const formSteps = document.querySelectorAll('.form-step');
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.target.classList.contains('active')) {
                const grids = mutation.target.querySelectorAll('.form-grid, .applications-grid, .summary-content');
                grids.forEach(grid => {
                    grid.classList.add('reveal-stagger', 'is-visible');
                });
            }
        });
    });

    formSteps.forEach(step => {
        observer.observe(step, { attributes: true, attributeFilter: ['class'] });
    });
});
