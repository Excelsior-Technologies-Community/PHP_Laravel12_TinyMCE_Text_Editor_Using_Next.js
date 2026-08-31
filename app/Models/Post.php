<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Post extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'slug',
        'description',
        'status',
        'meta_title',
        'meta_description',
    ];

    protected $dates = [
        'deleted_at',
    ];

    public function revisions()
    {
        return $this->hasMany(PostRevision::class);
    }

    public static function generateUniqueSlug($title, $ignoreId = null)
    {
        $slug = \Illuminate\Support\Str::slug($title);

        $originalSlug = $slug;
        $counter = 1;

        while (
            static::withTrashed()
                ->where('slug', $slug)
                ->when(
                    $ignoreId,
                    fn ($query) =>
                        $query->where('id', '!=', $ignoreId)
                )
                ->exists()
        ) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}