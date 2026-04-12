<?php
/**
 * Audit proxy for the Findability Check tool.
 * Deploy to InfinityFree (or any PHP host with cURL).
 *
 * Accepts: GET ?url=https://example.com
 * Returns: JSON { url, html, robotsTxt, sitemapXml, headers, statusCode, isHttps }
 *
 * Replaces proxy.mjs for production use.
 */

// --- Configuration ---
$ALLOWED_ORIGINS = [
    'https://chrishornak.com',
    'https://www.chrishornak.com',
    'http://localhost:3000',
];
$MAX_HTML    = 2 * 1024 * 1024; // 2 MB
$MAX_AUX    = 50000;            // 50 KB for robots.txt / sitemap.xml
$TIMEOUT    = 15;               // seconds
$USER_AGENT = 'Mozilla/5.0 (compatible; SiteCheck/1.0; +https://chrishornak.com/audit)';

// --- CORS ---
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $ALLOWED_ORIGINS, true)) {
    header("Access-Control-Allow-Origin: $origin");
} elseif ($origin === '') {
    // Allow no-origin requests (direct browser navigation, curl testing)
    header('Access-Control-Allow-Origin: *');
}
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

header('Content-Type: application/json; charset=utf-8');

// --- Validate input ---
$targetUrl = $_GET['url'] ?? '';
if ($targetUrl === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing ?url= parameter']);
    exit;
}

$parsed = parse_url($targetUrl);
if (!$parsed || !isset($parsed['scheme']) || !in_array($parsed['scheme'], ['http', 'https'], true)) {
    http_response_code(400);
    echo json_encode(['error' => 'URL must use http or https']);
    exit;
}

if (!isset($parsed['host'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

// Block internal / private IPs
$resolvedIp = gethostbyname($parsed['host']);
if (filter_var($resolvedIp, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
    http_response_code(400);
    echo json_encode(['error' => 'Cannot fetch internal or private addresses']);
    exit;
}

// --- Rate limiting (simple file-based, per IP) ---
$rateLimitDir = sys_get_temp_dir() . '/audit_ratelimit';
if (!is_dir($rateLimitDir)) {
    @mkdir($rateLimitDir, 0755, true);
}
$clientIp   = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateFile   = $rateLimitDir . '/' . md5($clientIp) . '.json';
$rateWindow = 60;  // seconds
$rateLimit  = 10;  // requests per window

$now = time();
$rateData = [];
if (file_exists($rateFile)) {
    $rateData = json_decode(file_get_contents($rateFile), true) ?: [];
    // Purge old entries
    $rateData = array_filter($rateData, fn($ts) => $ts > $now - $rateWindow);
}
if (count($rateData) >= $rateLimit) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please wait a minute and try again.']);
    exit;
}
$rateData[] = $now;
@file_put_contents($rateFile, json_encode(array_values($rateData)));

// --- Fetch helper ---
function safeFetch(string $url, int $timeout, string $userAgent, int $maxBytes): array {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 5,
        CURLOPT_TIMEOUT        => $timeout,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_USERAGENT      => $userAgent,
        CURLOPT_HTTPHEADER     => ['Accept: text/html,application/xhtml+xml,*/*'],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HEADER         => true,
    ]);

    $response   = curl_exec($ch);
    $error      = curl_error($ch);
    $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $finalUrl   = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    curl_close($ch);

    if ($response === false || $error !== '') {
        return ['body' => '', 'headers' => '', 'status' => 0, 'url' => $url, 'error' => $error];
    }

    $rawHeaders = substr($response, 0, $headerSize);
    $body       = substr($response, $headerSize, $maxBytes);

    return ['body' => $body, 'headers' => $rawHeaders, 'status' => $statusCode, 'url' => $finalUrl, 'error' => ''];
}

function parseResponseHeaders(string $raw): array {
    $securityHeaders = [];
    $keys = [
        'content-security-policy',
        'x-frame-options',
        'strict-transport-security',
        'x-content-type-options',
    ];
    foreach (explode("\r\n", $raw) as $line) {
        $pos = strpos($line, ':');
        if ($pos === false) continue;
        $key = strtolower(trim(substr($line, 0, $pos)));
        $val = trim(substr($line, $pos + 1));
        if (in_array($key, $keys, true)) {
            $securityHeaders[$key] = $val;
        }
    }
    return $securityHeaders;
}

// --- Build origin for robots.txt / sitemap.xml ---
$origin = $parsed['scheme'] . '://' . $parsed['host'];
if (isset($parsed['port'])) {
    $origin .= ':' . $parsed['port'];
}

// --- Fetch all three in sequence (PHP doesn't have Promise.all, but cURL multi could work) ---
// Using curl_multi for parallel fetches
$urls = [
    'page'    => $targetUrl,
    'robots'  => $origin . '/robots.txt',
    'sitemap' => $origin . '/sitemap.xml',
];

$multiHandle = curl_multi_init();
$handles     = [];

foreach ($urls as $key => $fetchUrl) {
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL            => $fetchUrl,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS      => 5,
        CURLOPT_TIMEOUT        => $TIMEOUT,
        CURLOPT_CONNECTTIMEOUT => 5,
        CURLOPT_USERAGENT      => $USER_AGENT,
        CURLOPT_HTTPHEADER     => ['Accept: text/html,application/xhtml+xml,*/*'],
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_HEADER         => true,
    ]);
    curl_multi_add_handle($multiHandle, $ch);
    $handles[$key] = $ch;
}

// Execute all requests simultaneously
$running = null;
do {
    curl_multi_exec($multiHandle, $running);
    curl_multi_select($multiHandle);
} while ($running > 0);

// Collect results
$results = [];
foreach ($handles as $key => $ch) {
    $response   = curl_multi_getcontent($ch);
    $statusCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $headerSize = (int) curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $finalUrl   = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $error      = curl_error($ch);

    $maxBytes = ($key === 'page') ? $MAX_HTML : $MAX_AUX;

    if ($response === false || $error !== '') {
        $results[$key] = ['body' => '', 'headers' => '', 'status' => 0, 'url' => $urls[$key]];
    } else {
        $rawHeaders = substr($response, 0, $headerSize);
        $body       = substr($response, $headerSize, $maxBytes);
        $results[$key] = ['body' => $body, 'headers' => $rawHeaders, 'status' => $statusCode, 'url' => $finalUrl];
    }

    curl_multi_remove_handle($multiHandle, $ch);
    curl_close($ch);
}
curl_multi_close($multiHandle);

// --- Check page response ---
$pageResult = $results['page'];
if ($pageResult['status'] === 0 || $pageResult['status'] >= 400) {
    http_response_code(502);
    $msg = $pageResult['status'] === 0
        ? "Could not reach {$parsed['host']}"
        : "Could not reach {$parsed['host']} ({$pageResult['status']})";
    echo json_encode(['error' => $msg]);
    exit;
}

// --- Build response ---
$securityHeaders = parseResponseHeaders($pageResult['headers']);

$output = [
    'url'        => $pageResult['url'],
    'html'       => $pageResult['body'],
    'robotsTxt'  => ($results['robots']['status'] >= 200 && $results['robots']['status'] < 400) ? $results['robots']['body'] : '',
    'sitemapXml' => ($results['sitemap']['status'] >= 200 && $results['sitemap']['status'] < 400) ? $results['sitemap']['body'] : '',
    'headers'    => $securityHeaders,
    'statusCode' => $pageResult['status'],
    'isHttps'    => strpos($pageResult['url'], 'https') === 0,
];

echo json_encode($output, JSON_UNESCAPED_SLASHES);
