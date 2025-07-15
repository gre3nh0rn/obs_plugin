<?php
header('Content-Type: application/json');

// Definisikan path dasar absolut yang diizinkan
// __DIR__ adalah direktori tempat skrip ini berada (c:\xampp\htdocs\live\)
$allowedBaseDirs = [
    realpath(__DIR__ . '/lagu-liturgi/lagu'),
    realpath(__DIR__ . '/lagu-liturgi/liturgi')
];

$response = ['success' => false, 'message' => 'Nama file tidak valid atau tidak diberikan.'];

if (isset($_GET['filename'])) {
    $requestedRelativePath = $_GET['filename']; // Misal: "lagu-liturgi/lagu/nama_lagu.txt"

    // 1. Keamanan Dasar: Tolak jika mengandung '..'
    if (strpos($requestedRelativePath, '..') !== false) {
        $response['message'] = 'Format nama file tidak valid (mengandung "..").';
        echo json_encode($response);
        exit;
    }

    // 2. Buat path absolut yang diminta
    // Pastikan menggunakan DIRECTORY_SEPARATOR untuk kompatibilitas OS
    $requestedAbsolutePath = realpath(__DIR__ . DIRECTORY_SEPARATOR . $requestedRelativePath);

    // 3. Validasi Path
    $isValid = false;
    if ($requestedAbsolutePath !== false) { // Pastikan realpath berhasil (file/dir ada)
        foreach ($allowedBaseDirs as $allowedDir) {
            // Cek apakah path absolut yang diminta berada di dalam salah satu direktori yang diizinkan
            if ($allowedDir !== false && strpos($requestedAbsolutePath, $allowedDir . DIRECTORY_SEPARATOR) === 0) {
                 // Cek apakah itu benar-benar file (bukan direktori)
                 if (is_file($requestedAbsolutePath)) {
                     $isValid = true;
                     break; // Path valid, keluar dari loop
                 }
            }
        }
    }

    // Ambil nama file saja untuk pesan error/sukses
    $filenameOnly = basename($requestedRelativePath);

    if ($isValid) {
        // 4. Cek ekstensi (sebagai lapisan tambahan)
        if (strtolower(pathinfo($requestedAbsolutePath, PATHINFO_EXTENSION)) === 'txt') {
            // 5. Cek keterbacaan
            if (is_readable($requestedAbsolutePath)) {
                $content = file_get_contents($requestedAbsolutePath);
                if ($content !== false) {
                    $response['success'] = true;
                    $response['content'] = $content;
                    $response['filename'] = $filenameOnly; // Kirim nama file saja
                    unset($response['message']); // Hapus pesan error default
                } else {
                    $response['message'] = 'Gagal membaca konten file: ' . $filenameOnly;
                }
            } else {
                $response['message'] = 'File tidak dapat dibaca (masalah izin?): ' . $filenameOnly;
            }
        } else {
            $response['message'] = 'File bukan tipe .txt: ' . $filenameOnly;
        }
    } else {
        // Jika $isValid tetap false setelah semua pengecekan
        $response['message'] = 'File tidak ditemukan atau berada di luar direktori yang diizinkan: ' . $filenameOnly;
    }
}

echo json_encode($response);
?>
