import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import WelcomeContainer from "../dashboard/_components/WelcomeContainer"

// Sidebar + greeting header + content area shared by every signed-in workspace page.
function WorkspaceShell({ children }) {
    return (
        <SidebarProvider style={{ "--sidebar-width": "18rem" }}>
            <AppSidebar />
            <main className="app-canvas relative min-h-screen w-full">
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-[#fdf9f5]/75 px-4 backdrop-blur-md md:px-8">
                    <SidebarTrigger className="text-slate-500 hover:bg-orange-50 hover:text-slate-900" />
                    <WelcomeContainer />
                </header>
                <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-4 md:px-10">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

export default WorkspaceShell
