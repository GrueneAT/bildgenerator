jQuery(function () {
    // Event: Choice meme from gallery
    jQuery('.memes-container').delegate('img', 'click', function () {
        var $img = jQuery(this);
        var imgInfo = {
            url: $img.attr('src'),
            height: $img.attr('img-height'),
            width: $img.attr('img-width'),
        };
        processMeme(imgInfo);
    });

    // Event: Upload local image
    jQuery('#meme-input').on('change', function () {
        const file = this.files[0];
        if (!file) return;
        
        const fileType = file.type;
        jQuery('#meme-input').val(''); // Reset file input

        if (!isImage(fileType)) {
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
    });
});