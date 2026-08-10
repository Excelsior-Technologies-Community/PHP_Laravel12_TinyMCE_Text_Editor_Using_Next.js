<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostImage;
use App\Models\PostRevision;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PostController extends Controller
{
    // LIST (with search, pagination, status filter)
    public function index(Request $request)
    {
        $search = $request->query('search', '');
        $status = $request->query('status', '');
        $perPage = (int) $request->query('per_page', 10);

        $query = Post::query();

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if ($status !== '' && in_array($status, ['draft', 'published', 'archived'])) {
            $query->where('status', $status);
        }

        $posts = $query->orderByDesc('id')->paginate($perPage)->appends($request->query());

        return response()->json($posts);
    }

    // STORE
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:draft,published,archived',
        ]);

        $post = Post::create($validated);

        return response()->json($post, 201);
    }

    // SHOW (EDIT)
    public function show($id)
    {
        return response()->json(Post::findOrFail($id));
    }

    // UPDATE
    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'in:draft,published,archived',
        ]);

        PostRevision::create([
            'post_id' => $post->id,
            'title' => $post->title,
            'content' => $post->description,
        ]);

        $post->update($validated);

        return response()->json($post);
    }

    // STATUSES
    public function statuses()
    {
        return response()->json([
            'draft' => 'Draft',
            'published' => 'Published',
            'archived' => 'Archived',
        ]);
    }

    // LIST IMAGES
    public function listImages(Request $request)
    {
        $postId = $request->query('post_id');
        $query = PostImage::query();

        if ($postId) {
            $query->where('post_id', $postId);
        }

        return response()->json($query->orderByDesc('id')->get());
    }

    // UPLOAD IMAGE
    public function uploadImage(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:2048|mimes:jpg,jpeg,png,gif,webp',
        ]);

        $file = $request->file('file');
        $filename = time() . '_' . Str::random(10) . '.' . $file->getClientOriginalExtension();
        $path = $file->storeAs('uploads', $filename, 'public');

        $image = PostImage::create([
            'post_id' => $request->post_id,
            'url' => Storage::url($path),
            'filename' => $filename,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json($image, 201);
    }

    // DELETE IMAGE
    public function deleteImage($id)
    {
        $image = PostImage::findOrFail($id);

        if ($image->url) {
            $relativePath = str_replace('/storage/', '', $image->url);
            Storage::disk('public')->delete($relativePath);
        }

        $image->delete();

        return response()->json(['message' => 'Image deleted successfully']);
    }

    // LIST REVISIONS
    public function listRevisions($id)
    {
        $post = Post::findOrFail($id);
        return response()->json($post->revisions);
    }

    // GET REVISION
    public function showRevision($postId, $revisionId)
    {
        $revision = PostRevision::where('post_id', $postId)->findOrFail($revisionId);
        return response()->json($revision);
    }

    // RESTORE REVISION
    public function restoreRevision($postId, $revisionId)
    {
        $post = Post::findOrFail($postId);
        $revision = PostRevision::where('post_id', $postId)->findOrFail($revisionId);

        $post->update([
            'title' => $revision->title,
            'description' => $revision->content,
        ]);

        return response()->json($post);
    }
}
