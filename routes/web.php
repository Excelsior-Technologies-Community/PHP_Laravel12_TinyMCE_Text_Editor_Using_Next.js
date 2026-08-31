<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
*/

/*
|--------------------------------------------------------------------------
| Post Management
|--------------------------------------------------------------------------
|
| These routes use the same PostController methods.
|
*/

/* Main posts page */
Route::get('/posts', [PostController::class, 'index'])
    ->name('posts.index');

/* Create post */
Route::post('/posts', [PostController::class, 'store'])
    ->name('posts.store');

/* Show single post */
Route::get('/posts/{id}', [PostController::class, 'show'])
    ->name('posts.show');

/* Update post */
Route::put('/posts/{id}', [PostController::class, 'update'])
    ->name('posts.update');

/* Soft delete post */
Route::delete('/posts/{id}', [PostController::class, 'destroy'])
    ->name('posts.destroy');


/*
|--------------------------------------------------------------------------
| Trash
|--------------------------------------------------------------------------
*/

/* List trashed posts */
Route::get('/posts-trash', [PostController::class, 'trashed'])
    ->name('posts.trashed');

/* Restore single post */
Route::post('/posts/{id}/restore', [PostController::class, 'restore'])
    ->name('posts.restore');

/* Permanently delete single post */
Route::delete('/posts/{id}/force-delete', [PostController::class, 'forceDelete'])
    ->name('posts.forceDelete');


/*
|--------------------------------------------------------------------------
| Bulk Actions
|--------------------------------------------------------------------------
*/

/* Bulk soft delete */
Route::post('/posts/bulk-delete', [PostController::class, 'bulkDelete'])
    ->name('posts.bulkDelete');

/* Bulk restore */
Route::post('/posts/bulk-restore', [PostController::class, 'bulkRestore'])
    ->name('posts.bulkRestore');

/* Bulk permanent delete */
Route::post('/posts/bulk-force-delete', [PostController::class, 'bulkForceDelete'])
    ->name('posts.bulkForceDelete');


/*
|--------------------------------------------------------------------------
| Statistics
|--------------------------------------------------------------------------
*/

Route::get('/posts-statistics', [PostController::class, 'statistics'])
    ->name('posts.statistics');


/*
|--------------------------------------------------------------------------
| Statuses
|--------------------------------------------------------------------------
*/

Route::get('/posts-statuses', [PostController::class, 'statuses'])
    ->name('posts.statuses');


/*
|--------------------------------------------------------------------------
| Images
|--------------------------------------------------------------------------
*/

/* List images */
Route::get('/post-images', [PostController::class, 'listImages'])
    ->name('posts.images.index');

/* Upload image */
Route::post('/post-images', [PostController::class, 'uploadImage'])
    ->name('posts.images.upload');

/* Delete image */
Route::delete('/post-images/{id}', [PostController::class, 'deleteImage'])
    ->name('posts.images.delete');


/*
|--------------------------------------------------------------------------
| Revisions
|--------------------------------------------------------------------------
*/

/* List revisions */
Route::get('/posts/{id}/revisions', [PostController::class, 'listRevisions'])
    ->name('posts.revisions.index');

/* Show revision */
Route::get(
    '/posts/{postId}/revisions/{revisionId}',
    [PostController::class, 'showRevision']
)->name('posts.revisions.show');

/* Restore revision */
Route::post(
    '/posts/{postId}/revisions/{revisionId}/restore',
    [PostController::class, 'restoreRevision']
)->name('posts.revisions.restore');