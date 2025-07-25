<?php

namespace App\Http\Controllers;

use App\Models\Calendar;
use App\Models\CalendarEvent;
use App\Models\User;
use App\Services\CalendarService;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    protected CalendarService $calendarService;
    protected NotificationService $notificationService;

    public function __construct(CalendarService $calendarService, NotificationService $notificationService)
    {
        $this->calendarService = $calendarService;
        $this->notificationService = $notificationService;
    }

    /**
     * Display the main calendar view.
     */
    public function index(Request $request): Response
    {
        $user = auth()->user();
        $view = $request->get('view', 'month'); // month, week, day
        $date = $request->get('date', now()->format('Y-m-d'));

        // Get accessible calendars
        $calendars = Calendar::accessibleByUser($user)
            ->with(['creator', 'shares.sharedWithUser'])
            ->get();

        // Get events for the current view
        $startDate = $this->getStartDateForView($view, $date);
        $endDate = $this->getEndDateForView($view, $date);
        
        // Debug: Log the date range being used
        \Log::info('Calendar date range debug', [
            'view' => $view,
            'date' => $date,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'start_date_parsed' => \Carbon\Carbon::parse($startDate)->toISOString(),
            'end_date_parsed' => \Carbon\Carbon::parse($endDate)->toISOString(),
        ]);
        
        $events = $this->calendarService->getEventsInRange($user, $startDate, $endDate);
        
        // Debug: Log what's being sent to frontend
        \Log::info('Calendar Index events debug', [
            'view' => $view,
            'date' => $date,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_events' => $events->count(),
            'support_ticket_events' => $events->filter(function($event) {
                return $event->is_support_ticket ?? false;
            })->count(),
            'regular_events' => $events->filter(function($event) {
                return !($event->is_support_ticket ?? false);
            })->count(),
            'events_sample' => $events->take(3)->map(function($event) {
                return [
                    'id' => $event->id,
                    'title' => $event->title,
                    'is_support_ticket' => $event->is_support_ticket ?? false,
                    'start_date' => $event->start_date
                ];
            })->toArray()
        ]);

        return Inertia::render('Calendar/Index', [
            'calendars' => $calendars,
            'events' => $events->values()->toArray(),
            'view' => $view,
            'date' => $date,
            'stats' => $this->calendarService->getCalendarStats($user),
        ]);
    }

    /**
     * Show the calendar creation form.
     */
    public function create(): Response
    {
        return Inertia::render('Calendar/Create');
    }

    /**
     * Store a new calendar.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'color' => 'required|string|regex:/^#[0-9A-F]{6}$/i',
            'is_public' => 'boolean',
        ]);

        try {
            $calendar = $this->calendarService->createCalendar(auth()->user(), $request->all());

            $this->notificationService->success(
                auth()->user(),
                "Calendar '{$calendar->name}' created successfully"
            );

            return redirect()->route('calendar.index')->with('success', 'Calendar created successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create calendar: ' . $e->getMessage()]);
        }
    }

    /**
     * Show the event creation form.
     */
    public function createEvent(Request $request): Response
    {
        $user = auth()->user();
        $calendars = Calendar::accessibleByUser($user)
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                      ->orWhereHas('shares', function ($shareQuery) use ($user) {
                          $shareQuery->where('shared_with_user_id', $user->id)
                                    ->whereIn('permission', ['edit', 'admin']);
                      });
            })
            ->get();

        return Inertia::render('Calendar/CreateEvent', [
            'calendars' => $calendars,
        ]);
    }

    /**
     * Store a new event.
     */
    public function storeEvent(Request $request)
    {
        $request->validate([
            'calendar_id' => 'required|exists:calendars,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'all_day' => 'boolean',
            'location' => 'nullable|string|max:255',
            'url' => 'nullable|url',
        ]);

        try {
            $event = $this->calendarService->createEvent(auth()->user(), $request->calendar_id, $request->all());

            $this->notificationService->success(
                auth()->user(),
                "Event '{$event->title}' created successfully"
            );

            return redirect()->route('calendar.index')->with('success', 'Event created successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to create event: ' . $e->getMessage()]);
        }
    }

    /**
     * Show calendar management page.
     */
    public function manage(Request $request): Response
    {
        $user = auth()->user();
        $calendars = Calendar::accessibleByUser($user)
            ->with(['creator', 'shares.sharedWithUser'])
            ->get();

        $tenantUsers = User::where('tenant_id', $user->tenant_id)
            ->where('id', '!=', $user->id)
            ->get(['id', 'name', 'email']);

        return Inertia::render('Calendar/Manage', [
            'calendars' => $calendars,
            'tenantUsers' => $tenantUsers,
        ]);
    }

    /**
     * Share a calendar with another user.
     */
    public function share(Request $request): JsonResponse
    {
        $request->validate([
            'calendar_id' => 'required|exists:calendars,id',
            'user_id' => 'required|exists:users,id',
            'permission' => 'required|in:view,edit,admin',
        ]);

        try {
            $share = $this->calendarService->shareCalendar(
                auth()->user(),
                $request->calendar_id,
                $request->user_id,
                $request->permission
            );

            return response()->json([
                'message' => 'Calendar shared successfully',
                'share' => $share->load('sharedWithUser'),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to share calendar: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Remove calendar share.
     */
    public function removeShare(Request $request): JsonResponse
    {
        $request->validate([
            'calendar_id' => 'required|exists:calendars,id',
            'user_id' => 'required|exists:users,id',
        ]);

        try {
            $this->calendarService->removeCalendarShare(
                auth()->user(),
                $request->calendar_id,
                $request->user_id
            );

            return response()->json([
                'message' => 'Calendar access removed successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to remove calendar access: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Show the event edit form.
     */
    public function editEvent(Request $request, CalendarEvent $event): Response
    {
        $user = auth()->user();
        
        // Check if user can edit this event
        if (!$event->canBeEditedBy($user)) {
            abort(403, 'You do not have permission to edit this event.');
        }

        $calendars = Calendar::accessibleByUser($user)
            ->where(function ($query) use ($user) {
                $query->where('created_by', $user->id)
                      ->orWhereHas('shares', function ($shareQuery) use ($user) {
                          $shareQuery->where('shared_with_user_id', $user->id)
                                    ->whereIn('permission', ['edit', 'admin']);
                      });
            })
            ->get();

        return Inertia::render('Calendar/EditEvent', [
            'event' => $event->load(['calendar', 'creator']),
            'calendars' => $calendars,
        ]);
    }

    /**
     * Update an existing event.
     */
    public function updateEvent(Request $request, CalendarEvent $event)
    {
        $user = auth()->user();
        
        // Check if user can edit this event
        if (!$event->canBeEditedBy($user)) {
            abort(403, 'You do not have permission to edit this event.');
        }

        $request->validate([
            'calendar_id' => 'required|exists:calendars,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'all_day' => 'boolean',
            'location' => 'nullable|string|max:255',
            'url' => 'nullable|url',
        ]);

        try {
            $updatedEvent = $this->calendarService->updateEvent($user, $event, $request->all());

            $this->notificationService->success(
                auth()->user(),
                "Event '{$updatedEvent->title}' updated successfully"
            );

            return redirect()->route('calendar.index')->with('success', 'Event updated successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to update event: ' . $e->getMessage()]);
        }
    }

    /**
     * Delete an event.
     */
    public function deleteEvent(Request $request, CalendarEvent $event)
    {
        $user = auth()->user();
        
        // Check if user can delete this event
        if (!$event->canBeDeletedBy($user)) {
            abort(403, 'You do not have permission to delete this event.');
        }

        try {
            $eventTitle = $event->title;
            $this->calendarService->deleteEvent($user, $event);

            $this->notificationService->success(
                auth()->user(),
                "Event '{$eventTitle}' deleted successfully"
            );

            return redirect()->route('calendar.index')->with('success', 'Event deleted successfully');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete event: ' . $e->getMessage()]);
        }
    }

    /**
     * Get events for AJAX requests.
     */
    public function events(Request $request): JsonResponse
    {
        $request->validate([
            'start' => 'required|date',
            'end' => 'required|date',
        ]);

        $user = auth()->user();
        
        // Apply the same date range logic as the index method
        $startDate = \Carbon\Carbon::parse($request->start)->startOfDay();
        $endDate = \Carbon\Carbon::parse($request->end)->endOfDay();
        
        // Debug: Log the date range being used
        \Log::info('Calendar events API debug', [
            'original_start' => $request->start,
            'original_end' => $request->end,
            'adjusted_start' => $startDate->toISOString(),
            'adjusted_end' => $endDate->toISOString(),
        ]);
        
        $events = $this->calendarService->getEventsInRange($user, $startDate, $endDate);

        return response()->json($events->values()->toArray());
    }

    /**
     * Get start date for calendar view.
     */
    private function getStartDateForView(string $view, string $date): string
    {
        $dateObj = \Carbon\Carbon::parse($date);
        
        return match ($view) {
            'month' => $dateObj->startOfMonth()->startOfDay()->format('Y-m-d H:i:s'),
            'week' => $dateObj->startOfWeek()->startOfDay()->format('Y-m-d H:i:s'),
            'day' => $dateObj->startOfDay()->format('Y-m-d H:i:s'),
            default => $dateObj->startOfMonth()->startOfDay()->format('Y-m-d H:i:s'),
        };
    }

    /**
     * Get end date for calendar view.
     */
    private function getEndDateForView(string $view, string $date): string
    {
        $dateObj = \Carbon\Carbon::parse($date);
        
        return match ($view) {
            'month' => $dateObj->endOfMonth()->endOfDay()->format('Y-m-d H:i:s'),
            'week' => $dateObj->endOfWeek()->endOfDay()->format('Y-m-d H:i:s'),
            'day' => $dateObj->endOfDay()->format('Y-m-d H:i:s'),
            default => $dateObj->endOfMonth()->endOfDay()->format('Y-m-d H:i:s'),
        };
    }
} 