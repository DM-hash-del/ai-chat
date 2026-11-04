<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FailedAiResponse extends Exception
{
    public function __construct(
        string $message = 'Failed to send message to AI',
        public readonly ?string $internalMessage = null,
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
        return response()->json([
            'message' => 'Failed to send message to AI',
        ], 500);
    }
}
