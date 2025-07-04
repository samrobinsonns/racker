# Email-to-Ticket Testing Quick Reference

## Recent Fixes Applied ✅

**Email Subject/Body Parsing**: Fixed email content appearing entirely in ticket title - now properly separates subject and description with improved encoding handling.

**Sender Email Extraction**: Improved logic to correctly extract the sender's ("From:") email address even when the subject is the first line and the 'From:' header is on the next line (common with some mailserver formats).

**Reply-to-Customer Functionality**: Fixed reply system for email-created tickets by implementing automatic contact creation/linking. Now both email-created and manually-created tickets support proper customer notifications.

## Quick Test Commands

### 1. Check System Status
```bash
# Check if mailserver is running
./vendor/bin/sail ps | grep mailserver

# Check mailserver logs
./vendor/bin/sail logs mailserver
```

### 2. Send Test Email
```bash
# Quick test email
echo "Subject: Test Ticket\n\nHello Support Team,\n\nThis is a test ticket.\n\nThanks!" | ./vendor/bin/sail exec mailserver sendmail -t test@example.com
```

### 3. Test Email Parsing (NEW)
```bash
# Test email parsing to debug subject/body separation
./vendor/bin/sail artisan emails:test-parsing 217bfeb1-62a6-4962-831a-3028095f74bc
```

### 4. Process Emails
```bash
# Process for specific tenant
./vendor/bin/sail artisan emails:process 217bfeb1-62a6-4962-831a-3028095f74bc

# Process for all tenants
./vendor/bin/sail artisan emails:process
```

### 4b. Production: Continuous Email Processing (Marks Emails as Read)
```bash
# Run this in production to process all new/unread emails every 60 seconds
./vendor/bin/sail artisan emails:process-continuously --frequency=60

# You can change the frequency (in seconds) for development/testing
./vendor/bin/sail artisan emails:process-continuously --frequency=10
```
- This command will only process new/unread emails and mark them as read after creating tickets, preventing duplicates.
- For production, set `--frequency=60` (every minute) or adjust as needed.

### 5. Test IMAP Connection
```bash
# Test connection
./vendor/bin/sail artisan emails:test-imap 217bfeb1-62a6-4962-831a-3028095f74bc
```

### 6. Check Created Tickets
```bash
# View email-created tickets
./vendor/bin/sail artisan tinker --execute="App\Models\SupportTicket::where('source', 'email')->latest()->get(['ticket_number', 'subject', 'requester_email', 'contact_id'])->toArray();"

# Check contact auto-creation
./vendor/bin/sail artisan tinker --execute="App\Models\SupportTicket::where('source', 'email')->with('contact')->latest()->first();"
```

### 7. Test Reply Functionality (NEW)
```bash
# Test reply to email-created ticket
./vendor/bin/sail artisan ticket:test-reply TKT-2025-615214 --message="Testing reply to email-created ticket" --from="agent@company.com" --name="Support Agent"

# Check contact information for replies
./vendor/bin/sail artisan tinker --execute="
\$ticket = App\Models\SupportTicket::where('ticket_number', 'TKT-2025-615214')->with('contact')->first();
echo 'Contact: ' . (\$ticket->contact ? \$ticket->contact->email : 'None') . \"\n\";
echo 'Requester Email: ' . \$ticket->requester_email . \"\n\";
"
```

## IMAP Settings for Testing

**Admin Panel → Support Ticket Settings → IMAP Settings:**
- Host: `mailserver`
- Port: `143`
- Username: `test@example.com`
- Password: `testpassword`
- Encryption: `none`
- Folder: `INBOX`
- Enabled: `true`

## Common Issues & Solutions

### Reply-to-Customer Functionality (FIXED)

**Problem**: When replying to tickets created from incoming emails, the system wasn't sending emails to the correct customer address. Email-created tickets only had `requester_email` fields but no linked contact, so replies failed.

**Root Cause**: The notification system expected tickets to have linked `Contact` records, but email-created tickets only stored email/name in `requester_email` and `requester_name` fields.

**Solution Applied**:
1. **Automatic Contact Creation**: Modified `TicketService` to automatically find existing contacts by email or create new ones when processing email-created tickets
2. **Enhanced Notification System**: Updated `NotificationService` to handle both contact-linked tickets and email-only tickets
3. **Unified Reply System**: Replies now work consistently whether the ticket was created manually (with contact) or from email (with auto-created contact)

**Test the Fix**:
```bash
# Create ticket from email - should auto-create contact
./vendor/bin/sail artisan emails:process 217bfeb1-62a6-4962-831a-3028095f74bc

# Check that contact was created and linked
./vendor/bin/sail artisan tinker --execute="App\Models\SupportTicket::where('source', 'email')->latest()->with('contact')->first();"

# Test reply functionality (should send to customer's email)
./vendor/bin/sail artisan ticket:test-reply TICKET_NUMBER --message="Testing customer notification"
```

