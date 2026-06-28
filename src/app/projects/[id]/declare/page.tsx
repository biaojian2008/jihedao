'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function DeclarePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, authenticated: isAuthenticated } = useAuth();
  const router = useRouter();
  
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pool, setPool] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPool() {
      // Get the latest active pool
      const { data } = await supabase
        .from('contribution_pools')
        .select('*')
        .eq('project_id', id)
        .eq('is_finalized', false)
        .order('month', { ascending: false })
        .limit(1)
        .single();
      
      setPool(data);
      setLoading(false);
    }
    fetchPool();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pool) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('project_declarations')
        .insert([
          {
            pool_id: pool.id,
            user_id: user?.id ?? '',
            content
          }
        ]);

      if (error) throw error;

      alert('申报成功，等待月底盲评');
      router.push(`/projects/${id}`);
    } catch (err: any) {
      alert(err.message || '申报失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] p-8 font-mono">加载中...</div>;
  if (!pool) return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] p-8 font-mono flex flex-col items-center justify-center">
      <p className="text-xl mb-4">本月尚未开启贡献池，请联系股东。</p>
      <button onClick={() => router.back()} className="border border-[#00ff00] px-4 py-2">返回</button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] font-mono p-4 md:p-8">
      <div className="max-w-2xl mx-auto border border-[#00ff00]/30 p-6">
        <h1 className="text-2xl font-bold mb-2">提交本月贡献说明</h1>
        <p className="text-xs opacity-50 mb-8 uppercase tracking-widest">
          Month: {new Date(pool.month).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm mb-4 opacity-70">
              请详细描述你本月为项目做出的贡献（工作内容、产出、影响）：
            </label>
            <textarea
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full bg-black border border-[#00ff00]/50 p-4 outline-none focus:border-[#00ff00] transition-colors resize-none leading-relaxed"
              placeholder="例如：完成了核心逻辑开发，优化了 UI 响应速度..."
            />
          </div>

          <div className="bg-[#00ff00]/5 p-4 text-xs opacity-60">
            提示：该说明将作为盲评的唯一参考依据，请务必真实准确。
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 border-2 border-[#00ff00] font-bold text-lg hover:bg-[#00ff00] hover:text-[#0a0a0a] transition-all disabled:opacity-50"
          >
            {isSubmitting ? '提交中...' : '提交申报'}
          </button>
        </form>
      </div>
    </div>
  );
}
