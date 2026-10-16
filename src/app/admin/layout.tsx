import { Suspense } from 'react';
import { connection } from 'next/server';
import { formsService } from '@/services/forms.service';
import { AdminLayoutShell } from '@/components/AdminLayoutShell';
import { ThemeProvider } from '@/components/ThemeProvider';
import type { FormRecord } from '@/types/form';
import { Loader2 } from 'lucide-react';

async function AdminShellLoader({ children }: { children: React.ReactNode }) {
  // Opt into dynamic rendering inside Suspense boundary to prevent blocking prerendering
  await connection();
  let forms: FormRecord[] = [];
  try {
    const result = await formsService.getForms({ perPage: 100, sort: '-id' });
    forms = result.items || [];
  } catch {
    forms = [];
  }

  return <AdminLayoutShell forms={forms}>{children}</AdminLayoutShell>;
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 transition-colors duration-300">
        <Suspense
          fallback={
            <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-9 h-9 text-[#DF1A3D] animate-spin" />
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                  Memuat <span className="inline-flex items-start text-[#DF1A3D] font-bold">SHARING VISION<span className="text-[0.6em] font-bold leading-none ml-[2px] pt-[0.1em]">™</span></span> Admin...
                </span>
              </div>
            </div>
          }
        >
          <AdminShellLoader>{children}</AdminShellLoader>
        </Suspense>
      </div>
    </ThemeProvider>
  );
}
