# PHP_Laravel12_TinyMCE_Text_Editor_Using_Next.js
# Step 1 : install laravel 12 and Create Project 
```php
composer create-project laravel/laravel PHP_Laravel12_TinyMCE_Text_Editor_Using_Next.JS
```
# Step 2 : Setup Database for.env file
```php
 DB_CONNECTION=mysql
 DB_HOST=127.0.0.1
 DB_PORT=3306
 DB_DATABASE=your database name
 DB_USERNAME=root
 DB_PASSWORD=
```
# Now Create Simple Tinymce text editor using laravel and Next.js followed all step:

# Step 3 : Create migration file for database table 
Command
```php
php artisan make:migration create_post_table
```
File path
database/migrations/xxxx_xx_xx_create_post_table.php
Migration Code:
```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->string('title');
    $table->longText('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
```
Run migration
```php
php artisan migrate
```
# Step 4 : Create Model 
Command
```php
php artisan make:model Post
```
File path
app/Models/Post.php
Model Code
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Post extends Model
{
    protected $fillable = [
        'title',
        'description'
    ];
}
```
# Step 5 : Create Controller 
Command
```php
php artisan make:controller PostController
```
File path
app/Http/Controllers/PostController.php
Controller Code
```php
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
```
# Step 6 : Create route for routes/web.php file
```php
<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PostController;

Route::get('/posts', [PostController::class, 'index']);
Route::post('/posts', [PostController::class, 'store']);
Route::get('/posts/{id}', [PostController::class, 'show']);
Route::post('/posts/{id}', [PostController::class, 'update']);
```
# Step 7 : Now Install Next.js and open terminal and run command
Command run :
```php
npx create-next-app next-auth-frontend
```

# Now  Show the Next.js Package successfull install 

<img width="398" height="646" alt="image" src="https://github.com/user-attachments/assets/cce684c7-c0c0-42cf-a70c-92287e239b7e" />

# Step 8 : Now Open New Terminal and  select next-auth-frontend this folder :
# Now install tinymce text editor package
```
npm install tinymce @tinymce/tinymce-vue
```
# And now create index.js ,  create.js and edit.js file into pages folder:
# next-auth-frontend/pages/index.js
```php
import { useEffect, useState } from "react";

