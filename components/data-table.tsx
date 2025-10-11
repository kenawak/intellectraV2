"use client"

import * as React from "react"
import {
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconLayoutColumns,
} from "@tabler/icons-react"
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table"
import { toast } from "sonner"
import { z } from "zod"

import { useIsMobile } from "@/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"

export const ideaSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  confidence: z.number(),
  upvotes: z.number(),
  createdAt: z.string(),
  userId: z.string().optional(),
})

// Columns defined inside component to access handleBookmark

export function DataTable() {
  const [activeTab, setActiveTab] = React.useState<"public" | "upvoted">("public")
  const [publicIdeas, setPublicIdeas] = React.useState<z.infer<typeof ideaSchema>[]>([])
  const [upvotedIdeas, setUpvotedIdeas] = React.useState<z.infer<typeof ideaSchema>[]>([])
  const [loading, setLoading] = React.useState(true)
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10,
  })

  const data = activeTab === "public" ? publicIdeas : upvotedIdeas

  React.useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setRowSelection({}) // Reset selection when tab changes
      setPagination({ pageIndex: 0, pageSize: 10 }) // Reset pagination
      try {
        if (activeTab === "public") {
          const response = await fetch('/api/ideas/public')
          if (response.ok) {
            const ideas = await response.json()
            const filtered = ideas.filter((idea: any) => idea.confidenceScore > 85).map((idea: any) => ({
              id: idea.id,
              title: idea.title,
              description: idea.summary,
              confidence: idea.confidenceScore,
              upvotes: idea.votes.up,
              createdAt: idea.createdAt,
            }))
            setPublicIdeas(filtered)
          }
        } else {
          const response = await fetch('/api/ideas/public')
          if (response.ok) {
            const ideas = await response.json()
            const upvoted = ideas.filter((idea: any) => idea.votes.userVote === 'up').map((idea: any) => ({
              id: idea.id,
              title: idea.title,
              description: idea.summary,
              confidence: idea.confidenceScore,
              upvotes: idea.votes.up,
              createdAt: idea.createdAt,
            }))
            setUpvotedIdeas(upvoted)
          }
        }
      } catch (error) {
        console.error('Failed to fetch ideas:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [activeTab])

  const handleBookmark = async (ideaId: string) => {
    const idea = publicIdeas.find(i => i.id === ideaId)
    if (!idea) return
    try {
      const response = await fetch('/api/ideas/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: idea.title,
          summary: idea.description,
          source_url: '', // or something
        })
      })
      if (response.ok) {
        toast.success('Bookmarked successfully')
        // Optionally refresh data
      } else {
        toast.error('Failed to bookmark')
      }
    } catch (error) {
      toast.error('Error bookmarking')
    }
  }

  const columns: ColumnDef<z.infer<typeof ideaSchema>>[] = [
    {
      id: "select",
      header: ({ table }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        </div>
      ),
      cell: ({ row }) => (
        <div className="flex items-center justify-center">
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        </div>
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => {
        return <TableCellViewer item={row.original} />
      },
      enableHiding: false,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <div className="max-w-64 truncate">
          {row.original.description}
        </div>
      ),
    },
    {
      accessorKey: "confidence",
      header: "Confidence",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-muted-foreground px-1.5">
          {row.original.confidence}%
        </Badge>
      ),
    },
    {
      accessorKey: "upvotes",
      header: "Upvotes",
      cell: ({ row }) => (
        <div className="text-center">
          {row.original.upvotes}
        </div>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="data-[state=open]:bg-muted text-muted-foreground flex size-8"
              size="icon"
            >
              <IconDotsVertical />
              <span className="sr-only">Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-32">
            {activeTab === "public" && (
              <DropdownMenuItem onClick={() => handleBookmark(row.original.id)}>
                Bookmark
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>View Details</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Report</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      pagination,
    },
    getRowId: (row) => row.id,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })


  return (
    <Tabs
      value={activeTab}
      onValueChange={(value) => setActiveTab(value as "public" | "upvoted")}
      className="w-full flex-col justify-start gap-6"
    >
      <div className="flex items-center justify-between px-4 lg:px-6">
        <TabsList>
          <TabsTrigger value="public">Public Ideas</TabsTrigger>
          <TabsTrigger value="upvoted">Upvoted Ideas</TabsTrigger>
        </TabsList>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconLayoutColumns />
                <span className="hidden lg:inline">Customize Columns</span>
                <span className="lg:hidden">Columns</span>
                <IconChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {table
                .getAllColumns()
                .filter(
                  (column) =>
                    typeof column.accessorFn !== "undefined" &&
                    column.getCanHide()
                )
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  )
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <TabsContent
        value="public"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
      <TabsContent
        value="upvoted"
        className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
      >
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader className="bg-muted sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} colSpan={header.colSpan}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between px-4">
          <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="flex w-full items-center gap-8 lg:w-fit">
            <div className="hidden items-center gap-2 lg:flex">
              <Label htmlFor="rows-per-page" className="text-sm font-medium">
                Rows per page
              </Label>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                  <SelectValue
                    placeholder={table.getState().pagination.pageSize}
                  />
                </SelectTrigger>
                <SelectContent side="top">
                  {[10, 20, 30, 40, 50].map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex w-fit items-center justify-center text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="ml-auto flex items-center gap-2 lg:ml-0">
              <Button
                variant="outline"
                className="hidden h-8 w-8 p-0 lg:flex"
                onClick={() => table.setPageIndex(0)}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to first page</span>
                <IconChevronsLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <span className="sr-only">Go to previous page</span>
                <IconChevronLeft />
              </Button>
              <Button
                variant="outline"
                className="size-8"
                size="icon"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to next page</span>
                <IconChevronRight />
              </Button>
              <Button
                variant="outline"
                className="hidden size-8 lg:flex"
                size="icon"
                onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                disabled={!table.getCanNextPage()}
              >
                <span className="sr-only">Go to last page</span>
                <IconChevronsRight />
              </Button>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}


function TableCellViewer({ item }: { item: z.infer<typeof ideaSchema> }) {
  const isMobile = useIsMobile()
  const [fullIdea, setFullIdea] = React.useState<any>(null)
  const [loading, setLoading] = React.useState(false)

  const fetchFullIdea = async () => {
    if (fullIdea) return
    setLoading(true)
    try {
      const res = await fetch(`/api/ideas/${item.id}`)
      if (res.ok) {
        const data = await res.json()
        setFullIdea(data)
      }
    } catch (error) {
      console.error('Failed to fetch full idea:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer direction={isMobile ? "bottom" : "right"}>
      <DrawerTrigger asChild>
        <Button variant="link" className="text-foreground w-fit px-0 text-left" onClick={fetchFullIdea}>
          {item.title}
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="gap-1">
          <DrawerTitle>{item.title}</DrawerTitle>
          <DrawerDescription>
            Idea details
          </DrawerDescription>
        </DrawerHeader>
        <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm max-h-96">
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              <span className="ml-2">Loading details...</span>
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <div className="font-medium">Description</div>
                <div className="text-muted-foreground">
                  {item.description}
                </div>
              </div>
              <Separator />
              <div className="grid gap-2">
                <div className="flex gap-2 leading-none font-medium">
                  Confidence: {item.confidence}%
                </div>
                <div className="flex gap-2 leading-none font-medium">
                  Upvotes: {item.upvotes}
                </div>
                <div className="flex gap-2 leading-none font-medium">
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </div>
              </div>
              {fullIdea && (
                <>
                  <Separator />
                  <div className="grid gap-2">
                    <div className="font-medium">Unmet Needs</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {fullIdea.unmet_needs?.length > 0 ? fullIdea.unmet_needs.map((need: string, index: number) => (
                        <li key={index}>{need}</li>
                      )) : <li>No unmet needs listed</li>}
                    </ul>
                  </div>
                  <div className="grid gap-2">
                    <div className="font-medium">Product Ideas</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {fullIdea.product_idea?.length > 0 ? fullIdea.product_idea.map((idea: string, index: number) => (
                        <li key={index}>{idea}</li>
                      )) : <li>No product ideas listed</li>}
                    </ul>
                  </div>
                  <div className="grid gap-2">
                    <div className="font-medium">Proof of Concept</div>
                    <div className="text-muted-foreground">
                      {fullIdea.proof_of_concept || "No proof of concept provided"}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <div className="font-medium">Suggested Platforms</div>
                    <ul className="list-disc list-inside text-muted-foreground">
                      {fullIdea.suggestedPlatforms?.length > 0 ? fullIdea.suggestedPlatforms.map((platform: any, index: number) => (
                        <li key={index}>{platform.name}{platform.link ? ` (${platform.link})` : ''}</li>
                      )) : <li>No suggested platforms</li>}
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </div>
        <DrawerFooter>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
