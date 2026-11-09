<?php

use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\travelTo;

describe('Usage endpoint', function () {
    beforeEach(function () {
        config([
            'services.credits.free' => 10,
            'services.credits.pro' => 100,
        ]);
    });

    test('returns the full allowance when nothing has been used today', function () {
        $user = User::factory()->create();

        $response = actingAs($user)->getJson('/api/usage');

        $response->assertStatus(200);
        $response->assertExactJson([
            'tier' => 'free',
            'daily_allowance' => 10,
            'used_today' => 0,
            'remaining' => 10,
        ]);
    });

    test('counts todays output tokens as credits', function () {
        $user = User::factory()->create();
        $user->usageLogs()->create(['input_tokens' => 500, 'output_tokens' => 1500, 'model' => 'test-model']);
        $user->usageLogs()->create(['input_tokens' => 500, 'output_tokens' => 1000, 'model' => 'test-model']);

        $response = actingAs($user)->getJson('/api/usage');

        $response->assertStatus(200);
        $response->assertJsonPath('used_today', 2.5);
        $response->assertJsonPath('remaining', 7.5);
    });

    test('does not count usage from previous days', function () {
        $user = User::factory()->create();
        travelTo(now()->subDay());
        $user->usageLogs()->create(['input_tokens' => 500, 'output_tokens' => 4000, 'model' => 'test-model']);
        travelTo(now()->addDay());

        $response = actingAs($user)->getJson('/api/usage');

        $response->assertJsonPath('used_today', 0);
        $response->assertJsonPath('remaining', 10);
    });

    test('uses the allowance for the users tier', function () {
        $user = User::factory()->create();
        $user->forceFill(['tier' => 'pro'])->save();

        $response = actingAs($user)->getJson('/api/usage');

        $response->assertJsonPath('tier', 'pro');
        $response->assertJsonPath('daily_allowance', 100);
        $response->assertJsonPath('remaining', 100);
    });

    test('returns 401 for a guest', function () {
        getJson('/api/usage')->assertStatus(401);
    });
});
