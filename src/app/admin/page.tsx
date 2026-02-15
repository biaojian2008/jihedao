/**
 * 后台 CMS - 首页配置、官方日志 CRUD
 */
import { AdminPanel } from "@/components/admin/admin-panel";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

export default function AdminPage() {
  return (
    <div className="min-h-screen pt-14 pb-20 md:pb-16">
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <AdminPageHeader />
        <AdminPanel />
      </main>
    </div>
  );
}
