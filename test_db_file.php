<?php

$host = '127.0.0.1';
$port = 3306;
$dbname = 'PHP_Laravel12_TinyMCE_Text_Editor_Using_Next.js';
$username = 'root';
$password = '';

file_put_contents('db_test_output.txt', "Starting...\n", FILE_APPEND);

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4";
    file_put_contents('db_test_output.txt', "Connecting...\n", FILE_APPEND);
    
    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_TIMEOUT => 5,
    ]);

    file_put_contents('db_test_output.txt', "Connected successfully!\n", FILE_APPEND);

    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    file_put_contents('db_test_output.txt', "Tables: " . implode(', ', $tables) . "\n", FILE_APPEND);

    $stmt = $pdo->query("SELECT COUNT(*) FROM posts");
    file_put_contents('db_test_output.txt', "Posts count: " . $stmt->fetchColumn() . "\n", FILE_APPEND);

} catch (PDOException $e) {
    file_put_contents('db_test_output.txt', "Error: " . $e->getMessage() . "\n", FILE_APPEND);
}
