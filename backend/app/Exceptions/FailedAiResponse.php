<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FailedAiResponse extends Exception
{
    public function __construct(
        string $message = 'Failed to send message to AI',
        public readonly ?string $internalMessage = null,
        public readonly ?int $conversationId = null,
    ) {
        parent::__construct($message);
    }

    public function report(): void
    {
        Log::warning('Failed to send message to AI', [
            'internal' => $this->internalMessage,
        ]);
    }

    public function render(Request $request): JsonResponse
    {
        $body = ['message' => 'Failed to send message to AI'];

        if (! is_null($this->conversationId)) {
            $body['conversation_id'] = $this->conversationId;
        }

        return response()->json($body, 502);
    }
}
