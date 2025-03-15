import { Button } from "@/components/ui/button";
import { appDataDir } from "@tauri-apps/api/path";
import {
  BaseDirectory,
  exists,
  mkdir,
  readTextFile,
  writeTextFile,
} from "@tauri-apps/plugin-fs";
import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router";
import {
  onClipboardUpdate,
  onFilesUpdate,
  onImageUpdate,
  onRTFUpdate,
  onTextUpdate,
  startListening,
  writeFiles,
  writeImageBase64,
  writeText,
} from "tauri-plugin-clipboard-api";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ClipboardList,
  FileText,
  Files,
  Image,
  Pin,
  Settings,
  Trash,
} from "lucide-react";
import CodeBlock from "./components/Code";
import { createTray } from "@/lib/trayManager";

interface ClipboardItem {
  type: "text" | "image" | "files";
  content: string | string[];
  timestamp: number;
  isPinned: boolean;
}

function debounce<F extends (...args: any[]) => any>(
  func: F,
  wait: number
): (...args: Parameters<F>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

function isCodeSnippet(text) {
  const codeIndicators = [
    /function\s+\w+\(/, // JavaScript function
    /class\s+\w+/, // Class declaration
    /\w+\s*=\s*.*;/, // Variable assignment
    /if\s*\(.*\)\s*{/, // If statement
    /<\/?[a-z][\s\S]*>/i, // HTML tags
    /#include\s+<.*>/, // C/C++ includes
    /^\s*\w+:\s+.+;$/, // CSS properties
  ];

  // Check for matches in the text
  return codeIndicators.some((regex) => regex.test(text));
}

const PINNED_ITEMS_FILE = "pinned_items.json";

export default function App() {
  const [currentContent, setCurrentContent] = useState<ClipboardItem | null>(
    null
  );
  const [history, setHistory] = useState<ClipboardItem[]>([]);
  const [pinnedItems, setPinnedItems] = useState<ClipboardItem[]>([]);
  const [filter, setFilter] = useState<"all" | "text" | "image" | "files">(
    "all"
  );

  const updateContent = useCallback(
    (type: ClipboardItem["type"], content: string | string[]) => {
      const newItem: ClipboardItem = {
        type,
        content,
        timestamp: Date.now(),
        isPinned: false,
      };
      setCurrentContent((prevContent) => {
        if (
          prevContent &&
          prevContent.type === newItem.type &&
          JSON.stringify(prevContent.content) ===
            JSON.stringify(newItem.content)
        ) {
          return prevContent; // Don't update if content is the same
        }
        setHistory((prev) => [newItem, ...prev.slice(0, 49)]); // Keep last 50 items
        return newItem;
      });
    },
    []
  );

  const debouncedUpdateContent = useCallback(
    debounce((type: ClipboardItem["type"], content: string | string[]) => {
      updateContent(type, content);
    }, 100),
    [updateContent]
  );

  useEffect(() => {
    let unlistenTextUpdate: () => void;
    let unlistenImageUpdate: () => void;
    let unlistenFiles: () => void;
    let unlistenRTF: () => void;
    let unlistenClipboard: () => void;

    const setupListeners = async () => {
      try {
        unlistenTextUpdate = await onTextUpdate((text) => {
          debouncedUpdateContent("text", text);
        });
        unlistenImageUpdate = await onImageUpdate((image) => {
          debouncedUpdateContent("image", image);
        });
        unlistenFiles = await onFilesUpdate((files) => {
          debouncedUpdateContent("files", files);
        });
        unlistenRTF = await onRTFUpdate((rtf) => {
          debouncedUpdateContent("text", rtf);
        });
        unlistenClipboard = await startListening();

        onClipboardUpdate(async () => {
          console.log("Clipboard updated");
        });
      } catch (error) {
        console.error("Error setting up clipboard listeners:", error);
      }
    };

    setupListeners();
    loadPinnedItems();

    return () => {
      if (unlistenTextUpdate) unlistenTextUpdate();
      if (unlistenImageUpdate) unlistenImageUpdate();
      if (unlistenFiles) unlistenFiles();
      if (unlistenRTF) unlistenRTF();
      if (unlistenClipboard) unlistenClipboard();
    };
  }, [debouncedUpdateContent]);

  useEffect(() => {
    createTray();
  }, []);

  const copyToClipboard = async (item: ClipboardItem) => {
    if (item.type === "text") {
      await writeText(item.content as string);
    } else if (item.type === "image") {
      await writeImageBase64(item.content as string);
    } else if (item.type === "files") {
      await writeFiles(item.content as string[]);
    }
  };

  const togglePin = async (item: ClipboardItem) => {
    const updatedItem = { ...item, isPinned: !item.isPinned };
    console.log("Toggling pin for item: ", updatedItem);

    // Update pinned items based on the new pin status
    if (updatedItem.isPinned) {
      setPinnedItems((prev) => [...prev, updatedItem]);
    } else {
      console.log("Removing item from pinned items");
      setPinnedItems((prev) =>
        prev.filter((i) => i.timestamp !== updatedItem.timestamp)
      );
    }

    // Update the history with the updated item
    setHistory((prev) =>
      prev.map((i) => (i.timestamp === item.timestamp ? updatedItem : i))
    );

    // Save the updated pinned items
    const currentPinnedItems = await new Promise<ClipboardItem[]>((resolve) => {
      setPinnedItems((prev) => {
        resolve(prev.filter((i) => i.isPinned));
        return prev; // Return the previous state
      });
    });

    await savePinnedItems(currentPinnedItems);
  };

  const deleteItem = async (item: ClipboardItem) => {
    setHistory((prev) => prev.filter((i) => i.timestamp !== item.timestamp));
    setPinnedItems((prev) =>
      prev.filter((i) => i.timestamp !== item.timestamp)
    );
    const currentPinnedItems = await new Promise<ClipboardItem[]>((resolve) => {
      setPinnedItems((prev) => {
        resolve(prev.filter((i) => i.isPinned));
        return prev; // Return the previous state
      });
    });

    await savePinnedItems(currentPinnedItems);
  };

  const savePinnedItems = async (items: ClipboardItem[]) => {
    console.log("Saving pinned items: ", items);
    try {
      const existsFile = await exists(PINNED_ITEMS_FILE, {
        baseDir: BaseDirectory.AppData,
      });
      if (!existsFile) {
        console.log("Pinned items file does not exist");
        // create it
        const dir = await appDataDir();
        await mkdir(dir, { recursive: true });
      }
      await writeTextFile(PINNED_ITEMS_FILE, JSON.stringify(items), {
        create: true,
        baseDir: BaseDirectory.AppData,
      });
    } catch (error) {
      console.error("Error saving pinned items:", error);
    }
  };

  const loadPinnedItems = async () => {
    try {
      const existsFile = await exists(PINNED_ITEMS_FILE, {
        baseDir: BaseDirectory.AppData,
      });
      if (!existsFile) {
        console.log("Pinned items file does not exist");
        // create it
        const dir = await appDataDir();
        await mkdir(dir, { recursive: true });
      }
      const content = await readTextFile(PINNED_ITEMS_FILE, {
        baseDir: BaseDirectory.AppData,
      });
      const items = JSON.parse(content) as ClipboardItem[];
      setPinnedItems(items);
    } catch (error) {
      console.error("Error loading pinned items:", error);
    }
  };

  const filteredHistory = [
    ...pinnedItems,
    ...history.filter((item) => !item.isPinned),
  ].filter((item) => filter === "all" || item.type === filter);

  return (
    <div className="flex h-full karla-font">
      <aside className="w-48 sm:w-64 border-r h-[95vh]">
        <div className="p-4 h-full flex flex-col justify-between">
          <div className="flex flex-col">
            <h1 className="text-4xl font-bold flex items-center gap-2 mb-4">
              Clipy
            </h1>
            <nav className="space-y-2">
              <Button
                variant={filter === "all" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setFilter("all")}
              >
                <ClipboardList className="mr-2 h-4 w-4" />
                All
              </Button>
              <Button
                variant={filter === "text" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setFilter("text")}
              >
                <FileText className="mr-2 h-4 w-4" />
                Text
              </Button>
              <Button
                variant={filter === "image" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setFilter("image")}
              >
                <Image className="mr-2 h-4 w-4" />
                Images
              </Button>
              <Button
                variant={filter === "files" ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setFilter("files")}
              >
                <Files className="mr-2 h-4 w-4" />
                Files
              </Button>
            </nav>
          </div>
          <div>
            <NavLink to={"/settings"} className="w-full justify-start">
              <Button variant={"ghost"} className="w-full justify-start">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </NavLink>
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-auto w-full h-full">
        <div className="px-4 pb-4">
          <h2 className="text-2xl font-semibold mb-4 backdrop-blur-lg bg-background/50 sticky top-0 z-10 p-4">
            Clipboard History
          </h2>
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {filteredHistory.length === 0 && (
                <p className="text-center text-muted-foreground">
                  No items to show
                </p>
              )}
              {filteredHistory.map((item) => (
                <ClipboardCard
                  key={item.timestamp}
                  item={item}
                  onPin={togglePin}
                  onDelete={deleteItem}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      </main>
    </div>
  );
}

function ClipboardCard({
  item,
  onPin,
  onDelete,
}: {
  item: ClipboardItem;
  onPin: (item: ClipboardItem) => void;
  onDelete: (item: ClipboardItem) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <span className="text-lg font-semibold">
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </span>
          <div>
            <Button variant="ghost" size="sm" onClick={() => onPin(item)}>
              <Pin
                className={`h-4 w-4 ${item.isPinned ? "fill-current" : ""}`}
              />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(item)}>
              <Trash className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ClipboardContent item={item} />
      </CardContent>
      <CardFooter className="flex justify-between">
        <p className="text-xs text-muted-foreground">
          {new Date(item.timestamp).toLocaleString()}
        </p>
        {/* <Button variant="secondary" size="sm" onClick={() => onCopy(item)}>
          <Copy className="h-4 w-4 mr-2" />
          Copy
        </Button> */}
      </CardFooter>
    </Card>
  );
}

function ClipboardContent({ item }: { item: ClipboardItem }) {
  switch (item.type) {
    case "text":
      return isCodeSnippet(item.content as string) ? (
        <CodeBlock code={item.content as string} />
      ) : (
        <p className="break-all max-h-24 overflow-auto">
          {item.content as string}
        </p>
      );

    case "image":
      return (
        <img
          src={`data:image/png;base64,${item.content}`}
          alt="Clipboard content"
          className="max-w-full max-h-64 object-contain rounded-xl"
        />
      );
    case "files":
      return (
        <ul className="list-disc list-inside">
          {(item.content as string[]).map((file, idx) => (
            <li key={idx} className="truncate">
              {file}
            </li>
          ))}
        </ul>
      );
    default:
      return <p>Unsupported content type</p>;
  }
}
