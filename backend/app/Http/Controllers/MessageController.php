<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\StoreMessageRequest;
use App\Services\ChatService;

class MessageController extends Controller
{
    public function store(StoreMessageRequest $request, string $conversation, ChatService $chat)
    {
        $user = $request->user();
        
        $conversation = $request->user()->conversations()->findOrFail($conversation);
        
        $userMessage = $request->input('content');

        $chat->sendMessage($user, $conversation, $userMessage);

        return response()->json([
            'user_message' => $conversation->messages()->where('role', 'user')->first(),
            'assistant_message' => $conversation->messages()->where('role', 'assistant')->first(),
        ], 201);
    }
}
