import axios from "axios";
import express from "express";

import { GitHubRepositoryCommits, syncRepositoryCommitsForUserOrg } from "@/common/models/commits.model";
import { GithubIntegration } from "@/common/models/ghIntegration.model";
import { GitHubRepositoryIssues, syncRepositoryIssuesForUserOrg } from "@/common/models/issues.model";
import { GitHubOrganization, syncOrganizationsForUser } from "@/common/models/organization.model";
import { GitHubRepositoryPulls, syncRepositoryPullsForUserOrg } from "@/common/models/pulls.model";
import { GitHubRepository, syncRepositoriesForUserOrg } from "@/common/models/repository.model";
import { getGithubToken } from "@/common/utils/getGithubToken";

const router = express.Router();

router.get("/callback", async (req, res) => {
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
});
router.get("/organizations", async (req, res) => {
  // Get all organizations
  const organizations = await GitHubOrganization.find({});
  return res.status(200).send(organizations);
});
router.get("/repos", async (req, res) => {
  // Get all organizations
  const repos = await GitHubRepository.find({});
  return res.status(200).send(repos);
});
router.get("/commits", async (req, res) => {
  // Get all organizations
  const commits = await GitHubRepositoryCommits.find({});
  return res.status(200).send(commits);
});
router.get("/issues", async (req, res) => {
  // Get all organizations
  const issues = await GitHubRepositoryIssues.find({});
  return res.status(200).send(issues);
});
router.get("/pulls", async (req, res) => {
  // Get all organizations
  const pulls = await GitHubRepositoryPulls.find({});
  return res.status(200).send(pulls);
});
router.get("/logout", async (req, res) => {
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
});

// full text search endpoint
router.get("/commitsTextSearch", async (req, res) => {
  const query = req.query.text as string;

  if (!query) {
    return res.status(400).send("Missing search query");
  }

  const results = await GitHubRepositoryCommits.aggregate([
    {
      $search: {
        index: "commits_search",
        text: {
          query,
          path: {
            wildcard: "*",
          },
        },
      },
    },
  ]);

  // Implement search logic here
  // This is a placeholder response
  return res.status(200).send({
    results,
  });
});

// full text search endpoint
router.get("/issuesTextSearch", async (req, res) => {
  const query = req.query.text as string;

  if (!query) {
    return res.status(400).send("Missing search query");
  }

  const results = await GitHubRepositoryIssues.aggregate([
    {
      $search: {
        index: "issues_search",
        text: {
          query,
          path: {
            wildcard: "*",
          },
        },
      },
    },
  ]);

  // Implement search logic here
  // This is a placeholder response
  return res.status(200).send({
    results,
  });
});

// full text search endpoint
router.get("/pullsTextSearch", async (req, res) => {
  const query = req.query.text as string;

  if (!query) {
    return res.status(400).send("Missing search query");
  }

  const results = await GitHubRepositoryPulls.aggregate([
    {
      $search: {
        index: "orgs_search",
        text: {
          query,
          path: {
            wildcard: "*",
          },
        },
      },
    },
  ]);

  // Implement search logic here
  // This is a placeholder response
  return res.status(200).send({
    results,
  });
});

export { router };
