import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { RequestsTable } from "@/components/tables/RequestsTable";
import { RequestForm } from "@/components/forms/RequestForm";
import { useRequests } from "@/api/requests";

export default function RequestsPage() {
  const { data = [], isLoading } = useRequests();
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Requests</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Request</Button>
          </DialogTrigger>
          <RequestForm onSuccess={() => setOpen(false)} />
        </Dialog>
      </div>
      {isLoading ? <p>Loading...</p> : <RequestsTable data={data} />}
    </div>
  );
}
