import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./_components/AppSidebar"
import WelcomeContainer from "./dashboard/_components/WelcomeContainer"

function DashboardLayout({ children }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="min-h-screen w-full bg-slate-50">
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md md:px-6">
                    <SidebarTrigger className="text-slate-500" />
                    <div className="h-6 w-px bg-slate-200" />
                    <WelcomeContainer />
                </header>
                <div className="mx-auto w-full max-w-7xl p-4 md:p-8">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

export default DashboardLayout
