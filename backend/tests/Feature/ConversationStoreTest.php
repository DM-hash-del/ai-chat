<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Tests\TestCase;

class ConversationStoreTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Http::preventStrayRequests();
        config(['services.credits.free' => 10]);
    }

    public function test_unathenticated_users_cant_access_conversations(): void
    {
        $response = $this->postJson('/api/conversations', [
            'content' => 'bad content',
        ]);

        $response->assertStatus(401);
    }

    public function test_authenticated_user_only_retrieve_their_conversations(): void
    {
        Http::fake([
            'https://api.openai.com/v1/responses' => Http::response(openAiResponse(), 200),
        ]);
        $user = User::factory()->create();

        $content = fake()->sentence(250);

        $response = $this->actingAs($user)->postJson('/api/conversations', [
            'content' => $content,
            'title' => 'a title',
        ]);

        $response->assertStatus(201);

        $this->assertDatabaseHas('conversations', [
            'title' => Str::limit($content, 50),
            'user_id' => $user->id,
        ]);
    }
}