export default function Index() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    fetch("/api/posts")
      .then((res) => res.json())
      .then((data) => setPosts(data));
  }, []);

  return (
    <div className="container">
      <h2 className="heading">Posts</h2>

      <a href="/create" className="create-btn">
        + Create New
      </a>

      <table className="table">
        <thead>
          <tr>
            <th style={{ width: "60px" }}>ID</th>
            <th style={{ width: "200px" }}>Title</th>
            <th>Description</th>
            <th style={{ width: "100px" }}>Action</th>
          </tr>
        </thead>

        <tbody>
          {posts.length === 0 && (
            <tr>
              <td colSpan="4" className="empty">
                No records found
              </td>
            </tr>
          )}

          {posts.map((post) => (
            <tr key={post.id}>
              <td>{post.id}</td>

              <td className="title-cell">
                {post.title}
              </td>

              <td>
                <div
                  className="description"
                  dangerouslySetInnerHTML={{ __html: post.description }}
                />
              </td>

              <td>
                <a href={`/edit?id=${post.id}`} className="edit-link">
                  Edit
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Inline CSS */}
      <style jsx>{`
        .container {
          max-width: 1100px;
          margin: 40px auto;
          font-family: Arial, sans-serif;
        }

        .heading {
          margin-bottom: 10px;
        }

        .create-btn {
          display: inline-block;
          margin-bottom: 15px;
          text-decoration: none;
          color: #2563eb;
          font-weight: bold;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          background: #fff;
        }

        .table th {
          background: #f3f4f6;
          text-align: left;
          padding: 10px;
          border: 1px solid #ddd;
        }

        .table td {
          padding: 10px;
          vertical-align: top;
          border: 1px solid #ddd;
        }

        .title-cell {
          font-weight: bold;
          color: #111827;
        }

        .description {
          color: #374151;
          line-height: 1.5;
        }

        .edit-link {
          color: #2563eb;
          text-decoration: none;
          font-weight: 500;
        }

        .edit-link:hover {
          text-decoration: underline;
        }

        .empty {
          text-align: center;
          padding: 20px;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}
```

# next-auth-frontend/pages/create.js
```php
import { useState } from "react";
import { useRouter } from "next/router";
import dynamic from "next/dynamic";

const TinyEditor = dynamic(() => import("../tinymce"), { ssr: false });

export default function Create() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const save = async () => {
    await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    router.push("/");
  };

  return (
    <div className="wrapper">
      <h2>Create Post</h2>

      <label>Title</label>
      <input
        className="input"
        placeholder="Enter title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label>Description</label>
      <TinyEditor onChange={setDescription} />

      <button type="button" className="btn" onClick={save}>
        Save
      </button>

      <style jsx>{`
        .wrapper {
          max-width: 900px;
          margin: 40px auto;
          font-family: Arial, sans-serif;
        }

        label {
          display: block;
          margin: 15px 0 6px;
          font-weight: bold;
        }

        .input {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .btn {
          margin-top: 15px;
          padding: 10px 18px;
          background: #2563eb;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn:hover {
          background: #1d4ed8;
        }
      `}</style>
    </div>
  );
}
```

# next-auth-frontend/pages/edit.js
```php
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const TinyEditor = dynamic(() => import("../tinymce"), { ssr: false });

export default function Edit() {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!id) return;

    fetch(`/api/posts/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setTitle(data.title);
        setDescription(data.description);
      });
  }, [id]);

  const update = async () => {
    await fetch(`/api/posts/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description }),
    });

    router.push("/");
  };

  return (
    <div className="wrapper">
      <h2>Edit Post</h2>

      <label>Title</label>
      <input
        className="input"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <label>Description</label>

      {/* 🔥 key={id} = NO refresh while typing */}
      <TinyEditor
        key={id}
        value={description}
        onChange={setDescription}
      />

      <button type="button" className="btn" onClick={update}>
        Update
      </button>

      <style jsx>{`
        .wrapper {
          max-width: 900px;
          margin: 40px auto;
          font-family: Arial, sans-serif;
        }

        label {
          display: block;
          margin: 15px 0 6px;
          font-weight: bold;
        }

        .input {
          width: 100%;
          padding: 10px;
          border: 1px solid #d1d5db;
          border-radius: 4px;
        }

        .btn {
          margin-top: 15px;
          padding: 10px 18px;
          background: #16a34a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn:hover {
          background: #15803d;
        }
      `}</style>
    </div>
  );
}
```
# Now also createtinymce.js file
```php
import { useEffect, useRef } from "react";

export default function TinyEditor({ value = "", onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tinymce@6/tinymce.min.js";

    script.onload = () => {
      window.tinymce.init({
        selector: "#editor",
        height: 300,
        menubar: false,
        plugins: "lists link code",
        toolbar: "undo redo | bold italic | bullist numlist | code",
        setup: (editor) => {
          editorRef.current = editor;

          editor.on("init", () => {
            editor.setContent(value || "");
          });

          editor.on("Change KeyUp", () => {
            onChange(editor.getContent());
          });
        },
      });
    };

    document.body.appendChild(script);

    return () => {
      if (window.tinymce) {
        window.tinymce.remove();
      }
    };
  }, []);

  // 🔥 THIS FIXES EDIT ISSUE
  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.getContent()) {
      editorRef.current.setContent(value || "");
    }
  }, [value]);

  return <textarea id="editor"></textarea>;
}

```

# Step 9: Now Run the server and paste this url
```php
php artisan serve
npm run build
npm run dev
http://localhost:3000/
```
<img width="1281" height="655" alt="image" src="https://github.com/user-attachments/assets/e9ccbce2-1ae2-44ff-ac7f-c8e7682303ff" />
<img width="1397" height="528" alt="image" src="https://github.com/user-attachments/assets/37fc5d39-197d-4cf3-b079-6ad371cbc226" />

<img width="1318" height="704" alt="image" src="https://github.com/user-attachments/assets/3390a0fa-8375-4dda-9792-26dd13688eba" />



