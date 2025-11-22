// components/EmailSpotGame.tsx
"use client";
import React, { useRef, useState, useEffect, useCallback } from "react";

type Props = {
    text: string;
    groundTruthIndices?: number[]; // 哪些 token 是正确的可疑点
    maxLives?: number;
};

type FeedbackItem = {
    id: string;
    x: number; // viewport coords
    y: number;
    type: "correct" | "wrong";
    label: string; // "+10" or "-5"
};

export default function EmailSpotGame({
    text,
    groundTruthIndices = [],
    maxLives = 5,
}: Props) {
    // token 切分
    const tokens = React.useMemo(() => {
        const parts = text.split(/(\s+|https?:\/\/[^\s]+|[^\s]+)/g).filter(Boolean);
        return parts;
    }, [text]);

    const truthSet = React.useMemo(() => new Set(groundTruthIndices), [groundTruthIndices]);

    // 新增：游戏模式（'easy' | 'hard'）与简单模式的当前选择
    const [mode, setMode] = useState<"easy" | "hard">("hard");
    const [easyChoice, setEasyChoice] = useState<"phishing" | "legit" | null>(null);

    // 是否本关已完成（用于启用下一关按钮）
    const [levelCompleted, setLevelCompleted] = useState(false);

    // 如果你想追踪当前关卡索引，可加：
    const [levelIndex, setLevelIndex] = useState(0);
    // onNextLevel: 进下一关的 stub（把真实的关卡加载逻辑放这儿）
    function onNextLevel() {
        // 示例：重置本关状态并增加 index
        setSelected(new Set());
        setFeedbacks([]);
        setMsg(null);
        setEasyChoice(null);
        setLevelCompleted(false);
        setLevelIndex((i) => i + 1);

        // TODO: 加载下一关的文本/groundTruth/isPhishing 等
    }

    // game state
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [score, setScore] = useState(0);
    const [lives, setLives] = useState(maxLives);
    const [msg, setMsg] = useState<string | null>(null);

    // cursor & container
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [showCursor, setShowCursor] = useState(true);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Feedbacks 用来渲染圆圈 + 飘分
    const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);

    // --- AUDIO: refs and controls ---
    const audioRefs = useRef<{ [k: string]: HTMLAudioElement | null }>({
        bingo: null,
        wrong: null,
        gameover: null,
    });
    const [muted, setMuted] = useState(false);
    const gameoverPlayedRef = useRef(false); // ensure gameover plays only once per game over

    // preload audio on mount
    useEffect(() => {
        // create audio elements pointing to public/sounds/*
        audioRefs.current.bingo = new Audio("/sounds/correct.wav");
        audioRefs.current.wrong = new Audio("/sounds/wrong.wav");
        audioRefs.current.gameover = new Audio("/sounds/gameover.wav");

        // prefer short preload
        Object.values(audioRefs.current).forEach((a) => {
            if (!a) return;
            a.preload = "auto";
            a.load();
            // small volume defaults
            a.volume = 0.9;
        });

        return () => {
            // clean up
            Object.values(audioRefs.current).forEach((a) => { try { a?.pause(); } catch { } });
        };
    }, []);

    // helper to play sound respecting muted and safe replay
    function playSound(key: "bingo" | "wrong" | "gameover") {
        if (muted) return;
        const a = audioRefs.current[key];
        if (!a) return;
        try {
            // rewind so we can retrigger quickly
            a.currentTime = 0;
            // play returns a promise; ignore errors (browsers may block before user gesture)
            const p = a.play();
            if (p && typeof p.then === "function") p.catch(() => { });
        } catch (e) {
            // ignore
        }
    }

    // 帮助函数：创建反馈并在 1200ms 后自动移除
    function pushFeedback(x: number, y: number, type: FeedbackItem["type"], label: string) {
        const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
        const item: FeedbackItem = { id, x, y, type, label };
        setFeedbacks((arr) => [...arr, item]);

        // 自动移除（动画时长与下面 CSS 保持一致：1200ms）
        setTimeout(() => {
            setFeedbacks((arr) => arr.filter((f) => f.id !== id));
        }, 1200);
    }

    // 点击 token（现在接收 MouseEvent 以获得坐标）
    const handleTokenClick = useCallback(
        (idx: number, e: React.MouseEvent) => {
            if (lives <= 0) return;
            if (selected.has(idx)) return;

            const clientX = e.clientX;
            const clientY = e.clientY;

            setSelected((s) => new Set(s).add(idx));
            if (truthSet.has(idx)) {
                setScore((s) => s + 10);
                setMsg("✅ 找到可疑点 +10");
                playSound("bingo"); // correct sound
                pushFeedback(clientX, clientY, "correct", "+10");
            } else {
                setLives((l) => l - 1);
                setScore((s) => Math.max(0, s - 5));
                setMsg("❌ 错误点击 -1 生命，-5 分");
                playSound("wrong"); // wrong sound
                pushFeedback(clientX, clientY, "wrong", "-5");
            }
            setTimeout(() => setMsg(null), 1200);
        },
        [selected, truthSet, lives]
    );

    // 需要：每个 level/邮件应有 isPhishing: boolean 表示整封邮件是否为 phishing
    // 如果你当前没有 level 对象，可临时定义： const isPhishing = true; 或把其作为 prop 传入
    const isPhishing = !!groundTruthIndices && groundTruthIndices.length > 0; // 临时启发式：有可疑 token 则当作 phishing。最好改为 explicit flag.

    // 立即判定：点击 Phishing/Legit 时调用
    function handleEasyChoice(choice: "phishing" | "legit") {
        if (lives <= 0 || levelCompleted) return;

        // 反馈出现位置：我们把它放在阅读区中心（和之前相同）
        const cont = containerRef.current;
        let centerX = window.innerWidth / 2;
        let centerY = window.innerHeight / 2;
        if (cont) {
            const r = cont.getBoundingClientRect();
            centerX = r.left + r.width / 2;
            centerY = r.top + r.height / 2;
        }

        // 判定邮件是否钓鱼 —— 推荐把 isPhishing 作为 prop/关卡字段
        const isPhishing = !!groundTruthIndices && groundTruthIndices.length > 0; // 临时启发式
        const pickedPhishing = choice === "phishing";
        const correct = pickedPhishing === isPhishing;

        if (correct) {
            setScore((s) => s + 10);
            setMsg("✅ 判断正确 +20");
            playSound?.("bingo");
            pushFeedback(centerX, centerY, "correct", "+10");
        } else {
            setLives((l) => Math.max(0, l - 1));
            setScore((s) => Math.max(0, s - 5));
            setMsg("❌ 判断错误 -1 生命，-10 分");
            playSound?.("wrong");
            pushFeedback(centerX, centerY, "wrong", "-5");
        }

        // 标记已完成本关（显示 Next Level 按钮）
        setLevelCompleted(true);
        // 清选择（如果你还用 easyChoice）
        setEasyChoice(null);

        setTimeout(() => setMsg(null), 1200);
    }




    // 鼠标与触摸处理（保持稳定）
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;

        function onMouseMove(e: MouseEvent) {
            setMousePos({ x: e.clientX, y: e.clientY });
        }
        function onMouseEnter(e: MouseEvent) {
            setShowCursor(true);
            setMousePos({ x: e.clientX, y: e.clientY });
        }
        function onMouseLeave() {
            setMousePos(null);
        }

        function onTouchMove(e: TouchEvent) {
            if (e.touches && e.touches[0]) {
                const t = e.touches[0];
                setMousePos({ x: t.clientX, y: t.clientY });
                setShowCursor(true);
            }
        }
        function onTouchEnd() {
            setMousePos(null);
        }

        el.addEventListener("mousemove", onMouseMove);
        el.addEventListener("mouseenter", onMouseEnter);
        el.addEventListener("mouseleave", onMouseLeave);
        el.addEventListener("touchstart", onTouchMove, { passive: true } as any);
        el.addEventListener("touchmove", onTouchMove, { passive: true } as any);
        el.addEventListener("touchend", onTouchEnd);

        return () => {
            el.removeEventListener("mousemove", onMouseMove);
            el.removeEventListener("mouseenter", onMouseEnter);
            el.removeEventListener("mouseleave", onMouseLeave);
            el.removeEventListener("touchstart", onTouchMove as any);
            el.removeEventListener("touchmove", onTouchMove as any);
            el.removeEventListener("touchend", onTouchEnd);
        };
    }, []);

    // when lives hits 0, play gameover once
    useEffect(() => {
        if (lives <= 0 && !gameoverPlayedRef.current) {
            playSound("gameover");
            gameoverPlayedRef.current = true;
        }
        // if resetting lives, reset the gameoverPlayed flag elsewhere (in resetGame)
    }, [lives]);

    //reset function must also reset gameoverPlayedRef
    function resetGame() {
        setSelected(new Set());
        setScore(0);
        setLives(maxLives);
        setMsg(null);
        setFeedbacks([]);
        gameoverPlayedRef.current = false;
    }

    const hearts = Array.from({ length: maxLives }, (_, i) => i < lives);

    return (
        <div className="w-full flex flex-col items-center">
            {/* 小型内联样式与动画 keyframes（方便直接粘贴） */}
            <style>{`
        /* 飘分文字向上并淡出的关键帧 */
        @keyframes floatUp {
          0% { transform: translateY(0); opacity: 1; }
          70% { transform: translateY(-28px); opacity: 0.9; }
          100% { transform: translateY(-48px); opacity: 0; }
        }
        /* 圈儿弹出并淡出 */
        @keyframes popFade {
          0% { transform: scale(0.6); opacity: 0.95; }
          50% { transform: scale(1.05); opacity: 0.9; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        /* 使 feedback 元素在页面上绝对定位并在动画后消失（动画时长 1.2s） */
        .feedback-wrapper {
          position: fixed;
          pointer-events: none;
          z-index: 120;
          transform: translate(-50%, -50%); /* 定位中心化 */
        }
        .feedback-circle {
          width: 52px;
          height: 52px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 6px 18px rgba(0,0,0,0.18);
          animation: popFade 1.2s ease-out forwards;
        }
        .feedback-label {
          margin-top: -8px;
          font-weight: 700;
          font-size: 14px;
          animation: floatUp 1.2s ease-out forwards;
        }
        
        /* Game Over 从上方落入并弹性停在中心 */
        @keyframes dropIn {
        0% {
            transform: translate(-50%, -150%) scale(0.92);
            opacity: 0;
        }
        65% {
            transform: translate(-50%, 8%) scale(1.04);
            opacity: 1;
        }
        100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
        }
        }

        /* 可选：轻微放大衰退效果 */
        @keyframes pulseOut {
        0% { transform: scale(1.02); }
        100% { transform: scale(1); }
        }

        /* GameOver 容器样式 */
        .gameover-drop {
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -150%);
        z-index: 200;
        pointer-events: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: dropIn 900ms cubic-bezier(.2,.9,.3,1) forwards;
        }
        .gameover-card {
        width: min(90vw, 560px);
        padding: 28px 32px;
        border-radius: 14px;
        background: linear-gradient(180deg, #111827, #0f172a);
        color: white;
        box-shadow: 0 20px 60px rgba(2,6,23,0.6);
        text-align: center;
        transform-origin: center;
        animation: pulseOut 260ms ease-out 1;
        }
        .gameover-title {
        font-size: 34px;
        font-weight: 800;
        letter-spacing: -0.02em;
        margin-bottom: 8px;
        }
        .gameover-sub {
        color: rgba(255,255,255,0.85);
        margin-bottom: 16px;
        }
        .gameover-actions { display:flex; gap:12px; justify-content:center; margin-top:6px; }
        .gameover-btn {
        padding: 10px 16px;
        border-radius: 10px;
        cursor: pointer;
        font-weight: 700;
        border: none;
        }
        .gameover-retry { background: white; color: #0f172a; }
        .gameover-home { background: rgba(255,255,255,0.06); color: white; border: 1px solid rgba(255,255,255,0.06); }
      `}</style>

            {/* 仪表盘 */}
            <div className="w-full max-w-4xl flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">

                    {/* 分数 */}
                    <div className="text-lg font-semibold">
                        Score: <span className="text-indigo-600">{score}</span>
                    </div>

                    {/* 生命值（爱心） */}
                    <div className="flex items-center gap-1">
                        {hearts.map((alive, i) => (
                            <svg
                                key={i}
                                width="22"
                                height="22"
                                viewBox="0 0 24 24"
                                fill={alive ? "red" : "none"}
                                stroke="red"
                                strokeWidth="1.1"
                                className="shadow-sm"
                            >
                                <path d="M12 21s-7-4.35-9.5-7.14C-0.5 9.5 4.5 4 8.5 7.5 10 9 11.5 10.5 12 11.5c.5-1 2-2.5 3.5-4 4-3.5 9 2.5 5 6.36C19 16.65 12 21 12 21z" />
                            </svg>
                        ))}
                    </div>

                    {/* 模式切换 */}
                    <div className="flex items-center gap-2 ml-2">
                        <span className="text-sm text-gray-500">Mode:</span>
                        <button
                            onClick={() => setMode("easy")}
                            className={`px-2 py-1 rounded text-sm ${mode === "easy"
                                ? "bg-indigo-600 text-lime-400"
                                : "bg-gray-100 hover:bg-gray-200"
                                }`}
                        >
                            Easy
                        </button>
                        <button
                            onClick={() => setMode("hard")}
                            className={`px-2 py-1 rounded text-sm ${mode === "hard"
                                ? "bg-indigo-600 text-red-400"
                                : "bg-gray-100 hover:bg-gray-200"
                                }`}
                        >
                            Hard
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        className="px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
                        onClick={() => setShowCursor((s) => !s)}
                    >
                        {showCursor ? "Hide Cursor" : "Show Cursor"}
                    </button>
                    <button className="px-3 py-1 rounded bg-indigo-600 text-white" onClick={resetGame}>
                        Reset
                    </button>
                </div>
            </div>

            {/* 客户端容器 */}
            <div className="w-full max-w-4xl h-[520px] bg-slate-50 rounded-lg shadow-lg overflow-hidden flex">
                <div className="w-44 bg-white p-4 border-r">
                    <div className="mb-4 font-bold">Inbox</div>
                    <div className="space-y-2 text-sm text-gray-600">
                        <div className="p-2 rounded bg-indigo-50">Subject: Account Alert</div>
                        <div className="p-2 rounded">Subject: Discount</div>
                        <div className="p-2 rounded">Subject: Team Update</div>
                    </div>
                </div>



                {/* 邮件阅读区 */}
                <div className="relative flex-1 p-6">
                    <div className="mb-3 text-sm text-gray-500">From: support@bank-example.com</div>
                    <div className="mb-6 text-lg font-semibold">Important: Verify your account</div>

                    {/* 这个区域会隐藏系统光标（cursor-none），token 不再单独设 cursor，避免覆盖 */}
                    <div
                        ref={containerRef}
                        className="relative bg-white p-4 rounded-md border cursor-none"
                        style={{ minHeight: 320 }}
                        onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                        onMouseLeave={() => setMousePos(null)}
                    >




                        <div style={{ lineHeight: 1.8 }}>
                            {tokens.map((tok, idx) => {
                                const isSelected = selected.has(idx);
                                const disabled = mode === "easy"; // 在简单模式下禁用 token 点击
                                return (
                                    <span
                                        key={idx}
                                        onClick={(e) => {
                                            if (disabled) return;
                                            handleTokenClick(idx, e);
                                        }}
                                        tabIndex={disabled ? -1 : 0}
                                        role="button"
                                        onKeyDown={(e) => {
                                            if (disabled) return;
                                            if (e.key === "Enter" || e.key === " ") handleTokenClick(idx, e as any);
                                        }}
                                        className={
                                            "inline-block select-none " +
                                            (isSelected ? "bg-yellow-300/70 border rounded-sm" : (disabled ? "" : "hover:bg-yellow-100"))
                                        }
                                        style={{ padding: "2px 3px", margin: "0 2px", cursor: disabled ? "default" : "pointer" }}
                                        title={disabled ? "" : "点击以标记可疑"}
                                    >
                                        {tok}
                                    </span>
                                );
                            })}
                        </div>

                        {/* 视觉的放大镜图形（不拦截事件） */}
                        {showCursor && mousePos && <MagnifierCursor x={mousePos.x} y={mousePos.y} />}
                    </div>

                    {/* 旧 msg（可删除，如果你只想用圈和飘分） */}
                    {/*<div className="mt-4 text-sm text-gray-600 min-h-[28px]">{msg}</div> */}
                    {/* 当是简单模式时显示整封选择控件 */}
                    {/* -----------------------------
   Easy-mode quick check buttons
   放在邮件区域之外（HUD / 标题右侧 / 侧边栏）
   ----------------------------- */}
                    {mode === "easy" && (
                        <div className="mt-4 flex items-center gap-3">
                            <div className="text-sm font-medium mr-2"></div>

                            {/* Phishing 按钮：自定义 SVG */}
                            <button
                                onClick={() => handleEasyChoice("phishing")}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none"

                            >
                                {/* 自定义警告 SVG（示例） */}
                                {/*<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M11 2a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" stroke="white" strokeWidth="1.4" />
                                    <path d="M11 7v5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    <circle cx="11" cy="15.5" r="0.8" fill="white" />
                                </svg>  */}
                                {/* 鱼钩svg */}
                                <svg
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="18"
                                    height="18"
                                    aria-hidden="true"
                                    fill="none"
                                >
                                    <circle
                                        cx="12"
                                        cy="3.41"
                                        r="1.91"
                                        fill="none"
                                        stroke="#020202"
                                        strokeWidth={1.91}
                                        strokeMiterlimit={10}
                                    />
                                    <path
                                        d="M12,5.32v.21a8.5,8.5,0,0,0,3.49,6.7,5.73,5.73,0,1,1-9.22,4.54"
                                        fill="none"
                                        stroke="#020202"
                                        strokeWidth={1.91}
                                        strokeMiterlimit={10}
                                    />
                                    <polyline
                                        points="9.14 16.77 6.27 13.91 6.27 16.77"
                                        fill="none"
                                        stroke="#020202"
                                        strokeWidth={1.91}
                                        strokeMiterlimit={10}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>

                                Phishing
                            </button>

                            {/* Legit 按钮：自定义 SVG */}
                            <button
                                onClick={() => handleEasyChoice("legit")}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 focus:outline-none"

                            >
                                {/* 勾勾 SVG（示例） */}
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                                    <path d="M20 6L9 17l-5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Legit
                            </button>
                        </div>
                    )}

                    {/* Next Level（右下角固定） */}
                    {levelCompleted && (
                        <div style={{ position: "fixed", right: 20, bottom: 20, zIndex: 220 }}>
                            <button
                                onClick={onNextLevel}
                                className="px-4 py-3 rounded-lg bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 focus:outline-none"
                            >
                                Next Level →
                            </button>
                        </div>
                    )}
                </div>
            </div>



            {/* 替换原先的 Game Over 区块：用从上落下居中动画 */}
            {lives <= 0 && (
                <div className="gameover-drop" role="dialog" aria-modal="true">
                    <div className="gameover-card">
                        <div className="gameover-title">💀 Game Over</div>
                        <div className="gameover-sub">你已经用完所有生命</div>
                        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6, color: "#FDE68A" }}>
                            最终得分: <span style={{ color: "#fff" }}>{score}</span>
                        </div>
                        <div className="gameover-actions">
                            <button
                                className="gameover-btn gameover-retry"
                                onClick={() => {
                                    // Reset game (复用现有 resetGame 函数)
                                    resetGame();
                                    // 确保放开 gameoverPlayed 标志以便之后再次触发音效
                                    // (resetGame 已经会重置 gameoverPlayedRef，如果没有，请在 resetGame 内设置)
                                }}
                            >
                                Retry
                            </button>
                            <button
                                className="gameover-btn gameover-home"
                                onClick={() => {
                                    // 若你有主页/菜单路由，可以在这里 navigate；否则也重置
                                    resetGame();
                                }}
                            >
                                Return
                            </button>
                        </div>
                    </div>
                </div>
            )}



            {/* 渲染所有 active feedbacks（圈 + 飘分） */}
            {feedbacks.map((f) => (
                <div
                    key={f.id}
                    className="feedback-wrapper"
                    style={{
                        left: f.x,
                        top: f.y,
                    }}
                >
                    {/* 圈 */}
                    <div
                        className="feedback-circle"
                        style={{
                            border: f.type === "correct" ? "3px solid rgba(22,163,74,0.95)" : "3px solid rgba(220,38,38,0.95)",
                            background: f.type === "correct" ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.09)",
                        }}
                    />
                    {/* 飘分文字（使用绝对定位使其在圈上方显示并执行动画） */}
                    <div
                        className="feedback-label"
                        style={{
                            position: "absolute",
                            left: "50%",
                            top: -6,
                            transform: "translateX(-50%)",
                            color: f.type === "correct" ? "#16a34a" : "#dc2626",
                        }}
                    >
                        {f.label}
                    </div>
                </div>
            ))}
        </div>
    );
}

