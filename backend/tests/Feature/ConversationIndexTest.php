<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationIndexTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_only_get_their_conversations(): void
    {
        $userOne = User::factory()->create();
        $userTwo = User::factory()->create();

        Conversation::factory()->for($userOne)->count(3)->create();
        Conversation::factory()->for($userTwo)->count(3)->create();

        $response = $this->actingAs($userOne)->getJson('/api/conversations');
        $response->assertStatus(200);
        $response->assertJsonCount(3);
    }
}
