'use client'

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
import { Button } from "@/components/ui/button"
import Modes from "./modes"
import Levels from "./levels"

export default function ModesDrawer() {
  return (
    <Drawer>
      <DrawerTrigger asChild className="hover:text-gael-blue">Modes</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-center">Game Modes</DrawerTitle>
          <DrawerDescription className="text-center">Choose Your Destiny</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <>
            <Modes />
            <Levels />
          </>
          <DrawerClose asChild>
            <Button variant="outline">Close</Button>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
