"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentProfileId } from "@/lib/current-user";
import { setCurrentProfileId } from "@/lib/current-user";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/i18n/locale-context";

const TITLE_MAX = 500;
const CONTENT_MAX = 10000;

const POST_TYPES = [
  { value: "product", key: "community.type.product" },
  { value: "service", key: "community.type.service" },
  { value: "project", key: "community.type.project" },
  { value: "task", key: "community.type.task" },
  { value: "course", key: "community.type.course" },
  { value: "demand", key: "community.type.demand" },
  { value: "stance", key: "community.type.stance" },
] as const;

type PostType = (typeof POST_TYPES)[number]["value"];

const STANCE_EMOJIS = "😀😃😄😁😅😂🤣😊😇🙂😉😌😍🥰😘😗😙😚😋😛😜🤪😝🤑🤗🤭🤫🤔😐😑😶😏😣😥😮🤐😯😪😫🥱😴🤤😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕😟🙁☹️😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈💀☠️💩🤡👻💪👍👎👏🙌🤝🙏✌️🤞🤟🤘🤙👌🤌🤏👈👉👆👇☝️✋🤚🖐️🖖👋🤙💅🦾🦿🦵🦶👂🦻👃🧠🫀🫁🦷🦴👀👁️👅👄".split("");

function StanceMediaButtons({ mediaUrlsStr, setMediaUrlsStr }: { mediaUrlsStr: string; setMediaUrlsStr: (v: string) => void }) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const upload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/upload/media", { method: "POST", credentials: "include", body: form });
      const data = await res.json().catch(() => ({}));
      if (data?.url) {
        const prev = mediaUrlsStr.trim();
        setMediaUrlsStr(prev ? prev + "\n" + data.url : data.url);
      }
    } finally {
      setUploading(false);
    }
  };
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) upload(f);
    e.target.value = "";
  };
  return (
    <>
      <input ref={galleryRef} type="file" accept="image/jpeg,image/png,image/gif,image/webp" className="hidden" onChange={onFile} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={onFile} />
      <button type="button" onClick={() => galleryRef.current?.click()} disabled={uploading} className="rounded-lg border border-foreground/20 p-2 text-foreground/70 hover:bg-foreground/10 disabled:opacity-50" title="图片">🖼️</button>
      <button type="button" onClick={() => cameraRef.current?.click()} disabled={uploading} className="rounded-lg border border-foreground/20 p-2 text-foreground/70 hover:bg-foreground/10 disabled:opacity-50" title="拍照">📷</button>
      {uploading && <span className="text-[10px] text-foreground/50">上传中…</span>}
    </>
  );
}

type Props = { open: boolean; onClose: () => void };

