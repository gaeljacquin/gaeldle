'use client'

import { useState } from "react"
import { Loader2 } from 'lucide-react'
import { Button } from "./ui/button"

const simulateFetch = () => new Promise(resolve => setTimeout(resolve, 3000))

export default function Dev() {
  const [isLoading, setIsLoading] = useState(false)

  const handleClick = async () => {
    setIsLoading(true)
    await simulateFetch()
    setIsLoading(false)
  }

  return process.env.NODE_ENV === 'development' && (
    <div className="mt-10 mb-10">
      <Button
        onClick={handleClick}
        disabled={isLoading}
        className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 disabled:opacity-50 disabled:cursor-not-allowed"
        aria-busy={isLoading}
      >
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </Button>

      {isLoading && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          aria-hidden="true"
        >
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      )}
    </div>
  )
}
