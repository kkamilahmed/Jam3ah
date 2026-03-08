<?php
/**
 * Prayer Times Year Generator
 * POST /api/generate_year.php
 * Body (JSON): { lat, lng, timezone, method, year }
 *
 * Run a PHP server from the Backend directory:
 *   php -S localhost:8080 -t .
 * Then call: POST http://localhost:8080/api/generate_year.php
 */

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Load Composer autoloader
$autoload = __DIR__ . '/../vendor/autoload.php';
if (!file_exists($autoload)) {
    http_response_code(500);
    echo json_encode(['error' => 'Run: composer install in the Backend directory']);
    exit;
}
require_once $autoload;

use IslamicNetwork\PrayerTimes\PrayerTimes;
use IslamicNetwork\PrayerTimes\Method;

// Parse request body
$body = json_decode(file_get_contents('php://input'), true);
if (!$body) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

$lat      = isset($body['lat'])      ? (float)  $body['lat']      : null;
$lng      = isset($body['lng'])      ? (float)  $body['lng']      : null;
$timezone = isset($body['timezone']) ? (string) $body['timezone'] : 'UTC';
$method   = isset($body['method'])   ? strtoupper((string) $body['method']) : Method::METHOD_ISNA;
$year     = isset($body['year'])     ? (int)    $body['year']     : (int) date('Y');

if ($lat === null || $lng === null) {
    http_response_code(400);
    echo json_encode(['error' => 'lat and lng are required']);
    exit;
}

// Map method string to library constant
$methodMap = [
    'ISNA'     => Method::METHOD_ISNA,
    'MWL'      => Method::METHOD_MWL,
    'EGYPTIAN' => Method::METHOD_EGYPT,
    'EGYPT'    => Method::METHOD_EGYPT,
    'MAKKAH'   => Method::METHOD_MAKKAH,
    'KARACHI'  => Method::METHOD_KARACHI,
    'GULF'     => Method::METHOD_GULF,
    'KUWAIT'   => Method::METHOD_KUWAIT,
    'QATAR'    => Method::METHOD_QATAR,
    'SINGAPORE'=> Method::METHOD_SINGAPORE,
    'TURKEY'   => Method::METHOD_TURKEY,
    'TEHRAN'   => Method::METHOD_TEHRAN,
    'JAFARI'   => Method::METHOD_JAFARI,
    'DUBAI'    => Method::METHOD_DUBAI,
    'JORDAN'   => Method::METHOD_JORDAN,
];
$calcMethod = $methodMap[$method] ?? Method::METHOD_ISNA;

try {
    $pt  = new PrayerTimes($calcMethod);
    $tz  = new DateTimeZone($timezone);
    $results = [];

    $start = new DateTime("{$year}-01-01", $tz);
    $end   = new DateTime("{$year}-12-31", $tz);

    $current = clone $start;
    while ($current <= $end) {
        $times = $pt->getTimes(
            clone $current,
            $lat,
            $lng,
            null,
            PrayerTimes::LATITUDE_ADJUSTMENT_METHOD_ANGLE,
            null,
            PrayerTimes::TIME_FORMAT_24H
        );

        $dateStr = $current->format('Y-m-d');
        $results[] = [
            'date'    => $dateStr,
            'fajr'    => $times['Fajr']    ?? null,
            'sunrise' => $times['Sunrise'] ?? null,
            'dhuhr'   => $times['Dhuhr']   ?? null,
            'asr'     => $times['Asr']     ?? null,
            'maghrib' => $times['Maghrib'] ?? null,
            'isha'    => $times['Isha']    ?? null,
        ];

        $current->modify('+1 day');
    }

    echo json_encode(['success' => true, 'count' => count($results), 'times' => $results]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
