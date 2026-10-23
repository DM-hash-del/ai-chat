<?php

use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\getJson;
use function Pest\Laravel\withHeader;

describe('User endpoint', function () {

    beforeEach(function () {
        withHeader('origin', 'http://localhost:5173');
    });

    test('doesn\'t expose user password', function () {
        $user = User::factory()->create();
        $response = actingAs($user)->getJson('/api/user');
        $response->assertSuccessful();
        $response->assertJsonMissingPath('password');
        $response->assertJsonMissingPath('remember_token');
        $response->assertJsonPath('email', $user->email);
    });

    test('returns 401 to user not logged in', function () {
        $response = getJson('/api/user');
        $response->assertStatus(401);
    });
});
