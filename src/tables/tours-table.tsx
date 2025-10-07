import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tour } from "@/api/tours";

type Props = {
  data: Tour[];
  onEdit: (tour: Tour) => void;
  onDelete: (id: number) => void;
};

export function ToursTable({ data, onEdit, onDelete }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Title</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>City</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((tour) => (
          <TableRow key={tour.id}>
            <TableCell>{tour.id}</TableCell>
            <TableCell>{tour.title_en}</TableCell>
            <TableCell>{tour.days}</TableCell>
            <TableCell>{tour.type}</TableCell>
            <TableCell>{tour.cityId}</TableCell>
            <TableCell className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(tour)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(tour.id)}
              >
                Delete
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
