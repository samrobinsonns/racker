<?php

namespace App\Providers;

use App\Models\SupportTicket;
use App\Policies\SupportTicketPolicy;
use App\Policies\SupportTicketSettingsPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        SupportTicket::class => SupportTicketPolicy::class,
        'App\Models\SupportTicketSettings' => SupportTicketSettingsPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
} 