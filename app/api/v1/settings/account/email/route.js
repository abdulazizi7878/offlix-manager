import { NextResponse } from "next/server";

import AccountSettingsService from "@/services/account-settings.service";

import {
    requestEmailChangeSchema,
} from "@/validations/account-settings.validation";

import {
    getCurrentUser,
} from "@/lib/auth/get-current-user";

import AppError from "@/lib/errors/AppError";

import {
    withErrorHandling,
} from "@/lib/api/with-error-handling";

export const POST = withErrorHandling(
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

        const { user } = currentUser;

        const body = await request.json();

        const { email } =
            requestEmailChangeSchema.parse(
                body
            );

        const result =
            await AccountSettingsService.requestEmailChange(
                user.id,
                user.accountId,
                email
            );

        return NextResponse.json({
            success: true,
            data: result,
        });
    }
);