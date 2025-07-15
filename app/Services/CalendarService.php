<?php

namespace App\Services;

use App\Models\Calendar;
use App\Models\CalendarEvent;
use App\Models\CalendarShare;
use App\Models\User;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class CalendarService
{
    protected NotificationService $notificationService;

    public function __construct(NotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
    }

    /**
     * Create a new calendar.
     */
    public function createCalendar(User $user, array $data): Calendar
    {
        $calendar = Calendar::create([
            'tenant_id' => $user->tenant_id,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'color' => $data['color'] ?? '#3B82F6',
            'is_public' => $data['is_public'] ?? false,
            'created_by' => $user->id,
        ]);

        return $calendar;
    }

    /**
     * Create a new calendar event.
     */
    public function createEvent(User $user, int $calendarId, array $data): CalendarEvent
    {
        $calendar = Calendar::findOrFail($calendarId);
        
        // Check permissions
        if (!$calendar->canBeEditedBy($user)) {
            throw new \Exception('You do not have permission to add events to this calendar.');
        }

        $event = CalendarEvent::create([
            'tenant_id' => $user->tenant_id,
            'calendar_id' => $calendarId,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'all_day' => $data['all_day'] ?? false,
            'location' => $data['location'] ?? null,
            'url' => $data['url'] ?? null,
            'created_by' => $user->id,
        ]);

        // Send notifications to calendar users
        $this->notifyCalendarUsers($calendar, $event, 'event_created');

        return $event;
    }

    /**
     * Get upcoming events for a user.
     */
    public function getUpcomingEvents(User $user, int $days = 7): Collection
    {
        $accessibleCalendars = Calendar::accessibleByUser($user)->pluck('id');
        
        // Get calendar events for the future (upcoming scope)
        $calendarEvents = CalendarEvent::whereIn('calendar_id', $accessibleCalendars)
            ->upcoming($days)
            ->with(['calendar', 'creator'])
            ->get();

        // Get support ticket due dates as events - use same future range as calendar events
        $startDate = now();
        $endDate = now()->addDays($days);
        $supportTicketEvents = $this->getSupportTicketEvents($user, $startDate, $endDate);

        // Debug: Log the events being found
        \Log::info('Calendar events found', [
            'tenant_id' => $user->tenant_id,
            'calendar_events_count' => $calendarEvents->count(),
            'support_ticket_events_count' => $supportTicketEvents->count(),
            'total_events' => $calendarEvents->count() + $supportTicketEvents->count(),
            'date_range' => [
                'start' => $startDate->toISOString(),
                'end' => $endDate->toISOString(),
                'days' => $days
            ]
        ]);

        // Merge and sort all events - handle mixed object types properly
        $allEvents = collect();
        
        // Add calendar events (Eloquent models)
        foreach ($calendarEvents as $event) {
            $allEvents->push($event);
        }
        
        // Add support ticket events (simple objects)
        foreach ($supportTicketEvents as $event) {
            $allEvents->push($event);
        }
        
        // Sort by start_date
        $sortedEvents = $allEvents->sortBy('start_date');
        
        // Debug: Log the collection types
        \Log::info('Calendar events collection debug', [
            'total_events' => $sortedEvents->count(),
            'calendar_events_count' => $calendarEvents->count(),
            'support_ticket_events_count' => $supportTicketEvents->count(),
            'event_types' => $sortedEvents->map(function($event) {
                return [
                    'id' => $event->id ?? 'no_id',
                    'type' => get_class($event),
                    'is_support_ticket' => $event->is_support_ticket ?? false,
                    'title' => $event->title ?? 'no_title'
                ];
            })->toArray()
        ]);
        
        return $sortedEvents;
    }

    /**
     * Get events for a specific date range.
     */
    public function getEventsInRange(User $user, $startDate, $endDate): Collection
    {
        $accessibleCalendars = Calendar::accessibleByUser($user)->pluck('id');
        
        $calendarEvents = CalendarEvent::whereIn('calendar_id', $accessibleCalendars)
            ->inDateRange($startDate, $endDate)
            ->with(['calendar', 'creator'])
            ->orderBy('start_date')
            ->get();

        // Get support ticket due dates as events
        $supportTicketEvents = $this->getSupportTicketEvents($user, $startDate, $endDate);

        // Merge and sort all events - handle mixed object types properly
        $allEvents = collect();
        
        // Add calendar events (Eloquent models)
        foreach ($calendarEvents as $event) {
            $allEvents->push($event);
        }
        
        // Add support ticket events (simple objects)
        foreach ($supportTicketEvents as $event) {
            $allEvents->push($event);
        }
        
        // Sort by start_date
        $sortedEvents = $allEvents->sortBy('start_date');
        
        // Debug: Log the collection types
        \Log::info('Calendar events in range debug', [
            'total_events' => $sortedEvents->count(),
            'calendar_events_count' => $calendarEvents->count(),
            'support_ticket_events_count' => $supportTicketEvents->count(),
            'event_types' => $sortedEvents->map(function($event) {
                return [
                    'id' => $event->id ?? 'no_id',
                    'type' => get_class($event),
                    'is_support_ticket' => $event->is_support_ticket ?? false,
                    'title' => $event->title ?? 'no_title'
                ];
            })->toArray()
        ]);
        
        return $sortedEvents;
    }

    /**
     * Get support ticket due dates as calendar events.
     */
    protected function getSupportTicketEvents(User $user, $startDate, $endDate): Collection
    {
        // Convert dates to Carbon instances if they're strings
        $startDate = $startDate instanceof \Carbon\Carbon ? $startDate : \Carbon\Carbon::parse($startDate);
        $endDate = $endDate instanceof \Carbon\Carbon ? $endDate : \Carbon\Carbon::parse($endDate);
        
        // Get support tickets with due dates in the specified range
        $tickets = \App\Models\SupportTicket::where('tenant_id', $user->tenant_id)
            ->whereNotNull('due_date')
            ->where('due_date', '>=', $startDate)
            ->where('due_date', '<=', $endDate)
            ->with(['assignee', 'priority', 'status', 'category'])
            ->get();

        // Debug: Log the number of tickets found
        \Log::info('Support ticket events found', [
            'tenant_id' => $user->tenant_id,
            'start_date' => $startDate->toISOString(),
            'end_date' => $endDate->toISOString(),
            'tickets_count' => $tickets->count(),
            'tickets' => $tickets->pluck('ticket_number', 'due_date')->toArray(),
            'all_tickets_with_due_dates' => \App\Models\SupportTicket::where('tenant_id', $user->tenant_id)
                ->whereNotNull('due_date')
                ->pluck('ticket_number', 'due_date')
                ->toArray()
        ]);

        // Convert tickets to calendar event format using simple objects
        $events = $tickets->map(function ($ticket) {
            // Create a simple object with the ticket data (not an Eloquent model)
            $event = (object) [
                'id' => 'ticket_' . $ticket->id,
                'calendar_id' => null, // No specific calendar for tickets
                'title' => "Due: {$ticket->subject}",
                'description' => "Support Ticket #{$ticket->ticket_number}",
                'start_date' => $ticket->due_date,
                'end_date' => $ticket->due_date,
                'all_day' => false,
                'location' => null,
                'url' => route('support-tickets.show', $ticket->id),
                'created_by' => $ticket->created_by,
                'tenant_id' => $ticket->tenant_id,
                'is_support_ticket' => true,
                'ticket' => $ticket,
                'calendar' => (object) [
                    'id' => null,
                    'name' => 'Support Tickets',
                    'color' => $this->getTicketPriorityColor($ticket->priority),
                ],
                'creator' => $ticket->assignee,
            ];
            
            // Debug: Log each event being created
            \Log::info('Creating support ticket event', [
                'ticket_id' => $ticket->id,
                'event_id' => $event->id,
                'ticket_number' => $ticket->ticket_number,
                'title' => $event->title,
                'start_date' => $event->start_date,
                'due_date' => $ticket->due_date
            ]);
            
            return $event;
        });

        // Check for duplicate IDs
        $eventIds = $events->pluck('id')->toArray();
        $duplicateIds = array_diff_assoc($eventIds, array_unique($eventIds));
        if (!empty($duplicateIds)) {
            \Log::warning('Duplicate event IDs found', [
                'duplicate_ids' => $duplicateIds,
                'all_event_ids' => $eventIds
            ]);
        }

        return $events;
    }

    /**
     * Get color based on ticket priority.
     */
    protected function getTicketPriorityColor($priority): string
    {
        if (!$priority) {
            return '#6B7280'; // Gray for unknown priority
        }

        return match ($priority->level) {
            1 => '#DC2626', // Red for Critical
            2 => '#EA580C', // Orange for High
            3 => '#D97706', // Yellow for Medium
            4 => '#059669', // Green for Low
            5 => '#6B7280', // Gray for Very Low
            default => '#6B7280',
        };
    }

    /**
     * Share a calendar with another user.
     */
    public function shareCalendar(User $user, int $calendarId, int $sharedWithUserId, string $permission = 'view'): CalendarShare
    {
        $calendar = Calendar::findOrFail($calendarId);
        
        // Check if user can manage the calendar
        if (!$calendar->canBeManagedBy($user)) {
            throw new \Exception('You do not have permission to share this calendar.');
        }

        // Check if target user exists and is in same tenant
        $targetUser = User::where('id', $sharedWithUserId)
            ->where('tenant_id', $user->tenant_id)
            ->firstOrFail();

        // Create or update share
        $share = CalendarShare::updateOrCreate(
            [
                'calendar_id' => $calendarId,
                'shared_with_user_id' => $sharedWithUserId,
            ],
            [
                'tenant_id' => $user->tenant_id,
                'shared_by_user_id' => $user->id,
                'permission' => $permission,
            ]
        );

        // Send notification to shared user
        $this->notificationService->info(
            $targetUser,
            "Calendar '{$calendar->name}' has been shared with you",
            'Calendar Shared',
            route('calendar.show', $calendarId),
            'View Calendar'
        );

        return $share;
    }

    /**
     * Remove calendar share.
     */
    public function removeCalendarShare(User $user, int $calendarId, int $sharedWithUserId): bool
    {
        $calendar = Calendar::findOrFail($calendarId);
        
        // Check if user can manage the calendar
        if (!$calendar->canBeManagedBy($user)) {
            throw new \Exception('You do not have permission to manage this calendar.');
        }

        $share = CalendarShare::where('calendar_id', $calendarId)
            ->where('shared_with_user_id', $sharedWithUserId)
            ->first();

        if ($share) {
            $sharedUser = User::find($sharedWithUserId);
            
            // Notify user that access was removed
            if ($sharedUser) {
                $this->notificationService->warning(
                    $sharedUser,
                    "Your access to calendar '{$calendar->name}' has been removed",
                    'Calendar Access Removed'
                );
            }

            return $share->delete();
        }

        return false;
    }

    /**
     * Notify calendar users about events.
     */
    protected function notifyCalendarUsers(Calendar $calendar, CalendarEvent $event, string $action, ?string $eventTitle = null): void
    {
        $usersToNotify = collect();

        // Add calendar creator
        $usersToNotify->push($calendar->creator);

        // Add users with access to the calendar
        $accessibleUsers = User::whereHas('calendarShares', function ($query) use ($calendar) {
            $query->where('calendar_id', $calendar->id);
        })->get();

        $usersToNotify = $usersToNotify->merge($accessibleUsers)->unique('id');

        // Remove the event creator from notifications
        $usersToNotify = $usersToNotify->reject(function ($user) use ($event) {
            return $user->id === $event->created_by;
        });

        // Determine notification message based on action
        $message = match ($action) {
            'event_created' => "New event '{$event->title}' added to calendar '{$calendar->name}'",
            'event_updated' => "Event '{$event->title}' updated in calendar '{$calendar->name}'",
            'event_deleted' => "Event '{$eventTitle}' deleted from calendar '{$calendar->name}'",
            default => "Event activity in calendar '{$calendar->name}'"
        };

        $title = match ($action) {
            'event_created' => 'New Calendar Event',
            'event_updated' => 'Event Updated',
            'event_deleted' => 'Event Deleted',
            default => 'Calendar Event Activity'
        };

        // Send notifications
        foreach ($usersToNotify as $user) {
            $this->notificationService->info(
                $user,
                $message,
                $title,
                route('calendar.index'),
                'View Calendar'
            );
        }
    }

    /**
     * Update an existing calendar event.
     */
    public function updateEvent(User $user, CalendarEvent $event, array $data): CalendarEvent
    {
        // Check permissions
        if (!$event->canBeEditedBy($user)) {
            throw new \Exception('You do not have permission to edit this event.');
        }

        $event->update([
            'calendar_id' => $data['calendar_id'],
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'start_date' => $data['start_date'],
            'end_date' => $data['end_date'],
            'all_day' => $data['all_day'] ?? false,
            'location' => $data['location'] ?? null,
            'url' => $data['url'] ?? null,
        ]);

        // Send notifications to calendar users
        $this->notifyCalendarUsers($event->calendar, $event, 'event_updated');

        return $event->fresh(['calendar', 'creator']);
    }

    /**
     * Delete a calendar event.
     */
    public function deleteEvent(User $user, CalendarEvent $event): bool
    {
        // Check permissions
        if (!$event->canBeDeletedBy($user)) {
            throw new \Exception('You do not have permission to delete this event.');
        }

        $eventTitle = $event->title;
        $calendar = $event->calendar;

        $deleted = $event->delete();

        if ($deleted) {
            // Send notifications to calendar users
            $this->notifyCalendarUsers($calendar, $event, 'event_deleted', $eventTitle);
        }

        return $deleted;
    }

    /**
     * Get calendar statistics for dashboard.
     */
    public function getCalendarStats(User $user): array
    {
        $accessibleCalendars = Calendar::accessibleByUser($user);
        
        $totalCalendars = $accessibleCalendars->count();
        $upcomingEvents = $this->getUpcomingEvents($user, 7)->count();
        $todayEvents = $this->getEventsInRange($user, now()->startOfDay(), now()->endOfDay())->count();

        return [
            'total_calendars' => $totalCalendars,
            'upcoming_events' => $upcomingEvents,
            'today_events' => $todayEvents,
        ];
    }
} 