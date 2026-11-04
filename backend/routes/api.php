<?php

use App\Http\Controllers\ConversationController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\LogoutController;
use App\Http\Controllers\RegisterController;
use App\Http\Controllers\MessageController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Vite proxy settings test endpoint
Route::get('/ping', function () {
    return response()->json(['message' => 'pong', 'timestamp' => now()]);
});

Route::post('/register', [RegisterController::class, 'register']);

Route::post('/login', [LoginController::class, 'login'])->middleware('throttle:5,1');

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [LogoutController::class, 'logout']);
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::apiResource('conversations', ConversationController::class);
    Route::post('conversations/{conversation}/messages', [MessageController::class, 'store']);
});
