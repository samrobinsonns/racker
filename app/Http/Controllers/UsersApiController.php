<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UsersApiController extends Controller
{
    /**
     * Get users for messaging (tenant-scoped)
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        
        // If central admin, get users from specified tenant
        if ($user->is_central_admin && $request->has('tenant_id')) {
            $tenantId = $request->get('tenant_id');
            $users = User::where('tenant_id', $tenantId)
                ->where('id', '!=', $user->id) // Exclude current user
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get();
        } else {
            // Regular users: get users from their own tenant
            $users = User::where('tenant_id', $user->tenant_id)
                ->where('id', '!=', $user->id) // Exclude current user
                ->select('id', 'name', 'email')
                ->orderBy('name')
                ->get();
        }

        return response()->json([
            'users' => $users
        ]);
    }
} 