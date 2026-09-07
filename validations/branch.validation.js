import { z } from "zod";

const branchNameSchema = z
  .string()
  .trim()
  .min(2, "Branch name must be at least 2 characters.")
  .max(150, "Branch name must not exceed 150 characters.");

const branchDescriptionSchema = z
  .string()
  .trim()
  .max(1000, "Branch description must not exceed 1000 characters.")
  .optional()
  .nullable();

export const createBranchSchema = z.object({
  name: branchNameSchema,

  description: branchDescriptionSchema,
});

export const updateBranchSchema = z
  .object({
    name: branchNameSchema.optional(),

    description: branchDescriptionSchema,
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.description !== undefined,
    {
      message: "At least one field must be provided.",
    }
  );

export const updateBranchStatusSchema = z.object({
  status: z.enum(["active", "inactive"], {
    message: "Status must be either active or inactive.",
  }),
});

export const branchIdSchema = z.string().uuid(
  "Invalid branch ID."
);