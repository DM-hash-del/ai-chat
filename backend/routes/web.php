<?php

use Illuminate\Support\Facades\Route;

// Send every page address (not API or Sanctum) to the React app.
Route::get('/{any?}', function () {
    return response()->file(public_path('index.html'));
})->where('any', '^(?!api|sanctum).*$');