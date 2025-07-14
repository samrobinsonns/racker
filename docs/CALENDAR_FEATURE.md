# Calendar Feature Documentation

## Overview
The Calendar feature provides a modern, interactive calendar for users to create, view, edit, and manage events. It supports multi-day events, local timezone handling, and seamless integration with notifications and multi-tenancy. The calendar also integrates with the Support Ticket system to display ticket due dates as calendar events.

---

## User Guide

### Accessing the Calendar
- Navigate to the "Calendar" section from the main dashboard or navigation menu.
- The calendar displays in Month, Week, and Day views.

### Creating Events
- **Click any date square** or **press Enter** to open the Create Event modal.
- Fill in event details:
  - **Calendar**: Choose which calendar to add the event to.
  - **Event Title**: Name your event.
  - **Start/End**: Set the date and time (defaults to local time).
  - **All day event**: Check if the event lasts all day.
  - **Location/URL**: (Optional) Add extra info.
- Click **Create Event** to save.

### Editing Events
- **Click any event** in the calendar to open the Edit Event modal.
- Update details as needed, or click **Delete Event** to remove it.
- Changes are reflected instantly in the calendar.

### Support Ticket Due Dates
- **Support ticket due dates** automatically appear as calendar events.
- Due dates are color-coded by priority:
  - **Red**: Critical priority tickets
  - **Orange**: High priority tickets  
  - **Yellow**: Medium priority tickets
  - **Green**: Low priority tickets
  - **Gray**: Very low priority tickets
- **Click on a support ticket event** to open the ticket details in a new tab.
- Support ticket events are always visible and cannot be filtered out.
- Events show with a warning icon (⚠️) to distinguish them from regular calendar events.

### Multi-Day Events
- Create an event with a start and end date spanning multiple days.
- The event will visually span across all relevant days in the calendar grid.
- Overlapping and stacked events are handled automatically.

### Timezone Handling
- All dates and times are handled in your browser's local timezone.
- What you see in the modal is what is saved and displayed—no shifting due to server or database timezone.
- Events are always shown at the correct local time for each user.

### Notifications
- Creating, editing, or deleting events triggers notifications for users with access to the calendar.
- Notification settings and integration are managed centrally.

---

## Developer Guide

### File Structure
- **Frontend:** `resources/js/Pages/Calendar/Index.jsx` (main UI, modals, grid logic)
- **Backend:** `app/Models/CalendarEvent.php`, `app/Http/Controllers/CalendarController.php`, `app/Services/CalendarService.php`
- **Docs:** `docs/CALENDAR_FEATURE.md` (this file)

### Key Features
- **Local Timezone:** Dates are stored and displayed as local time, using plain strings (no UTC conversion).
- **Event Modals:** Both create and edit use modals for a seamless UX.
- **Multi-Day Events:** Events spanning multiple days are rendered as a single bar across the grid.
- **Support Ticket Integration:** Due dates from support tickets appear as calendar events.
- **Accessibility:** Keyboard navigation supported (Enter to create event).
- **Notifications:** Integrated with the app's notification system.
- **Multi-Tenancy:** All calendar data is tenant-scoped.

### Support Ticket Integration
- **CalendarService::getEventsInRange()** fetches both calendar events and support ticket due dates.
- **Support ticket events** are converted to calendar event format with special properties:
  - `is_support_ticket: true`
  - `calendar.name: 'Support Tickets'`
  - `url: route to ticket details`
  - Color based on ticket priority level
- **Frontend handling** in `Index.jsx`:
  - Support ticket events show warning icon (⚠️)
  - Clicking opens ticket in new tab instead of edit modal
  - Events are always visible (no calendar filtering)
  - Special styling distinguishes from regular events

### Date Handling
- **Frontend:**
  - Uses a custom `parseLocalDate` helper to parse backend date strings as local time.
  - All event comparisons and rendering use this helper.
- **Backend:**
  - `CalendarEvent` model stores and retrieves dates as-is (no timezone conversion).
  - No UTC conversion is performed; what the user enters is what is stored.

### Extending the Calendar
- To add new features (e.g., recurring events, color coding, sharing), extend the React component and backend models/services.
- For multi-day event rendering, see the grid logic in `Index.jsx`.
- For notification hooks, see `CalendarService.php` and the notification docs.
- To add more ticket types, modify `CalendarService::getSupportTicketEvents()`.

### Troubleshooting
- **Event appears on wrong day:** Ensure both frontend and backend use local time and the custom date parser.
- **Timezone issues:** Do not use `toISOString()` for date input values; always use local formatting.
- **Modal not opening:** Check event click handlers and modal state logic in `Index.jsx`.
- **Support ticket events not showing:** Check that tickets have due dates and are within the current view range.

---

## See Also
- [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)
- [MULTI_TENANCY_GUIDE.md](./MULTI_TENANCY_GUIDE.md)
- [USER_PROFILES.md](./USER_PROFILES.md)
- [SUPPORT_TICKET_SYSTEM.md](./SUPPORT_TICKET_SYSTEM.md) 