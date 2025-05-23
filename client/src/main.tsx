import { createRoot } from "react-dom/client";
import { ThemeProvider } from "@/components/ui/theme-provider";
import App from "./App";
import "./index.css";
import AOS from 'aos';
import 'aos/dist/aos.css';

// Initialize AOS
AOS.init({
  duration: 800,
  easing: 'ease-in-out',
  once: true
});

createRoot(document.getElementById("root")!).render(
  <ThemeProvider defaultTheme="dark" storageKey="chadjee-theme">
    <App />
  </ThemeProvider>
);
