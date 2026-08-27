<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostImage;
use App\Models\PostRevision;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    // =========================================================
    // LIST POSTS
    // Search + Pagination + Status Filter
    // =========================================================
    public function index(Request $request)
    {
        $search = $request->query('search', '');
        $status = $request->query('status', '');
        $perPage = (int) $request->query('per_page', 10);

        $perPage = min(max($perPage, 1), 100);

        $query = Post::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('meta_title', 'like', "%{$search}%")
                    ->orWhere('meta_description', 'like', "%{$search}%");
            });
        }

        if (
            $status !== '' &&
            in_array($status, ['draft', 'published', 'archived'], true)
        ) {
            $query->where('status', $status);
        }

        $posts = $query
            ->orderByDesc('id')
            ->paginate($perPage)
            ->appends($request->query());

        return response()->json($posts);
    }

    // =========================================================
    // STORE
    // =========================================================
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,published,archived',

            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                'unique:posts,slug',
            ],

            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ], [
            'slug.regex' => 'Slug may contain lowercase letters, numbers and hyphens only.',
            'meta_title.max' => 'Meta title should not exceed 60 characters.',
            'meta_description.max' => 'Meta description should not exceed 160 characters.',
        ]);

        if (empty($validated['slug'])) {
            $validated['slug'] = Post::generateUniqueSlug(
                $validated['title']
            );
        } else {
            $validated['slug'] = Str::slug($validated['slug']);

            $validated['slug'] = Post::generateUniqueSlug(
                $validated['slug']
            );
        }

        $post = Post::create($validated);

        return response()->json($post, 201);
    }

    // =========================================================
    // SHOW
    // =========================================================
    public function show($id)
    {
        return response()->json(
            Post::findOrFail($id)
        );
    }

    // =========================================================
    // UPDATE
    // =========================================================
    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'nullable|in:draft,published,archived',

            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::unique('posts', 'slug')->ignore($post->id),
            ],

            'meta_title' => 'nullable|string|max:60',
            'meta_description' => 'nullable|string|max:160',
        ], [
            'slug.regex' => 'Slug may contain lowercase letters, numbers and hyphens only.',
            'meta_title.max' => 'Meta title should not exceed 60 characters.',
            'meta_description.max' => 'Meta description should not exceed 160 characters.',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Generate slug when empty
        |--------------------------------------------------------------------------
        */
        if (empty($validated['slug'])) {
            $validated['slug'] = Post::generateUniqueSlug(
                $validated['title'],
                $post->id
            );
        } else {
            $validated['slug'] = Str::slug($validated['slug']);

            $validated['slug'] = Post::generateUniqueSlug(
                $validated['slug'],
                $post->id
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Save previous content as revision
        |--------------------------------------------------------------------------
        */
        PostRevision::create([
            'post_id' => $post->id,
            'title' => $post->title,
            'content' => $post->description,
        ]);

        $post->update($validated);

        return response()->json($post);
    }

    // =========================================================
    // STATUSES
    // =========================================================
    public function statuses()
    {
        return response()->json([
            'draft' => 'Draft',
            'published' => 'Published',
            'archived' => 'Archived',
        ]);
    }

    // =========================================================
    // LIST IMAGES
    // =========================================================
    public function listImages(Request $request)
    {
        $postId = $request->query('post_id');

        $query = PostImage::query();

        if ($postId) {
            $query->where('post_id', $postId);
        }

        return response()->json(
            $query->orderByDesc('id')->get()
        );
    }

    // =========================================================
    // UPLOAD IMAGE
    // =========================================================
    public function uploadImage(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:2048|mimes:jpg,jpeg,png,gif,webp',
        ]);

        $file = $request->file('file');

        $filename =
            time() .
            '_' .
            Str::random(10) .
            '.' .
            $file->getClientOriginalExtension();

        $path = $file->storeAs(
            'uploads',
            $filename,
            'public'
        );

        $image = PostImage::create([
            'post_id' => $request->post_id,
            'url' => Storage::url($path),
            'filename' => $filename,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json($image, 201);
    }

    // =========================================================
    // DELETE IMAGE
    // =========================================================
    public function deleteImage($id)
    {
        $image = PostImage::findOrFail($id);

        if ($image->url) {
            $relativePath = str_replace(
                '/storage/',
                '',
                $image->url
            );

            Storage::disk('public')->delete($relativePath);
        }

        $image->delete();

        return response()->json([
            'message' => 'Image deleted successfully',
        ]);
    }

    // =========================================================
    // LIST REVISIONS
    // =========================================================
    public function listRevisions($id)
    {
        $post = Post::findOrFail($id);

        return response()->json(
            $post->revisions
        );
    }

    // =========================================================
    // GET REVISION
    // =========================================================
    public function showRevision($postId, $revisionId)
    {
        $revision = PostRevision::where(
            'post_id',
            $postId
        )->findOrFail($revisionId);

        return response()->json($revision);
    }

    // =========================================================
    // RESTORE REVISION
    // =========================================================
    public function restoreRevision($postId, $revisionId)
    {
        $post = Post::findOrFail($postId);

        $revision = PostRevision::where(
            'post_id',
            $postId
        )->findOrFail($revisionId);

        $post->update([
            'title' => $revision->title,
            'description' => $revision->content,
        ]);

        return response()->json($post);
    }
}