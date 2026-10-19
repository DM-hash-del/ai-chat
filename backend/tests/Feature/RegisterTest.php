<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;

// uses(RefreshDatabase::class);

function validRegistrationData(array $overrides = []): array
{
    return array_merge([
        'name' => 'Valid User',
        'email' => 'valid@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ], $overrides);
};

describe('User Registration', function () {

    beforeEach(function () {
        $this->withHeader('origin', 'http://localhost:5173');
    });

    test('can register and be authenticatedsuccessfully', function () {
        $response = $this->postJson('/api/register', validRegistrationData());
        $response->assertStatus(201);
        $this->assertAuthenticatedAs(User::where(
            'email', 'valid@example.com')->first()
        );
        $this->assertDatabaseHas('users', [
            'name' => 'Valid User',
            'email' => 'valid@example.com',
        ]);
    });

    test('password is saved as a hash in the database', function () {
        $response = $this->postJson('/api/register', validRegistrationData());
        $response->assertStatus(201);
        $user = User::where('email', 'valid@example.com')->first();
        $storedPassword = $user->password;
        $this->assertTrue(Hash::check('password123', $storedPassword));
    });

    test('emails are unique in the database', function () {
        User::factory()->create(['email' => 'valid@example.com']);
        $responseTwo = $this->postJson('/api/register', validRegistrationData());
        $responseTwo->assertStatus(422);
        $responseTwo->assertJsonValidationErrors(['email']);
    });

    test('cannot register with a password that is too short', function () {
        $response = $this->postJson('/api/register', validRegistrationData([
            'password' => 'short',
            'password_confirmation' => 'short',
        ]));
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    });

    test('cannot register with a password that does not match the confirmation', function () {
        $response = $this->postJson('/api/register', validRegistrationData([
            'password' => 'password123',
            'password_confirmation' => 'differentPassword',
        ]));
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['password']);
    });

    test('cannot set their tier level during registration', function () {
        $response = $this->postJson('/api/register', validRegistrationData([
            'tier' => 'premium',
        ]));
        $response->assertStatus(201);
        $this->assertDatabaseHas('users', [
            'name' => 'Valid User',
            'email' => 'valid@example.com',
            'tier' => 'free',
        ]);
    });

    test('response does not contain the password or remember token', function () {
        $response = $this->postJson('/api/register', validRegistrationData());
        $response->assertStatus(201);
        $response->assertJsonMissing(['password', 'remember_token']);
        $response->assertJsonStructure([
            'id',
            'name',
            'email',
            'tier',
            'created_at',
            'updated_at',
        ]);
    });

    test('Invalid name and email are rejected', function ($userData, $errors) {
        $response = $this->withHeader('origin', 'http://localhost:5173')
            ->postJson('/api/register', array_merge(validRegistrationData(
                ['name' => '', 'email' => '']
            ), $userData));

        $response->assertStatus(422);
        $response->assertJsonValidationErrors($errors);
    })->with([
        'missing name' => [
            ['email' => 'valid@example.com'],
            ['name'],
        ],
        'missing email' => [
            ['name' => 'Valid Name'],
            ['email'],
        ],
        'invalid email' => [
            ['name' => 'Valid Name', 'email' => 'invalid-email'],
            ['email'],
        ],
    ]);
});
