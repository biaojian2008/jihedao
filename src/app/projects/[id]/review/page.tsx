'use client';

import { useEffect, useState, use } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Declaration {
  user_id: string;
  content: string;
  points: number; // Local state for voting
}

export default function ReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  
  const [declarations, setDeclarations] = useState<Declaration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pool, setPool] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Get current month's pool
        const { data: poolData } = await supabase
          .from('contribution_pools')
          .select('*')
          .eq('project_id', id)
          .eq('is_finalized', false)
          .order('month', { ascending: false })
          .limit(1)
          .single();
        
        setPool(poolData);

        if (poolData) {
          // 2. Get all declarations for this pool
          const { data: decData } = await supabase
            .from('project_declarations')
            .select('user_id, content')
            .eq('pool_id', poolData.id);
          
          // Filter out current user (blind review rule: can't vote for self)
          const otherDecs = decData?.filter(d => d.user_id !== user?.id) || [];
          setDeclarations(otherDecs.map(d => ({ ...d, points: 0 })));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    if (user) fetchData();
  }, [id, user]);

  const totalPoints = declarations.reduce((sum, d) => sum + d.points, 0);
  const remainingPoints = 100 - totalPoints;

  const handlePointChange = (userId: string, val: number) => {
    setDeclarations(decs => decs.map(d => {
      if (d.user_id === userId) {
        // Enforce 1-50 limit per person
        const newPoints = Math.max(0, Math.min(50, val));
        return { ...d, points: newPoints };
      }
      return d;
    }));
  };

  const handleSubmit = async () => {
    if (totalPoints !== 100) {
      alert('必须全部投完100点');
      return;
    }

    setIsSubmitting(true);
    try {
      const votes = declarations
        .filter(d => d.points > 0)
        .map(d => ({
          pool_id: pool.id,
          voter_id: user?.id ?? '',
          target_id: d.user_id,
          points: d.points
        }));

      const { error } = await supabase
        .from('blind_reviews')
        .insert(votes);

      if (error) throw error;

      alert('投票成功');
      router.push(`/projects/${id}`);
    } catch (err: any) {
      alert(err.message || '投票失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] p-8 font-mono">同步中...</div>;
  if (!pool) return <div className="min-h-screen bg-[#0a0a0a] text-red-500 p-8 font-mono">本月暂无活跃贡献池</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#00ff00] font-mono p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-end border-b border-[#00ff00]/30 pb-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">本月盲评结算</h1>
            <p className="text-sm opacity-60 mt-1">贡献池总量: {pool.total_amount} JHBC</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${remainingPoints === 0 ? 'text-[#00ff00]' : 'text-yellow-500'}`}>
              {remainingPoints}
            </div>
            <div className="text-[10px] uppercase opacity-60">待分配点数</div>
          </div>
        </div>

        <div className="space-y-6 mb-12">
          {declarations.map((dec) => (
            <div key={dec.user_id} className="border border-[#00ff00]/30 p-6 bg-black/40 relative group">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <div className="text-[10px] uppercase opacity-50 mb-2">贡献说明</div>
                  <p className="text-sm leading-relaxed opacity-90">{dec.content}</p>
                </div>
                <div className="w-full md:w-48 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs uppercase opacity-50">投入点数</span>
                    <span className="font-bold">{dec.points}</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="50" 
                    value={dec.points}
                    onChange={(e) => handlePointChange(dec.user_id, parseInt(e.target.value))}
                    className="w-full h-1 bg-[#00ff00]/20 appearance-none cursor-pointer accent-[#00ff00]"
                  />
                  <div className="flex justify-between text-[8px] opacity-40 mt-1">
                    <span>0</span>
                    <span>25</span>
                    <span>50</span>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {declarations.length === 0 && (
            <div className="text-center py-20 border border-dashed border-[#00ff00]/20 opacity-40">
              暂无其他成员提交申报
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || remainingPoints !== 0 || declarations.length === 0}
          className="w-full py-6 border-2 border-[#00ff00] font-bold text-2xl hover:bg-[#00ff00] hover:text-black transition-all disabled:opacity-30 disabled:grayscale"
        >
          {isSubmitting ? '正在提交...' : '确认并提交投票'}
        </button>
        
        <p className="text-center text-[10px] mt-6 opacity-40 uppercase tracking-widest">
          盲评规则: 最少3人参与 | 单人上限50点 | 必须投完100点 | 不能投给自己
        </p>
      </div>
    </div>
  );
}
