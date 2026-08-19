jQuery(function () {
    // Event: Choice meme from gallery
    jQuery('.app-memes-container').delegate('img', 'click', function () {
        var $img = jQuery(this);
        var imgInfo = {
            url: $img.attr('src'),
            height: $img.attr('img-height'),
            width: $img.attr('img-width'),
        };
        processMeme(imgInfo);
    });

    // Read a File object, validate it as an image, and feed it through processMeme.
    // Shared between the <input type="file"> change handler and drag-and-drop on
    // the .gat-dropzone label.
    function loadMemeFile(file) {
        if (!file) return;

        if (!ValidationUtils.isValidImageFile(file)) {
            showAlert('Error! Invalid Image');
            return;
        }

        const reader = new FileReader();
        reader.onload = function () {
            var meme = new Image();
            meme.onload = function () {
                processMeme({
                    url: reader.result,
                    height: meme.height,
                    width: meme.width,
                });
            };
            meme.onerror = function () {
                showAlert('Error loading image');
            };
            meme.src = reader.result;
        };
        reader.onerror = function () {
            showAlert('Error reading file');
        };
        reader.readAsDataURL(file);
    }

    // Event: Upload local image via file input
    jQuery('#meme-input').on('change', function () {
        const file = this.files[0];
        jQuery('#meme-input').val(''); // Reset file input
        loadMemeFile(file);
    });

    // Drag-and-drop on the .gat-dropzone label. The label already forwards
    // clicks to #meme-input (native for=…); we add drag-over visual feedback
    // and dropped-file handling on top.
    const dropzone = document.getElementById('meme-dropzone');
    if (dropzone) {
        ['dragenter', 'dragover'].forEach(function (evt) {
            dropzone.addEventListener(evt, function (e) {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.add('is-dragover');
            });
        });
        ['dragleave', 'dragend', 'drop'].forEach(function (evt) {
            dropzone.addEventListener(evt, function (e) {
                e.preventDefault();
                e.stopPropagation();
                dropzone.classList.remove('is-dragover');
            });
        });
        dropzone.addEventListener('drop', function (e) {
            const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            loadMemeFile(file);
        });
    }
});
