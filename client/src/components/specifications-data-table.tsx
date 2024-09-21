"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { GuessWithSpecs, Spec, Specs } from "@/types/games"
import GenArrow from "@/components/gen-arrow"
import { bgCorrect, bgIncorrect, bgPartial, imgHeight, imgWidth } from "../lib/constants"
import zSpecs from "~/src/stores/specifications"

const columns: ColumnDef<GuessWithSpecs>[] = [
  {
    accessorKey: "name",
    header: ({ }) => {
      return (
        <div className="text-center">
          Name
        </div>
      )
    }, cell: ({ row }) => {
      return (
        <HoverCard>
          <HoverCardTrigger>
            <div className={`border border-gray-200 shadow-md rounded-md text-white justify-center bg-gael-blue`}>
              <div className="flex items-center justify-center text-center px-4 py-2">
                {row.getValue("name")}
              </div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent>
            <Image
              src={row.original.imageUrl}
              width={imgWidth}
              height={imgHeight}
              style={{ objectFit: "contain", width: "auto", height: "auto" }}
              alt={row.getValue("name")}
              priority
            />
          </HoverCardContent>
        </HoverCard>
      )
    },
    enableHiding: false,
  },
  {
    id: "release_dates",
    accessorKey: "release_dates",
    header: ({ }) => {
      return (
        <div className="text-center">
          Release Year
        </div>
      )
    },
    cell: ({ row }) => (
      <>
        {GenArrow(
          (row.getValue("release_dates") as Spec).value ?? "",
          (row.getValue("release_dates") as Spec).arrowDir ?? "",
          row.original.release_dates.specscn
        )}
      </>
    ),
    enableHiding: false,
  },
  {
    id: "platforms",
    accessorKey: "platforms",
    header: ({ }) => {
      return (
        <div className="text-center">
          Platforms
        </div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.platforms.specscn)}`}>
          {(row.getValue("platforms") as Spec).values ?
            <div className="flex flex-wrap gap-3 justify-center items-center text-center">
              {(row.getValue("platforms") as Spec).values?.map((val: string, index: number) => (
                <span key={val + '-' + index} className='px-4 py-2 text-md'>
                  {val}
                </span>
              ))}
            </div>
            : <span className='px-4 py-2 text-md text-center'>No data</span>
          }
        </div>
      )
    },
  },
  {
    id: "genres",
    accessorKey: "genres",
    header: ({ }) => {
      return (
        <div className="text-center">
          Genres
        </div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.genres.specscn)}`}>
          {(row.getValue("genres") as Spec).values ?
            <div className="flex flex-wrap gap-3 justify-center items-center text-center">
              {(row.getValue("genres") as Spec).values?.map((val: string, index: number) => (
                <span key={val + '-' + index} className='px-4 py-2 text-md'>
                  {val}
                </span>
              ))}
            </div>
            : <span className='px-4 py-2 text-md text-center'>No data</span>
          }
        </div>
      )
    },
  },
  {
    id: "themes",
    accessorKey: "themes",
    header: ({ }) => {
      return (
        <div className="text-center">
          Themes
        </div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.themes.specscn)}`}>
          {(row.getValue("themes") as Spec).values ?
            <div className="flex flex-wrap gap-3 justify-center items-center text-center">
              {(row.getValue("themes") as Spec).values?.map((val: string, index: number) => (
                <span key={val + '-' + index} className='px-4 py-2 text-md'>
                  {val}
                </span>
              ))}
            </div>
            : <span className='px-4 py-2 text-md text-center'>No data</span>
          }
        </div>
      )
    },
  },
  {
    id: "game_modes",
    accessorKey: "game_modes",
    header: ({ }) => {
      return (
        <div className="text-center">
          Game Modes
        </div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.game_modes.specscn)}`}>
          {(row.getValue("game_modes") as Spec).values ?
            <div className="flex flex-wrap gap-3 justify-center items-center text-center">
              {(row.getValue("game_modes") as Spec).values?.map((val: string, index: number) => (
                <span key={val + '-' + index} className='px-4 py-2 text-md'>
                  {val}
                </span>
              ))}
            </div>
            : <span className='px-4 py-2 text-md text-center'>No data</span>
          }
        </div>
      )
    },
  },
  {
    id: "game_engines",
    accessorKey: "game_engines",
    header: ({ }) => {
      return (
        <div className="text-center">
          Game Engines
        </div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.game_engines.specscn)}`}>
          {(row.getValue("game_engines") as Spec).values ?
            <div className="flex flex-wrap gap-3 justify-center items-center text-center">
              {(row.getValue("game_engines") as Spec).values?.map((val: string, index: number) => (
                <span key={val + '-' + index} className='px-4 py-2 text-md'>
                  {val}
                </span>
              ))}
            </div>
            : <span className='px-4 py-2 text-md text-center'>No data</span>
          }
        </div>
      )
    },
  },
  {
    id: "player_perspectives",
    accessorKey: "player_perspectives",
    header: ({ }) => {
      return (
        <div className="text-center">
          Player Perspectives
        </div>
      )
    },
    cell: ({ row }) => {
      return (
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.player_perspectives.specscn)}`}>
          {(row.getValue("player_perspectives") as Spec).values ?
            <div className="flex flex-wrap gap-3 justify-center items-center text-center">
              {(row.getValue("player_perspectives") as Spec).values?.map((val: string, index: number) => (
                <span key={val + '-' + index} className='px-4 py-2 text-md'>
                  {val}
                </span>
              ))}
            </div>
            : <span className='px-4 py-2 text-md text-center'>No data</span>
          }
        </div>
      )
    },
  },
]

export default function SpecificationsDataTable({ guesses }: { guesses: GuessWithSpecs[] }) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const { getSummary, setSummary } = zSpecs();
  const summary = getSummary();
  const table = useReactTable({
    data: guesses,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  function getColumnValues(columnId: string) {
    const column = table.getColumn(columnId);

    if (!column) {
      throw new Error(`Column with id ${columnId} not found`);
    }

    return table.getRowModel().rows.map(row => row.getValue(columnId));
  }

  const columnIds = table.getAllColumns().map(column => column.id);
  columnIds.map((columnId: string) => {
    const columnValues = getColumnValues(columnId);

    if (!summary[columnId as keyof Specs]) {
      (summary[columnId as keyof Specs] as Spec) = columnValues[0] as Spec
    } else {
      columnValues.map((columnValue: unknown) => {
        const spec: Spec = columnValue as Spec;

        if ((summary[columnId as keyof Specs] as Spec).specscn === bgIncorrect && (
          spec.specscn === bgPartial || spec.specscn === bgCorrect
        )) {
          (summary[columnId as keyof Specs] as Spec) = spec;
        } else if ((summary[columnId as keyof Specs] as Spec).specscn === bgPartial && spec.specscn === bgCorrect) {
          (summary[columnId as keyof Specs] as Spec) = spec;
        }
      })
    }
  })

  useEffect(() => {
    setSummary(summary);
  }, [setSummary, summary])

  return (
    <div className="w-full">
      <div className="flex items-center py-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="mx-auto mb-2">
              Columns <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
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
                    {column.id.replace('_', ' ')}
                  </DropdownMenuCheckboxItem>
                )
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
            {table.getRowModel().rows?.length && (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
