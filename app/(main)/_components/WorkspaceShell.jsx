import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "./AppSidebar"
import WelcomeContainer from "../dashboard/_components/WelcomeContainer"

// Sidebar + greeting header + content area shared by every signed-in workspace page.
function WorkspaceShell({ children }) {
    return (
        <SidebarProvider style={{ "--sidebar-width": "16rem" }}>
            <AppSidebar />
            <main className="app-canvas relative min-h-screen w-full min-w-0">
                <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-orange-100/50 bg-[#fdf9f5]/80 px-4 backdrop-blur-xl md:px-8">
                    <SidebarTrigger className="text-slate-500 hover:bg-orange-50 hover:text-slate-900" />
                    <WelcomeContainer />
                </header>
                <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 md:px-8">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}

export default WorkspaceShell
