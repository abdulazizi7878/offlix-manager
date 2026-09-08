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

const permissionKeysSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Permission key cannot be empty.")
      .max(100, "Permission key is too long.")
  )
  .default([])
  .transform((permissions) => [
    ...new Set(permissions),
  ]);

const branchEmployeeSchema = z.object({
  userId: z.string().uuid("Invalid employee ID."),
  permissions: permissionKeysSchema,
});

export const createBranchSchema = z.object({
  name: branchNameSchema,
  description: branchDescriptionSchema,
  employees: z
    .array(branchEmployeeSchema)
    .default([]),
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

export const addBranchEmployeeSchema = z.object({
  employeeId: z.string().uuid("Invalid employee ID."),
  permissions: permissionKeysSchema,
});

export const updateBranchEmployeeSchema = z.object({
  permissions: permissionKeysSchema,
});

export const employeeIdSchema = z.string().uuid(
  "Invalid employee ID."
);