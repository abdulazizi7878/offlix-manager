import { NextResponse } from "next/server";

import OrganizationSettingsService from "@/services/organization-settings.service";
import {
    organizationSettingsActionSchema,
} from "@/validations/organization-settings.validation";

import { getCurrentUser } from "@/lib/auth/get-current-user";
import AppError from "@/lib/errors/AppError";
import { withErrorHandling } from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(async () => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    const result =
        await OrganizationSettingsService.getOrganizationSettings(
            user.id,
            user.accountId
        );

    return NextResponse.json({
        success: true,
        data: result,
    });
});

export const POST = withErrorHandling(async (request) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    const body = await request.json();

    const validatedData =
        organizationSettingsActionSchema.parse(body);

    let result;

    switch (validatedData.action) {
        case "createBranch":
            result =
                await OrganizationSettingsService.createBranch(
                    user.id,
                    user.accountId,
                    validatedData.data
                );
            break;

        case "addEmployeeToBranch":
            result =
                await OrganizationSettingsService.addEmployeeToBranch(
                    user.id,
                    user.accountId,
                    validatedData.branchId,
                    validatedData.data.employeeId,
                    validatedData.data.permissions
                );
            break;

        default:
            throw new AppError(
                "Unsupported organization settings action.",
                400,
                "UNSUPPORTED_ORGANIZATION_ACTION"
            );
    }

    return NextResponse.json(
        {
            success: true,
            data: result,
        },
        { status: 201 }
    );
});

export const PATCH = withErrorHandling(async (request) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    const body = await request.json();

    const validatedData =
        organizationSettingsActionSchema.parse(body);

    let result;

    switch (validatedData.action) {
        case "updateBranch":
            result =
                await OrganizationSettingsService.updateBranch(
                    user.id,
                    user.accountId,
                    validatedData.branchId,
                    validatedData.data
                );
            break;

        case "updateBranchStatus":
            result =
                await OrganizationSettingsService.updateBranchStatus(
                    user.id,
                    user.accountId,
                    validatedData.branchId,
                    validatedData.data.status
                );
            break;

        case "updateEmployeePermissions":
            result =
                await OrganizationSettingsService.updateEmployeePermissions(
                    user.id,
                    user.accountId,
                    validatedData.branchId,
                    validatedData.employeeId,
                    validatedData.data.permissions
                );
            break;

        default:
            throw new AppError(
                "Unsupported organization settings action.",
                400,
                "UNSUPPORTED_ORGANIZATION_ACTION"
            );
    }

    return NextResponse.json({
        success: true,
        data: result,
    });
});

export const DELETE = withErrorHandling(async (request) => {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new AppError(
            "Authentication required.",
            401,
            "UNAUTHORIZED"
        );
    }

    const { user } = currentUser;

    const body = await request.json();

    const validatedData =
        organizationSettingsActionSchema.parse(body);

    if (
        validatedData.action !==
        "removeEmployeeFromBranch"
    ) {
        throw new AppError(
            "Unsupported organization settings action.",
            400,
            "UNSUPPORTED_ORGANIZATION_ACTION"
        );
    }

    const result =
        await OrganizationSettingsService.removeEmployeeFromBranch(
            user.id,
            user.accountId,
            validatedData.branchId,
            validatedData.employeeId
        );

    return NextResponse.json({
        success: true,
        data: result,
    });
});