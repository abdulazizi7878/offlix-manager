import { NextResponse } from "next/server";

import AccountSettingsService from "@/services/account-settings.service";

import {
    verifyEmailChangeSchema,
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

        const {
            verificationToken,
        } =
            verifyEmailChangeSchema.parse(
                body
            );

        const result =
            await AccountSettingsService.resendEmailChange(
                user.id,
                verificationToken
            );

        return NextResponse.json({
            success: true,
            data: result,
        });
    }
);