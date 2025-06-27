<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background-color: #f8f9fa;
            padding: 15px;
            margin-bottom: 20px;
            border-bottom: 1px solid #dee2e6;
        }
        .ticket-info {
            font-size: 14px;
            color: #6c757d;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .footer {
            font-size: 12px;
            color: #6c757d;
            border-top: 1px solid #dee2e6;
            padding-top: 15px;
            margin-top: 30px;
        }
        .warning {
            background-color: #fff3cd;
            color: #856404;
            padding: 10px;
            margin-bottom: 20px;
            border: 1px solid #ffeeba;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2 style="margin: 0; color: #0056b3;">Support Ticket Update</h2>
        </div>

        <div class="ticket-info">
            <p>
                <strong>Ticket:</strong> #{{ $ticket->ticket_number }}<br>
                <strong>Subject:</strong> {{ $ticket->subject }}<br>
                <strong>Status:</strong> {{ $ticket->status->name }}<br>
                <strong>Priority:</strong> {{ $ticket->priority->name }}
            </p>
        </div>

        <div class="content">
            {!! $content !!}
        </div>

        <div class="warning">
            Please do not modify the subject line when replying to this email. This helps us keep your communication properly organized.
        </div>

        <div class="footer">
            <p>
                This is an automated message. Please do not reply to this email directly if the ticket is closed.<br>
                To update this ticket, please reply to this email or visit our support portal.
            </p>
            <p>
                &copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
            </p>
        </div>
    </div>
</body>
</html> 