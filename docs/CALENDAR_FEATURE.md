# Calendar Feature Documentation

## Overview
The Calendar feature provides a modern, interactive calendar for users to create, view, edit, and manage events. It supports multi-day events, local timezone handling, and seamless integration with notifications and multi-tenancy.

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
- **Accessibility:** Keyboard navigation supported (Enter to create event).
- **Notifications:** Integrated with the app's notification system.
- **Multi-Tenancy:** All calendar data is tenant-scoped.

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

### Troubleshooting
- **Event appears on wrong day:** Ensure both frontend and backend use local time and the custom date parser.
- **Timezone issues:** Do not use `toISOString()` for date input values; always use local formatting.
- **Modal not opening:** Check event click handlers and modal state logic in `Index.jsx`.

---

## See Also
- [NOTIFICATION_SYSTEM.md](./NOTIFICATION_SYSTEM.md)
- [MULTI_TENANCY_GUIDE.md](./MULTI_TENANCY_GUIDE.md)
- [USER_PROFILES.md](./USER_PROFILES.md) 