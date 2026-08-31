<?php

namespace App\Http\Controllers;

use App\Models\Post;
use App\Models\PostImage;
use App\Models\PostRevision;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class PostController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | LIST POSTS
    |--------------------------------------------------------------------------
    | Features:
    | - Search
    | - Status filter
    | - Sorting
    | - Pagination
    | - Statistics
    | - Default 5 records per page
    |--------------------------------------------------------------------------
    */
    public function index(Request $request)
    {
        $search = trim($request->query('search', ''));
        $status = trim($request->query('status', ''));

        $sortBy = $request->query('sort_by', 'id');
        $sortOrder = strtolower($request->query('sort_order', 'desc'));

        // Default = 5 records per page
        $perPage = (int) $request->query('per_page', 5);

        // Keep pagination between 1 and 100
        $perPage = min(max($perPage, 1), 100);

        /*
        |--------------------------------------------------------------------------
        | Allowed sorting columns
        |--------------------------------------------------------------------------
        */
        $allowedSortColumns = [
            'id',
            'title',
            'status',
            'created_at',
            'updated_at',
        ];

        if (!in_array($sortBy, $allowedSortColumns, true)) {
            $sortBy = 'id';
        }

        if (!in_array($sortOrder, ['asc', 'desc'], true)) {
            $sortOrder = 'desc';
        }

        /*
        |--------------------------------------------------------------------------
        | Main query
        |--------------------------------------------------------------------------
        */
        $query = Post::query();

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        */
        if ($search !== '') {
            $query->where(function ($q) use ($search) {

                $q->where('title', 'like', "%{$search}%")

                    ->orWhere(
                        'description',
                        'like',
                        "%{$search}%"
                    )

                    ->orWhere(
                        'slug',
                        'like',
                        "%{$search}%"
                    )

                    ->orWhere(
                        'meta_title',
                        'like',
                        "%{$search}%"
                    )

                    ->orWhere(
                        'meta_description',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        /*
        |--------------------------------------------------------------------------
        | Status filter
        |--------------------------------------------------------------------------
        */
        if (
            $status !== '' &&
            in_array(
                $status,
                [
                    'draft',
                    'published',
                    'archived',
                ],
                true
            )
        ) {
            $query->where('status', $status);
        }

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */
        $query->orderBy(
            $sortBy,
            $sortOrder
        );

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        |
        | Default:
        | per_page = 5
        |
        | Examples:
        |
        | /api/posts
        | /api/posts?page=1
        | /api/posts?page=2
        | /api/posts?page=3
        | /api/posts?per_page=5
        |
        |--------------------------------------------------------------------------
        */
        $posts = $query
            ->paginate($perPage)
            ->appends($request->query());

        /*
        |--------------------------------------------------------------------------
        | Statistics
        |--------------------------------------------------------------------------
        |
        | withTrashed() includes soft deleted posts.
        |--------------------------------------------------------------------------
        */
        $allPosts = Post::withTrashed();

        $stats = [
            'total' => (clone $allPosts)->count(),

            'draft' => (clone $allPosts)
                ->where('status', 'draft')
                ->count(),

            'published' => (clone $allPosts)
                ->where('status', 'published')
                ->count(),

            'archived' => (clone $allPosts)
                ->where('status', 'archived')
                ->count(),

            'trashed' => (clone $allPosts)
                ->onlyTrashed()
                ->count(),
        ];

        /*
        |--------------------------------------------------------------------------
        | Return JSON
        |--------------------------------------------------------------------------
        */
        return response()->json([
            'data' => $posts->items(),

            'current_page' => $posts->currentPage(),

            'last_page' => $posts->lastPage(),

            'per_page' => $posts->perPage(),

            'total' => $posts->total(),

            'from' => $posts->firstItem(),

            'to' => $posts->lastItem(),

            'stats' => $stats,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STORE
    |--------------------------------------------------------------------------
    */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',

            'description' => 'nullable|string',

            'status' => [
                'nullable',
                Rule::in([
                    'draft',
                    'published',
                    'archived',
                ]),
            ],

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
            'slug.regex' =>
                'Slug may contain lowercase letters, numbers and hyphens only.',

            'meta_title.max' =>
                'Meta title should not exceed 60 characters.',

            'meta_description.max' =>
                'Meta description should not exceed 160 characters.',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Default status
        |--------------------------------------------------------------------------
        */
        if (empty($validated['status'])) {
            $validated['status'] = 'draft';
        }

        /*
        |--------------------------------------------------------------------------
        | Generate slug
        |--------------------------------------------------------------------------
        */
        if (empty($validated['slug'])) {

            $validated['slug'] = Post::generateUniqueSlug(
                $validated['title']
            );

        } else {

            $validated['slug'] = Str::slug(
                $validated['slug']
            );

            $validated['slug'] = Post::generateUniqueSlug(
                $validated['slug']
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Create post
        |--------------------------------------------------------------------------
        */
        $post = Post::create($validated);

        return response()->json([
            'message' => 'Post created successfully.',

            'data' => $post,
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | SHOW
    |--------------------------------------------------------------------------
    */
    public function show($id)
    {
        $post = Post::findOrFail($id);

        return response()->json([
            'data' => $post,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | UPDATE
    |--------------------------------------------------------------------------
    */
    public function update(
        Request $request,
        $id
    ) {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string|max:255',

            'description' => 'nullable|string',

            'status' => [
                'nullable',
                Rule::in([
                    'draft',
                    'published',
                    'archived',
                ]),
            ],

            'slug' => [
                'nullable',
                'string',
                'max:255',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',

                Rule::unique(
                    'posts',
                    'slug'
                )->ignore($post->id),
            ],

            'meta_title' => 'nullable|string|max:60',

            'meta_description' => 'nullable|string|max:160',
        ], [
            'slug.regex' =>
                'Slug may contain lowercase letters, numbers and hyphens only.',

            'meta_title.max' =>
                'Meta title should not exceed 60 characters.',

            'meta_description.max' =>
                'Meta description should not exceed 160 characters.',
        ]);

        /*
        |--------------------------------------------------------------------------
        | Generate slug
        |--------------------------------------------------------------------------
        */
        if (empty($validated['slug'])) {

            $validated['slug'] = Post::generateUniqueSlug(
                $validated['title'],
                $post->id
            );

        } else {

            $validated['slug'] = Str::slug(
                $validated['slug']
            );

            $validated['slug'] = Post::generateUniqueSlug(
                $validated['slug'],
                $post->id
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Save current content as revision
        |--------------------------------------------------------------------------
        */
        PostRevision::create([
            'post_id' => $post->id,

            'title' => $post->title,

            'content' => $post->description,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Update post
        |--------------------------------------------------------------------------
        */
        $post->update($validated);

        return response()->json([
            'message' => 'Post updated successfully.',

            'data' => $post->fresh(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE / SOFT DELETE
    |--------------------------------------------------------------------------
    */
    public function destroy($id)
    {
        $post = Post::findOrFail($id);

        $post->delete();

        return response()->json([
            'message' =>
                'Post moved to trash successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | RESTORE
    |--------------------------------------------------------------------------
    */
    public function restore($id)
    {
        $post = Post::onlyTrashed()
            ->findOrFail($id);

        $post->restore();

        return response()->json([
            'message' =>
                'Post restored successfully.',

            'data' => $post->fresh(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | PERMANENT DELETE
    |--------------------------------------------------------------------------
    */
    public function forceDelete($id)
    {
        $post = Post::onlyTrashed()
            ->findOrFail($id);

        /*
        |--------------------------------------------------------------------------
        | Delete physical images
        |--------------------------------------------------------------------------
        */
        $images = PostImage::where(
            'post_id',
            $post->id
        )->get();

        foreach ($images as $image) {

            if ($image->url) {

                $relativePath = str_replace(
                    '/storage/',
                    '',
                    $image->url
                );

                Storage::disk('public')
                    ->delete($relativePath);
            }
        }

        /*
        |--------------------------------------------------------------------------
        | Delete image records
        |--------------------------------------------------------------------------
        */
        PostImage::where(
            'post_id',
            $post->id
        )->delete();

        /*
        |--------------------------------------------------------------------------
        | Delete revisions
        |--------------------------------------------------------------------------
        */
        PostRevision::where(
            'post_id',
            $post->id
        )->delete();

        /*
        |--------------------------------------------------------------------------
        | Permanent delete
        |--------------------------------------------------------------------------
        */
        $post->forceDelete();

        return response()->json([
            'message' =>
                'Post permanently deleted.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | BULK DELETE
    |--------------------------------------------------------------------------
    */
    public function bulkDelete(
        Request $request
    ) {
        $validated = $request->validate([
            'ids' => 'required|array|min:1',

            'ids.*' =>
                'integer|exists:posts,id',
        ]);

        $posts = Post::whereIn(
            'id',
            $validated['ids']
        )->get();

        $count = 0;

        foreach ($posts as $post) {

            $post->delete();

            $count++;
        }

        return response()->json([
            'message' =>
                "{$count} post(s) moved to trash.",

            'count' => $count,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | BULK RESTORE
    |--------------------------------------------------------------------------
    */
    public function bulkRestore(
        Request $request
    ) {
        $validated = $request->validate([
            'ids' =>
                'required|array|min:1',

            'ids.*' =>
                'integer',
        ]);

        $posts = Post::onlyTrashed()
            ->whereIn(
                'id',
                $validated['ids']
            )
            ->get();

        $count = 0;

        foreach ($posts as $post) {

            $post->restore();

            $count++;
        }

        return response()->json([
            'message' =>
                "{$count} post(s) restored successfully.",

            'count' => $count,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | BULK PERMANENT DELETE
    |--------------------------------------------------------------------------
    */
    public function bulkForceDelete(
        Request $request
    ) {
        $validated = $request->validate([
            'ids' =>
                'required|array|min:1',

            'ids.*' =>
                'integer',
        ]);

        $posts = Post::onlyTrashed()
            ->whereIn(
                'id',
                $validated['ids']
            )
            ->get();

        $count = 0;

        DB::transaction(
            function () use (
                $posts,
                &$count
            ) {

                foreach ($posts as $post) {

                    /*
                    |--------------------------------------------------------------------------
                    | Delete physical images
                    |--------------------------------------------------------------------------
                    */
                    $images = PostImage::where(
                        'post_id',
                        $post->id
                    )->get();

                    foreach ($images as $image) {

                        if ($image->url) {

                            $relativePath = str_replace(
                                '/storage/',
                                '',
                                $image->url
                            );

                            Storage::disk('public')
                                ->delete(
                                    $relativePath
                                );
                        }
                    }

                    /*
                    |--------------------------------------------------------------------------
                    | Delete image records
                    |--------------------------------------------------------------------------
                    */
                    PostImage::where(
                        'post_id',
                        $post->id
                    )->delete();

                    /*
                    |--------------------------------------------------------------------------
                    | Delete revisions
                    |--------------------------------------------------------------------------
                    */
                    PostRevision::where(
                        'post_id',
                        $post->id
                    )->delete();

                    /*
                    |--------------------------------------------------------------------------
                    | Permanent delete
                    |--------------------------------------------------------------------------
                    */
                    $post->forceDelete();

                    $count++;
                }
            }
        );

        return response()->json([
            'message' =>
                "{$count} post(s) permanently deleted.",

            'count' => $count,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | TRASHED POSTS
    |--------------------------------------------------------------------------
    | Default = 5 records per page
    |--------------------------------------------------------------------------
    */
    public function trashed(
        Request $request
    ) {
        $search = trim(
            $request->query(
                'search',
                ''
            )
        );

        $perPage = (int) $request->query(
            'per_page',
            5
        );

        $perPage = min(
            max($perPage, 1),
            100
        );

        $query = Post::onlyTrashed();

        /*
        |--------------------------------------------------------------------------
        | Search trashed posts
        |--------------------------------------------------------------------------
        */
        if ($search !== '') {

            $query->where(
                function ($q) use ($search) {

                    $q->where(
                        'title',
                        'like',
                        "%{$search}%"
                    )

                        ->orWhere(
                            'description',
                            'like',
                            "%{$search}%"
                        )

                        ->orWhere(
                            'slug',
                            'like',
                            "%{$search}%"
                        );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Pagination
        |--------------------------------------------------------------------------
        */
        $posts = $query
            ->orderByDesc('deleted_at')
            ->paginate($perPage)
            ->appends(
                $request->query()
            );

        return response()->json([
            'data' => $posts->items(),

            'current_page' =>
                $posts->currentPage(),

            'last_page' =>
                $posts->lastPage(),

            'per_page' =>
                $posts->perPage(),

            'total' =>
                $posts->total(),

            'from' =>
                $posts->firstItem(),

            'to' =>
                $posts->lastItem(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STATISTICS
    |--------------------------------------------------------------------------
    */
    public function statistics()
    {
        $query = Post::withTrashed();

        return response()->json([
            'total' =>
                (clone $query)->count(),

            'draft' =>
                (clone $query)
                    ->where(
                        'status',
                        'draft'
                    )
                    ->count(),

            'published' =>
                (clone $query)
                    ->where(
                        'status',
                        'published'
                    )
                    ->count(),

            'archived' =>
                (clone $query)
                    ->where(
                        'status',
                        'archived'
                    )
                    ->count(),

            'trashed' =>
                (clone $query)
                    ->onlyTrashed()
                    ->count(),
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | STATUSES
    |--------------------------------------------------------------------------
    */
    public function statuses()
    {
        return response()->json([
            'draft' => 'Draft',

            'published' => 'Published',

            'archived' => 'Archived',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | LIST IMAGES
    |--------------------------------------------------------------------------
    */
    public function listImages(
        Request $request
    ) {
        $postId = $request->query(
            'post_id'
        );

        $query = PostImage::query();

        if ($postId) {

            $query->where(
                'post_id',
                $postId
            );
        }

        return response()->json(
            $query
                ->orderByDesc('id')
                ->get()
        );
    }


    /*
    |--------------------------------------------------------------------------
    | UPLOAD IMAGE
    |--------------------------------------------------------------------------
    */
    public function uploadImage(
        Request $request
    ) {
        $request->validate([
            'file' =>
                'required|image|max:2048|mimes:jpg,jpeg,png,gif,webp',

            'post_id' =>
                'nullable|integer|exists:posts,id',
        ]);

        $file = $request->file('file');

        /*
        |--------------------------------------------------------------------------
        | Generate unique filename
        |--------------------------------------------------------------------------
        */
        $filename =
            time()
            . '_'
            . Str::random(10)
            . '.'
            . $file->getClientOriginalExtension();

        /*
        |--------------------------------------------------------------------------
        | Store file
        |--------------------------------------------------------------------------
        */
        $path = $file->storeAs(
            'uploads',
            $filename,
            'public'
        );

        /*
        |--------------------------------------------------------------------------
        | Create image record
        |--------------------------------------------------------------------------
        */
        $image = PostImage::create([
            'post_id' =>
                $request->post_id,

            'url' =>
                Storage::url($path),

            'filename' =>
                $filename,

            'mime_type' =>
                $file->getMimeType(),

            'size' =>
                $file->getSize(),
        ]);

        return response()->json([
            'message' =>
                'Image uploaded successfully.',

            'data' => $image,
        ], 201);
    }


    /*
    |--------------------------------------------------------------------------
    | DELETE IMAGE
    |--------------------------------------------------------------------------
    */
    public function deleteImage($id)
    {
        $image = PostImage::findOrFail($id);

        /*
        |--------------------------------------------------------------------------
        | Delete physical file
        |--------------------------------------------------------------------------
        */
        if ($image->url) {

            $relativePath = str_replace(
                '/storage/',
                '',
                $image->url
            );

            Storage::disk('public')
                ->delete($relativePath);
        }

        /*
        |--------------------------------------------------------------------------
        | Delete database record
        |--------------------------------------------------------------------------
        */
        $image->delete();

        return response()->json([
            'message' =>
                'Image deleted successfully.',
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | LIST REVISIONS
    |--------------------------------------------------------------------------
    */
    public function listRevisions($id)
    {
        $post = Post::findOrFail($id);

        return response()->json(
            $post
                ->revisions()
                ->latest()
                ->get()
        );
    }


    /*
    |--------------------------------------------------------------------------
    | GET REVISION
    |--------------------------------------------------------------------------
    */
    public function showRevision(
        $postId,
        $revisionId
    ) {
        /*
        |--------------------------------------------------------------------------
        | Make sure post exists
        |--------------------------------------------------------------------------
        */
        Post::findOrFail($postId);

        /*
        |--------------------------------------------------------------------------
        | Find revision belonging to post
        |--------------------------------------------------------------------------
        */
        $revision = PostRevision::where(
            'post_id',
            $postId
        )->findOrFail(
            $revisionId
        );

        return response()->json([
            'data' => $revision,
        ]);
    }


    /*
    |--------------------------------------------------------------------------
    | RESTORE REVISION
    |--------------------------------------------------------------------------
    */
    public function restoreRevision(
        $postId,
        $revisionId
    ) {
        $post = Post::findOrFail(
            $postId
        );

        $revision = PostRevision::where(
            'post_id',
            $postId
        )->findOrFail(
            $revisionId
        );

        /*
        |--------------------------------------------------------------------------
        | Save current content as revision
        |--------------------------------------------------------------------------
        */
        PostRevision::create([
            'post_id' =>
                $post->id,

            'title' =>
                $post->title,

            'content' =>
                $post->description,
        ]);

        /*
        |--------------------------------------------------------------------------
        | Restore revision
        |--------------------------------------------------------------------------
        */
        $post->update([
            'title' =>
                $revision->title,

            'description' =>
                $revision->content,
        ]);

        return response()->json([
            'message' =>
                'Revision restored successfully.',

            'data' =>
                $post->fresh(),
        ]);
    }
}