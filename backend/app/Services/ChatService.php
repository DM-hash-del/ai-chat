<?php

namespace App\Services;

use App\Services\AiClientService;
use App\Services\CreditsService;
use App\Models\User;
use App\Models\Conversation;
use App\Exceptions\InsufficientCredits;
use Illuminate\Support\Facades\DB;

class ChatService
{
    /**
     * Create a new class instance.
     */
    public function __construct(
        protected AiClientService $aiClientService,
        protected CreditsService $creditsService,
    ){
        //
    }

    public function sendMessage(User $user, Conversation $conversation, string $content)
    {
        // check credits
        $remainingCredits = $this->creditsService->remainingCredits($user);

        if ($remainingCredits <= 0) {
            throw new InsufficientCredits(
                message: 'Insufficient credits',
                internalMessage: 'Provider Returned: ' . $remainingCredits,
            );
        }

        // Save the user's message to conversation
        $userMessage = $conversation->messages()->create([
            'content' => $content,
            'role' => 'user',
        ]);

        // Load the conversation messages to send to ai
        $messages = $conversation->messages()
            ->orderBy('id', 'asc')
            ->get(['role', 'content'])
            ->toArray();

        // send message to ai and get response
        $response = $this->aiClientService->sendMessage($messages);

        // get input and output tokens from response
        $inputTokens = $response['input_tokens'];
        $outputTokens = $response['output_tokens'];

        $assistantMessage = DB::transaction(function () use ($conversation, $response, $user, $inputTokens, $outputTokens) {
            // save assistant message to conversation
            $assistantMessage = $conversation->messages()->create([
                'content' => $response['content'],
                'role' => 'assistant',
            ]);
    
            // log usage to credits service
            $this->creditsService->logUsage($user, $outputTokens, $inputTokens);

            return $assistantMessage;
        });

        return [
            'user_message' => $userMessage,
            'assistant_message' => $assistantMessage,
            'input_tokens' => $inputTokens,
            'output_tokens' => $outputTokens,
        ];
    }
}
