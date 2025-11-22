// src/services/levels.ts
export type EmailLevel = {
    id: string;
    subject: string;
    fromName: string;
    fromEmail: string;
    date?: string;
    paragraphs: string[];         // 每个段落为独立字符串
    // groundTruth 用关键词/短语数组表示（小写匹配），可以是单词、短链接、邮箱、短语等
    groundTruth: string[];
    difficulty?: number;
};

export const levels: EmailLevel[] = [
    {
        id: "level-1",
        subject: "Important: Verify your account",
        fromName: "Bank Security Team",
        fromEmail: "support@bank-example.com",
        date: "Today",
        paragraphs: [
            "Dear user,",
            "Your bank account has been temporarily suspended due to unusual activity.",
            "Please verify your identity by clicking the link below immediately:",
            "https://secure-login-bank-example.com",
            "Failure to do so may result in permanent account closure.",
            "Best regards,",
            "Bank Security Team"
        ],
        // 这里我们直接写要匹配的关键词/短语（不区分大小写）
        groundTruth: ["suspended", "unusual activity", "secure-login-bank-example.com", "verify your identity"]
    },

    {
        id: "level-2",
        subject: "Quick question about partnership",
        fromName: "Riley Thompson",
        fromEmail: "rthompson@biztechsolutions.com",
        date: "Yesterday",
        paragraphs: [
            "Hello Robin,",
            "I hope this finds you well. I've been closely following your company's rapid growth and impressive digital innovations over the past year.",
            "At BizTech Solutions, we've recently launched a platform that I believe could align perfectly with your current objectives and further streamline your operations.",
            "I'd love the chance to discuss how we might be a good fit for your team. Would you be available for a brief call next week, perhaps Wednesday at 10 AM?",
            "Looking forward to connecting.",
            "Warm regards,",
            "Riley Thompson\nSenior B2B Solutions Specialist\nBizTech Solutions"
        ],
        groundTruth: ["biztechsolutions.com"] // 例如链接/发件人域名可疑
    },

    // 你可以继续在这里添加更多 level 对象
];
