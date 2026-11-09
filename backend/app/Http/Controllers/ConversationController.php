<?php

namespace App\Http\Controllers;

use App\Exceptions\FailedAiResponse;
use App\Http\Requests\StoreConversationRequest;
use App\Http\Requests\UpdateConversationRequest;
use App\Services\ChatService;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ConversationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $conversations = $request->user()->conversations()->latest()->get();

        return response()->json($conversations, 200);
    }

    /**
     * Create a single conversation along with the initial message
     */
    public function store(StoreConversationRequest $request, ChatService $chat)
    {
        $user = $request->user();
        $content = $request->input('content');

        $chat->ensureHasCredits($user);

        $conversation = $user->conversations()->create([
            'title' => Str::limit($content, 50),
        ]);

        try {
            $chat->sendMessage($user, $conversation, $content);
        } catch (FailedAiResponse $e) {
            throw new FailedAiResponse($e->getMessage(), $e->internalMessage, $conversation->id);
        }

        return response()->json($conversation->load('messages'), 201);
    }

    public function show(Request $request, string $conversation)
    {
        $conversation = $request->user()->conversations()->findOrFail($conversation);

        return response()->json($conversation->load('messages'), 200);
    }

    public function update(UpdateConversationRequest $request, string $conversation)
    {
        $conversation = $request->user()
            ->conversations()
            ->findOrFail($conversation);

        $conversation->update(
            ['title' => $request->validated('title'),
            ]);

        return $conversation;
    }

    public function destroy(Request $request, string $conversation)
    {
        $request->user()->conversations()->findOrFail($conversation)->delete();

        return response()->noContent(204);
    }
}
