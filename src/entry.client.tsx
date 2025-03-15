import React from "react";
import ReactDOM from "react-dom/client";
import { HydratedRouter } from "react-router/dom";
import { ThemeProvider } from "@/components/theme-provider";
import "./App.css";

ReactDOM.hydrateRoot(
  document,
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark">
      <HydratedRouter />
    </ThemeProvider>
  </React.StrictMode>
);
