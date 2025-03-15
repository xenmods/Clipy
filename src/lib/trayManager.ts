import { TrayIcon, TrayIconOptions } from "@tauri-apps/api/tray";
import { defaultWindowIcon } from "@tauri-apps/api/app";

let tray: TrayIcon | null = null;

export async function createTray() {
  await TrayIcon.removeById("clipy-tray"); // Remove the tray icon if it already exists
  if (!tray) {
    const options: TrayIconOptions = {
      icon: await defaultWindowIcon(),
      id: "clipy-tray",
    };
    tray = await TrayIcon.new(options);
  }
}

export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null; // Reset the tray variable
  }
}
