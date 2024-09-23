"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { GuessWithSpecs, Spec } from "@/types/games"
import zSpecs from "~/src/stores/specifications"

const columns: ColumnDef<Partial<GuessWithSpecs>>[] = [
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
      <div className={`border border-gray-200 shadow-md rounded-md text-white justify-center ${(row.original.release_dates?.specscn)}`}>
        <div className="flex items-center justify-center px-2">
          {row.original.release_dates?.specscn === 'bg-gael-green' ?
            <span className='px-4 py-2 text-md'>{(row.getValue("release_dates") as Spec).value}</span>
            : <span className="p-2" />
          }
        </div>
      </div>
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
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.platforms?.specscn)}`}>
          {row.original.platforms?.specscn === 'bg-gael-green' ?
            (row.getValue("platforms") as Spec).values ?
              <div className="flex flex-wrap gap-3 justify-center items-center text-center">
                {(row.getValue("platforms") as Spec).values?.map((val: string, index: number) => (
                  <span key={val + '-' + index} className='px-4 py-2 text-md'>
                    {val}
                  </span>
                ))}
              </div>
              : <span className='px-4 py-2 text-md text-center'>No data</span>
            : <span className="p-2" />
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
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.genres?.specscn)}`}>
          {row.original.genres?.specscn === 'bg-gael-green' ?
            (row.getValue("genres") as Spec).values ?
              <div className="flex flex-wrap gap-3 justify-center items-center text-center">
                {(row.getValue("genres") as Spec).values?.map((val: string, index: number) => (
                  <span key={val + '-' + index} className='px-4 py-2 text-md'>
                    {val}
                  </span>
                ))}
              </div>
              : <span className='px-4 py-2 text-md text-center'>No data</span>
            : <span className="p-2" />
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
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.themes?.specscn)}`}>
          {row.original.themes?.specscn === 'bg-gael-green' ?
            (row.getValue("themes") as Spec).values ?
              <div className="flex flex-wrap gap-3 justify-center items-center text-center">
                {(row.getValue("themes") as Spec).values?.map((val: string, index: number) => (
                  <span key={val + '-' + index} className='px-4 py-2 text-md'>
                    {row.original.themes?.specscn === 'bg-gael-green' && val}
                  </span>
                ))}
              </div>
              : <span className='px-4 py-2 text-md text-center'>No data</span>
            : <span className="p-2" />
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
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.game_modes?.specscn)}`}>
          {row.original.game_modes?.specscn === 'bg-gael-green' ?
            (row.getValue("game_modes") as Spec).values ?
              <div className="flex flex-wrap gap-3 justify-center items-center text-center">
                {(row.getValue("game_modes") as Spec).values?.map((val: string, index: number) => (
                  <span key={val + '-' + index} className='px-4 py-2 text-md'>
                    {row.original.game_modes?.specscn === 'bg-gael-green' && val}
                  </span>
                ))}
              </div>
              : <span className='px-4 py-2 text-md text-center'>No data</span>
            : <span className="p-2" />
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
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.game_engines?.specscn)}`}>
          {row.original.game_engines?.specscn === 'bg-gael-green' ?
            (row.getValue("game_engines") as Spec).values ?
              <div className="flex flex-wrap gap-3 justify-center items-center text-center">
                {(row.getValue("game_engines") as Spec).values?.map((val: string, index: number) => (
                  <span key={val + '-' + index} className='px-4 py-2 text-md'>
                    {val}
                  </span>
                ))}
              </div>
              : <span className='px-4 py-2 text-md text-center'>No data</span>
            :
            <span className="p-2" />
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
        <div className={`border border-gray-200 shadow-md rounded-md flex flex-col items-center text-white justify-center ${(row.original.player_perspectives?.specscn)}`}>
          {row.original.player_perspectives?.specscn === 'bg-gael-green' ?
            (row.getValue("player_perspectives") as Spec).values &&
            <div className="flex flex-wrap gap-3 justify-center items-center text-center">
              {(row.getValue("player_perspectives") as Spec).values?.map((val: string, index: number) => (
                <span key={val + '-' + index} className='px-4 py-2 text-md'>
                  {val}
                </span>
              ))}
            </div>
            :
            <span className="p-2" />
          }
        </div>
      )
    },
  },
]

export default function SummaryDataTable() {
  const { getSummary } = zSpecs();
  const summary = getSummary()
  const table = useReactTable({
    data: [summary],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="w-full">
      <div className="rounded-md border mt-8">
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
            {table.getRowModel().rows.map((row) => (
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
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
