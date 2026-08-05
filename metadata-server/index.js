const express = require('express');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);
const app = express();
app.use(express.json());

const ALLOWED_DOMAINS = ['tiktok.com', 'instagram.com', 'youtube.com', 'youtu.be'];
const AUTH_SECRET = process.env.METADATA_SERVER_SECRET;

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

function isAllowedUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    return ALLOWED_DOMAINS.some(d => parsed.hostname === d || parsed.hostname.endsWith('.' + d));
  } catch {
    return false;
  }
}

function isYouTubeUrl(urlString) {
  try {
    const { hostname } = new URL(urlString);
    return hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be';
  } catch {
    return false;
  }
}

async function fetchYouTubeMetadataFromHtml(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': MOBILE_USER_AGENT,
      'Accept-Language': 'en-US,en;q=0.9',
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);

  const html = await response.text();

  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  const title = (titleMatch?.[1] ?? '').replace(/ - YouTube$/i, '').trim();

  // The video description is embedded as "shortDescription":"<json-escaped>" in ytInitialPlayerResponse
  const descMatch = html.match(/"shortDescription":"((?:[^"\\]|\\.)*)"/);
  if (!descMatch) throw new Error('Could not find video description in page HTML');

  const description = JSON.parse('"' + descMatch[1] + '"');
  return { title, description };
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/metadata', async (req, res) => {
  if (AUTH_SECRET) {
    const provided = req.headers['x-metadata-secret'];
    if (provided !== AUTH_SECRET) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'url is required' });
  }
  if (!isAllowedUrl(url)) {
    return res.status(400).json({ error: 'URL not from an allowed domain' });
  }

  try {
    const { stdout } = await execFileAsync(
      'yt-dlp',
      ['--print', 'title', '--print', 'description', '--no-download', '--no-playlist', '--js-runtimes', 'node', url],
      { timeout: 30_000 },
    );

    const lines = stdout.split('\n');
    const title = lines[0]?.trim() ?? '';
    // description starts after title line
    const description = lines.slice(1).join('\n').trim();

    return res.json({ title, description });
  } catch (err) {
    // For YouTube, yt-dlp often fails in server environments due to bot detection.
    // Fall back to fetching the page HTML directly, which is how the link import path works.
    if (isYouTubeUrl(url)) {
      try {
        const metadata = await fetchYouTubeMetadataFromHtml(url);
        return res.json(metadata);
      } catch (htmlErr) {
        console.error('YouTube HTML fallback error:', htmlErr.message);
      }
    }
    console.error('yt-dlp error:', err.message);
    return res.status(502).json({ error: 'Failed to fetch metadata', detail: err.message });
  }
});

const PORT = process.env.PORT ?? 8080;
app.listen(PORT, () => {
  console.log(`Metadata server listening on port ${PORT}`);
});
