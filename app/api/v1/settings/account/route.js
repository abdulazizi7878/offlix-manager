import { NextResponse } from "next/server";
import AccountSettingsService from "@/services/account-settings.service";
import { updateAccountSettingsSchema } from "@/validations/account-settings.validation";
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

    const result = await AccountSettingsService.getAccountSettings(
        user.id,
        user.accountId
    );

    return NextResponse.json({
        success: true,
        data: result,
    });
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

    const validatedData = updateAccountSettingsSchema.parse(body);

    const result = await AccountSettingsService.updateAccountSettings(
        user.id,
        user.accountId,
        validatedData
    );

    return NextResponse.json({
        success: true,
        data: result,
    });
});