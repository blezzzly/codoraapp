import { AppProvider } from "@/hooks/useApp";
import ClientLayout from "@/components/ClientLayout";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ErrorHandler } from "@/components/ErrorHandler";

export const metadata: Metadata = {
  title: "codora c++ - Learn C++ Through Practice",
  description: "An offline-first PWA for learning C++. Practice coding problems, track your progress, and master C++ at your own pace.",
  applicationName: "codora c++",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "codora c++",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-foreground antialiased" style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <ErrorHandler />
        <AppProvider>
          <ClientLayout>
            {children}
          </ClientLayout>
        </AppProvider>
      </body>
    </html>
  );
}
