<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreMessageRequest;
use App\Services\ChatService;

class MessageController extends Controller
{
    public function store(StoreMessageRequest $request, string $conversation, ChatService $chat)
    {
        $user = $request->user();

        $conversation = $request->user()->conversations()->findOrFail($conversation);

        $userMessage = $request->input('content');

        $result = $chat->sendMessage($user, $conversation, $userMessage);

        return response()->json([
            'user_message' => $result['user_message'],
            'assistant_message' => $result['assistant_message'],
        ], 201);
    }
}
