import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

{ /* Getting the github access token */ }

export const getGithubToken = async(): Promise<string> => {
    const session = await auth.api.getSession({
        headers: await headers()
    })

    if(!session){
        throw new Error("UnAuthorized");
    }

    const account = await prisma.account.findFirst({
        where: {
            userId: session.user.id,
            providerId: "github"
        }
    })

    if(!account){
        throw new Error("GitHub account not found");
    }

    const token = account.accessToken;

    if(!token){
        throw new Error("GitHub token missing");
    }

    return token;
}

export type ContributionCalendar = {
    totalContributions: number;
    weeks: {
        contributionDays: {
            contributionCount: number;
            date: string;
            color: string;
        }[];
    }[];
};

export async function fetchUserContribution(token: string, username: string): Promise<ContributionCalendar> {
    const octokit = new Octokit({
        auth: token
    });

    const query = `
    query ($username: String!) {
        user(login: $username) {
            contributionsCollection {
                contributionCalendar {
                    totalContributions
                    weeks {
                        contributionDays {
                            contributionCount
                            date
                            color
                        }
                    }
                }
            }
        }
    }
    `;

    interface ContributionData {
        user: {
            contributionsCollection: {
                contributionCalendar: ContributionCalendar;
            };
        };
    }

    try {
        const response: ContributionData = await octokit.graphql(query, { username });

        return response.user.contributionsCollection.contributionCalendar;
    } catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to fetch contributions: ${error.message}`);
        }
        throw error;
    }
}

export const getRepositories = async ( page: number = 1, perPage: number = 10) => {
    const token =  await getGithubToken();
    const octokit = new Octokit({
        auth: token
    });

    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
        sort: "updated",
        direction: "desc",
        visibility: "all",
        per_page: perPage,
        page: page
    })

    return data;
} 