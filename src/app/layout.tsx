import { Montserrat } from "next/font/google";
import { AppProvider } from "@/hooks/useApp";
import ClientLayout from "@/components/ClientLayout";
import { PwaRegister } from "@/components/PwaRegister";
import OnboardingGate from "@/components/OnboardingGate";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ErrorHandler } from "@/components/ErrorHandler";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Codora — Learn C++ Through Practice",
    template: "%s · Codora",
  },
  description:
    "Codora is a beginner-friendly way to learn C++. Follow structured lessons, solve practice problems with real code execution, earn XP, and watch your skills grow — all in your browser.",
  applicationName: "Codora",
  manifest: "/manifest.json",
  icons: {
    icon: "/icons/icon-192x192.png",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/icon-192x192.png",
  },
  appleWebApp: {
    capable: true,
    title: "Codora",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F0C0C0",
  viewportFit: "cover",
};

const cancelSuppressionScript = `
(function() {
  if (typeof window === 'undefined') return;
  function isCancel(reason) {
    if (!reason || typeof reason !== 'object') return false;
    return reason.type === 'cancelation'
      || reason.name === 'Canceled'
      || reason.msg === 'operation is manually canceled'
      || reason.message === 'operation is manually canceled'
      || (reason instanceof Error && reason.name === 'Canceled');
  }
  window.addEventListener('unhandledrejection', function(event) {
    if (isCancel(event.reason)) {
      event.preventDefault();
    }
  });
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: cancelSuppressionScript }} />
      </head>
      <body
        className="bg-background text-foreground antialiased"
        style={{ fontFamily: montserrat.style.fontFamily }}
      >
        <ErrorHandler />
        <PwaRegister />
        <AppProvider>
          <OnboardingGate>
            <ClientLayout>{children}</ClientLayout>
          </OnboardingGate>
        </AppProvider>
      </body>
    </html>
  );
}