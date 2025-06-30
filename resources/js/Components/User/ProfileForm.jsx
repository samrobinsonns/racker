import { useForm } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';

export default function ProfileForm({ user, className = '' }) {
    const { data, setData, patch, errors, processing, recentlySuccessful } = useForm({
        name: user.name,
        email: user.email,
        title: user.title || '',
        location: user.location || '',
        bio: user.bio || '',
        company: user.company || '',
        website: user.website || '',
    });

    const submit = (e) => {
        e.preventDefault();
        patch(route('profile.update'));
    };

    return (
        <form onSubmit={submit} className={`${className} space-y-8`}>
            {/* Basic Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h3>
                <div className="space-y-6">
                    <div>
                        <InputLabel htmlFor="name" value="Full Name" />
                        <TextInput
                            id="name"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            required
                            isFocused
                        />
                        <InputError className="mt-2" message={errors.name} />
                    </div>

                    <div>
                        <InputLabel htmlFor="email" value="Email Address" />
                        <TextInput
                            id="email"
                            type="email"
                            className="mt-1 block w-full"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            required
                        />
                        <InputError className="mt-2" message={errors.email} />
                    </div>

                    <div>
                        <InputLabel htmlFor="title" value="Job Title" />
                        <TextInput
                            id="title"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="e.g. Senior Developer"
                        />
                        <InputError className="mt-2" message={errors.title} />
                    </div>

                    <div>
                        <InputLabel htmlFor="company" value="Company" />
                        <TextInput
                            id="company"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.company}
                            onChange={(e) => setData('company', e.target.value)}
                            placeholder="e.g. Tech Corp"
                        />
                        <InputError className="mt-2" message={errors.company} />
                    </div>
                </div>
            </div>

            {/* Additional Information */}
            <div className="bg-white rounded-2xl shadow-sm p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Additional Information</h3>
                <div className="space-y-6">
                    <div>
                        <InputLabel htmlFor="bio" value="Bio" />
                        <textarea
                            id="bio"
                            className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-violet-500 focus:ring-violet-500"
                            rows="4"
                            value={data.bio}
                            onChange={(e) => setData('bio', e.target.value)}
                            placeholder="Tell us about yourself..."
                        />
                        <InputError className="mt-2" message={errors.bio} />
                    </div>

                    <div>
                        <InputLabel htmlFor="location" value="Location" />
                        <TextInput
                            id="location"
                            type="text"
                            className="mt-1 block w-full"
                            value={data.location}
                            onChange={(e) => setData('location', e.target.value)}
                            placeholder="e.g. San Francisco, CA"
                        />
                        <InputError className="mt-2" message={errors.location} />
                    </div>

                    <div>
                        <InputLabel htmlFor="website" value="Website" />
                        <TextInput
                            id="website"
                            type="url"
                            className="mt-1 block w-full"
                            value={data.website}
                            onChange={(e) => setData('website', e.target.value)}
                            placeholder="e.g. https://example.com"
                        />
                        <InputError className="mt-2" message={errors.website} />
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-4 justify-end">
                <button
                    type="submit"
                    disabled={processing}
                    className="inline-flex items-center px-6 py-3 border border-transparent rounded-full text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            Saving...
                        </>
                    ) : (
                        'Save Changes'
                    )}
                </button>

                <Transition
                    show={recentlySuccessful}
                    enter="transition ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="transition ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <p className="text-sm text-green-600">Saved successfully.</p>
                </Transition>
            </div>
        </form>
    );
} 