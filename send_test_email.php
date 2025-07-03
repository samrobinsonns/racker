<?php

// Test email sending script
$to = 'test@example.com';
$subject = 'Test Ticket - Proper Subject';
$message = "Hello Support Team,\n\nThis is a properly formatted test email that should create a ticket with the correct subject and body separation.\n\nPlease help me with this issue.\n\nBest regards,\nTest User";
$headers = "From: customer@example.com\r\n";
$headers .= "Reply-To: customer@example.com\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Send the email
if (mail($to, $subject, $message, $headers)) {
    echo "Test email sent successfully!\n";
} else {
    echo "Failed to send test email.\n";
} 