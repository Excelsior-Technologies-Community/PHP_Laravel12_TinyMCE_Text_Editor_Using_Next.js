<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;

Route::get('/posts/statuses', [PostController::class, 'statuses']);
Route::get('/posts/images', [PostController::class, 'listImages']);
Route::post('/posts/images/upload', [PostController::class, 'uploadImage']);
Route::delete('/posts/images/{id}', [PostController::class, 'deleteImage']);

Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);

Route::get('/posts/{id}/revisions', [PostController::class, 'listRevisions']);
Route::get('/posts/{id}/revisions/{revisionId}', [PostController::class, 'showRevision']);
Route::post('/posts/{id}/revisions/{revisionId}/restore', [PostController::class, 'restoreRevision']);

Route::get('/posts/{id}', [PostController::class, 'show']);
Route::post('/posts/{id}', [PostController::class, 'update']);
