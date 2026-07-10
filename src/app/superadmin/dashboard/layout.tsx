import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get('superadmin_session');

  if (!session || session.value !== 'authenticated') {
    redirect('/superadmin');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navbar for Super Admin */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-red-600 tracking-tight">SuperAdmin</span>
              <span className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded-md font-medium">Portal</span>
            </div>
            <div>
               {/* Logout could go here */}
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
