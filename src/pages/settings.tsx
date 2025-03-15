import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, SunMoon } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useTheme } from "@/components/theme-provider";
import { invoke } from "@tauri-apps/api/core";

export default function SettingsPage() {
  const [view, setView] = useState("appearance");
  const { theme, setTheme } = useTheme();
  return (
    <div className="flex h-screen karla-font">
      <aside className="w-48 sm:w-64 border-r h-[95vh]">
        <div className="p-4 h-full flex flex-col justify-between">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold flex items-center gap-2 mb-4">
              Settings
            </h1>
            <nav className="space-y-2">
              <Button
                variant={"ghost"}
                className={`w-full justify-start ${
                  view === "appearance" ? "bg-accent" : ""
                }`}
                onClick={() => setView("appearance")}
              >
                <SunMoon className="mr-2 h-4 w-4" />
                Appearance
              </Button>
            </nav>
          </div>
          <div>
            <NavLink to={"/"} className="w-full justify-start">
              <Button variant={"ghost"} className="w-full justify-start">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            </NavLink>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto w-full h-full">
        <div className="px-4 pb-4">
          <h2 className="text-2xl font-semibold mb-4 backdrop-blur-lg bg-background/50 sticky top-0 z-10 p-4">
            {view.charAt(0).toUpperCase() + view.slice(1)}
          </h2>
          <ScrollArea className="h-full px-4">
            {view === "appearance" && (
              <div className="space-y-4 w-full">
                <div className="flex flex-col justify-between w-full">
                  <h2 className="text-xl font-semibold">Theme</h2>
                  <p className="text-sm text-gray-500">
                    Select your preferred theme
                  </p>
                </div>
                <div className="flex flex-row w-full gap-4">
                  <Card
                    onClick={async () => {
                      await invoke("plugin:theme|set_theme", {
                        theme: "light",
                      });
                      setTheme("light");
                    }}
                    className={`bg-white text-black w-full border hover:border-primary transition-all ease-in-out duration-300 cursor-pointer ${
                      theme === "light"
                        ? "border-primary"
                        : "border-transparent"
                    }`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <CardTitle>Light</CardTitle>
                      <div className="flex flex-row w-full justify-between gap-2">
                        <div className="flex flex-col gap-2 w-1/4 justify-between">
                          <div className="w-full h-2 rounded-full bg-gray-200"></div>
                          <div className="w-full h-2 rounded-full bg-gray-200"></div>
                          <div className="w-full h-2 rounded-full bg-gray-200"></div>
                          <div className="w-full h-2 rounded-full bg-gray-200"></div>
                        </div>
                        <div className="flex flex-col gap-2 w-3/4">
                          <div className="w-full h-4 rounded-full bg-gray-200"></div>
                          <div className="w-full h-4 rounded-full bg-gray-200"></div>
                          <div className="w-full h-4 rounded-full bg-gray-200"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    onClick={async () => {
                      await invoke("plugin:theme|set_theme", {
                        theme: "dark",
                      });
                      setTheme("dark");
                    }}
                    className={`bg-[#18000A] text-white w-full border hover:border-primary transition-all ease-in-out duration-300 cursor-pointer ${
                      theme === "dark" ? "border-primary" : "border-transparent"
                    }`}
                  >
                    <CardContent className="p-4 space-y-2">
                      <CardTitle>Dark</CardTitle>
                      <div className="flex flex-row w-full justify-between gap-2">
                        <div className="flex flex-col gap-2 w-1/4 justify-between">
                          <div className="w-full h-2 rounded-full bg-neutral-900"></div>
                          <div className="w-full h-2 rounded-full bg-neutral-900"></div>
                          <div className="w-full h-2 rounded-full bg-neutral-900"></div>
                          <div className="w-full h-2 rounded-full bg-neutral-900"></div>
                        </div>
                        <div className="flex flex-col gap-2 w-3/4">
                          <div className="w-full h-4 rounded-full bg-neutral-900"></div>
                          <div className="w-full h-4 rounded-full bg-neutral-900"></div>
                          <div className="w-full h-4 rounded-full bg-neutral-900"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}
