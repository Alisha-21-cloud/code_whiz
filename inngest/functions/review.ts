import { inngest } from "../client";
import { getPullRequestDiff, postReviewComment } from "@/module/github/lib/github";
import { retrieveContext } from "@/module/ai/lib/rag";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import prisma from "@/lib/db";

export const generateReview = inngest.createFunction(
    { id: "generate-review", concurrency: 5 },
    { event: "pr.review.requested" },

    async ({ event, step }) => {
        const { owner, repo, prNumber, userId } = event.data;

        const { diff, title, description, token } = await step.run("fetch-pr-data", async () => {

            const account = await prisma.account.findFirst({
                where: {
                    userId: userId,
                    providerId: "github"
                }
            })

            if (!account?.accessToken) {
                throw new Error("No GitHub access token found");
            }

            const data = await getPullRequestDiff(account.accessToken, owner, repo, prNumber);
            return { ...data, token: account.accessToken }
        });


        const context = await step.run("retrieve-context", async () => {
            const query = `${title}\n${description}`;

            return await retrieveContext(query, `${owner}/${repo}`)
        });


        const review = await step.run("generate-ai-review", async () => {
            const prompt = `# Updated Code Review Prompt

You are an expert code reviewer. Analyze the following pull request and provide a detailed, constructive code review.

## PR Information
**Title:** ${title}
**Description:** ${description || "No description provided"}

## Context from Codebase
${context.join("\n\n")}

## Code Changes
\`\`\`diff
${diff}
\`\`\`

## Review Requirements

Provide a comprehensive review with the following sections:

### 1. Walkthrough
A file-by-file explanation of the changes. Describe what each modification does and how it contributes to the overall change.

### 2. Sequence Diagram (if applicable)
Create a Mermaid JS sequence diagram visualizing the flow of the changes. Use a \`\`\`mermaid ... \`\`\` code block.

**IMPORTANT Mermaid Guidelines:**
- Ensure all Mermaid syntax is valid
- Keep diagram labels simple and concise
- Use alphanumeric characters and underscores only in labels
- Avoid special characters like quotes, braces, parentheses inside Note text
- Keep the diagram focused on the main flow
- If multiple interactions exist, show the primary flow only

### 3. Summary
Brief overview of the PR's purpose and main changes.

### 4. Strengths
Identify what was done well in the implementation.

### 5. Issues
List any bugs, security concerns, code smells, or potential problems.
- **Critical Issues:** Problems that will cause failures
- **Major Issues:** Significant problems needing attention
- **Minor Issues:** Small improvements or optimizations

### 6. Suggestions
Provide specific, actionable code improvements with examples where appropriate.

### 7. Poem
End with a short, creative poem (4-8 lines) summarizing the changes. Keep it light and relevant to the code changes.

## Formatting Notes
- Use proper markdown headings and bullet points
- Keep technical explanations clear and concise
- Provide code examples for suggestions when helpful
- Balance constructive criticism with positive feedback`;

            const { text } = await generateText({
                model: google("gemini-2.5-flash"),
                prompt
            })

            return text
        });

        await step.run("post-comment", async () => {
            await postReviewComment(token, owner, repo, prNumber, review)
        })


        await step.run("save-review", async () => {
            const repository = await prisma.repository.findFirst({
                where: {
                    owner,
                    name: repo
                }
            });

            if (repository) {
                await prisma.review.create({
                    data: {
                        repositoryId: repository.id,
                        prNumber,
                        prTitle: title,
                        prUrl: `https://github.com/${owner}/${repo}/pull/${prNumber}`,
                        review,
                        status: "completed",
                    },
                });
            }
        })
        return { success: true }
    }
)