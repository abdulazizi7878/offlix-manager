import { z } from "zod";

export const uuidSchema = z.string().uuid("Invalid UUID.");

export const branchIdSchema = z.string().uuid(
    "Invalid branch ID."
);

export const employeeIdSchema = z.string().uuid(
    "Invalid employee ID."
);

const permissionKeysSchema = z
    .array(
        z
            .string()
            .trim()
            .min(1, "Permission key cannot be empty.")
            .max(100, "Permission key is too long.")
    )
    .max(200, "Too many permissions selected.")
    .default([]);

export const createBranchSchema = z.object({
    name: z
        .string()
        .trim()
        .min(1, "Branch name is required.")
        .max(
            150,
            "Branch name must not exceed 150 characters."
        ),

    description: z
        .string()
        .trim()
        .max(
            2000,
            "Description must not exceed 2000 characters."
        )
        .nullable()
        .optional(),

    employees: z
        .array(
            z.object({
                userId: employeeIdSchema,
                permissions: permissionKeysSchema,
            })
        )
        .optional(),
});

export const updateBranchSchema = z
    .object({
        name: z
            .string()
            .trim()
            .min(1, "Branch name is required.")
            .max(
                150,
                "Branch name must not exceed 150 characters."
            )
            .optional(),

        description: z
            .string()
            .trim()
            .max(
                2000,
                "Description must not exceed 2000 characters."
            )
            .nullable()
            .optional(),
    })
    .refine(
        (data) =>
            data.name !== undefined ||
            data.description !== undefined,
        {
            message:
                "At least one branch field is required.",
        }
    );

export const updateBranchStatusSchema = z.object({
    status: z.enum(["active", "inactive"]),
});

export const addEmployeeToBranchSchema = z.object({
    employeeId: employeeIdSchema,
    permissions: permissionKeysSchema,
});

export const updateEmployeePermissionsSchema = z.object({
    permissions: permissionKeysSchema,
});

export const organizationSettingsActionSchema = z.discriminatedUnion(
    "action",
    [
        z.object({
            action: z.literal("createBranch"),
            data: createBranchSchema,
        }),

        z.object({
            action: z.literal("updateBranch"),
            branchId: branchIdSchema,
            data: updateBranchSchema,
        }),

        z.object({
            action: z.literal("updateBranchStatus"),
            branchId: branchIdSchema,
            data: updateBranchStatusSchema,
        }),

        z.object({
            action: z.literal("addEmployeeToBranch"),
            branchId: branchIdSchema,
            data: addEmployeeToBranchSchema,
        }),

        z.object({
            action: z.literal("updateEmployeePermissions"),
            branchId: branchIdSchema,
            employeeId: employeeIdSchema,
            data: updateEmployeePermissionsSchema,
        }),

        z.object({
            action: z.literal("removeEmployeeFromBranch"),
            branchId: branchIdSchema,
            employeeId: employeeIdSchema,
        }),
    ]
);