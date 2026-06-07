// Modal functionality - uses the native <dialog> API
// (the design-system .gat-modal class is applied to a <dialog> element).
jQuery(function() {
    const dialog = document.getElementById('videoModal');
    const iframe = document.getElementById('video-iframe');

    function closeVideoModal() {
        if (!dialog) return;
        if (dialog.open) {
            dialog.close();
        }
        if (iframe) {
            iframe.setAttribute('src', '');
        }
    }

    // Open modal
    jQuery('#video-modal-btn').on('click', function() {
        if (!dialog) return;
        const videoUrl = jQuery(this).data('video');
        if (iframe) {
            iframe.setAttribute('src', videoUrl);
        }
        // showModal() puts the dialog in the top-layer and triggers ::backdrop.
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    });

    // Close via the close button
    jQuery('#close-modal').on('click', closeVideoModal);

    // Close when clicking the backdrop (clicks on the <dialog> element itself,
    // not its child content). With native <dialog> the backdrop is the dialog
    // element's own click area outside the content box.
    if (dialog) {
        dialog.addEventListener('click', function(e) {
            if (e.target === dialog) {
                closeVideoModal();
            }
        });

        // Reset iframe when the dialog is closed (Esc, form submit, etc.).
        dialog.addEventListener('close', function() {
            if (iframe) {
                iframe.setAttribute('src', '');
            }
        });

        // The native <dialog> handles Esc automatically; the 'close' listener
        // above will then clear the iframe src.
    }
});

// Font-examples modal: shows the example gallery in-app so the user never
// leaves their in-progress canvas. Same native <dialog> mechanism as the
// video modal; schriften.html stays as a deep-linkable standalone fallback.
jQuery(function() {
    const dialog = document.getElementById('fontExamplesModal');
    if (!dialog) return;

    function openFontExamples() {
        if (typeof dialog.showModal === 'function') {
            dialog.showModal();
        } else {
            dialog.setAttribute('open', '');
        }
    }

    function closeFontExamples() {
        if (dialog.open) {
            dialog.close();
        } else {
            dialog.removeAttribute('open');
        }
    }

    jQuery('#font-examples-btn').on('click', openFontExamples);
    jQuery('#close-font-examples').on('click', closeFontExamples);

    // Close when clicking the backdrop (the dialog element itself, outside the
    // content box).
    dialog.addEventListener('click', function(e) {
        if (e.target === dialog) {
            closeFontExamples();
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