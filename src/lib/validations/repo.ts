import {
  z,
} from "zod";

export const githubUrlSchema =
  z
    .string()
    .url()
    .regex(
      /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\/tree\/[\w./-]+)?$/,
      "Must be a valid GitHub repository URL",
    );

export const analyzeSchema =
  z
    .object({
      githubUrl:
        githubUrlSchema.optional(),

      installationId:
        z
          .number()
          .int()
          .positive()
          .optional(),

      githubRepositoryId:
        z
          .string()
          .regex(
            /^\d+$/,
          )
          .optional(),
    })
    .superRefine(
      (
        value,
        context,
      ) => {
        const hasPublicUrl =
          Boolean(
            value.githubUrl,
          );

        const hasInstallationRepo =
          Boolean(
            value.installationId &&
              value.githubRepositoryId,
          );

        /*
         * Exactly one repository source.
         */
        if (
          hasPublicUrl ===
          hasInstallationRepo
        ) {
          context.addIssue({
            code:
              z.ZodIssueCode
                .custom,

            message:
              "Provide either a public GitHub URL or one connected GitHub repository",
          });
        }
      },
    );

export type AnalyzeRequest =
  z.infer<
    typeof analyzeSchema
  >;
