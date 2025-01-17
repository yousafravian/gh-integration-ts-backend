import { parentPort, workerData } from 'node:worker_threads';
import axios from 'axios';
import { OctokitService } from '@/common/utils/octokit.service';
import { syncOrganizationsForUser } from '@/controllers/orgs.controller';
import { syncRepositoriesForUserOrg } from '@/controllers/repos.controller';
import { syncRepositoryCommitsForUserOrg } from '@/controllers/commits.controller';
import { syncRepositoryIssuesForUserOrg } from '@/controllers/issues.controller';
import { syncRepositoryPullsForUserOrg } from '@/controllers/pull-requests.controller';
import { saveIntegrationData } from '@/controllers/integration.controller';
import { connectDB } from '@/common/utils/dbManager';

// Function to calculate Fibonacci
const syncData = async (code: string) => {
  await connectDB();
  if (!code) {
    throw new Error("No code provided");
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
      throw new Error(tokenResponse.data.error_description);
    }

    const accessToken = tokenResponse.data.access_token;

    // Fetch user data
    const userResponse = await OctokitService.getAuthenticatedUser(accessToken);
    const userId = userResponse.data.id;
    const username = userResponse.data.login;

    if (parentPort) {
      const integration = await saveIntegrationData({
        userId,
        username,
        isProc: 1,
        lastSync: new Date().toISOString(),
        token: accessToken,
      });
      parentPort.postMessage({
        message: "GitHub Integration successful",
        payload: {
          _id: integration._id.toString(),
          userId: integration.userId,
          username: integration.username,
          token: integration.token,
          inProc: integration.isProc,
          lastSync: integration.lastSync!.toISOString(),
          connectedAt: integration.connectedAt.toISOString(),
        },
      });
    }

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
      isProc: 0,
      lastSync: new Date().toISOString(),
      token: accessToken,
    });

    return {
      message: "GitHub Integration successful",
      payload: {
        _id: integration._id.toString(),
        userId: integration.userId,
        username: integration.username,
        token: integration.token,
        isProc: 0,
        lastSync: integration.lastSync!.toISOString(),
        connectedAt: integration.connectedAt.toISOString(),
      },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};

(async () => {
  try {
    if (parentPort) {
      // Perform the calculation and send the result back
      await syncData(workerData.code);
    } else {
      console.error("This script must be run as a worker.");
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
