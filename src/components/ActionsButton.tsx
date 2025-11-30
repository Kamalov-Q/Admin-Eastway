import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Eye, MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export type ActionButtonProps<T> = {
  item: T;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;

  //Customization

  showView?: boolean;
  showEdit?: boolean;
  showDelete?: boolean;

  viewLabel?: string;
  editLabel?: string;
  deleteLabel?: string;

  className?: string;
};

function ActionsButton<T>({
  item,
  onView,
  onEdit,
  onDelete,
  showView = true,
  showEdit = true,
  showDelete = true,
  viewLabel = "View",
  editLabel = "Edit",
  deleteLabel = "Delete",
  className,
}: ActionButtonProps<T>) {
  return (
    <div className={`flex justify-end ${className}`}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          {showView && onView && (
            <DropdownMenuItem
              onClick={() => onView(item)}
              className="text-blue-600 focus:text-blue-700"
            >
              <Eye className="h-4 w-4 mr-2 text-blue-600" />
              {viewLabel}
            </DropdownMenuItem>
          )}
          {showEdit && onEdit && (
            <DropdownMenuItem onClick={() => onEdit(item)}>
              <Pencil className="h-4 w-4 mr-2 " /> {editLabel}
            </DropdownMenuItem>
          )}
          {showDelete && onDelete && (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-700"
              onClick={() => onDelete(item)}
            >
              <Trash2 className="h-4 w-4 mr-2 text-red-600" /> {deleteLabel}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default ActionsButton;
