# Ticket Reply Testing Documentation

## Overview
The ticket reply testing system allows developers to simulate email replies to support tickets during development and testing. This is particularly useful when you need to test the email reply functionality without setting up actual email processing.

## Test Command
The system provides an artisan command `ticket:test-reply` that simulates incoming email replies.

### Basic Command Structure
```bash
./vendor/bin/sail artisan ticket:test-reply {ticket_number} [options]
```

### Available Options
| Option | Description | Default |
|--------|-------------|---------|
| `--message` | The reply message content | "This is a test reply to ticket [number]" |
| `--from` | The sender's email address | test@example.com |
| `--name` | The sender's display name | Test User |

### Examples

1. Basic Reply Test
```bash
./vendor/bin/sail artisan ticket:test-reply TKT-2025-236136
```

2. Custom Message
```bash
./vendor/bin/sail artisan ticket:test-reply TKT-2025-236136 --message="I've tested the feature and found some issues"
```

3. Custom Sender Details
```bash
./vendor/bin/sail artisan ticket:test-reply TKT-2025-236136 \
    --from="customer@example.com" \
    --name="John Customer" \
    --message="Here's my detailed feedback"
```

## What The Test Simulates

### 1. Email Reply Processing
- Creates a reply record with email metadata
- Sets reply type as 'customer'
- Marks the reply as coming via email
- Includes proper email headers and timestamps

### 2. System Updates
- Updates ticket's last response time
- Creates activity log entries
- Maintains email threading information
- Preserves tenant context

### 3. Data Structure
The test creates a reply with the following structure:
```php
[
    'content' => $message,
    'content_html' => "<p>{$message}</p>",
    'author_email' => $fromEmail,
    'author_name' => $fromName,
    'reply_type' => 'customer',
    'is_internal' => false,
    'is_via_email' => true,
    'message_id' => 'test-' . time(),
    'email_headers' => [
        'message_id' => 'test-' . time(),
        'received_at' => now(),
    ],
    'email_metadata' => [
        'subject' => "Re: [{$ticketNumber}] {$ticket->subject}",
        'cc' => [],
        'bcc' => [],
    ],
]
```

## Success Response
Upon successful execution, the command displays a table with:
- Ticket number
- Sender information
- Reply ID
- Creation timestamp

Example output:
```
✓ Reply created successfully!
+------------+--------------------------------------+
| Field      | Value                                |
+------------+--------------------------------------+
| Ticket     | TKT-2025-236136                      |
| From       | John Customer <customer@example.com> |
| Reply ID   | 22                                   |
| Created At | 2025-07-01 14:32:00                  |
+------------+--------------------------------------+
```

## Error Handling
The command handles various error scenarios:

1. Ticket Not Found
```bash
Ticket TKT-2025-236136 not found!
```

2. Invalid Input
- Missing required fields
- Invalid email format
- Malformed ticket number

## Testing Scenarios

### 1. Basic Reply Flow
```bash
# Test basic reply functionality
./vendor/bin/sail artisan ticket:test-reply TKT-2025-236136
```

### 2. Customer Communication
```bash
# Simulate customer providing additional information
./vendor/bin/sail artisan ticket:test-reply TKT-2025-236136 \
    --from="customer@example.com" \
    --name="John Customer" \
    --message="Here's the additional information you requested"
```

### 3. Multiple Replies
```bash
# Test multiple replies to the same ticket
./vendor/bin/sail artisan ticket:test-reply TKT-2025-236136 --message="First reply"
./vendor/bin/sail artisan ticket:test-reply TKT-2025-236136 --message="Second reply"
```

## Development Notes

### Adding New Features
When adding new features to the email reply system:
1. Update the test command to simulate the new functionality
2. Add appropriate test scenarios to this documentation
3. Update the data structure section if new fields are added

### Troubleshooting
If the command fails:
1. Verify the ticket number exists
2. Check tenant context is properly set
3. Ensure all required fields are provided
4. Review the error message for specific issues

## Related Documentation
- Email Configuration Guide
- Support Ticket System Documentation
- Activity Logging System 