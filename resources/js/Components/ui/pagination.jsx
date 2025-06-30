import { Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export function Pagination({ links }) {
    // Don't render pagination if there's only 1 page
    if (links.length <= 3) return null;

    return (
        <nav role="navigation" aria-label="Pagination Navigation" className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="hidden sm:block">
                <div className="flex items-center space-x-2">
                    {links.map((link, i) => {
                        // Skip "prev" and "next" labels in the middle
                        if (
                            (i === 0 && link.label === '&laquo; Previous') ||
                            (i === links.length - 1 && link.label === 'Next &raquo;')
                        ) {
                            return null;
                        }

                        // For prev/next arrows
                        if (i === 0) {
                            return (
                                <Button
                                    key={link.label}
                                    variant="outline"
                                    size="icon"
                                    disabled={!link.url}
                                    asChild={link.url ? true : undefined}
                                    aria-label="Previous page"
                                >
                                    {link.url ? (
                                        <Link href={link.url}>
                                            <ChevronLeftIcon className="h-4 w-4" />
                                        </Link>
                                    ) : (
                                        <ChevronLeftIcon className="h-4 w-4" />
                                    )}
                                </Button>
                            );
                        }

                        if (i === links.length - 1) {
                            return (
                                <Button
                                    key={link.label}
                                    variant="outline"
                                    size="icon"
                                    disabled={!link.url}
                                    asChild={link.url ? true : undefined}
                                    aria-label="Next page"
                                >
                                    {link.url ? (
                                        <Link href={link.url}>
                                            <ChevronRightIcon className="h-4 w-4" />
                                        </Link>
                                    ) : (
                                        <ChevronRightIcon className="h-4 w-4" />
                                    )}
                                </Button>
                            );
                        }

                        // For numbered pages
                        return (
                            <Button
                                key={link.label}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                asChild={!link.active && link.url ? true : undefined}
                                disabled={!link.url}
                                aria-current={link.active ? 'page' : undefined}
                                aria-label={`Page ${link.label}`}
                            >
                                {link.url && !link.active ? (
                                    <Link href={link.url}>
                                        {link.label.replace(/&laquo;|&raquo;/g, '')}
                                    </Link>
                                ) : (
                                    link.label.replace(/&laquo;|&raquo;/g, '')
                                )}
                            </Button>
                        );
                    })}
                </div>
            </div>
            {/* Mobile pagination */}
            <div className="flex flex-1 justify-between sm:hidden">
                {links[0].url ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={links[0].url}>Previous</Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        Previous
                    </Button>
                )}
                {links[links.length - 1].url ? (
                    <Button variant="outline" size="sm" asChild>
                        <Link href={links[links.length - 1].url}>Next</Link>
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" disabled>
                        Next
                    </Button>
                )}
            </div>
        </nav>
    );
} 