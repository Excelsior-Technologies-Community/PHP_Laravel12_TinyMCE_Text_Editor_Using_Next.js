<?php

namespace App\Http\Controllers;

use App\Models\Post;
use Illuminate\Http\Request;

class PostController extends Controller
{
    // LIST
    public function index()
    {
        return response()->json(Post::orderBy('id', 'asc')->get());
    }

    // STORE
    public function store(Request $request)
    {
        $post = Post::create([
            'title' => $request->title,
            'description' => $request->description,
        ]);

        return response()->json($post);
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
        $post->update([
            'title' => $request->title,
            'description' => $request->description,
        ]);

        return response()->json($post);
    }
}
