async function startDownload() {
    const url = document.getElementById('urlInput').value;
    const format = document.getElementById('formatSelect').value;
    const resultArea = document.getElementById('resultArea');
    const resultContent = document.getElementById('resultContent');
    const loader = document.getElementById('loader');
    const errorMsg = document.getElementById('errorMsg');
    const btn = document.getElementById('downloadBtn');
    
    // Elemen UI Text
    const titleEl = document.getElementById('videoTitle');
    const downloadLinkEl = document.getElementById('downloadLink');

    if (!url) {
        alert("Please paste a valid YouTube link");
        return;
    }

    // UI Reset
    resultArea.style.display = 'block';
    loader.style.display = 'block';
    resultContent.style.display = 'none';
    errorMsg.style.display = 'none';
    btn.disabled = true;
    btn.style.opacity = "0.7";
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        // Panggil Backend
        const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&format=${format}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Tampilkan Info Judul
        titleEl.innerText = data.title;
        
        // Update Link Manual (sebagai cadangan jika auto download gagal)
        downloadLinkEl.href = data.download;
        downloadLinkEl.innerText = "Download Started! (Click here if not)";
        
        loader.style.display = 'none';
        resultContent.style.display = 'block';

        // --- UPDATE: OTOMATIS DOWNLOAD ---
        // Membuat elemen <a> tersembunyi dan mengkliknya
        const autoLink = document.createElement('a');
        autoLink.href = data.download;
        autoLink.setAttribute('download', ''); // Trigger download attribute
        autoLink.style.display = 'none';
        document.body.appendChild(autoLink);
        
        // Klik otomatis
        autoLink.click();
        
        // Bersihkan elemen
        setTimeout(() => {
            document.body.removeChild(autoLink);
        }, 100);
        // ----------------------------------

    } catch (err) {
        console.error(err);
        loader.style.display = 'none';
        errorMsg.innerText = "Error: " + (err.message || "Failed to fetch download link");
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.innerHTML = '<i class="fas fa-bolt"></i> Download Music/Video';
    }
}
