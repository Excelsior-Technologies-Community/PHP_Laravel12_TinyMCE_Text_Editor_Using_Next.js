<?php
file_put_contents('mysql_test.txt', "Starting...\n", FILE_APPEND);

$host = '127.0.0.1';
$port = 3306;
$dbname = 'PHP_Laravel12_TinyMCE_Text_Editor_Using_Next.js';
$username = 'root';
$password = '';

file_put_contents('mysql_test.txt', "Connecting to $host:$port...\n", FILE_APPEND);

$mysqli = @new mysqli($host, $username, $password, $dbname, $port);

if ($mysqli->connect_errno) {
    file_put_contents('mysql_test.txt', "MySQL connection failed: " . $mysqli->connect_error . "\n", FILE_APPEND);
} else {
    file_put_contents('mysql_test.txt', "MySQL connected!\n", FILE_APPEND);
    
    $result = $mysqli->query("SELECT COUNT(*) FROM posts");
    if ($result) {
        $row = $result->fetch_row();
        file_put_contents('mysql_test.txt', "Posts count: " . $row[0] . "\n", FILE_APPEND);
    }
    
    $mysqli->close();
}
