<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Exception for insufficient credits
 */
class InsufficientCredits extends Exception
{
    public function __construct(
        string $message = 'Insufficient credits',
        public readonly ?string $internalMessage = null,
    ) {
        parent::__construct($message);
    }

    public function report(): void
    {
        Log::warning('Insufficient credits', [
            'internal' => $this->internalMessage,
        ]);
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Insufficient credits',
        ], 429);
    }
}
