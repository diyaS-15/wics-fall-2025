"use client";
import EmailSpotGame from "@/components/EmailSpotGame";

const sampleEmail = `
Dear user,

Your bank account has been temporarily suspended due to unusual activity.
Please verify your identity by clicking the link below immediately:
https://secure-login-bank-example.com

Failure to do so may result in permanent account closure.

Best regards,
Bank Security Team
`;

export default function Page() {
    const groundTruth = [2, 15, 20, 23, 24, 25];
    return (
        <div className="p-8">
            <EmailSpotGame text={sampleEmail} groundTruthIndices={groundTruth} />
        </div>
    );
}
