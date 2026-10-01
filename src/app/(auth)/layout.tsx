export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="font-display text-2xl font-bold text-primary-dark">
            Aivy
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
