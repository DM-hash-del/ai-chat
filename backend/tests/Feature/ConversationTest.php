<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\postJson;
use function Pest\Laravel\withHeader;

describe('Conversation Index Endpoint', function () {

    test('returns conversations for the authenticated user', function () {

        // Create another user and conversation to ensure the authenticated user's conversations are not returned
        $anotherUser = User::factory()->create();
        Conversation::factory()->for($anotherUser)->create();

        // Create conversations for the authenticated user
        $user = User::factory()->create();
        $conversation = Conversation::factory()->count(5)->for($user)->create();
        foreach ($conversation as $c) {
            $messageCount = fake()->numberBetween(2, 10);
            Message::factory()
                ->count($messageCount)
                ->for($c, 'conversation')
                ->create();
        }
        $response = actingAs($user)->getJson('/api/conversations');
        $response->assertStatus(200);
        $response->assertJsonCount(5);
        $response->assertJsonMissingPath('0.messages');
    });

    test('returns conversations in descending order of creation date', function () {
        $user = User::factory()->create();
        $conversations = [];
        for ($i = 4; $i > 0; $i--) {
            $conversations[] = Conversation::factory()->for($user)->create([
                'created_at' => now()->subDays($i),
            ]);
        }
        $response = actingAs($user)->getJson('/api/conversations');
        $response->assertStatus(200);
        $expectedIds = array_reverse(collect($conversations)->pluck('id')->toArray());
        $responseIds = collect($response->json())->pluck('id')->toArray();
        expect($responseIds)->toBe($expectedIds);
    });
});

describe('Conversation Store Endpoint', function () {

    test('creates a new conversation for the authenticated user', function () {
        $user = User::factory()->create();
        $content = fake()->sentence(300);
        $response = actingAs($user)->postJson('/api/conversations', [
            'content' => $content,
            'title' => 'My Title',
        ]);
        $response->assertStatus(201);
        $response->assertJsonMissing([
            'title' => 'My Title',
        ]);
        $response->assertJsonPath('messages.0.role', 'user');
        $response->assertJsonPath('title', Str::limit($content, 50));
        assertDatabaseHas('conversations', [
            'title' => Str::limit($content, 50),
            'user_id' => $user->id,
        ]);
        assertDatabaseHas('messages', [
            'conversation_id' => $response->json('messages.0.conversation_id'),
            'role' => 'user',
            'content' => $content,
        ]);
    });

    test('produces a title equal to short content', function () {
        $user = User::factory()->create();
        $content = fake()->sentence(4);
        $response = actingAs($user)->postJson('/api/conversations', [
            'content' => $content,
        ]);
        $response->assertStatus(201);
        $response->assertJsonPath('title', $content);
        expect($response->json('title'))->toBeString()->toStartWith($content);
    });

    test('produces a title equal to first 50 characters of long content', function () {
        $user = User::factory()->create();
        $content = fake()->sentence(100);
        $response = actingAs($user)->postJson('/api/conversations', [
            'content' => $content,
        ]);
        $response->assertStatus(201);
        expect($response->json('title'))->toBeString()->toStartWith(Str::limit($content, 50));
        $contentLength = mb_strlen($content);
        $titleLength = mb_strlen($response->json('title'));
        expect($titleLength)->toBeLessThan($contentLength);
    });

    test('rejects invalid content', function ($content) {
        $user = User::factory()->create();
        $response = actingAs($user)->postJson('/api/conversations', [
            'content' => $content,
        ]);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['content']);
        assertDatabaseCount('messages', 0);
        assertDatabaseCount('conversations', 0);
    })->with([
        'contentMissing' => null,
        'contentOverlong' => str_repeat('a', 4001),
    ]);

    test('boundary test for content length', function () {
        $user = User::factory()->create();
        $content = str_repeat('a', 4000);
        $response = actingAs($user)->postJson('/api/conversations', [
            'content' => $content,
        ]);
        $response->assertStatus(201);
    });

    test('returns 401 for unauthenticated user', function () {
        $response = postJson('/api/conversations', [
            'content' => 'bad content',
        ]);
        $response->assertStatus(401);
        assertDatabaseCount('messages', 0);
        assertDatabaseCount('conversations', 0);
    });
});

function makeConversationWithMessages(User $user, int $count)
{
    $conversation = Conversation::factory()->for($user)->create();
    Message::factory($count)->for($conversation)->create();
    return $conversation;
}

describe('Conversation Show Endpoint', function () {
    beforeEach(function () {
        withHeader('origin', 'http://localhost:5173');
        $this->userOne = User::factory()->create(['email' => 'userOne@example.com']);
        $this->userTwo = User::factory()->create(['email' => 'userTwo@example.com']);
        $this->userThree = User::factory()->create(['email' => 'userThree@example.com']);

    });

    test('returns a users conversation with messsages', function () {
        $conversation = makeConversationWithMessages($this->userOne, 3);
        $response = actingAs($this->userOne)->getJson("/api/conversations/{$conversation->id}");
        $response->dump();
        assertDatabaseCount('messages', 3);
        assertDatabaseCount('users', 3);
        // Should probably check the response shape
    });

});
