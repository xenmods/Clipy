import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Minus, Maximize, Minimize } from "lucide-react";

export default function Titlebar() {
  const windowRef = useRef<any>();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // check if window is not undefined
    if (typeof window !== "undefined") {
      windowRef.current = getCurrentWindow();
    }
  }, []);

  const toggleMaximize = async () => {
    if (windowRef.current) {
      const maximized = await windowRef.current.isMaximized();
      if (maximized) {
        await windowRef.current.unmaximize();
      } else {
        await windowRef.current.maximize();
      }
      setIsMaximized(!maximized); // Update the state based on the new state
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="bg-background select-none flex justify-between fixed top-0 left-0 right-0 p-2 z-50"
    >
      <h1 className="text-lg ">Clipy</h1>
      <div>
        <Button
          variant="ghost"
          className="w-[15px] h-[15px]"
          onClick={() => windowRef.current.minimize()}
        >
          <Minus />
        </Button>
        <Button
          variant="ghost"
          className="w-[15px] h-[15px]"
          onClick={toggleMaximize}
        >
          {isMaximized ? <Minimize /> : <Maximize />}
        </Button>
        <Button
          variant="ghost"
          className="w-[15px] h-[15px]"
          onClick={() => windowRef.current.close()}
        >
          <X />
        </Button>
      </div>
    </div>
  );
}
