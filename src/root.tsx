import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import Titlebar from "@/components/ui/titlebar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Clipy</title>
        <Meta />
        <Links />
      </head>

      <body className="karla-font">
        <Titlebar />
        <div className="mt-8">{children}</div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}
