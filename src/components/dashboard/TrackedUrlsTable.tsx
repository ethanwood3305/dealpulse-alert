
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrashIcon } from "lucide-react";
import { format } from "date-fns";
import { TrackedUrl } from "@/hooks/use-tracked-urls";
import { TagInput } from "./TagInput";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TrackedUrlsTableProps {
  trackedUrls: TrackedUrl[];
  onDelete: (id: string) => Promise<void>;
  onAddTag: (urlId: string, tag: string) => Promise<void>;
  onRemoveTag: (urlId: string, tag: string) => Promise<void>;
  urlsLimit: number | undefined;
}

export const TrackedUrlsTable = ({ 
  trackedUrls, 
  onDelete,
  onAddTag,
  onRemoveTag,
  urlsLimit = 1
}: TrackedUrlsTableProps) => {
  if (trackedUrls.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tracked URLs</CardTitle>
          <CardDescription>You're not tracking any URLs yet.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Add a URL above to start tracking competitor prices.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Sort URLs by creation date (newest first)
  const sortedUrls = [...trackedUrls].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tracked URLs</CardTitle>
        <CardDescription>Your tracked competitor product URLs</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Last Price</TableHead>
              <TableHead>Last Checked</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedUrls.map((url, index) => {
              const isActive = index < urlsLimit;
              
              return (
                <TableRow key={url.id} className={!isActive ? "opacity-70" : ""}>
                  <TableCell className="font-medium truncate max-w-[200px]">
                    <a 
                      href={url.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="hover:text-primary hover:underline"
                    >
                      {url.url}
                    </a>
                  </TableCell>
                  <TableCell>
                    {isActive ? (
                      <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                        Not Active
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isActive ? (
                      url.last_price ? (
                        <span className="font-mono">${url.last_price.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">Pending</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isActive ? (
                      url.last_checked ? (
                        format(new Date(url.last_checked), 'MMM d, yyyy h:mm a')
                      ) : (
                        <span className="text-muted-foreground">Not checked yet</span>
                      )
                    ) : (
                      <span className="text-muted-foreground">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <TagInput 
                      urlId={url.id}
                      existingTags={url.tags || []}
                      onAddTag={onAddTag}
                      onRemoveTag={onRemoveTag}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this tracked URL and remove all associated data.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDelete(url.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
