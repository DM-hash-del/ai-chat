<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class InvalidTier extends Exception
{
    public function __construct(
        string $message = 'Invalid tier',
        public readonly ?string $internalMessage = null,
    ) {
        parent::__construct($message);
    }

    public function report(): void
    {
        Log::warning('Invalid tier', [
            'internal' => $this->internalMessage,
        ]);
    }

    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'message' => 'Invalid tier',
        ], 500);
    }
}
