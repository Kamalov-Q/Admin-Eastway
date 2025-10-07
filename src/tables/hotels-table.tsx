import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Hotel } from "@/api/hotels";

type Props = {
  data: Hotel[];
  onEdit: (hotel: Hotel) => void;
  onDelete: (id: number) => void;
};

export function HotelsTable({ data, onEdit, onDelete }: Props) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>City ID</TableHead>
          <TableHead>Category ID</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((hotel) => (
          <TableRow key={hotel.id}>
            <TableCell>{hotel.id}</TableCell>
            <TableCell>{hotel.name_en}</TableCell>
            <TableCell>{hotel.cityId}</TableCell>
            <TableCell>{hotel?.category?.name_en}</TableCell>
            <TableCell className="space-x-2">
              <Button variant="outline" size="sm" onClick={() => onEdit(hotel)}>
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(hotel.id)}
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
