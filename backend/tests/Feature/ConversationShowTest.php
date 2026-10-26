<?php

namespace Tests\Feature;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ConversationShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_retrieves_their_conversation_with_messages(): void
    {
        $userOne = User::factory()->create();

        $conversation = Conversation::factory()->for($userOne)->create(['title' => 'First Message']);

        Message::factory()->count(6)->for($conversation)->create();

        $userOneResponse = $this->actingAs($userOne)
            ->getJson("/api/conversations/{$conversation->id}");

        $userOneResponse->assertStatus(200);

        $userTwo = User::factory()->create();

        $userTwoResponse = $this->actingAs($userTwo)
            ->getJson("/api/conversations/{$conversation->id}");

        $userTwoResponse->assertStatus(404);

    }
}
