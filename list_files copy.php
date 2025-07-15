<?php
  header('Content-Type: application/json');

  $saveDir = 'lagu-liturgi/';
  $files = [];
  $response = ['success' => false, 'files' => []];

  if (is_dir($saveDir)) {
      // Scan direktori dan filter hanya file .txt
      $items = scandir($saveDir);
      foreach ($items as $item) {
          // Abaikan '.' dan '..' serta file yang bukan .txt
          if ($item !== '.' && $item !== '..' && is_file($saveDir . $item) && strtolower(pathinfo($item, PATHINFO_EXTENSION)) === 'txt') {
              $files[] = $item;
          }
      }
      $response['success'] = true;
      $response['files'] = $files;
  } else {
      $response['message'] = 'Direktori penyimpanan tidak ditemukan.';
  }

  echo json_encode($response);
?>

