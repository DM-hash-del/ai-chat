<?php

use App\Models\User;
use App\Models\Conversation;
use Illuminate\Support\Facades\Http;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\assertDatabaseCount;
use function Pest\Laravel\assertDatabaseHas;
use Illuminate\Http\Client\Request;

describe('MessageController', function () {
    beforeEach(function () {
        Http::preventStrayRequests();
        $this->model = config('services.openai.model');
        $this->maxOutputTokens = config('services.openai.max_output_tokens');
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
                'https://api.openai.com/v1/response' => Http::response([
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
                        ]
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
        
        it('should error for invalid content', function ($content) {
            $user = User::factory()->create([
                'email' => 'test@example.com',
                'password' => 'password',
            ]);

            $conversation = Conversation::factory()->for($user)->create([
                'title' => 'Test Conversation',
            ]);

            $response = actingAs($user)->postJson('/api/conversations/' . $conversation->id . '/messages', [
                'content' => $content,
            ])->assertStatus(422);

            $response->assertJsonValidationErrors(['content']);

            assertDatabaseCount('messages', 0);

        })->with(
            ['missing content' => null],
            ['overlong content' => str_repeat('a', 4001)],
            ['empty content' => ''],
            ['boundary content' => str_repeat('b', 4000)]
        );
    });
});
