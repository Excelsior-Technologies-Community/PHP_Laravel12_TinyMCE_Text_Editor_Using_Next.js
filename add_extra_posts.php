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
        'title' => 'Extra Sample Post ' . $i . ' - ' . ucfirst($status),
        'description' => '<p>Extra content for sample post number ' . $i . '.</p><p>More <strong>rich text</strong> here.</p>',
        'status' => $status,
    ]);

    $imgCount = rand(1, 3);
    for ($j = 1; $j <= $imgCount; $j++) {
        PostImage::create([
            'post_id' => $post->id,
            'url' => 'https://picsum.photos/seed/extra' . $post->id . 'img' . $j . '/600/400',
            'filename' => 'extra_' . $post->id . '_' . $j . '.jpg',
            'mime_type' => 'image/jpeg',
            'size' => rand(50000, 500000),
        ]);
    }

    echo 'Created post ' . $post->id . ' with ' . $imgCount . ' images (' . $status . ')' . PHP_EOL;
}

echo 'Done!' . PHP_EOL;
