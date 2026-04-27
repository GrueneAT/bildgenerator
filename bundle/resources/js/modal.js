// Modal functionality
jQuery(function() {
    // Video modal functionality
    jQuery('#video-modal-btn').on('click', function() {
        const videoUrl = jQuery(this).data('video');
        jQuery('#video-iframe').attr('src', videoUrl);
        jQuery('#videoModal').removeClass('hidden');
        jQuery('body').addClass('overflow-hidden');
    });

    // Close modal functionality
    jQuery('#close-modal').on('click', function(e) {
        jQuery('#videoModal').addClass('hidden');
        jQuery('#video-iframe').attr('src', '');
        jQuery('body').removeClass('overflow-hidden');
    });
    
    // Close modal when clicking background
    jQuery('#videoModal').on('click', function(e) {
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

// Button group functionality
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

// Alert functionality now handled by centralized AlertSystem