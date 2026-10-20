<?php

use App\Models\User;

describe('User endpoint', function () {

    beforeEach(function () {
        $this->withHeader('origin', 'http://localhost:5173');
    });

    test('doesn\'t expose user password', function () {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/user');
        $response->assertSuccessful();
        $response->assertJsonMissingPath('password');
        $response->assertJsonMissingPath('remember_token');
        $response->assertJsonPath('email', $user->email);
    });

    test('returns 401 to user not logged in', function () {
        $this->getJson('/api/user')->assertStatus(401);
    });
});