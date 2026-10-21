import { Suspense } from 'react';
import { connection } from 'next/server';
import Image from 'next/image';
import { formsService } from '@/services/forms.service';
import { AdminLayoutShell } from '@/components/AdminLayoutShell';
import type { FormRecord } from '@/types/form';
import { Loader2 } from 'lucide-react';

async function AdminShellLoader({ children }: { children: React.ReactNode }) {
  // Opt into dynamic rendering inside Suspense boundary to prevent blocking prerendering
  await connection();
  let forms: FormRecord[] = [];
  try {
    const result = await formsService.getForms({ perPage: 100, sort: '-id' });
    forms = result.items || [];
    console.log('[AdminShellLoader] Loaded forms count:', forms.length, forms.map(f => f.id));
  } catch (err) {
    console.error('[AdminShellLoader] Error loading forms:', err);
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] text-slate-900 dark:text-slate-100 transition-colors duration-300">
      <Suspense
        fallback={
          <div className="min-h-screen bg-slate-50 dark:bg-[#0A0A0A] flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Image
                src="/Logo-Sharingvision-Main.png"
                alt="Sharing Vision Logo"
                width={160}
                height={32}
                className="h-8 w-auto object-contain mb-1"
                priority
              />
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 text-[#DF1A3D] animate-spin" />
                <span className="text-xs font-semibold tracking-wider uppercase text-slate-600 dark:text-slate-300">
                  Memuat Portal Admin...
                </span>
              </div>
            </div>
          </div>
        }
      >
        <AdminShellLoader>{children}</AdminShellLoader>
      </Suspense>
    </div>
  );
}
