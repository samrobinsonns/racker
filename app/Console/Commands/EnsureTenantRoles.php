namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Tenant;
use App\Models\Role;

class EnsureTenantRoles extends Command
{
    protected $signature = 'tenant:ensure-roles {tenant_id? : The ID of the tenant to ensure roles for}';
    protected $description = 'Ensures that all necessary roles exist for the specified tenant(s)';

    public function handle()
    {
        $tenantId = $this->argument('tenant_id');

        if ($tenantId) {
            $tenant = Tenant::find($tenantId);
            if (!$tenant) {
                $this->error("Tenant not found: {$tenantId}");
                return 1;
            }
            $this->ensureRolesForTenant($tenant);
        } else {
            Tenant::chunk(100, function ($tenants) {
                foreach ($tenants as $tenant) {
                    $this->ensureRolesForTenant($tenant);
                }
            });
        }

        $this->info('Tenant roles have been ensured successfully!');
    }

    protected function ensureRolesForTenant(Tenant $tenant)
    {
        $this->info("Ensuring roles for tenant: {$tenant->id}");

        // Get template roles (type = 'tenant' and tenant_id = null)
        $templateRoles = Role::where('type', 'tenant')
            ->whereNull('tenant_id')
            ->get();

        foreach ($templateRoles as $template) {
            // Check if the role already exists for this tenant
            $existingRole = Role::where('name', $template->name)
                ->where('tenant_id', $tenant->id)
                ->first();

            if (!$existingRole) {
                // Create the role for this tenant
                Role::create([
                    'name' => $template->name,
                    'display_name' => $template->display_name,
                    'description' => $template->description,
                    'type' => 'tenant',
                    'tenant_id' => $tenant->id,
                    'permissions' => $template->permissions,
                ]);

                $this->line("Created role '{$template->name}' for tenant {$tenant->id}");
            }
        }
    }
} 