/* 放大镜光标：保留 pointer-events: none */
function MagnifierCursor({ x, y }: { x: number; y: number }) {
    const size = 44;
    const offsetX = 18;
    const offsetY = 18;
    const left = x + offsetX;
    const top = y + offsetY;

    return (
        <div
            style={{
                position: "fixed",
                left,
                top,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
                zIndex: 80,
                pointerEvents: "none",
            }}
            aria-hidden
        >
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 48 48">
                <path fill="#616161" d="M34.6 28.1H38.6V45.1H34.6z" transform="rotate(-45.001 36.586 36.587)"></path><path fill="#616161" d="M20 4A16 16 0 1 0 20 36A16 16 0 1 0 20 4Z"></path><path fill="#37474F" d="M36.2 32.1H40.2V44.400000000000006H36.2z" transform="rotate(-45.001 38.24 38.24)"></path><path fill="#64B5F6" d="M20 7A13 13 0 1 0 20 33A13 13 0 1 0 20 7Z"></path><path fill="#BBDEFB" d="M26.9,14.2c-1.7-2-4.2-3.2-6.9-3.2s-5.2,1.2-6.9,3.2c-0.4,0.4-0.3,1.1,0.1,1.4c0.4,0.4,1.1,0.3,1.4-0.1C16,13.9,17.9,13,20,13s4,0.9,5.4,2.5c0.2,0.2,0.5,0.4,0.8,0.4c0.2,0,0.5-0.1,0.6-0.2C27.2,15.3,27.2,14.6,26.9,14.2z"></path>
            </svg>
        </div>
    );
}
