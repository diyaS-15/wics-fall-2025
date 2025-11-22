// src/components/EmailAnnotator.tsx
import React, { useState, useMemo } from "react";

type Props = {
    text: string; // 邮件原文
    groundTruthIndices?: number[]; // 哪些 token 是可疑（由关卡数据提供）
    onSubmit?: (result: { correct: number; incorrect: number; missed: number }) => void;
};

export default function EmailAnnotator({ text, groundTruthIndices = [], onSubmit }: Props) {
    // 将文本按 token 切分（保留空格和标点）
    const tokens = useMemo(() => {
        // 这个正则把单词、短链接、标点分开并保留空格作为 token
        // 目的是保证渲染不会丢失原始排版
        const parts = text.split(/(\s+|https?:\/\/[^\s]+|[^\s]+)/g).filter(Boolean);
        return parts;
    }, [text]);

    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [feedback, setFeedback] = useState<string | null>(null);

    function toggle(idx: number) {
        setFeedback(null);
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    }

    function submit() {
        const selectedArr = Array.from(selected);
        const truthSet = new Set(groundTruthIndices);
        let correct = 0;
        let incorrect = 0;
        for (const s of selectedArr) {
            if (truthSet.has(s)) correct++;
            else incorrect++;
        }
        let missed = 0;
        for (const t of groundTruthIndices) if (!selected.has(t)) missed++;

        setFeedback(`命中 ${correct}，错标 ${incorrect}，漏标 ${missed}`);
        onSubmit?.({ correct, incorrect, missed });
    }

    return (
        <div style={{ maxWidth: 800, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
            <div
                style={{
                    border: "1px solid #ddd",
                    padding: 16,
                    borderRadius: 8,
                    background: "#fff",
                    lineHeight: 1.6,
                }}
            >
                {/* 邮件渲染：每个 token 是一个可点的 span */}
                <div>
                    {tokens.map((tok, idx) => {
                        const isSelected = selected.has(idx);
                        return (
                            <span
                                key={idx}
                                onClick={() => toggle(idx)}
                                style={{
                                    cursor: "pointer",
                                    userSelect: "none",
                                    padding: "2px 4px",
                                    margin: "0 1px",
                                    borderRadius: 4,
                                    background: isSelected ? "rgba(255,220,0,0.5)" : "transparent",
                                    border: isSelected ? "1px solid rgba(180,140,0,0.6)" : "none",
                                }}
                                title={isSelected ? "已标记为可疑" : "点击标记可疑"}
                            >
                                {tok}
                            </span>
                        );
                    })}
                </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={submit}>提交</button>
                <button
                    onClick={() => {
                        setSelected(new Set());
                        setFeedback(null);
                    }}
                >
                    重置
                </button>
            </div>

            {feedback && (
                <div style={{ marginTop: 10, color: "#084", fontWeight: 600 }}>
                    反馈：{feedback}
                </div>
            )}
        </div>
    );
}
