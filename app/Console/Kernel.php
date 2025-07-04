<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use App\Jobs\ProcessEmailQueue;

class Kernel extends ConsoleKernel
{
    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        Commands\EnsureTenantRoles::class,
    ];

    /**
     * Define the application's command schedule.
     *
     * These cron jobs are run in the background.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule): void
    {
        // Process Microsoft 365 emails every 5 minutes
        $schedule->command('microsoft365:process-emails')
            ->everyFiveMinutes()
            ->withoutOverlapping()
            ->runInBackground();

        // Process email queue every minute
        $schedule->job(new ProcessEmailQueue())
            ->everyMinute()
            ->withoutOverlapping()
            ->onQueue('emails');
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
} 