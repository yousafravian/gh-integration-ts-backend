import { Octokit } from "@octokit/rest";

let octokit: Octokit;

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class OctokitService {
  static authenticate(accessToken: string) {
    octokit = new Octokit({ auth: accessToken });
  }

  static async getAuthenticatedUser(token: string) {
    if (!octokit) OctokitService.authenticate(token);

    return octokit.rest.users.getAuthenticated();
  }

  static async getOrganizations(token: string) {
    if (!octokit) OctokitService.authenticate(token);

    const organizationsResponse = await octokit.rest.orgs.listForAuthenticatedUser();
    return organizationsResponse.data;
  }

  static async getRepositories(token: string, orgName: string) {
    if (!octokit) OctokitService.authenticate(token);

    const reposResponse = await octokit.rest.repos.listForOrg({ org: orgName });
    return reposResponse.data;
  }

  static async *fetchRepositoryIssues(token: string, repo: any) {
    if (!octokit) OctokitService.authenticate(token);

    let page = 1;
    const perPage = 100;

    try {
      while (true) {
        // Fetch issues for the current page
        const issuesResponse = await octokit.rest.issues.listForRepo({
          owner: repo.owner.login,
          repo: repo.name,
          page,
          per_page: perPage,
        });

        const data = issuesResponse.data;

        // Stop when there are no more issues
        if (data.length === 0) {
          break;
        }

        // Yield issues for this page
        yield data;

        // Move to the next page
        page++;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching issues:", error.message);
      }
      yield [];
    }
  }
  
  static async *fetchRepositoryCommits(token: string, repo: any) {
    if (!octokit) OctokitService.authenticate(token);

    let page = 1;
    const perPage = 100;

    try {
      while (true) {
        // Fetch commits for the current page
        const commitsResponse = await octokit.rest.repos.listCommits({
          owner: repo.owner.login,
          repo: repo.name,
          page,
          per_page: perPage,
        });

        const data = commitsResponse.data;

        // Stop when there are no more commits
        if (data.length === 0) {
          break;
        }

        // Yield commits for this page
        yield data;

        // Move to the next page
        page++;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching commits:", error.message);
      }
      yield [];
    }
  }

  static async *fetchRepositoryPulls(token: string, repo: any) {
    if (!octokit) OctokitService.authenticate(token);

    let page = 1;
    const perPage = 100;

    try {
      while (true) {
        // Fetch pull requests for the current page
        const pullsResponse = await octokit.rest.pulls.list({
          owner: repo.owner.login,
          repo: repo.name,
          page,
          per_page: perPage,
          state: "all", // Fetch all PR states
        });

        const data = pullsResponse.data;

        // Stop when there are no more pull requests
        if (data.length === 0) {
          break;
        }

        // Yield PRs for this page
        yield data;

        // Move to the next page
        page++;
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error fetching pull requests:", error.message);
      }
      yield [];
    }
  }
}
