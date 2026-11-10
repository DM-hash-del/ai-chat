<?php

use App\Models\Conversation;
use App\Models\Message;
use App\Models\User;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use function Pest\Laravel\assertDatabaseMissing;

describe('MessageController', function () {
    beforeEach(function () {
        Http::preventStrayRequests();
        $this->model = config('services.openai.model');
        $this->maxOutputTokens = config('services.openai.max_output_tokens');
        config(['services.credits.free' => 10]);
    });

    describe('store', function () {
        it('should append a new message to the conversation', function () {

            $user = User::factory()->create([
                'email' => 'test@example.com',
                'password' => 'password',
            ]);

            $conversation = Conversation::factory()->for($user)->create([
                'title' => 'Test Conversation',
            ]);

            Http::fake([
                'https://api.openai.com/v1/responses' => Http::response([
                    'id' => 'resp_test',
                    'object' => 'response',
                    'status' => 'completed',
                    'output' => [
                        [
                            'type' => 'message',
                            'content' => [
                                [
                                    'type' => 'output_text',
                                    'text' => 'Hello, from the test!',
                                ],
                            ],
                        ],
                    ],
                    'usage' => [
                        'input_tokens' => 12,
                        'output_tokens' => 34,
                    ],
                ], 200),
            ]);

            $response = actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'Hello, world!',
            ])->assertStatus(201);

            Http::assertSent(function (Request $request) {
                return $request->url() === 'https://api.openai.com/v1/responses' &&
                    $request->method() === 'POST' &&
                    $request->hasHeader('Content-Type') &&
                    $request['model'] === $this->model &&
                    $request['instructions'] === 'You are a helpful assistant that can answer questions and help with tasks.' &&
                    $request['input'] === [
                        [
                            'role' => 'user',
                            'content' => 'Hello, world!',
                        ],
                    ] &&
                    $request['max_output_tokens'] == $this->maxOutputTokens;
            });

            $response->assertJson([
                'user_message' => [
                    'content' => 'Hello, world!',
                    'role' => 'user',
                ],
                'assistant_message' => [
                    'content' => 'Hello, from the test!',
                    'role' => 'assistant',
                ],
            ]);

            $response->assertJsonStructure([
                'user_message' => [
                    'id',
                    'content',
                    'role',
                ],
                'assistant_message' => [
                    'id',
                    'content',
                    'role',
                ],
            ]);

            assertDatabaseCount('messages', 2);

            assertDatabaseHas('messages', [
                'conversation_id' => $conversation->id,
                'content' => 'Hello, world!',
                'role' => 'user',
            ]);

            assertDatabaseHas('messages', [
                'conversation_id' => $conversation->id,
                'content' => 'Hello, from the test!',
                'role' => 'assistant',
            ]);

            assertDatabaseHas('usage_logs', [
                'user_id' => $user->id,
                'input_tokens' => 12,
                'output_tokens' => 34,
                'model' => $this->model,
            ]);
        });

        it('returns the newly created messages when the conversation has history', function () {
            $user = User::factory()->create();
            $conversation = Conversation::factory()->for($user)->create();
            Message::factory()->for($conversation)->create(['role' => 'user', 'content' => 'Earlier question']);
            Message::factory()->for($conversation)->create(['role' => 'assistant', 'content' => 'Earlier answer']);
            Http::fake([
                'https://api.openai.com/v1/responses' => Http::response(openAiResponse('New answer'), 200),
            ]);

            $response = actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'New question',
            ]);

            $response->assertStatus(201);
            $newUserMessage = Message::where('content', 'New question')->sole();
            $newAssistantMessage = Message::where('content', 'New answer')->sole();
            $response->assertJsonPath('user_message.id', $newUserMessage->id);
            $response->assertJsonPath('user_message.content', 'New question');
            $response->assertJsonPath('assistant_message.id', $newAssistantMessage->id);
            $response->assertJsonPath('assistant_message.content', 'New answer');
        });

        it('returns 502 without a conversation id when the AI fails', function () {
            $user = User::factory()->create();
            $conversation = Conversation::factory()->for($user)->create();
            Http::fake([
                'https://api.openai.com/v1/responses' => Http::response([], 500),
            ]);

            $response = actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'Hello, world!',
            ]);

            $response->assertStatus(502);
            $response->assertExactJson(['message' => 'Failed to send message to AI']);
            assertDatabaseHas('messages', ['role' => 'user', 'content' => 'Hello, world!']);
            assertDatabaseMissing('messages', ['role' => 'assistant']);
        });

        it('reuses the saved user message when sending the same content again after a failure', function () {
            $user = User::factory()->create();
            $conversation = Conversation::factory()->for($user)->create();
            Http::fake([
                'https://api.openai.com/v1/responses' => Http::sequence()
                    ->push([], 500)
                    ->push(openAiResponse(), 200),
            ]);

            actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'Hello, world!',
            ])->assertStatus(502);
            $savedUserMessage = Message::where('role', 'user')->sole();

            $retry = actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'Hello, world!',
            ]);

            $retry->assertStatus(201);
            $retry->assertJsonPath('user_message.id', $savedUserMessage->id);
            expect(Message::where('role', 'user')->count())->toBe(1);
            expect(Message::where('role', 'assistant')->count())->toBe(1);
            Http::assertSentCount(2);
            [$retryRequest] = Http::recorded()->last();
            expect($retryRequest['input'])->toBe([
                ['role' => 'user', 'content' => 'Hello, world!'],
            ]);
        });

        it('saves a new user message when different content is sent after a failure', function () {
            $user = User::factory()->create();
            $conversation = Conversation::factory()->for($user)->create();
            Http::fake([
                'https://api.openai.com/v1/responses' => Http::sequence()
                    ->push([], 500)
                    ->push(openAiResponse(), 200),
            ]);

            actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'First try',
            ])->assertStatus(502);

            actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'Something else',
            ])->assertStatus(201);

            expect(Message::where('role', 'user')->pluck('content')->all())
                ->toBe(['First try', 'Something else']);
        });

        it('should error for invalid content', function ($content) {
            $user = User::factory()->create([
                'email' => 'test@example.com',
                'password' => 'password',
            ]);

            $conversation = Conversation::factory()->for($user)->create([
                'title' => 'Test Conversation',
            ]);

            $response = actingAs($user)->postJson('/api/conversations/'.$conversation->id.'/messages', [
                'content' => $content,
            ])->assertStatus(422);

            $response->assertJsonValidationErrors(['content']);

            assertDatabaseCount('messages', 0);

        })->with([
            'missing content' => null,
            'overlong content' => str_repeat('a', 4001),
            'empty content' => '',
        ]);

        it('accepts content at the 4000 character limit', function () {
            $user = User::factory()->create();
            $conversation = Conversation::factory()->for($user)->create();
            Http::fake([
                'https://api.openai.com/v1/responses' => Http::response(openAiResponse(), 200),
            ]);

            actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => str_repeat('b', 4000),
            ])->assertStatus(201);
        });

        it('returns 502 when the AI reply has no message content', function () {
            $user = User::factory()->create();
            $conversation = Conversation::factory()->for($user)->create();
            Http::fake([
                'https://api.openai.com/v1/responses' => Http::response([
                    'id' => 'resp_test',
                    'output' => [],
                    'usage' => ['input_tokens' => 12, 'output_tokens' => 0],
                ], 200),
            ]);

            $response = actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'Hello, world!',
            ]);

            $response->assertStatus(502);
            $response->assertExactJson(['message' => 'Failed to send message to AI']);
            assertDatabaseMissing('messages', ['role' => 'assistant']);
        });

        it('logs the provider status and body when the AI returns an error', function () {
            Log::spy();
            $user = User::factory()->create();
            $conversation = Conversation::factory()->for($user)->create();
            Http::fake([
                'https://api.openai.com/v1/responses' => Http::response([
                    'error' => ['message' => 'The model does not exist', 'type' => 'invalid_request_error'],
                ], 400),
            ]);

            $response = actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'Hello, world!',
            ]);

            $response->assertStatus(502);
            $response->assertExactJson(['message' => 'Failed to send message to AI']);
            Log::shouldHaveReceived('warning')
                ->withArgs(fn (string $message, array $context) => str_contains($context['internal'], '400')
                    && str_contains($context['internal'], 'The model does not exist'))
                ->once();
        });

        it('returns 502 when the AI provider cannot be reached', function () {
            $user = User::factory()->create();
            $conversation = Conversation::factory()->for($user)->create();
            Http::fake([
                'https://api.openai.com/v1/responses' => fn () => throw new ConnectionException('Connection timed out'),
            ]);

            $response = actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'Hello, world!',
            ]);

            $response->assertStatus(502);
            $response->assertExactJson(['message' => 'Failed to send message to AI']);
            assertDatabaseMissing('messages', ['role' => 'assistant']);
        });

        it('sends max_output_tokens to the AI as an integer', function () {
            config(['services.openai.max_output_tokens' => '3000']);
            $user = User::factory()->create();
            $conversation = Conversation::factory()->for($user)->create();
            Http::fake([
                'https://api.openai.com/v1/responses' => Http::response(openAiResponse(), 200),
            ]);

            actingAs($user)->postJson("/api/conversations/{$conversation->id}/messages", [
                'content' => 'Hello, world!',
            ])->assertStatus(201);

            Http::assertSent(fn (Request $request) => $request['max_output_tokens'] === 3000);
        });
    });
});