export function PublisherModal({ open, onClose }: Props) {
  const queryClient = useQueryClient();
  const profileId = getCurrentProfileId();
  const { authenticated, user } = useAuth();
  const { t } = useLocale();
  const [step, setStep] = useState<"type" | "form">("type");
  const [type, setType] = useState<PostType | "">("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tagsStr, setTagsStr] = useState("");
  const [mediaUrlsStr, setMediaUrlsStr] = useState("");
  const [authorCollateral, setAuthorCollateral] = useState("");
  const [participantFreeze, setParticipantFreeze] = useState("");
  const [expectedDuration, setExpectedDuration] = useState("");
  const [details, setDetails] = useState("");
  const [returnsDescription, setReturnsDescription] = useState("");
  const [repayWhen, setRepayWhen] = useState("");
  const [productPrice, setProductPrice] = useState("");
  const [courseFee, setCourseFee] = useState("");
  const [courseSbtIssuer, setCourseSbtIssuer] = useState("");
  const [taskLocation, setTaskLocation] = useState("");
  const [taskStartEnd, setTaskStartEnd] = useState("");
  const [taskRequirements, setTaskRequirements] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showStanceEmoji, setShowStanceEmoji] = useState(false);

  const isProject = type === "project";
  const isTask = type === "task";
  const isProduct = type === "product";
  const isService = type === "service";
  const isProductOrService = isProduct || isService;
  const isProjectOrTask = isProject || isTask;

  const reset = () => {
    setStep("type");
    setType("");
    setTitle("");
    setContent("");
    setTagsStr("");
    setMediaUrlsStr("");
    setAuthorCollateral("");
    setParticipantFreeze("");
    setExpectedDuration("");
    setDetails("");
    setReturnsDescription("");
    setRepayWhen("");
    setProductPrice("");
    setCourseFee("");
    setCourseSbtIssuer("");
    setTaskLocation("");
    setTaskStartEnd("");
    setTaskRequirements("");
    setError("");
    setSuccess(false);
    setShowStanceEmoji(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const isStance = type === "stance";
  const effectiveTitle = isStance ? (content.trim().slice(0, 80) || "观点") : title;

  const handleSubmit = async () => {
    if (!content.trim()) {
      setError(t("publisher.errorFillRequired"));
      return;
    }
    if (!isStance && !title.trim()) {
      setError(t("publisher.errorFillRequired"));
      return;
    }
    if (effectiveTitle.length > TITLE_MAX || content.length > CONTENT_MAX) {
      setError(t("publisher.errorFillRequired"));
      return;
    }
    if (isProject) {
      const coll = Number(authorCollateral) || 0;
      const freeze = Number(participantFreeze) || 0;
      if (coll <= 0) {
        setError(t("publisher.authorCollateral") + " 必填且 > 0");
        return;
      }
      if (freeze <= 0) {
        setError(t("publisher.participantFreeze") + " 必填且 > 0");
        return;
      }
      if (!expectedDuration.trim()) {
        setError(t("publisher.expectedDuration") + " 必填");
        return;
      }
      if (!details.trim()) {
        setError(t("publisher.details") + " 必填");
        return;
      }
      if (!returnsDescription.trim()) {
        setError(t("publisher.returnsDescription") + " 必填");
        return;
      }
    }
    if (isProductOrService) {
      const price = Number(productPrice);
      if (price < 0 || !productPrice.trim()) {
        setError(t("publisher.priceJihe") + " 必填且 ≥ 0");
        return;
      }
    }
    if (type === "course") {
      const fee = Number(courseFee);
      if (fee < 0 || !courseFee.trim()) {
        setError(t("publisher.courseFeeJihe") + " 必填且 ≥ 0");
        return;
      }
    }
    if (isTask) {
      if (!returnsDescription.trim()) {
        setError(t("publisher.taskReward") + " 必填");
        return;
      }
      if (!expectedDuration.trim()) {
        setError(t("publisher.expectedDuration") + " 必填");
        return;
      }
      if (!details.trim()) {
        setError(t("publisher.taskWhat") + " 必填");
        return;
      }
    }
    const authorId = profileId ?? process.env.NEXT_PUBLIC_DEFAULT_AUTHOR_ID;
    const privyId = authenticated && user?.id ? user.id : null;
    if (!authorId && !privyId) {
      setError(t("publisher.errorNoAuth"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const mediaUrls = mediaUrlsStr
        .split(/\r?\n/)
        .map((u) => u.trim())
        .filter((u) => u && /^https?:\/\//.test(u));
      let finalDetails = details.trim().slice(0, 5000);
      let finalAuthorCollateral = Number(authorCollateral) || 0;
      let finalParticipantFreeze = Number(participantFreeze) || 0;
      if (isProductOrService) {
        finalAuthorCollateral = Number(productPrice) || 0;
      }
      if (type === "course") {
        finalParticipantFreeze = Number(courseFee) || 0;
        if (courseSbtIssuer.trim()) {
          finalDetails = (finalDetails ? finalDetails + "\n\n" : "") + "SBT铸造者: " + courseSbtIssuer.trim().slice(0, 200);
        }
      }
      if (type === "task") {
        const parts: string[] = [];
        if (taskLocation.trim()) parts.push("地点: " + taskLocation.trim().slice(0, 200));
        if (taskStartEnd.trim()) parts.push("时间: " + taskStartEnd.trim().slice(0, 200));
        if (taskRequirements.trim()) parts.push("要求: " + taskRequirements.trim().slice(0, 1000));
        if (parts.length) finalDetails = (finalDetails ? finalDetails + "\n\n" : "") + parts.join("\n");
      }
      const payload: Record<string, unknown> = {
        type: type || "stance",
        title: effectiveTitle.slice(0, TITLE_MAX),
        content: content.trim().slice(0, CONTENT_MAX),
        tags: tagsStr.split(/[,，\s]+/).filter(Boolean).slice(0, 20),
        media_urls: mediaUrls,
        author_collateral: finalAuthorCollateral,
        participant_freeze: finalParticipantFreeze,
        expected_duration: expectedDuration.trim().slice(0, 200),
        details: finalDetails,
        returns_description: returnsDescription.trim().slice(0, 2000),
        repay_when: repayWhen.trim() || t("publisher.repayDefault"),
      };
      if (authorId) {
        payload.author_id = authorId;
      } else if (privyId) {
        payload.privy_user_id = privyId;
      }
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t("publisher.errorPublish"));
        return;
      }
      if (privyId && (data as { author_id?: string }).author_id) {
        setCurrentProfileId((data as { author_id: string }).author_id);
      }
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      setSuccess(true);
      setTimeout(handleClose, 800);
    } catch {
      setError(t("publisher.errorNetwork"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  const hasDid = !!profileId;
  if (!hasDid) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={handleClose}>
        <div
          className="flex w-full max-w-lg flex-col rounded-t-2xl border-t border-foreground/10 bg-background p-6 sm:rounded-2xl sm:border"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t("community.publish")}</h2>
            <button type="button" onClick={handleClose} className="text-foreground/60 hover:text-foreground text-xl leading-none">×</button>
          </div>
          <p className="text-sm text-foreground/80">{t("profile.publishNeedDid")}</p>
          <Link href="/me" className="mt-4 inline-block rounded-full border border-accent bg-accent/10 px-4 py-2 text-center text-sm font-semibold text-accent hover:bg-accent hover:text-black" onClick={handleClose}>
            前往个人中心
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-0 sm:p-4" onClick={handleClose}>
      <div
        className="flex w-full max-w-lg flex-col rounded-t-2xl border-t border-foreground/10 bg-background sm:rounded-2xl sm:border max-h-[85vh] sm:max-h-[88vh] mt-auto sm:mt-0"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "min(85vh, calc(100vh - 2rem))" }}
      >
        <div className="shrink-0 p-4 pb-0 sm:p-6 sm:pb-0">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t("community.publish")}</h2>
            <button type="button" onClick={handleClose} className="text-foreground/60 hover:text-foreground text-xl leading-none">
              ×
            </button>
          </div>
        </div>
        <div
          className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-4 pb-24 sm:px-6 sm:pb-6"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
        {success ? (
          <p className="py-8 text-center text-accent font-medium">{t("publisher.success")}</p>
        ) : step === "type" ? (
          <>
            <p className="mb-3 text-xs text-foreground/70">{t("publisher.chooseType")}</p>
            <div className="grid grid-cols-2 gap-2">
              {POST_TYPES.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => {
                    setType(item.value);
                    setStep("form");
                  }}
                  className="rounded-lg border border-foreground/20 py-3 text-sm font-medium text-foreground hover:border-accent/60 hover:text-accent transition-colors"
                >
                  {t(item.key)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-foreground/50">
                {t("publisher.chooseType")}: {type && t(`community.type.${type}`)}
              </span>
              <button
                type="button"
                onClick={() => setStep("type")}
                className="text-xs text-accent hover:underline"
              >
                {t("publisher.back")}
              </button>
            </div>
            {!isStance && (
              <div className="mb-2">
                <label className="mb-1 block text-xs text-foreground/70">{isProductOrService ? "商品名" : t("publisher.title")} *</label>
                <input
                  placeholder={t("publisher.title")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                  maxLength={TITLE_MAX}
                  className="w-full rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50"
                />
                <p className="mt-0.5 text-right text-[10px] text-foreground/40">{title.length}/{TITLE_MAX}</p>
              </div>
            )}
            <div className="mb-2">
              <label className="mb-1 block text-xs text-foreground/70">{isStance ? "内容" : isProductOrService ? "商品介绍 *" : t("publisher.content") + " *（简介）"}</label>
              <textarea
                placeholder={isStance ? "分享你的观点…" : t("publisher.content")}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                maxLength={CONTENT_MAX}
                rows={isStance ? 4 : 5}
                className="w-full resize-none rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50"
              />
              {isStance && (
                <>
                  {showStanceEmoji && (
                    <div className="mt-2 max-h-28 overflow-y-auto rounded-lg border border-foreground/10 bg-black/40 p-2">
                      <div className="flex flex-wrap gap-1">
                        {STANCE_EMOJIS.map((e) => (
                          <button
                            key={e}
                            type="button"
                            className="rounded p-1 text-lg leading-none hover:bg-foreground/10"
                            onClick={() => {
                              setContent((s) => (s + e).slice(0, CONTENT_MAX));
                              setShowStanceEmoji(false);
                            }}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 border-t border-foreground/10 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowStanceEmoji((v) => !v)}
                      className="rounded-lg border border-foreground/20 p-2 text-foreground/70 hover:bg-foreground/10"
                      title="表情"
                    >
                      😀
                    </button>
                    <StanceMediaButtons mediaUrlsStr={mediaUrlsStr} setMediaUrlsStr={setMediaUrlsStr} />
                  </div>
                </>
              )}
              <p className="mt-0.5 text-right text-[10px] text-foreground/40">{content.length}/{CONTENT_MAX}</p>
            </div>

            {/* 项目：抵押、冻结、时长、具体内容、收益、归还 */}
            {type === "project" && (
              <div className="mb-3 space-y-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
                <p className="text-xs font-medium text-accent">抵押与冻结（项目必填）</p>
                <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.authorCollateral")} *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={authorCollateral}
                      onChange={(e) => setAuthorCollateral(e.target.value)}
                      className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.participantFreeze")} *</label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0"
                      value={participantFreeze}
                      onChange={(e) => setParticipantFreeze(e.target.value)}
                      className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.expectedDuration")} *</label>
                  <input
                    placeholder="例：2 周"
                    value={expectedDuration}
                    onChange={(e) => setExpectedDuration(e.target.value.slice(0, 200))}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.details")} *（具体做什么）</label>
                  <textarea
                    placeholder="详细说明参与者需要完成的工作"
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 5000))}
                    rows={3}
                    className="w-full resize-none rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.returnsDescription")} *</label>
                  <textarea
                    placeholder="参与者的收益如何"
                    value={returnsDescription}
                    onChange={(e) => setReturnsDescription(e.target.value.slice(0, 2000))}
                    rows={2}
                    className="w-full resize-none rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.repayWhen")}</label>
                  <input
                    placeholder={t("publisher.repayDefault")}
                    value={repayWhen}
                    onChange={(e) => setRepayWhen(e.target.value.slice(0, 200))}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* 商品/服务：价格、上传图片 */}
            {isProductOrService && (
              <div className="mb-3 space-y-2 rounded-lg border border-foreground/15 bg-black/20 p-3">
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.priceJihe")} *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.priceSpec")}</label>
                  <input
                    placeholder={t("publisher.priceSpecPlaceholder")}
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 500))}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">商品图片（上传）</label>
                  <div className="flex items-center gap-2">
                    <StanceMediaButtons mediaUrlsStr={mediaUrlsStr} setMediaUrlsStr={setMediaUrlsStr} />
                  </div>
                </div>
              </div>
            )}

            {/* 课程：费用（济和币）、谁铸造 SBT、大纲；图片用下方「图片链接」 */}
            {type === "course" && (
              <div className="mb-3 space-y-2 rounded-lg border border-foreground/15 bg-black/20 p-3">
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.courseFeeJihe")} *</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={courseFee}
                    onChange={(e) => setCourseFee(e.target.value)}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.courseSbtIssuer")}</label>
                  <input
                    placeholder={t("publisher.courseSbtIssuerPlaceholder")}
                    value={courseSbtIssuer}
                    onChange={(e) => setCourseSbtIssuer(e.target.value.slice(0, 200))}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.courseDuration")}</label>
                  <input
                    placeholder={t("publisher.courseDurationPlaceholder")}
                    value={expectedDuration}
                    onChange={(e) => setExpectedDuration(e.target.value.slice(0, 200))}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.syllabus")}</label>
                  <textarea
                    placeholder={t("publisher.syllabusPlaceholder")}
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
                    rows={3}
                    className="w-full resize-none rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            )}

            {/* 任务：奖励、预计时长、地点、开始结束时间、做什么、要求、参加者抵押可选；图片用下方「图片链接」 */}
            {type === "task" && (
              <div className="mb-3 space-y-2 rounded-lg border border-foreground/15 bg-black/20 p-3">
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.taskReward")} *（济和币或 SBT）</label>
                  <textarea
                    placeholder={t("publisher.taskRewardPlaceholder")}
                    value={returnsDescription}
                    onChange={(e) => setReturnsDescription(e.target.value.slice(0, 2000))}
                    rows={2}
                    className="w-full resize-none rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.expectedDuration")} *</label>
                  <input
                    placeholder="例：2 周"
                    value={expectedDuration}
                    onChange={(e) => setExpectedDuration(e.target.value.slice(0, 200))}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.taskLocation")}</label>
                  <input
                    placeholder={t("publisher.taskLocationPlaceholder")}
                    value={taskLocation}
                    onChange={(e) => setTaskLocation(e.target.value.slice(0, 200))}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.taskStartEnd")}</label>
                  <input
                    placeholder={t("publisher.taskStartEndPlaceholder")}
                    value={taskStartEnd}
                    onChange={(e) => setTaskStartEnd(e.target.value.slice(0, 200))}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.taskWhat")} *</label>
                  <textarea
                    placeholder={t("publisher.taskWhatPlaceholder")}
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 5000))}
                    rows={3}
                    className="w-full resize-none rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.taskRequirements")}</label>
                  <textarea
                    placeholder={t("publisher.taskRequirementsPlaceholder")}
                    value={taskRequirements}
                    onChange={(e) => setTaskRequirements(e.target.value.slice(0, 1000))}
                    rows={2}
                    className="w-full resize-none rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.participantFreeze")}（可选）</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                    value={participantFreeze}
                    onChange={(e) => setParticipantFreeze(e.target.value)}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
              </div>
            )}

            {!isStance && (
              <>
                <input
                  placeholder={t("publisher.tags")}
                  value={tagsStr}
                  onChange={(e) => setTagsStr(e.target.value)}
                  className="mb-2 w-full rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50"
                />
                {!isProductOrService && (
                  <textarea
                    placeholder={t("publisher.mediaUrls")}
                    value={mediaUrlsStr}
                    onChange={(e) => setMediaUrlsStr(e.target.value)}
                    rows={2}
                    className="mb-4 w-full resize-none rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50"
                  />
                )}
                {isProductOrService && <div className="mb-4" />}
              </>
            )}
            {isStance && <div className="mb-4" />}
            {error && <p className="mb-2 text-xs text-red-400">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-lg border border-foreground/20 px-4 py-2 text-xs text-foreground/80 hover:bg-foreground/5"
              >
                {t("publisher.cancel")}
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-black disabled:opacity-50 hover:opacity-90"
              >
                {submitting ? t("publisher.submitting") : t("publisher.submit")}
              </button>
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}
