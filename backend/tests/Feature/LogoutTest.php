<?php

use App\Models\User;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertGuest;
use function Pest\Laravel\postJson;
use function Pest\Laravel\withHeader;

describe('User Logout', function () {

    beforeEach(function () {
        withHeader('origin', 'http://localhost:5173');
    });

    test('Successfully', function () {
        $user = User::factory()->create();
        $response = actingAs($user)->postJson('/api/logout');
        $response->assertStatus(204);
        assertGuest('web');
    });

    test('whos not logged in returns 401', function () {
        $response = postJson('/api/logout');
        $response->assertStatus(401);
        assertGuest('web');
    });

});
