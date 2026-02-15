"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getCurrentProfileId } from "@/lib/current-user";
import { setCurrentProfileId } from "@/lib/current-user";
import { useAuth } from "@/lib/auth-context";
import { useLocale } from "@/lib/i18n/locale-context";

const TITLE_MAX = 500;
const CONTENT_MAX = 10000;

const POST_TYPES = [
  { value: "project", key: "community.type.project" },
  { value: "task", key: "community.type.task" },
  { value: "product", key: "community.type.product" },
  { value: "course", key: "community.type.course" },
  { value: "stance", key: "community.type.stance" },
] as const;

type PostType = (typeof POST_TYPES)[number]["value"];

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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isProjectOrTask = type === "project" || type === "task";

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
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError(t("publisher.errorFillRequired"));
      return;
    }
    if (title.length > TITLE_MAX || content.length > CONTENT_MAX) {
      setError(t("publisher.errorFillRequired"));
      return;
    }
    if (isProjectOrTask) {
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
      const payload: Record<string, unknown> = {
        type: type || "stance",
        title: title.trim().slice(0, TITLE_MAX),
        content: content.trim().slice(0, CONTENT_MAX),
        tags: tagsStr.split(/[,，\s]+/).filter(Boolean).slice(0, 20),
        media_urls: mediaUrls,
        author_collateral: Number(authorCollateral) || 0,
        participant_freeze: Number(participantFreeze) || 0,
        expected_duration: expectedDuration.trim().slice(0, 200),
        details: details.trim().slice(0, 5000),
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center" onClick={handleClose}>
      <div
        className="w-full max-w-lg rounded-t-2xl border-t border-foreground/10 bg-background p-6 sm:rounded-2xl sm:border sm:max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t("community.publish")}</h2>
          <button type="button" onClick={handleClose} className="text-foreground/60 hover:text-foreground text-xl leading-none">
            ×
          </button>
        </div>

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
            <div className="mb-2">
              <label className="mb-1 block text-xs text-foreground/70">{t("publisher.title")} *</label>
              <input
                placeholder={t("publisher.title")}
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, TITLE_MAX))}
                maxLength={TITLE_MAX}
                className="w-full rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50"
              />
              <p className="mt-0.5 text-right text-[10px] text-foreground/40">{title.length}/{TITLE_MAX}</p>
            </div>
            <div className="mb-2">
              <label className="mb-1 block text-xs text-foreground/70">{t("publisher.content")} *（简介）</label>
              <textarea
                placeholder={t("publisher.content")}
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, CONTENT_MAX))}
                maxLength={CONTENT_MAX}
                rows={5}
                className="w-full resize-none rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50"
              />
              <p className="mt-0.5 text-right text-[10px] text-foreground/40">{content.length}/{CONTENT_MAX}</p>
            </div>

            {(type === "project" || type === "task" || type === "product" || type === "course") && (
              <div className="mb-3 space-y-2 rounded-lg border border-accent/30 bg-accent/5 p-3">
                <p className="text-xs font-medium text-accent">抵押与冻结（项目/任务必填）</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.authorCollateral")}{isProjectOrTask ? " *" : ""}</label>
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
                    <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.participantFreeze")}{isProjectOrTask ? " *" : ""}</label>
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
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.expectedDuration")}{isProjectOrTask ? " *" : ""}</label>
                  <input
                    placeholder="例：2 周"
                    value={expectedDuration}
                    onChange={(e) => setExpectedDuration(e.target.value.slice(0, 200))}
                    className="w-full rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.details")}{isProjectOrTask ? " *" : ""}（具体做什么）</label>
                  <textarea
                    placeholder="详细说明参与者需要完成的工作"
                    value={details}
                    onChange={(e) => setDetails(e.target.value.slice(0, 5000))}
                    rows={3}
                    className="w-full resize-none rounded border border-foreground/20 bg-black/40 px-2 py-1.5 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-0.5 block text-[10px] text-foreground/60">{t("publisher.returnsDescription")}{isProjectOrTask ? " *" : ""}</label>
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

            <input
              placeholder={t("publisher.tags")}
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              className="mb-2 w-full rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50"
            />
            <textarea
              placeholder={t("publisher.mediaUrls")}
              value={mediaUrlsStr}
              onChange={(e) => setMediaUrlsStr(e.target.value)}
              rows={2}
              className="mb-4 w-full resize-none rounded-lg border border-foreground/20 bg-black/40 px-3 py-2 text-sm text-foreground placeholder:text-foreground/50"
            />
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
  );
}
