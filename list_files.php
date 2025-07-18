<?php
header('Content-Type: application/json');

// Direktori dasar tempat folder lagu dan liturgi berada
$baseDir = __DIR__ . '/lagu-liturgi/';

$type = isset($_GET['type']) ? $_GET['type'] : null;

// --- DEBUGGING---
error_log("list_files.php - Menerima tipe: [" . ($type === null ? 'NULL' : $type) . "]");
// header('X-Debug-Received-Type: ' . ($type === null ? 'NULL' : $type));
// --- AKHIR DEBUGGING ---

$targetDir = '';
$files = [];
$success = false;
$message = '';

if ($type === 'song') {
    error_log("list_files.php - Tipe dikenali sebagai 'song'"); // Log jika masuk blok ini
    $targetDir = $baseDir . 'lagu/';
    $relativePathPrefix = 'lagu-liturgi/lagu/';
} elseif ($type === 'liturgy') {
    error_log("list_files.php - Tipe dikenali sebagai 'liturgy'"); // Log jika masuk blok ini
    $targetDir = $baseDir . 'liturgi/';
    $relativePathPrefix = 'lagu-liturgi/liturgi/';
} else {
    // Tambahkan nilai yang diterima ke pesan error untuk kejelasan
    $message = 'Tipe file tidak valid. Harap pilih "song" atau "liturgy". Diterima: [' . ($type === null ? 'NULL' : $type) . ']';
    error_log("list_files.php - Tipe TIDAK VALID: [" . ($type === null ? 'NULL' : $type) . "]"); // Log jika masuk blok ini
    echo json_encode(['success' => false, 'message' => $message, 'files' => []]);
    exit;
}

// Cek apakah direktori ada dan bisa dibaca
if (is_dir($targetDir) && is_readable($targetDir)) {
    try {
        // Gunakan DirectoryIterator untuk cara yang lebih OOP
        $iterator = new DirectoryIterator($targetDir);
        foreach ($iterator as $fileinfo) {
            // Hanya ambil file .txt, abaikan ., .., dan folder
            if ($fileinfo->isFile() && strtolower($fileinfo->getExtension()) === 'txt') {
                // Kirim nama file dengan path relatif dari direktori web root
                // atau dari direktori yang dikenali oleh load_file.php
                // Contoh: 'lagu-liturgi/lagu/nama_lagu.txt'
                $files[] = $relativePathPrefix . $fileinfo->getFilename();
            }
        }
        $success = true;
        // Urutkan file berdasarkan nama (opsional)
        sort($files);
    } catch (Exception $e) {
        $message = 'Terjadi kesalahan saat membaca direktori: ' . $e->getMessage();
        $success = false;
    }
} else {
    // Tambahkan detail path yang gagal dibaca untuk debugging
    $message = 'Direktori target tidak ditemukan atau tidak dapat dibaca: ' . realpath($targetDir) ?: $targetDir;
    $success = false;
}

echo json_encode([
    'success' => $success,
    'message' => $message,
    'files' => $files
]);

?>
