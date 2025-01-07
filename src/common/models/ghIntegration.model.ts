import mongoose from "mongoose";

const GithubIntegrationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // GitHub User ID
  username: { type: String, required: true }, // GitHub Username
  token: { type: String, required: true }, // Access Token
  connectedAt: { type: Date, default: Date.now },
  lastSync: { type: Date },
});

GithubIntegrationSchema.static(
  "saveIntegrationData",
  async function (data: {
    userId: string;
    username: string;
    lastSync: Date;
    token: string;
  }) {
    const { userId, username, lastSync, token } = data;

    try {
      const existingIntegration = await this.findOne({ userId });

      if (existingIntegration) {
        // Update existing integration
        existingIntegration.token = token;
        existingIntegration.lastSync = lastSync;

        // Update organizations and repositories
        /*existingIntegration.organizations = organizations.map((org: any) => {
                const existingOrg: any = existingIntegration.organizations.find(
                    (o: any) => o.name === org.name
                );

                if (existingOrg) {
                    // Merge repositories if the organization already exists
                    existingOrg.repositories = org.repositories.map((repo: any) => {
                        const existingRepo = existingOrg.repositories.find(
                            (r: any) => r.name === repo.name
                        );

                        return existingRepo
                            ? { ...existingRepo, ...repo } // Merge existing repo details
                            : repo; // Add new repo
                    });

                    return { ...existingOrg, ...org }; // Merge org details
                }

                return org; // Add new organization
            });
*/
        await existingIntegration.save();
        console.log("GitHub Integration updated successfully");
        return existingIntegration;
      } else {
        // Create new integration
        const integration = new this({
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
  },
);

export const GithubIntegration = mongoose.model("GithubIntegration", GithubIntegrationSchema);
