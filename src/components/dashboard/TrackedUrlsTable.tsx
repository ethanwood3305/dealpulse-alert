
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, MoreVertical, Trash2 } from "lucide-react";

interface TrackedUrl {
  id: string;
  url: string;
  last_price: number | null;
  last_checked: string | null;
  created_at: string;
}

interface TrackedUrlsTableProps {
  trackedUrls: TrackedUrl[];
  onDelete: (id: string) => Promise<void>;
}

export const TrackedUrlsTable = ({ trackedUrls, onDelete }: TrackedUrlsTableProps) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Your Tracked URLs</CardTitle>
            <CardDescription>Websites you're currently monitoring</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {trackedUrls.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Last Price</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Added</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trackedUrls.map(url => (
                  <TableRow key={url.id}>
                    <TableCell className="font-medium truncate max-w-[200px]">
                      <a href={url.url} target="_blank" rel="noopener noreferrer" className="flex items-center hover:text-primary">
                        {url.url}
                        <ArrowUpRight className="h-3 w-3 ml-1 inline" />
                      </a>
                    </TableCell>
                    <TableCell>
                      {url.last_price ? `$${url.last_price.toFixed(2)}` : "Not checked yet"}
                    </TableCell>
                    <TableCell>
                      {formatDate(url.last_checked)}
                    </TableCell>
                    <TableCell>
                      {new Date(url.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onDelete(url.id)} className="text-destructive focus:text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">You're not tracking any URLs yet.</p>
            <p className="text-muted-foreground">Add a URL above to start monitoring competitors.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
