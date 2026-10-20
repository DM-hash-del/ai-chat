<?php

use Illuminate\Support\Facades\Auth;
use App\Models\User;

describe('Logout User', function () {

    beforeEach(function () {
        $this->withHeader('origin', 'http://localhost:5173');
    });

    test('Successfully', function () {
        $user = User::factory()->create();
        $response = $this->actingAs($user)->postJson('/api/logout');
        $response->assertStatus(204);
        $this->assertGuest('web'); 
    });

    test('whos not logged in returns 401', function () {
        $response = $this->postJson('/api/logout');
        $response->assertStatus(401);
        $this->assertGuest('web');
    });

});
