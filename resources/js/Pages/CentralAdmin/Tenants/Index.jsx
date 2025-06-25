import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { 
    PlusIcon, 
    EyeIcon, 
    PencilIcon, 
    TrashIcon, 
    MagnifyingGlassIcon,
    BuildingOfficeIcon,
    UsersIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function Index({ tenants }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [filteredTenants, setFilteredTenants] = useState(tenants.data);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedTenant, setSelectedTenant] = useState(null);
    const [editData, setEditData] = useState({
        name: '',
        status: 'active',
        plan: 'basic'
    });

    // Filter tenants based on search term and status
    useEffect(() => {
        let filtered = tenants.data;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(tenant => {
                const name = tenant.name || '';
                const id = tenant.id;
                const domain = tenant.domains?.[0]?.domain || '';
                
                return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       domain.toLowerCase().includes(searchTerm.toLowerCase());
            });
        }

        // Apply status filter
        if (statusFilter && statusFilter !== 'all') {
            filtered = filtered.filter(tenant => {
                const status = tenant.status || 'active';
                return status.toLowerCase() === statusFilter.toLowerCase();
            });
        }

        setFilteredTenants(filtered);
    }, [searchTerm, statusFilter, tenants.data]);

    const handleEdit = (tenant) => {
        setSelectedTenant(tenant);
        setEditData({
            name: tenant.name || '',
            status: tenant.status || 'active',
            plan: tenant.plan || 'basic'
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        
        router.put(route('central-admin.tenants.update', selectedTenant.id), {
            data: editData
        }, {
            onSuccess: () => {
                setShowEditModal(false);
                setSelectedTenant(null);
            },
            onError: (errors) => {
                console.error('Update failed:', errors);
            }
        });
    };

    const handleDelete = (tenant) => {
        setSelectedTenant(tenant);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        router.delete(route('central-admin.tenants.destroy', selectedTenant.id), {
            onSuccess: () => {
                setShowDeleteModal(false);
                setSelectedTenant(null);
            }
        });
    };

    const getStatusBadge = (status) => {
        const badges = {
            active: 'bg-green-100 text-green-800',
            inactive: 'bg-yellow-100 text-yellow-800',
            suspended: 'bg-red-100 text-red-800'
        };
        return badges[status] || badges.active;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold leading-tight text-gray-900">
                        Tenant Management
                    </h2>
                    <Link
                        href={route('central-admin.tenants.create')}
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-indigo-700 transition ease-in-out duration-150"
                    >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Tenant
                    </Link>
                </div>
            }
        >
            <Head title="Tenant Management" />

            {/* Search and Filters */}
            <div className="mb-6 bg-white shadow rounded-lg p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Search tenants..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex space-x-2">
                        <select 
                            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>
                </div>
                
                {/* Search Results Count */}
                {(searchTerm || statusFilter) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                            Showing {filteredTenants.length} of {tenants.data.length} tenants
                            {searchTerm && ` matching "${searchTerm}"`}
                            {statusFilter && ` with status "${statusFilter}"`}
                        </p>
                    </div>
                )}
            </div>

            {/* Tenants Grid */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredTenants.map((tenant) => (
                    <div key={tenant.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow duration-200">
                        <div className="p-6">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <BuildingOfficeIcon className="h-8 w-8 text-gray-400" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-lg font-medium text-gray-900 truncate">
                                        {tenant.name || 'Unnamed Tenant'}
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        ID: {tenant.id.substring(0, 8)}...
                                    </p>
                                </div>
                            </div>
                            
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <UsersIcon className="h-4 w-4 mr-1" />
                                        {tenant.users_count} users
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(tenant.status)}`}>
                                        {tenant.status || 'active'}
                                    </span>
                                </div>
                                
                                {tenant.domains && tenant.domains.length > 0 && (
                                    <div className="mt-2">
                                        <p className="text-sm text-gray-600">
                                            <span className="font-medium">Domain:</span> {tenant.domains[0].domain}
                                        </p>
                                    </div>
                                )}
                                
                                <div className="mt-2">
                                    <p className="text-xs text-gray-500">
                                        Created {new Date(tenant.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-gray-50 px-6 py-3">
                            <div className="flex justify-between items-center">
                                <div className="flex space-x-2">
                                    <Link
                                        href={route('central-admin.tenants.show', tenant.id)}
                                        className="text-indigo-600 hover:text-indigo-900 p-1"
                                        title="View Details"
                                    >
                                        <EyeIcon className="h-4 w-4" />
                                    </Link>
                                    <button
                                        onClick={() => handleEdit(tenant)}
                                        className="text-emerald-600 hover:text-emerald-900 p-1"
                                        title="Edit"
                                    >
                                        <PencilIcon className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(tenant)}
                                        className="text-red-600 hover:text-red-900 p-1"
                                        title="Delete"
                                    >
                                        <TrashIcon className="h-4 w-4" />
                                    </button>
                                </div>
                                
                                <Link
                                    href={route('dashboard', { tenant_id: tenant.id })}
                                    className="text-xs text-gray-600 hover:text-gray-900 underline"
                                >
                                    Manage →
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredTenants.length === 0 && (
                <div className="text-center py-12">
                    <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
                    {searchTerm || statusFilter ? (
                        <>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Try adjusting your search or filter criteria.
                            </p>
                            <div className="mt-6">
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setStatusFilter('');
                                    }}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No tenants</h3>
                            <p className="mt-1 text-sm text-gray-500">Get started by creating a new tenant.</p>
                            <div className="mt-6">
                                <Link
                                    href={route('central-admin.tenants.create')}
                                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                                >
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add Tenant
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Pagination */}
            {filteredTenants.length > 0 && (
                <div className="mt-8 flex items-center justify-between">
                    <div className="flex-1 flex justify-between sm:hidden">
                        {tenants.prev_page_url && (
                            <Link
                                href={tenants.prev_page_url}
                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Previous
                            </Link>
                        )}
                        {tenants.next_page_url && (
                            <Link
                                href={tenants.next_page_url}
                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Next
                            </Link>
                        )}
                    </div>
                    
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing <span className="font-medium">{tenants.from}</span> to{' '}
                                <span className="font-medium">{tenants.to}</span> of{' '}
                                <span className="font-medium">{tenants.total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                {tenants.links.map((link, index) => (
                                    <Link
                                        key={index}
                                        href={link.url || '#'}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                            link.active
                                                ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                        } ${index === 0 ? 'rounded-l-md' : ''} ${
                                            index === tenants.links.length - 1 ? 'rounded-r-md' : ''
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </nav>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <Modal
                    show={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    maxWidth="lg"
                >
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Edit Tenant</h3>
                            <button
                                type="button"
                                onClick={() => setShowEditModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <form onSubmit={handleEditSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                    Name
                                </label>
                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    id="status"
                                    name="status"
                                    value={editData.status}
                                    onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="suspended">Suspended</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="plan" className="block text-sm font-medium text-gray-700">
                                    Plan
                                </label>
                                <select
                                    id="plan"
                                    name="plan"
                                    value={editData.plan}
                                    onChange={(e) => setEditData({ ...editData, plan: e.target.value })}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                >
                                    <option value="basic">Basic</option>
                                    <option value="pro">Pro</option>
                                    <option value="enterprise">Enterprise</option>
                                </select>
                            </div>
                            
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Update Tenant
                                </button>
                            </div>
                        </form>
                    </div>
                </Modal>
            )}

            {showDeleteModal && (
                <Modal
                    show={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    maxWidth="md"
                >
                    <div className="px-6 py-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-medium text-gray-900">Delete Tenant</h3>
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="text-gray-400 hover:text-gray-500"
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>
                        
                        <div className="space-y-4">
                            <p>Are you sure you want to delete the tenant "<strong>{selectedTenant?.name || 'Unnamed Tenant'}</strong>"?</p>
                            <p className="text-sm text-gray-600">This action cannot be undone and will remove all associated data.</p>
                            
                            <div className="flex justify-end space-x-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                                >
                                    Delete Tenant
                                </button>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </AuthenticatedLayout>
    );
} 