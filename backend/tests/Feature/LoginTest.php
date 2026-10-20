<?php

use App\Models\User;

describe('User Login', function () {

    beforeEach(function () {
        $this->withHeader('origin', 'http://localhost:5173');
    });

    test('existing user can login with valid credentials', function () {
        $user = User::factory()->create([
            'password' => 'password123',
        ]);
        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);
        $response->assertStatus(200);
        $response->assertJsonStructure(['message', 'user']);
        $this->assertAuthenticatedAs($user);
    });

    test('cannot login with invalid credentials', function () {
        $user = User::factory()->create([
            'password' => 'password123',
        ]);
        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrongpassword',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        $this->assertGuest();
    });

    test('cannot login with non-existing user', function () {
        $response = $this->postJson('/api/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'password123',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email']);
        $this->assertGuest();
    });

    test('cannot login with missing email or password', function () {
        $response = $this->postJson('/api/login', [
            'email' => '',
            'password' => '',
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['email', 'password']);
        $this->assertGuest();
    });

    test('cannot send multiple login requests in a short period of time', function () {
        $user = User::factory()->create([
            'password' => 'password123',
        ]);

        for ($i = 0; $i < 6; $i++) {
            $response = $this->postJson('/api/login', [
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
