<?php

use App\Models\User;

use function Pest\Laravel\assertAuthenticatedAs;
use function Pest\Laravel\assertGuest;
use function Pest\Laravel\postJson;
use function Pest\Laravel\withHeader;

describe('User Login', function () {

    beforeEach(function () {
        withHeader('origin', 'http://localhost:5173');
    });

    test('existing user can login with valid credentials', function () {
        $user = User::factory()->create([
            'password' => 'password123',
        ]);
        $response = postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);
        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'user']);
        assertAuthenticatedAs($user);
    });

    test('cannot login with invalid credentials', function () {
        $user = User::factory()->create([
            'password' => 'password123',
        ]);
        $response = postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        assertGuest();
    });

    test('cannot login with non-existing user', function () {
        $response = postJson('/api/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        assertGuest();
    });

    test('cannot login with missing email or password', function () {
        $response = postJson('/api/login', [
            'email' => '',
            'password' => '',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email', 'password']);
        assertGuest();
    });

    test('cannot send multiple login requests in a short period of time', function () {
        $user = User::factory()->create([
            'password' => 'password123',
        ]);

        for ($i = 0; $i < 6; $i++) {
            $response = postJson('/api/login', [
                'email' => $user->email,
                'password' => 'wrongpassword',
            ]);
            if ($i < 5) {
                $response->assertStatus(422);
            } else {
                $response->assertStatus(429);
            }
        }
    });

});
