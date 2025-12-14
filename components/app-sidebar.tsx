"use client";

import { Github, BookOpen, Settings, Moon, Sun, LogOut } from "lucide-react"
import { useTheme } from "next-themes"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "@/lib/auth-client"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import Logout from "@/module/auth/components/logout"

export const AppSidebar = () => {

    const { theme, setTheme } = useTheme();
    const [mounted] = useState(() => typeof window !== "undefined");
    const pathname = usePathname();

    const { data: session } = useSession();

    const navigationItems = [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: BookOpen,
        },
        {
            title: "Repository",
            url: "/dashboard/repository",
            icon: Github,
        },
        {
            title: "Reviews",
            url: "/dashboard/reviews",
            icon: BookOpen,
        },
        {
            title: "Subscription",
            url: "/dashboard/subscription",
            icon: BookOpen,
        },
        {
            title: "Settings",
            url: "/dashboard/settings",
            icon: Settings,
        },
    ]

    const isActive = (url: string) => {
        return pathname === url || pathname.startsWith(url + "/dashboard");
    }

    if (!mounted || !session) {
        return null;
    }

    const user = session.user;
    const userName = user.name || "GUEST";
    const userEmail = user.email || "";
    const userAvatar = user.image || "";
    const userInitials = userName.split(" ").map((n) => n[0]).join("").toUpperCase();

    return (
        <Sidebar>
            <SidebarHeader className="border-b">
                <div className="flex flex-col gap-4 px-2 py-6">
                    <div className="flex items-center gap-4 px-3 py-4 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent/70 transition-colors">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary text-primary-foreground shrink-0">
                            <Github className="w-6 h-6" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-sidebar-foreground tracking-wide">
                                Connected Account
                            </p>
                            <p className="text-sm font-medium text-sidebar-foreground/90">
                                @{userName}
                            </p>
                        </div>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-6 flex-col gap-1">
                <div className="mb-2">
                    <p className="text-xs font-semibold text-sidebar-foreground/60 px-3 mb-3 uppercase tracking-widest">Menu</p>
                </div>

                <SidebarMenu className="gap-2">
                    {
                        navigationItems.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    className={`h-11 px-4 rounded-lg transition-all duration-200 ${isActive(item.url)
                                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                                        : "hover:bg-sidebar-accent/60 text-sidebar-foreground"
                                        }`}
                                >
                                    <Link href={item.url} className="flex items-center gap-3">
                                        <item.icon className="w-5 h-5 shrink-0" />
                                        <span className="text-sm font-medium">{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        ))
                    }
                </SidebarMenu>
            </SidebarContent>

            <SidebarFooter className="border-t px-3 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <SidebarMenuButton
                                    size="lg"
                                    className="h-12 px-4 rounded-lg data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
                                >
                                    <Avatar className="h-10 w-10 rounded-lg shrink-0">
                                        <AvatarImage
                                            src={userAvatar || "/placeholder.svg"}
                                            alt={userName}
                                        />
                                        <AvatarFallback className="rounded-lg">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="grid flex-1 text-left text-sm leading-relaxed min-w-0">
                                        <span className="truncate font-semibold text-base">
                                            {userName}
                                        </span>
                                        <span className="truncate text-xs text-sidebar-foreground/70">
                                            {userEmail}
                                        </span>
                                    </div>
                                </SidebarMenuButton>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent
                                className="w-80 rounded-lg"
                                align="end"
                                side="right"
                                sideOffset={8}
                            >
                                <div className="flex items-center gap-3 px-4 py-4 bg-sidebar-accent/30 rounded-t-lg">
                                    <Avatar className="h-12 w-12 rounded-lg shrink-0">
                                        <AvatarImage
                                            src={userAvatar || "/placeholder.svg"}
                                            alt={userName}
                                        />
                                        <AvatarFallback className="rounded-lg">
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm">{userName}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {userEmail}
                                        </p>
                                    </div>
                                </div>

                                <div className="px-2 py-3 border-t border-b">
                                    <DropdownMenuItem asChild>
                                        <button
                                            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                                            className="w-full px-3 py-3 flex items-center gap-3 cursor-pointer rounded-md hover:bg-sidebar-accent/50 transition-colors text-sm font-medium"
                                        >
                                            {theme === "dark" ? (
                                                <>
                                                    <Sun className="w-5 h-5 shrink-0" />
                                                    <span>Light Mode</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Moon className="w-5 h-5 shrink-0" />
                                                    <span>Dark Mode</span>
                                                </>
                                            )}
                                        </button>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer px-3 py-3 my-1 rounded-md hover:bg-red-500/10 hover:text-red-600 transition-colors font-medium">
                                        <LogOut className="w-5 h-5 mr-3 shrink-0" />
                                        <Logout>Sign Out</Logout>
                                    </DropdownMenuItem>
                                </div>

                            </DropdownMenuContent>
                        </DropdownMenu>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
