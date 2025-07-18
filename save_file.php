<?php
header('Content-Type: application/json');

// Direktori dasar yang diizinkan untuk menyimpan
// Pastikan path ini benar dan server PHP punya izin tulis ke folder ini dan subfoldernya
$baseSaveDir = realpath(__DIR__ . '/lagu-liturgi');

$response = ['success' => false, 'message' => 'Permintaan tidak valid.'];

// Gunakan POST untuk menerima data
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['filePath']) && isset($_POST['content'])) {

    $requestedRelativePath = $_POST['filePath']; // Misal: "lagu-liturgi/lagu/nama_baru.txt"
    $content = $_POST['content'];

    // --- Validasi Keamanan Path ---

    // 1. Tolak jika mengandung '..'
    if (strpos($requestedRelativePath, '..') !== false) {
        $response['message'] = 'Format path file tidak valid (mengandung "..").';
        echo json_encode($response);
        exit;
    }

    // 2. Normalisasi dan bersihkan path (hapus ./, //, dll.)
    // Memastikan path dimulai dengan 'lagu-liturgi/'
    if (strpos($requestedRelativePath, 'lagu-liturgi/') !== 0) {
         $response['message'] = 'Path harus berada di dalam folder lagu-liturgi.';
         echo json_encode($response);
         exit;
    }
    // Hapus 'lagu-liturgi/' untuk mendapatkan path relatif terhadap $baseSaveDir
    $relativePathClean = substr($requestedRelativePath, strlen('lagu-liturgi/'));

    // 3. Bentuk path absolut yang dituju
    $targetAbsolutePath = $baseSaveDir . DIRECTORY_SEPARATOR . $relativePathClean;

    // 4. Dapatkan path absolut kanonikal
    // Ini penting untuk perbandingan yang konsisten
    $targetAbsolutePathCanonical = realpath(dirname($targetAbsolutePath)); // Dapatkan direktori target

    // 5. Cek apakah path absolut target berada di dalam baseSaveDir
    if (!$baseSaveDir || !$targetAbsolutePathCanonical || strpos($targetAbsolutePathCanonical, $baseSaveDir) !== 0) {
        $response['message'] = 'Penyimpanan di luar direktori yang diizinkan.';
        // error_log("Save attempt outside allowed dir: Target: " . $targetAbsolutePath . " | Base: " . $baseSaveDir); // Debugging
        echo json_encode($response);
        exit;
    }

    // 6. Cek ekstensi (harus .txt)
    $filename = basename($targetAbsolutePath);
    if (strtolower(pathinfo($filename, PATHINFO_EXTENSION)) !== 'txt') {
        $response['message'] = 'Hanya file .txt yang dapat disimpan.';
        echo json_encode($response);
        exit;
    }

    // --- Proses Penyimpanan ---
    try {
        // Dapatkan direktori dari path lengkap
        $directory = dirname($targetAbsolutePath);

        // Buat direktori jika belum ada (rekursif)
        if (!is_dir($directory)) {
            // Mode 0775 biasanya cukup, sesuaikan jika perlu
            if (!mkdir($directory, 0775, true)) {
                throw new Exception('Gagal membuat direktori penyimpanan.');
            }
        }

        // Cek apakah direktori bisa ditulis
        if (!is_writable($directory)) {
             throw new Exception('Direktori penyimpanan tidak dapat ditulis (masalah izin?).');
        }

        // Tulis konten ke file
        // file_put_contents bersifat atomik (lebih aman dari fopen/fwrite/fclose)
        if (file_put_contents($targetAbsolutePath, $content) !== false) {
            $response['success'] = true;
            $response['message'] = 'File berhasil disimpan.';
            $response['filename'] = $filename; // Kirim nama file yang disimpan
        } else {
            throw new Exception('Gagal menulis ke file.');
        }

    } catch (Exception $e) {
        $response['message'] = 'Terjadi kesalahan saat menyimpan: ' . $e->getMessage();
        // error_log("Save Error: " . $e->getMessage() . " | Path: " . $targetAbsolutePath); // Debugging
    }

} else {
     if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
         $response['message'] = 'Metode request harus POST.';
     } else {
         $response['message'] = 'Data tidak lengkap (filePath atau content hilang).';
     }
}

echo json_encode($response);
?>
