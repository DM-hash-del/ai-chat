<?php

namespace App\Services;

use App\Exceptions\InvalidTier;
use App\Models\User;
use Carbon\Carbon;

class CreditsService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Crdits are tokens divided by 1000
     */
    public function remainingCredits(User $user): float|int
    {
        return $this->dailyAllowance($user) - $this->getUsage($user);
    }

    /**
     * The number of credits the user's tier allows per day.
     *
     * @throws InvalidTier
     */
    public function dailyAllowance(User $user): float|int
    {
        $tier = $user->tier ?? 'free';

        $credits = config('services.credits.'.$tier);
        if (is_null($credits)) {
            throw new InvalidTier(
                message: 'Invalid tier',
                internalMessage: 'Tier not found in config: '.$tier,
            );
        }

        return $credits + 0;
    }

    /**
     * Log usage for a user
     * The maths isn't right here.
     */
    public function logUsage(User $user, int $outputTokens, int $inputTokens)
    {
        $user->usageLogs()->create([
            'output_tokens' => $outputTokens,
            'input_tokens' => $inputTokens,
            'model' => config('services.openai.model'),
        ]);
    }

    public function getUsage(User $user)
    {
        $from = Carbon::now('UTC')->startOfDay();
        $to = Carbon::now('UTC')->endOfDay();

        return $user->usageLogs()->whereBetween('created_at', [$from, $to])->sum('output_tokens') / 1000;
    }
}
