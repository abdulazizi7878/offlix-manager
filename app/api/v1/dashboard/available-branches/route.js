// file: app/api/v1/dashboard/available-branches/route.js

import { NextResponse } from "next/server";

import BranchAccessService from "@/services/branch-access.service";

import { getCurrentUser } from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import {
    withErrorHandling,
} from "@/lib/api/with-error-handling";

export const GET = withErrorHandling(
    async (request) => {
        const currentUser =
            await getCurrentUser();

        if (!currentUser) {
            throw new AppError(
                "Authentication required.",
                401,
                "UNAUTHORIZED"
            );
        }

        const { user } =
            currentUser;

        const { searchParams } =
            new URL(request.url);

        const permission =
            searchParams.get("permission");

        if (!permission) {
            throw new AppError(
                "Permission is required.",
                400,
                "PERMISSION_REQUIRED"
            );
        }

        const branches =
            await BranchAccessService.getAvailableBranches(
                user.id,
                user.accountId,
                permission
            );

        return NextResponse.json({
            success: true,
            data: branches,
        });
    }
);