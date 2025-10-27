import { useAuthStore } from "@/store/auth-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Shield, ChevronDown, LogOut } from "lucide-react";

function roleVariant(role?: string) {
  const r = (role || "").toLowerCase();
  if (r.includes("admin")) return "destructive" as const;
  if (r.includes("manager") || r.includes("editor")) return "default" as const;
  if (r.includes("guide") || r.includes("staff")) return "secondary" as const;
  return "outline" as const;
}

const prettyPhone = (p?: string | null) =>
  p
    ? p.replace(/(\+?\d{1,3})(\d{2,3})(\d{3})(\d{2})(\d{2})/, "$1 $2 $3 $4 $5")
    : "—";

export default function Header() {
  const { user } = useAuthStore();

  const phone = user?.phoneNumber ?? "";
  const role =
    user?.role?.split("").at(0)?.toUpperCase()! + user?.role?.slice(1);
  const name = (user as any)?.name ?? (user as any)?.fullName ?? undefined;

  return (
    <header className="z-40 w-full border-b">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="leading-tight">
            <div className="text-sm font-semibold">
              Welcome to Tours Dashboard
            </div>
          </div>
        </div>

        {/* Right: User quick info */}
        <div className="flex items-center gap-2">
          {/* Phone pill */}
          <div className="hidden sm:flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
            <Phone className="h-3.5 w-3.5" />
            {phone ? (
              <a href={`tel:${phone}`} className="hover:underline">
                {prettyPhone(phone)}
              </a>
            ) : (
              <span className="text-muted-foreground">No phone</span>
            )}
          </div>

          {/* Role badge */}
          <Badge
            variant={roleVariant(role)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs"
          >
            <Shield className="h-3.5 w-3.5" />
            {role ? role.toString() : "Guest"}
          </Badge>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="font-medium">{name ?? "User"}</span>
                  <span className="text-xs text-muted-foreground">
                    {role || "Guest"}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild disabled={!phone}>
                <a href={phone ? `tel:${phone}` : undefined}>
                  <Phone className="mr-2 h-4 w-4" /> Call {prettyPhone(phone)}
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  try {
                    const store: any = useAuthStore.getState
                      ? useAuthStore.getState()
                      : null;
                    if (store?.logout) return store.logout();
                  } catch (err: any) {
                    console.error(err?.message || "Something went wrong!!!");
                  }
                }}
              >
                <LogOut className="mr-2 h-4 w-4" color="red" />{" "}
                <span className="text-red-500">Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
