import { Logo } from "@/components/Logo";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
import { AuthHalftonePanelArt } from "@/components/auth/AuthHalftonePanelArt";

interface Props {
  children: React.ReactNode;
}

export function AuthSplitShell({ children }: Props) {
  return (
    <div className="relative flex min-h-screen w-full bg-background font-sans text-foreground antialiased">
      <AuthThemeToggle />

      <div className="flex w-full flex-col lg:w-1/2">
        <div className="absolute left-2 top-2 p-6 md:left-4 md:top-4 md:p-10">
          <Logo href="/" size="lg" short />
        </div>

        <div className="flex flex-1 items-center justify-center p-6 pb-10 pt-24 md:p-10 md:pt-28">
          {children}
        </div>
      </div>

      <div className="hidden p-4 lg:block lg:w-1/2">
        <div className="relative h-full min-h-[calc(100vh-2rem)] w-full overflow-hidden rounded-[2rem] border border-black/10">
          <AuthHalftonePanelArt />
        </div>
      </div>
    </div>
  );
}
