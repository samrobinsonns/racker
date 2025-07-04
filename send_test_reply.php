<?php

// Test reply email sending script
$to = 'test@example.com';
$subject = 'Re: Attachment Test'; // This should match an existing ticket subject
$message = "Hello Support Team,\n\nThis is a reply to the existing ticket.\n\nThanks for your help!\n\nBest regards,\nTest User";
$headers = "From: customer@example.com\r\n";
$headers .= "Reply-To: customer@example.com\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$headers .= "In-Reply-To: <test-message-id-12345@example.com>\r\n";
$headers .= "References: <test-message-id-12345@example.com>\r\n";

// Send the email
if (mail($to, $subject, $message, $headers)) {
    echo "Test reply email sent successfully!\n";
} else {
    echo "Failed to send test reply email.\n";
} 