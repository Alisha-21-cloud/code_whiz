"use server";

import {
    ContributionCalendar,
    fetchUserContribution,
    getGithubToken
} from "@/module/github/lib/github";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { Octokit } from "octokit";
import prisma from "@/lib/db";

export async function getContributionStats() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            throw new Error("UnAuthorized");
        }

        const token = await getGithubToken();

        const octokit = new Octokit({
            auth: token
        });

        const {data: user} = await octokit.rest.users.getAuthenticated();
        const calendar = await fetchUserContribution(token, user.login);

        if(!calendar){
            return null;
        }

        const contributions = calendar.weeks.flatMap((week : any) => 
            week.contributionDays.map((day : any) => ({
                date: day.date,
                count: day.contributionCount,
                level: Math.min(4, Math.floor(day.contributionCount / 3)) 
            }))
        );

        return {
            contributions,
            totalContributions: calendar.totalContributions,
        }
    } catch (error) {
        console.error("Error in getContributionStats:", error);
        return null;
    }
}

export async function getDashboardStats() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            throw new Error("UnAuthorized");
        }

        const token = await getGithubToken();
        const octokit = new Octokit({
            auth: token
        });

        // get users github username

        const {data: user} = await octokit.rest.users.getAuthenticated();

        {/* TODO: FETCH TOTAL CONNECTED REPO FROM DB */}
        const totalRepos = 30;

        // fetch user contributions
        const calendar = await fetchUserContribution(token, user.login);
        const totalCommits = calendar?.totalContributions || 0;

        // count prs from database or github
        const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
            q: `author:${user.login} type:pr`,
            per_page: 1
        });

        const totalPRs = prs.total_count;

        {/* TODO: Count AI Reviews From DB */}
        const totalReviews = 44;

        return {
            totalCommits,
            totalPRs,
            totalReviews,
            totalRepos,
        }
    } catch (error) {
        console.error("Error in getDashboardStats:", error);
        return {
            totalCommits: 0,
            totalPRs: 0,
            totalReviews: 0,
            totalRepos: 0,
        };
    }
}

export async function getMonthlyActivity() {
    try {
        const session = await auth.api.getSession({
            headers: await headers()
        })

        if (!session?.user) {
            throw new Error("UnAuthorized");
        }

        const token = await getGithubToken();
        const octokit = new Octokit({
            auth: token
        });

        const {data: user} = await octokit.rest.users.getAuthenticated();

        const calendar: ContributionCalendar = await fetchUserContribution(token, user.login);

        if(!calendar){
            return [];
        }

        const monthlyData : {
            [key: string]: {commits: number; prs: number; reviews: number}
        } = {};

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        // Initialize last 6 months
        const now = new Date();

        for(let i = 5; i >= 0; i--){
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = monthNames[date.getMonth()];
            monthlyData[monthKey] = {commits: 0, prs: 0, reviews: 0};
        }

        // Aggregate commits
        calendar.weeks.forEach((week) => {
            week.contributionDays.forEach((day) => {
                const date = new Date(day.date);
                const monthKey = monthNames[date.getMonth()];
                if(monthlyData[monthKey]){
                    monthlyData[monthKey].commits += day.contributionCount;
                }
            });
        });


        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        // TODO : Aggregate PRs and Reviews similarly from GitHub or DB

        const generateSampleReviews = () => {
            const sampleReviews = [];
            const now = new Date();

            for (let i = 0; i < 50; i++) {
                const randomDaysAgo = Math.floor(Math.random() * 180); // within last 6 months
                const reviewDate = new Date(now);
                reviewDate.setDate(now.getDate() - randomDaysAgo);
                sampleReviews.push({
                     createdAt: reviewDate 
                });
            }
            return sampleReviews;
        };

        const reviews = generateSampleReviews();
        reviews.forEach((review) => {
            const monthKey = monthNames[review.createdAt.getMonth()];
            if(monthlyData[monthKey]){
                monthlyData[monthKey].reviews += 1;
            }
        })

        const { data: prs } = await octokit.rest.search.issuesAndPullRequests({
            q: `author:${user.login} type:pr created:>${
                sixMonthsAgo.toISOString().split('T')[0]
            }`,
            per_page: 100,
        });

        prs.items.forEach((pr: any) => {
            const date = new Date(pr.created_at);
            const monthKey = monthNames[date.getMonth()];
            if (monthlyData[monthKey]) {
                monthlyData[monthKey].prs += 1;
            }
        });

        return Object.keys(monthlyData).map((name) => ({
            name,
            ...monthlyData[name]
        }));

    } catch (error) {
        console.error("Error fetching monthly activity:", error);
        return [];
    }
}