<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class EmailSetting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tenant_id',
        'smtp_host',
        'smtp_port',
        'smtp_username',
        'smtp_password',
        'from_email',
        'from_name',
        'use_ssl',
        'is_active',
        'last_tested_at',
        'last_test_successful',
        'last_test_error',
        'imap_host',
        'imap_port',
        'imap_username',
        'imap_password',
        'imap_encryption',
        'imap_folder',
        'imap_enabled',
        'imap_last_check_at',
        'imap_last_check_successful',
        'imap_last_check_error'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'use_ssl' => 'boolean',
        'is_active' => 'boolean',
        'last_tested_at' => 'datetime',
        'last_test_successful' => 'boolean',
        'imap_enabled' => 'boolean',
        'imap_last_check_at' => 'datetime',
        'imap_last_check_successful' => 'boolean',
    ];

    /**
     * Get the tenant that owns the email settings.
     */
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Set the SMTP password with encryption.
     *
     * @param string $value
     * @return void
     */
    public function setSmtpPasswordAttribute($value)
    {
        $this->attributes['smtp_password'] = Crypt::encryptString($value);
    }

    /**
     * Get the decrypted SMTP password.
     *
     * @param string $value
     * @return string
     */
    public function getSmtpPasswordAttribute($value)
    {
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return '';
        }
    }

    /**
     * Set the IMAP password with encryption.
     *
     * @param string $value
     * @return void
     */
    public function setImapPasswordAttribute($value)
    {
        $this->attributes['imap_password'] = Crypt::encryptString($value);
    }

    /**
     * Get the decrypted IMAP password.
     *
     * @param string $value
     * @return string
     */
    public function getImapPasswordAttribute($value)
    {
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return '';
        }
    }

    /**
     * Get the configuration array for mail settings.
     *
     * @return array
     */
    public function getMailConfig(): array
    {
        return [
            'transport' => 'smtp',
            'host' => $this->smtp_host,
            'port' => $this->smtp_port,
            'encryption' => $this->use_ssl ? 'tls' : '',
            'username' => $this->smtp_username,
            'password' => $this->getSmtpPasswordAttribute($this->smtp_password),
            'from' => [
                'address' => $this->from_email,
                'name' => $this->from_name,
            ],
            'timeout' => 30,
        ];
    }
}
