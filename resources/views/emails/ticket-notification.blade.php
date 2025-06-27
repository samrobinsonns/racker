@component('mail::message')
{!! $mailMessage->greeting !!}

@foreach ($mailMessage->introLines as $line)
{!! $line !!}

@endforeach

@if (isset($mailMessage->actionText))
@component('mail::button', ['url' => $mailMessage->actionUrl])
{{ $mailMessage->actionText }}
@endcomponent
@endif

@foreach ($mailMessage->outroLines as $line)
{!! $line !!}

@endforeach

@if (trim($mailMessage->salutation) !== 'Regards,')
{!! $mailMessage->salutation !!}
@else
@component('mail::subcopy')
If you're having trouble clicking the "{{ $mailMessage->actionText }}" button, copy and paste the URL below into your web browser:
<span class="break-all">[{{ $mailMessage->displayableActionUrl }}]({{ $mailMessage->actionUrl }})</span>
@endcomponent
@endif
@endcomponent 