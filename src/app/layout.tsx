import "./globals.css";

export const metadata = {
  title: 'Wallet Mono X',
  description: 'Wallet Mono X - Tu billetera digital',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="antialiased">
      <body className="font-sans">
        {children}
      </body>
    </html>
  );
}
