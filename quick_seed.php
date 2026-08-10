<?php
$autoload = __DIR__ . '/vendor/autoload.php';
require $autoload;
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Post;
use App\Models\PostImage;

$statuses = ['draft', 'published', 'archived'];

for ($i = 1; $i <= 10; $i++) {
    $status = $statuses[$i % 3];
    $post = Post::create([
        'title' => 'Sample Post ' . $i,
        'description' => '<p>Content for post ' . $i . '</p>',
        'status' => $status,
    ]);

    PostImage::create([
        'post_id' => $post->id,
        'url' => 'https://picsum.photos/seed/post' . $post->id . '/600/400',
        'filename' => 'sample_' . $post->id . '.jpg',
        'mime_type' => 'image/jpeg',
        'size' => rand(50000, 300000),
    ]);

    echo $post->id . "\n";
}

echo "Done\n";
