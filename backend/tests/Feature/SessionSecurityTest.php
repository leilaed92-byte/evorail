<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SessionSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_invalid_login_returns_401_without_authentication(): void
    {
        $user = User::factory()->create(['password' => 'password']);

        $this->postJson('/api/login', ['email' => $user->email, 'password' => 'wrong'])
            ->assertUnauthorized()->assertJsonPath('code', 'invalid_credentials')->assertJsonPath('message', 'The provided credentials are incorrect.');
        $this->assertGuest();
    }

    public function test_allowed_origin_receives_credentials_and_foreign_origin_does_not(): void
    {
        $this->withHeaders(['Origin' => 'http://127.0.0.1:5174', 'Access-Control-Request-Method' => 'POST'])
            ->options('/api/login')->assertNoContent()
            ->assertHeader('Access-Control-Allow-Origin', 'http://127.0.0.1:5174')
            ->assertHeader('Access-Control-Allow-Credentials', 'true');
        $this->withHeaders(['Origin' => 'https://foreign.example', 'Access-Control-Request-Method' => 'POST'])
            ->options('/api/login')->assertHeaderMissing('Access-Control-Allow-Origin');
    }

    public function test_login_rejects_missing_csrf_in_production_middleware(): void
    {
        $user = User::factory()->create(['password' => 'password']);
        $this->app['env'] = 'production';

        $this->withHeader('Origin', 'http://127.0.0.1:5174')
            ->postJson('/api/login', ['email' => $user->email, 'password' => 'password'])->assertStatus(419);
        $this->assertGuest();
    }
}
