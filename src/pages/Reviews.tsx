import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { ReviewsTable } from "@/components/tables/ReviewsTable";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { useReviews } from "@/api/reviews";

export default function ReviewsPage() {
  const { data = [], isLoading } = useReviews();
  const [open, setOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Add Review</Button>
          </DialogTrigger>
          <ReviewForm onSuccess={() => setOpen(false)} />
        </Dialog>
      </div>
      {isLoading ? <p>Loading...</p> : <ReviewsTable data={data} />}
    </div>
  );
}
