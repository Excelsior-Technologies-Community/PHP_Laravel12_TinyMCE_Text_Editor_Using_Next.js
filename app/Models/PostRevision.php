<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PostRevision extends Model
{
    protected $fillable = ['post_id', 'title', 'content'];

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
