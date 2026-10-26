<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Support\Str;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;
use function Pest\Laravel\getJson;
use function Pest\Laravel\patchJson;
use function Pest\Laravel\postJson;

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
    Message::factory($count)->for($conversation)->create([
        'content' => 'Test message',
        'role' => 'user',
    ]);

    return $conversation;
}

describe('Conversation Show Endpoint', function () {
    beforeEach(function () {
        $this->userA = User::factory()->create(['email' => 'userA@example.com']);
        $this->userB = User::factory()->create(['email' => 'userB@example.com']);
        $this->userC = User::factory()->create(['email' => 'userC@example.com']);
    });

    test('returns a users conversation with messsages', function () {
        $conversation = makeConversationWithMessages($this->userA, 3);
        $responseA = actingAs($this->userA)->getJson("/api/conversations/{$conversation->id}");

        $dataA = $responseA->json();

        assertDatabaseCount('messages', 3);
        assertDatabaseCount('users', 3);
        $responseA->assertJsonStructure([
            'id',
            'title',
            'messages' => [
                '*' => [
                    'id',
                    'content',
                ],
            ],
        ]);
        expect($dataA)->toBeArray();
        expect($dataA['messages'])->toBeArray();
        expect($dataA['messages'][0]['content'])->toBe('Test message');
        expect($dataA['messages'][0]['role'])->toBe('user');
        expect($dataA['messages'])->toHaveCount(3);
        $messageIds = collect($dataA['messages'])->pluck('id')->toArray();
        expect($messageIds)->toEqual([1, 2, 3]);

        $responseB = actingAs($this->userB)->getJson("/api/conversations/{$conversation->id}");
        $responseB->assertStatus(404);

        $responseC = getJson("/api/conversations/{$conversation->id}");
        $responseC->assertStatus(404);
    });

});

describe('Conversation Update Endpoint', function () {

    test('updates users conversation title', function () {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create([
            'title' => 'original title',
        ]);
        $response = actingAs($user)->patchJson("/api/conversations/{$conversation->id}", [
            'title' => 'updated title',
        ]);
        $response->assertStatus(200);
        assertDatabaseHas('conversations', [
            'id' => $conversation->id,
            'title' => 'updated title',
        ]);
    });

    test('can\'t update another users conversation', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        $userBConversation = Conversation::factory()->for($userB)->create([
            'title' => 'user b conversation',
        ]);
        $malicousResponse = actingAs($userA)->patchJson("/api/conversations/{$userBConversation->id}", [
            'title' => 'user a hijack',
        ]);
        $malicousResponse->assertStatus(404);
        assertDatabaseHas('conversations', [
            'id' => $userBConversation->id,
            'title' => 'user b conversation',
        ]);
    });

    test('title validation', function ($content) {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create([
            'title' => 'first title',
        ]);
        $response = actingAs($user)->patchJson("/api/conversations/{$conversation->id}");
        $response->assertStatus(422);
    })->with(
        ['title' => null],
        ['title' => str_repeat('a', 256)],
        ['title' => ''],
        ['title' => str_repeat('b', 255)]
    );

    test('returns 401 for guest', function () {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        $response = patchJson("/api/conversations/{$conversation->id}", [
            'title' => 'guest title',
        ]);

        $response->assertStatus(401);
    });
});

describe('Conversation Delete Endpoint', function () {

    test('allows users to delete conversations', function () {
        $user = User::factory()->create();
        $conversation = Conversation::factory()->for($user)->create();
        Message::factory()->for($conversation)->count(5)->create();

        assertDatabaseHas('conversations', ['id' => $conversation->id]);

        $response = actingAs($user)->deleteJson("/api/conversations/{$conversation->id}");

        $response->assertStatus(204);

        assertDatabaseMissing('conversations', ['id' => $conversation->id]);
        assertDatabaseMissing('messages', ['conversation_id' => $conversation->id]);
    });

    test('doesn\'t allow deletion of another users conversations', function () {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $userAConversation = Conversation::factory()->for($userA)->create();
        Message::factory()->for($userAConversation)->count(3)->create();
        $userA->usageLogs()->create([
            'user_id' => $userA->id,
            'input_tokens' => 100,
            'output_tokens' => 200,
            'model' => 'gpt-6-luna',
        ]);

        $userBConversation = Conversation::factory()->for($userB)->create();
        Message::factory()->for($userBConversation)->count(2)->create();

        $resA = actingAs($userA)->deleteJson("/api/conversations/{$userBConversation->id}");

        $resA->assertStatus(404);
        assertDatabaseHas('conversations', ['id' => $userAConversation->id]);
        assertDatabaseHas('messages', ['conversation_id' => $userAConversation->id]);
        assertDatabasehas('usage_logs', ['user_id' => $userA->id]);
    });
});
