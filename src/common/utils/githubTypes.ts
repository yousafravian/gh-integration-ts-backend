import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";

export type ListCommits = RestEndpointMethodTypes["repos"]["listCommits"]["response"]["data"];
export type ListPulls = RestEndpointMethodTypes["pulls"]["list"]["response"]["data"];
export type ListIssues = RestEndpointMethodTypes["issues"]["listForRepo"]["response"]["data"];
export type ListOrgs = RestEndpointMethodTypes["orgs"]["list"]["response"]["data"];
