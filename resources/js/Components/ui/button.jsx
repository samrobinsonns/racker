import * as React from "react";
import { Link } from "@inertiajs/react";
import { cn } from "@/lib/utils";

const buttonVariants = {
    default: "bg-indigo-600 text-white hover:bg-indigo-700 focus-visible:outline-indigo-600",
    destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:outline-gray-600",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "text-indigo-600 underline-offset-4 hover:underline",
};

const buttonSizes = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
};

export function Button({
    className,
    variant = "default",
    size = "default",
    asChild = false,
    ...props
}) {
    const Comp = asChild ? Link : "button";
    return (
        <Comp
            className={cn(
                "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                buttonVariants[variant],
                buttonSizes[size],
                className
            )}
            {...props}
        />
    );
} 