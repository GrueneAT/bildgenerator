// Initialize UI components
jQuery(function() {
    // Wait for fabric to be available before initializing canvas-dependent code
    function waitForFabric() {
        if (typeof fabric !== 'undefined') {
            console.log('Fabric.js loaded, initializing application...');
            
            // Initialize the application now that fabric is available
            if (typeof initializeApplication === 'function') {
                initializeApplication();
            }
            
            console.log('UI components initialized with Tailwind CSS');
        } else {
            console.log('Waiting for Fabric.js to load...');
            setTimeout(waitForFabric, 50);
        }
    }
    
    waitForFabric();
});