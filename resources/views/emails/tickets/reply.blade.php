@component('mail::message')
# Hello {{ $recipientName }}!

@foreach($message as $line)
{!! $line !!}

@endforeach

@component('mail::button', ['url' => $actionUrl])
{{ $actionText }}
@endcomponent

You can reply directly to this email or use the link above.

Thanks,<br>
{{ config('app.name') }}

@component('mail::subcopy')
This email is regarding ticket #{{ $ticket->ticket_number }}. Your reply will be added to the ticket automatically.
@endcomponent
@endcomponent 