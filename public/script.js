async function startDownload() {
    const url = document.getElementById('urlInput').value;
    const format = document.getElementById('formatSelect').value;
    const resultArea = document.getElementById('resultArea');
    const resultContent = document.getElementById('resultContent');
    const loader = document.getElementById('loader');
    const errorMsg = document.getElementById('errorMsg');
    const btn = document.getElementById('downloadBtn');

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

    try {
        // Panggil Backend Vercel
        const response = await fetch(`/api/download?url=${encodeURIComponent(url)}&format=${format}`);
        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        // Tampilkan Hasil
        document.getElementById('videoTitle').innerText = data.title;
        document.getElementById('downloadLink').href = data.download;
        
        loader.style.display = 'none';
        resultContent.style.display = 'block';

    } catch (err) {
        console.error(err);
        loader.style.display = 'none';
        errorMsg.innerText = "Error: " + (err.message || "Failed to fetch download link");
        errorMsg.style.display = 'block';
    } finally {
        btn.disabled = false;
        btn.style.opacity = "1";
    }
}
