<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = [
        'title',
        'description',
        'status',
    ];

    protected $attributes = [
        'status' => 'draft',
    ];

    public function images()
    {
        return $this->hasMany(PostImage::class);
    }

    public function revisions()
    {
        return $this->hasMany(PostRevision::class)->orderByDesc('created_at');
    }
}
