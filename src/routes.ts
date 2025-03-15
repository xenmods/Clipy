import { type RouteConfig, route } from "@react-router/dev/routes";

export default [
  route("/", "App.tsx"),
  route("/settings", "./pages/settings.tsx"),
] satisfies RouteConfig;
