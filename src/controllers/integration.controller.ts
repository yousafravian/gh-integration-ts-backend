import axios from "axios";
import { GithubIntegration } from "@/common/models/ghIntegration.model";
import type { Request, Response } from "express";
import { OctokitService } from '@/common/utils/octokit.service';
import { syncRepositoryIssuesForUserOrg } from "./issues.controller";
import { syncRepositoryCommitsForUserOrg } from "./commits.controller";
import { syncOrganizationsForUser } from "./orgs.controller";
import { syncRepositoryPullsForUserOrg } from "./pull-requests.controller";
import { syncRepositoriesForUserOrg } from '@/controllers/repos.controller';

// Route handlers
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
    const userResponse = await OctokitService.getAuthenticatedUser(accessToken);
    const userId = userResponse.data.id;
    const username = userResponse.data.login;

    // Fetch organizations
    const orgs = await syncOrganizationsForUser(accessToken, userId);

    for (const org of orgs) {
      const repositories = await syncRepositoriesForUserOrg(accessToken, org, userId);

      for (const repo of repositories) {
        await syncRepositoryCommitsForUserOrg(accessToken, org, repo, userId);
        await syncRepositoryIssuesForUserOrg(accessToken, org, repo, userId);
        await syncRepositoryPullsForUserOrg(accessToken, org, repo, userId);
      }
    }

    // Save data to MongoDB
    const integration = await saveIntegrationData({
      userId,
      username,
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


// utility functions
export const saveIntegrationData = async (data: any) => {
  const { userId, username, lastSync, token } = data;

  try {
    // Check if the integration already exists
    const existingIntegration = await GithubIntegration.findOne({ userId });

    if (existingIntegration) {
      // Update existing integration
      existingIntegration.token = token;
      existingIntegration.lastSync = lastSync;

      await existingIntegration.save();
      console.log("GitHub Integration updated successfully");
      return existingIntegration;
    } else {
      // Create a new integration
      const integration = new GithubIntegration({
        userId,
        username,
        lastSync,
        token,
      });

      await integration.save();
      console.log("GitHub Integration created successfully");
      return integration;
    }
  } catch (error) {
    console.error("Error saving GitHub Integration data:", error);
    throw new Error("Error saving GitHub Integration data");
  }
};