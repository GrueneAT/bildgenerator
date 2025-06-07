// Modal functionality to replace Bootstrap modals
jQuery(function() {
    // Video modal functionality
    jQuery('#video-modal-btn').on('click', function() {
        const videoUrl = jQuery(this).data('video');
        jQuery('#video-iframe').attr('src', videoUrl);
        jQuery('#videoModal').removeClass('hidden');
        jQuery('body').addClass('overflow-hidden');
    });

    // Close modal functionality
    jQuery('#close-modal, #videoModal').on('click', function(e) {
        if (e.target === this) {
            jQuery('#videoModal').addClass('hidden');
            jQuery('#video-iframe').attr('src', '');
            jQuery('body').removeClass('overflow-hidden');
        }
    });

    // Close modal on escape key
    jQuery(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            jQuery('#videoModal').addClass('hidden');
            jQuery('#video-iframe').attr('src', '');
            jQuery('body').removeClass('overflow-hidden');
        }
    });
});

// Button group functionality to replace Bootstrap button groups
jQuery(function() {
    jQuery('.btn-group label').on('click', function() {
        const $label = jQuery(this);
        const $group = $label.closest('.btn-group');
        const $radio = $label.find('input[type="radio"]');
        
        // Remove active class from siblings
        $group.find('label').removeClass('active').removeClass('bg-gruene-secondary');
        
        // Add active class to clicked label
        $label.addClass('active').addClass('bg-gruene-secondary');
        
        // Check the radio button and trigger change event
        $radio.prop('checked', true).trigger('change');
        
        console.log('Alignment button clicked:', $radio.attr('id'), 'value:', $radio.val());
    });
});

// Alert functionality to replace Bootstrap alerts
function showTailwindAlert(message, type = 'danger') {
    const $alertContainer = jQuery('.alert-container');
    
    const alertClasses = {
        danger: 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded',
        success: 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded',
        warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded',
        info: 'bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded'
    };
    
    // Clear all previous alert classes
    $alertContainer.removeClass();
    $alertContainer.addClass('alert-container max-w-7xl mx-auto px-4 mt-4');
    $alertContainer.addClass(alertClasses[type]);
    
    $alertContainer
        .removeClass('hidden')
        .html(`<p class="text-center mb-0 font-medium">${message}</p>`)
        .fadeIn('normal', function () {
            setTimeout(function () {
                $alertContainer.fadeOut('normal', function () {
                    $alertContainer.addClass('hidden').html('');
                });
            }, CONSTANTS.ALERT_DURATION);
        });
}