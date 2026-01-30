const axios = require('axios');

let json = null;

const gB = Buffer.from('ZXRhY2xvdWQub3Jn', 'base64').toString();

const headers = {
  origin: 'https://v1.y2mate.nu',
  referer: 'https://v1.y2mate.nu/',
  'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
  accept: '*/*'
};

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function ts() {
  return Math.floor(Date.now() / 1000);
}

async function getjson() {
  if (json) return json;
  try {
    const get = await axios.get('https://v1.y2mate.nu');
    const html = get.data;
    const m = /var json = JSON\.parse\('([^']+)'\)/.exec(html);
    if (!m) throw new Error('Failed to parse JSON from source');
    json = JSON.parse(m[1]);
    return json;
  } catch (e) {
    throw new Error('Error fetching init data: ' + e.message);
  }
}

function authorization() {
  let e = '';
  for (let i = 0; i < json[0].length; i++) {
    e += String.fromCharCode(
      json[0][i] - json[2][json[2].length - (i + 1)]
    );
  }
  if (json[1]) e = e.split('').reverse().join('');
  return e.length > 32 ? e.slice(0, 32) : e;
}

function extrakid(url) {
  const m =
    /youtu\.be\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /v=([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/shorts\/([a-zA-Z0-9_-]{11})/.exec(url) ||
    /\/live\/([a-zA-Z0-9_-]{11})/.exec(url);

  if (!m) throw new Error('Invalid YouTube URL');
  return m[1];
}

async function init() {
  const key = String.fromCharCode(json[6]);
  const url = `https://eta.${gB}/api/v1/init?${key}=${authorization()}&t=${ts()}`;
  const res = await axios.get(url, { headers });
  if (res.data.error && res.data.error !== 0 && res.data.error !== '0') {
    throw res.data;
  }
  return res.data;
}

async function yt2mate(videoUrl, format = 'mp3') {
  await getjson();
  const videoId = extrakid(videoUrl);
  const initRes = await init();

  let res = await axios.get(
    initRes.convertURL +
      '&v=' + videoId +
      '&f=' + format +
      '&t=' + ts() +
      '&_=' + Math.random(),
    { headers }
  );

  let data = res.data;

  if (data.error && data.error !== 0) {
    throw data;
  }

  if (data.redirect === 1 && data.redirectURL) {
    const r2 = await axios.get(
      data.redirectURL + '&t=' + ts(),
      { headers }
    );
    data = r2.data;
  }

  if (data.downloadURL && !data.progressURL) {
    return {
      id: videoId,
      title: data.title,
      format,
      download: data.downloadURL
    };
  }

  // Loop batas waktu 25 detik agar tidak timeout di Vercel Free Tier
  const startTime = Date.now();
  for (;;) {
    if (Date.now() - startTime > 25000) throw new Error("Timeout: Conversion took too long.");
    
    await sleep(3000);
    const progressRes = await axios.get(
      data.progressURL + '&t=' + ts(),
      { headers }
    );

    const p = progressRes.data;
    if (p.error && p.error !== 0) {
      throw p;
    }

    if (p.progress === 3) {
      return {
        id: videoId,
        title: p.title,
        format,
        download: data.downloadURL
      };
    }
  }
}

// Handler Vercel
module.exports = async (req, res) => {
  // Setup CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url, format } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const result = await yt2mate(url, format || 'mp3');
    res.status(200).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
};
