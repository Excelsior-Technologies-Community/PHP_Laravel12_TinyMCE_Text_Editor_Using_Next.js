<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;

/*
|--------------------------------------------------------------------------
| Post Status
|--------------------------------------------------------------------------
*/
Route::get('/posts/statuses', [PostController::class, 'statuses']);

/*
|--------------------------------------------------------------------------
| Images
|--------------------------------------------------------------------------
*/
Route::get('/posts/images', [PostController::class, 'listImages']);
Route::post('/posts/images/upload', [PostController::class, 'uploadImage']);
Route::delete('/posts/images/{id}', [PostController::class, 'deleteImage']);

/*
|--------------------------------------------------------------------------
| Posts
|--------------------------------------------------------------------------
*/
Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);

/*
|--------------------------------------------------------------------------
| Revisions
|--------------------------------------------------------------------------
*/
Route::get('/posts/{id}/revisions', [PostController::class, 'listRevisions']);

Route::get(
    '/posts/{id}/revisions/{revisionId}',
    [PostController::class, 'showRevision']
);

Route::post(
    '/posts/{id}/revisions/{revisionId}/restore',
    [PostController::class, 'restoreRevision']
);

/*
|--------------------------------------------------------------------------
| Single Post
|--------------------------------------------------------------------------
*/
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::post('/posts/{id}', [PostController::class, 'update']);