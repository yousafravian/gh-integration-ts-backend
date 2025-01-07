import axios from "axios";

export function getGithubToken(accessToken: string) {
  return axios.get("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
