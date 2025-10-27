import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy } from "lucide-react";
import toast from "react-hot-toast";
import type { Request } from "@/api/requests";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  request: Request | null;
};

const StatusBadge = ({ status }: { status: Request["status"] }) => {
  const map: Record<Request["status"], { label: string; cls: string }> = {
    active: {
      label: "Active",
      cls: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    passive: {
      label: "Passive",
      cls: "bg-gray-100 text-gray-700 border-gray-200",
    },
  };
  return (
    <Badge className={`border ${map[status].cls}`}>{map[status].label}</Badge>
  );
};

function fmtDate(iso?: string) {
  if (!iso) return "-";
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  } catch {
    return iso;
  }
}

export function RequestViewModal({ open, onOpenChange, request }: Props) {
  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied`);
    } catch {
      toast.error(`Failed to copy ${label.toLowerCase()}`);
    }
  };

  const targetLabel =
    request?.type === "tour" || request?.tourId
      ? request?.tour?.title_en
        ? `Tour: ${request.tour.title_en}`
        : request?.tourId
        ? `Tour #${request.tourId}`
        : "-"
      : request?.type === "hotel" || request?.hotelId
      ? request?.hotel?.name_en
        ? `Hotel: ${request.hotel.name_en}`
        : request?.hotelId
        ? `Hotel #${request.hotelId}`
        : "-"
      : "-";

  const fullName =
    request?.firstName || request?.lastName
      ? `${request?.firstName ?? ""} ${request?.lastName ?? ""}`.trim()
      : "-";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="px-6 pt-6">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl">
              {request ? `Request #${request.id}` : "Request"}
            </DialogTitle>
            <div className="text-sm text-gray-500">
              {fmtDate(request?.createdAt)}
            </div>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          {!request ? (
            <div className="space-y-4">
              <div className="h-4 w-40 bg-gray-200 rounded" />
              <div className="h-4 w-72 bg-gray-200 rounded" />
              <div className="h-24 w-full bg-gray-200 rounded" />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="font-medium">{fullName}</div>
                <StatusBadge status={request.status} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Email</div>
                  <div className="font-medium break-all">
                    {request.email || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Phone</div>
                  <div className="font-medium break-all">
                    {request.phone || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Citizenship</div>
                  <div className="font-medium">
                    {request.citizenship || "-"}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Travelers</div>
                  <div className="font-medium">
                    {typeof request.travelers === "number"
                      ? request.travelers
                      : "-"}
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-gray-500">Target</div>
                  <div className="font-medium">{targetLabel}</div>
                </div>
              </div>

              <div className="border-t" />

              <div>
                <div className="mb-2 text-sm font-medium text-gray-800">
                  Comment
                </div>
                <div className="rounded-lg border bg-white p-3 text-sm leading-relaxed whitespace-pre-wrap wrap-break-words max-h-56 overflow-auto">
                  {request.comment || "-"}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 pb-6">
          {request && (
            <Button
              variant="outline"
              onClick={() => copy(String(request.id), "Request ID")}
              className="mr-auto"
            >
              <Copy className="h-4 w-4 mr-2" /> Copy ID
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
