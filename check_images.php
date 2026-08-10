<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Post;
use App\Models\PostImage;

echo 'Posts: ' . Post::count() . PHP_EOL;
echo 'Images: ' . PostImage::count() . PHP_EOL;
echo 'With post_id: ' . PostImage::whereNotNull('post_id')->count() . PHP_EOL;
echo 'Without post_id: ' . App\Models\PostImage::whereNull('post_id')->count() . PHP_EOL;

if (PostImage::count() === 0) {
    echo "No images found. Adding sample images..." . PHP_EOL;

    $posts = Post::all();
    $imageUrls = [
        'https://picsum.photos/seed/a1/600/400',
        'https://picsum.photos/seed/b2/600/400',
        'https://picsum.photos/seed/c3/600/400',
        'https://picsum.photos/seed/d4/600/400',
        'https://picsum.photos/seed/e5/600/400',
    ];

    foreach ($posts as $post) {
        $count = rand(1, 3);
        for ($i = 0; $i < $count; $i++) {
            $url = $imageUrls[array_rand($imageUrls)];
            $filename = 'sample_' . $post->id . '_' . ($i + 1) . '.jpg';

            PostImage::create([
                'post_id' => $post->id,
                'url' => $url,
                'filename' => $filename,
                'mime_type' => 'image/jpeg',
                'size' => rand(50000, 300000),
            ]);
        }
        echo "Added {$count} images to post {$post->id}" . PHP_EOL;
    }

    echo 'Total images now: ' . PostImage::count() . PHP_EOL;
} else {
    echo "Images already exist." . PHP_EOL;
}