### Email Subject/Body Parsing Issues (FIXED)

**Problem**: Entire email content appears in ticket title instead of being separated into subject and description.

**Root Cause**: The original `cleanEmailBody()` method was too aggressive in removing content, thinking message text was email headers. Also, some mailserver formats put the subject as the first line and the 'From:' header on the next line, which was not previously handled.

**Solution Applied**: 
- Updated `ProcessIncomingEmails.php` with improved email parsing logic
- Fixed `cleanEmailBody()` method to only remove actual headers at the beginning
- Added proper email encoding handling (base64, quoted-printable)
- Improved multipart email structure parsing
- Added comprehensive debugging output
- **NEW:** The parser now detects and extracts the sender's email from a 'From:' header that appears immediately after the subject line (for raw emails where the subject is the first line).

**Test the Fix**:
```bash
# Use the new parsing test command to verify the fix
./vendor/bin/sail artisan emails:test-parsing 217bfeb1-62a6-4962-831a-3028095f74bc

# Then process emails normally
./vendor/bin/sail artisan emails:process 217bfeb1-62a6-4962-831a-3028095f74bc
```

### Connection Failed
```bash
# Test network connectivity
./vendor/bin/sail exec laravel.test ping mailserver

# Check if port is accessible
./vendor/bin/sail exec laravel.test telnet mailserver 143
```

### Database Errors
```bash
# Run migrations
./vendor/bin/sail artisan migrate

# Check email settings
./vendor/bin/sail artisan tinker --execute="App\Models\EmailSetting::all()->toArray();"
```

### Email Not Processing
```bash
# Check Laravel logs
./vendor/bin/sail logs laravel.test

# Check mailserver logs
./vendor/bin/sail logs mailserver
```

## Test Email Templates

### Simple Test
```
Subject: Test Ticket - Simple Issue

Hello Support Team,

I need help with a simple issue.

Thanks!
```

### Detailed Test
```
Subject: Test Ticket - Complex Issue

Hello Support Team,

I am experiencing a complex issue with the system:

1. Login problems
2. Database connection errors
3. Performance issues

Please help me resolve these issues.

Best regards,
Test User
test@example.com
```

### Multipart Test Email
```bash
# Create a test email file
cat > test_multipart.txt << 'EOF'
Subject: Multipart Test Email

This is a multipart email with:
- Plain text content
- Multiple paragraphs
- Proper line breaks

The email should be parsed correctly with the subject in the title and this content in the description.

Thank you for testing!
EOF

# Send the test email
./vendor/bin/sail exec mailserver sendmail -t test@example.com < test_multipart.txt
```

## Debugging Email Parsing

### New Debugging Features

The improved email processing now includes detailed debugging output:

1. **Email Structure Analysis**: Shows email type (plain text vs multipart)
2. **Part-by-Part Processing**: Lists each email part and its content type  
3. **Encoding Detection**: Handles base64, quoted-printable, and other encodings
4. **Content Length Verification**: Shows subject and body lengths
5. **Preview Output**: First 100 characters of processed body

### Test Parsing Without Creating Tickets

Use the new `emails:test-parsing` command to debug email parsing without actually creating tickets:

```bash
./vendor/bin/sail artisan emails:test-parsing 217bfeb1-62a6-4962-831a-3028095f74bc
```

This command will:
- Connect to the IMAP server
- Parse the most recent email
- Show detailed parsing results
- Verify subject/body separation
- Display content previews

## Verification Checklist

### Email Processing
- [ ] Mailserver container running
- [ ] IMAP settings configured in admin panel
- [ ] Test email sent successfully
- [ ] Email parsing test shows proper subject/body separation ✅ NEW
- [ ] Email processing command runs without errors
- [ ] Ticket created in database with proper subject and description ✅ IMPROVED
- [ ] Subject and body properly separated ✅ FIXED
- [ ] Requester email captured correctly 
- [ ] Debug output shows correct parsing structure ✅ NEW

### Contact Auto-Creation & Reply System (NEW)
- [ ] Email-created tickets automatically link to contacts ✅ NEW
- [ ] Existing contacts found by email address ✅ NEW
- [ ] New contacts created with proper name/email ✅ NEW
- [ ] Reply-to-customer works for email-created tickets ✅ FIXED
- [ ] Reply-to-customer works for manually-created tickets ✅ VERIFIED
- [ ] Notification emails sent to correct customer address ✅ FIXED
- [ ] Both internal notes and public replies function correctly ✅ VERIFIED 