// Fallback button functionality for navigation
document.addEventListener('DOMContentLoaded', function() {
    const backBtn = document.getElementById('backBtn');

    if (backBtn) {
        backBtn.addEventListener('click', function(e) {
            e.preventDefault();

            // Try to go back in history first
            if (window.history.length > 1) {
                window.history.back();
            } else {
                // Fallback to home page
                window.location.href = '../index.html';
            }
        });
    }

    // Add keyboard navigation support
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const backBtn = document.getElementById('backBtn');
            if (backBtn) {
                backBtn.click();
            }
        }
    });
});
