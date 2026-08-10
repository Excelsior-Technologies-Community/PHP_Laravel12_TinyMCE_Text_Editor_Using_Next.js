<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Post;
use App\Models\PostImage;

$statuses = ['draft', 'published', 'archived'];

for ($i = 1; $i <= 10; $i++) {
    $status = $statuses[$i % 3];
    $post = Post::create([
        'title' => 'Tinker Post ' . $i,
        'description' => '<p>Tinker content for post ' . $i . '</p><p>Status: ' . $status . '</p>',
        'status' => $status,
    ]);
    PostImage::create([
        'post_id' => $post->id,
        'url' => 'https://picsum.photos/seed/tinker' . $post->id . '/600/400',
        'filename' => 'tinker_' . $post->id . '.jpg',
        'mime_type' => 'image/jpeg',
        'size' => rand(50000, 300000),
    ]);
    echo $post->id . "\n";
}
echo "Done\n";
