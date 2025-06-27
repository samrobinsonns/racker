<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(\App\Services\PageTemplateService::class);
        
        // Support Ticket Services
        $this->app->singleton(\App\Services\SupportTickets\TicketService::class);
        $this->app->singleton(\App\Services\SupportTickets\ReplyService::class);
        $this->app->singleton(\App\Services\SupportTickets\AttachmentService::class);
        $this->app->singleton(\App\Services\SupportTickets\NotificationService::class);
        $this->app->singleton(\App\Services\SupportTickets\Microsoft365EmailService::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
    }
}
