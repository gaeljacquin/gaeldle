import dynamic from 'next/dynamic'
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
import Levels from "~/src/components/levels"

const DynamicModes = dynamic(() => import('@/components/modes'), {
  ssr: false,
})

export default function ModesDrawer() {
  return (
    <Drawer>
      <DrawerTrigger className="hover:text-gael-blue">Modes</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="text-center">Game Modes</DrawerTitle>
          <DrawerDescription className="text-center">Choose Your Destiny</DrawerDescription>
        </DrawerHeader>
        <DrawerFooter>
          <>
            <DynamicModes isInDrawer={true} />
            <Levels />
          </>
          <DrawerClose asChild>
            <div className="mx-auto w-full max-w-sm flex justify-center">
              <Button
                variant="outline"
              >
                Close
              </Button>
            </div>
          </DrawerClose>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
