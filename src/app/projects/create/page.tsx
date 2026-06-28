'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function CreateProjectPage() {
  const { user, authenticated, ready } = useAuth();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rules, setRules] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ready) return <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] p-8">加载中...</div>;

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] flex flex-col items-center justify-center p-8">
        <h1 className="text-2xl mb-4 font-mono">请先登录以发起项目</h1>
        <button
          onClick={() => window.location.href = '/'}
          className="border border-[#00ff00] px-6 py-2 hover:bg-[#00ff00] hover:text-[#0a0a0a] transition-colors font-mono"
        >
          返回首页
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const userId = (user as { id?: string; sub?: string })?.id ?? (user as { sub?: string })?.sub ?? '';

      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{ name, description, rules, founder_id: userId, total_assets: 0 }])
        .select()
        .single();

      if (projectError) throw projectError;

      const { error: memberError } = await supabase
        .from('project_members')
        .insert([{
          project_id: (project as { id: string }).id,
          user_id: userId,
          role: 'founder',
          investment_jhbc: 0,
          contribution_jhbc: 0,
        }]);

      if (memberError) throw memberError;

      router.push(`/projects/${(project as { id: string }).id}`);
    } catch (err: unknown) {
      console.error(err);
      setError((err as Error).message || '创建项目失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] font-mono p-4 md:p-8">
      <div className="max-w-2xl mx-auto border border-[#00ff00]/30 p-6 rounded-sm">
        <h1 className="text-3xl font-bold mb-8 border-b border-[#00ff00]/30 pb-4 text-center">
          发起新项目
        </h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-2 opacity-70">项目名称</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-black border border-[#00ff00]/50 p-3 outline-none focus:border-[#00ff00] transition-colors"
              placeholder="输入响亮的名称..."
            />
          </div>

          <div>
            <label className="block text-sm mb-2 opacity-70">项目介绍</label>
            <textarea
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full bg-black border border-[#00ff00]/50 p-3 outline-none focus:border-[#00ff00] transition-colors resize-none"
              placeholder="简述项目的愿景与目标..."
            />
          </div>

          <div>
            <label className="block text-sm mb-2 opacity-70">协作规则</label>
            <textarea
              required
              value={rules}
              onChange={(e) => setRules(e.target.value)}
              rows={4}
              className="w-full bg-black border border-[#00ff00]/50 p-3 outline-none focus:border-[#00ff00] transition-colors resize-none"
              placeholder="明确股东、贡献者与分红规则..."
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm border border-red-500/30 p-3 bg-red-500/5">
              错误: {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 border-2 border-[#00ff00] font-bold text-xl hover:bg-[#00ff00] hover:text-[#0a0a0a] transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            {isSubmitting ? '提交中...' : '立即发起项目'}
          </button>
        </form>
      </div>
    </div>
  );
}
