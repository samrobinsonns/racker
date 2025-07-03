# Email-to-Ticket System Testing Guide

## Overview

The email-to-ticket system allows support tickets to be automatically created from incoming emails using docker-mailserver and IMAP polling. This guide covers setup, configuration, and testing procedures.

## Prerequisites

- Laravel Sail running
- docker-mailserver container running
- IMAP extension installed in PHP
- Support ticket system with proper database schema

## System Architecture

```
Email → docker-mailserver → IMAP → Laravel Command → Support Ticket
```

## Setup Verification

### 1. Check Mailserver Status

```bash
# Check if mailserver container is running
./vendor/bin/sail ps | grep mailserver

# Check mailserver logs
./vendor/bin/sail logs mailserver
```

### 2. Verify IMAP Connection

```bash
# Test IMAP connection from Laravel
./vendor/bin/sail artisan emails:test-imap 217bfeb1-62a6-4962-831a-3028095f74bc
```

### 3. Check Database Schema

Ensure the following fields exist and are nullable:
- `support_tickets.category_id` (nullable)
- `support_tickets.created_by` (nullable)
- `support_tickets.source` (for tracking email-created tickets)
- `support_tickets.source_id` (for tracking message ID)

## Configuration

### 1. IMAP Settings in Admin Panel

Navigate to: **Admin → Support Ticket Settings → IMAP Settings**

Configure with these values for local testing:
- **IMAP Host**: `mailserver`
- **IMAP Port**: `143` (or `993` for SSL)
- **Username**: `test@example.com`
- **Password**: `testpassword`
- **Encryption**: `none` (or `ssl` for port 993)
- **Folder**: `INBOX`
- **Enabled**: `true`

### 2. Email Settings Database

The system stores IMAP settings in the `email_settings` table:
- `imap_host`: Mail server hostname
- `imap_port`: IMAP port number
- `imap_username`: Email username
- `imap_password`: Email password (encrypted)
- `imap_encryption`: SSL/TLS encryption type
- `imap_folder`: Mailbox folder to monitor
- `imap_enabled`: Whether IMAP processing is active

## Testing Procedures

### 1. Send Test Email

#### Method 1: Using sendmail (Recommended)
```bash
# Create a test email file
cat > test_email.txt << 'EOF'
From: customer@example.com
To: test@example.com
Subject: Test Support Ticket - Website Issue

Hello Support Team,

I am experiencing an issue with the website login. When I try to log in, I get an error message saying "Invalid credentials" even though I am sure my password is correct.

Please help me resolve this issue.

Best regards,
John Customer
EOF

# Send the email
./vendor/bin/sail exec mailserver sendmail -t test@example.com < test_email.txt
```

#### Method 2: Using telnet
```bash
# Connect to mailserver
./vendor/bin/sail exec mailserver telnet localhost 25

# Send email (interactive)
EHLO localhost
MAIL FROM: customer@example.com
RCPT TO: test@example.com
DATA
Subject: Test Ticket - Database Issue

Hello Support Team,

I am having trouble accessing the database. The connection keeps timing out.

Please help!

Best regards,
Jane Doe
.
QUIT
```

### 2. Process Incoming Emails

```bash
# Process emails for a specific tenant
./vendor/bin/sail artisan emails:process 217bfeb1-62a6-4962-831a-3028095f74bc

# Process emails for all tenants
./vendor/bin/sail artisan emails:process
```

### 3. Verify Ticket Creation

#### Check Database
```bash
# Check for email-created tickets
./vendor/bin/sail artisan tinker --execute="App\Models\SupportTicket::where('source', 'email')->latest()->get(['ticket_number', 'subject', 'requester_email', 'created_at'])->toArray();"
```

#### Check Admin Panel
Navigate to: **Support Tickets** and look for tickets with:
- Source: "email"
- Requester email: matches sender
- Subject: email subject
- Description: email body

## Troubleshooting

### Common Issues

#### 1. IMAP Connection Failed
**Symptoms**: "Failed to connect to IMAP" error
**Solutions**:
- Verify mailserver container is running
- Check IMAP settings in admin panel
- Ensure correct hostname (`mailserver`) and port
- Test network connectivity: `./vendor/bin/sail exec laravel.test ping mailserver`

#### 2. Authentication Errors
**Symptoms**: "SECURITY PROBLEM: insecure server advertised AUTH=PLAIN"
**Solutions**:
- This is expected in development environment
- For production, configure proper SSL/TLS
- Verify username/password are correct

#### 3. Email Content in Subject Field
**Symptoms**: Entire email content appears in ticket subject
**Solutions**:
- Check email parsing logic in `ProcessIncomingEmails.php`
- Verify `getEmailBody()` method is working correctly
- Ensure proper email structure handling

#### 4. Database Errors
**Symptoms**: "Field doesn't have a default value" errors
**Solutions**:
- Run migrations: `./vendor/bin/sail artisan migrate`
- Ensure `category_id` and `created_by` are nullable
- Check database schema matches expectations

### Debug Commands

```bash
# Check mailserver logs
./vendor/bin/sail logs mailserver

# Check Laravel logs
./vendor/bin/sail logs laravel.test

# Test IMAP connection manually
./vendor/bin/sail exec laravel.test telnet mailserver 143

# Check email settings in database
./vendor/bin/sail artisan tinker --execute="App\Models\EmailSetting::all()->toArray();"
```

## Production Considerations

### 1. Security
- Use SSL/TLS encryption for IMAP
- Store passwords encrypted in database
- Implement proper authentication
- Use dedicated email accounts for ticket processing

### 2. Performance
- Implement email polling with reasonable intervals
- Add duplicate detection to prevent multiple tickets
- Consider using email webhooks instead of polling
- Implement proper error handling and retry logic

### 3. Monitoring
- Log all email processing activities
- Monitor failed email processing
- Set up alerts for system issues
- Track email-to-ticket conversion rates

## Scheduled Processing

To automatically process emails, add to your crontab:

```bash
# Process emails every 5 minutes
*/5 * * * * cd /path/to/racker && ./vendor/bin/sail artisan emails:process >> /dev/null 2>&1
```

Or use Laravel's task scheduling in `app/Console/Kernel.php`:

```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('emails:process')->everyFiveMinutes();
}
```

## API Endpoints

### Test IMAP Connection
```
POST /api/admin/email-settings/test-imap
```

### Save IMAP Settings
```
POST /api/admin/email-settings/imap
```

### Get IMAP Settings
```
GET /api/admin/email-settings/imap
```

## File Structure

```
app/
├── Console/Commands/
│   └── ProcessIncomingEmails.php    # Main email processing command
├── Http/Controllers/
│   └── Admin/EmailSettingController.php  # IMAP settings management
└── Models/
    └── EmailSetting.php             # Email settings model

database/migrations/
├── xxx_add_imap_fields_to_email_settings.php
├── xxx_make_category_id_nullable_in_support_tickets.php
└── xxx_make_created_by_nullable_in_support_tickets.php

docker-compose.yml                   # Mailserver service configuration
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Laravel and mailserver logs
3. Verify configuration settings
4. Test with simple email first
5. Check database schema and migrations 