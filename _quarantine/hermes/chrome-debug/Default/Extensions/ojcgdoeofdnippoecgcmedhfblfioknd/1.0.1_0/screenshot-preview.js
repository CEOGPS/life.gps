document.addEventListener('DOMContentLoaded', async () => {
    const previewImg = document.getElementById('sc-preview-img');
    const copyBtn = document.getElementById('sc-copy-btn');
    const downloadPngBtn = document.getElementById('sc-download-png');
    const downloadJpgBtn = document.getElementById('sc-download-jpg');
    const downloadPdfBtn = document.getElementById('sc-download-pdf');

    // 1. Get the image from storage
    const data = await chrome.storage.local.get('lastScreenshot');
    if (data.lastScreenshot) {
        previewImg.src = data.lastScreenshot;
    } else {
        document.body.innerHTML = '<div style="padding: 50px; text-align: center;"><h2>No screenshot found.</h2></div>';
        return;
    }

    // 2. Action: Copy to Clipboard
    copyBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(previewImg.src);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);

            const originalText = copyBtn.innerHTML;
            copyBtn.innerHTML = '<span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!</span>';
            setTimeout(() => copyBtn.innerHTML = originalText, 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            alert('Failed to copy to clipboard.');
        }
    });

    // 3. Action: Download PNG
    downloadPngBtn.addEventListener('click', () => {
        const link = document.createElement('a');
        link.download = `screenshot_${Date.now()}.png`;
        link.href = previewImg.src;
        link.click();
    });

    // 4. Action: Download JPG
    downloadJpgBtn.addEventListener('click', () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            const jpgUrl = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.download = `screenshot_${Date.now()}.jpg`;
            link.href = jpgUrl;
            link.click();
        };
        img.src = previewImg.src;
    });

    // 5. Action: PDF (via Print)
    downloadPdfBtn.addEventListener('click', () => {
        window.print();
    });
});
