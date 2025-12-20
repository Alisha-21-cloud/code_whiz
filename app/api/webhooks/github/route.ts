import { reviewPullRequest } from "@/module/ai/actions";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const event = req.headers.get("x-github-event");

        console.log(`Received GitHub event: ${event}`);

        if (event === "ping") {
            return NextResponse.json({ msg: "pong" }, { status: 200 });
        }

        if (event === "pull_request") {
            const action = body.action;
            const repo = body.repository.full_name;
            const prNumber = body.number;

            const [owner, repoName] = repo.split("/");

            if (action === "opened" || action === "synchronize" ) {
                reviewPullRequest(owner, repoName, prNumber)
                .then(() => console.log(`Reviewed PR #${prNumber} in ${repo}`))
                .catch((error) => console.error(`Error reviewing PR #${prNumber} in ${repo}:`, error));
            }
        }

        // Handle other GitHub events here

        return NextResponse.json({ msg: "Event received" }, { status: 200 });
    } catch (error) {
        console.error("Error processing GitHub webhook:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}