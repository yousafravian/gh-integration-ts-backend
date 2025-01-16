import axios from "axios";
import { getGithubToken } from "@/common/utils/getGithubToken";
import { syncOrganizationsForUser } from "@/common/models/organization.model";
import { syncRepositoriesForUserOrg } from "@/common/models/repository.model";
import { syncRepositoryCommitsForUserOrg } from "@/common/models/commits.model";
import { syncRepositoryIssuesForUserOrg } from "@/common/models/issues.model";
import { syncRepositoryPullsForUserOrg } from "@/common/models/pulls.model";
import { GithubIntegration } from "@/common/models/ghIntegration.model";
import type { Request, Response } from "express";

export const handleIntegration = async (req: Request, res: Response) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Missing code parameter");
  }

  const postData = {
    client_id: process.env.GH_CLIENT_ID,
    client_secret: process.env.GH_CLIENT_SECRET,
    code,
  };

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post("https://github.com/login/oauth/access_token", postData, {
      headers: { Accept: "application/json" },
    });

    if (tokenResponse.data.error) {
      return res.status(400).send({
        error: tokenResponse.data.error,
        message: tokenResponse.data.error_description,
      });
    }

    const accessToken = tokenResponse.data.access_token;

    // Fetch user data
    const userResponse = await getGithubToken(accessToken);

    // Fetch organizations
    const orgs = await syncOrganizationsForUser(accessToken, userResponse.data.id);
    for (const org of orgs) {
      const repository = await syncRepositoriesForUserOrg(accessToken, org, userResponse.data.id);

      for (const repo of repository) {
        const commit = await syncRepositoryCommitsForUserOrg(accessToken, org, repo, userResponse.data.id);
        const issues = await syncRepositoryIssuesForUserOrg(accessToken, org, repo, userResponse.data.id);
        const pulls = await syncRepositoryPullsForUserOrg(accessToken, org, repo, userResponse.data.id);
      }
    }

    // Save data to MongoDB
    const integration = await (GithubIntegration as any)?.saveIntegrationData({
      userId: userResponse.data.id,
      username: userResponse.data.login,
      lastSync: new Date().toISOString(),
      token: accessToken,
    });

    res.status(200).send({
      message: "GitHub Integration successful",
      payload: integration,
    });
  } catch (error) {
    console.error("Error during GitHub data fetch:", error);
    res.status(500).send({ error: "Error processing GitHub OAuth" });
  }
};

export const handleLogout = async (req: Request, res: Response) => {
  try {
    // Implement logout logic here
    const userId = req.query.userId;

    // Delete user's GitHub Integration data
    const data = await GithubIntegration.deleteOne({ userId });

    if (data.deletedCount === 0) {
      return res.status(200).send({ error: "User not found" });
    }

    res.status(200).send({ message: "Logged out successfully" });
  } catch (e) {
    res.status(500).send({ error: "Error logging out" });
  }
};
