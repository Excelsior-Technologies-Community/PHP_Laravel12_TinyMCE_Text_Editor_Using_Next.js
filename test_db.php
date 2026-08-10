<?php

$host = '127.0.0.1';
$port = 3306;
$dbname = 'PHP_Laravel12_TinyMCE_Text_Editor_Using_Next.js';
$username = 'root';
$password = '';

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);

    echo "Connected successfully!" . PHP_EOL;

    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "Tables: " . implode(', ', $tables) . PHP_EOL;

    $stmt = $pdo->query("SELECT COUNT(*) FROM posts");
    echo "Posts count: " . $stmt->fetchColumn() . PHP_EOL;

    $stmt = $pdo->query("SELECT COUNT(*) FROM post_images");
    echo "Images count: " . $stmt->fetchColumn() . PHP_EOL;

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . PHP_EOL;
}
