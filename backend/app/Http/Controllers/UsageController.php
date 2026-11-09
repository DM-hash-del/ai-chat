<?php

namespace App\Http\Controllers;

use App\Services\CreditsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsageController extends Controller
{
    /**
     * Return the authenticated user's credit usage for today.
     */
    public function __invoke(Request $request, CreditsService $credits): JsonResponse
    {
        $user = $request->user();

        return response()->json([
            'tier' => $user->tier ?? 'free',
            'daily_allowance' => $credits->dailyAllowance($user),
            'used_today' => $credits->getUsage($user),
            'remaining' => $credits->remainingCredits($user),
        ], 200);
    }
}
