'use client'

import { useState } from 'react'
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function AboutDialog() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger className="hover:text-gael-blue">
            About
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-center">About</DialogTitle>
              <DialogDescription className="text-center">
                Gaeldle
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 text-justify">
              <p>A game celebrating games, for casual and hardcore gamers alike! Inspired by
                {' '}
                <Link
                  href="https://www.nytimes.com/games/wordle/index.html"
                  target="_blank"
                  className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                >
                  Wordle
                </Link>
                ,
                {' '}
                <Link
                  href="https://www.gamedle.wtf/?lang=en"
                  target="_blank"
                  className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                >
                  Gamedle
                </Link>
                , and
                {' '}
                <Link
                  href="https://medium.com/floodgates/the-complete-and-authoritative-list-of-wordle-spinoffs-fb00bfafc448"
                  target="_blank"
                  className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                >
                  all the other spinoffs
                </Link>
                .
              </p>
              <p>New games and artwork are picked daily from an ever-growing list of games. The list, cover images and artwork are sourced from
                {' '}
                <Link
                  href="https://www.igdb.com/"
                  target="_blank"
                  className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                >
                  IGDB
                </Link>
                .
              </p>
              <p>All rights go to the rightful owners - no copyright infringement intended.</p>
              <p>View our
                {' '}
                <Link
                  href="/privacy"
                  className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                >
                  Privacy Policy
                </Link>
                {' '}
                and
                {' '}
                <Link
                  href="/tos"
                  className="text-gael-blue hover:text-gael-blue-dark hover:underline"
                >
                  Terms of Service
                </Link>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  )
}