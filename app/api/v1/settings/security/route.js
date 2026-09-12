import { NextResponse } from "next/server";

import SecuritySettingsService from "@/services/security-settings.service";

import {
    changePasswordSchema,
    revokeSessionSchema,
    revokeOtherSessionsSchema,
} from "@/validations/security-settings.validation";

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

    const { user, session } = currentUser;

    const result =
        await SecuritySettingsService.getSecuritySettings(
            user.id,
            user.accountId
        );

    return NextResponse.json({
        success: true,
        data: {
            ...result,
            currentSessionId: session.id,
        },
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

    const { user, session } = currentUser;

    const body = await request.json();

    const data = changePasswordSchema.parse(body);

    const result =
        await SecuritySettingsService.changePassword(
            user.id,
            user.accountId,
            session.id,
            data.currentPassword,
            data.newPassword
        );

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

    const { user, session } = currentUser;

    const body = await request.json();

    /*
     * Two supported operations:
     *
     * { sessionId: "..." }
     *
     * or
     *
     * { confirm: true }
     *
     * for revoking all other sessions.
     */

    if (body?.sessionId) {
        const data =
            revokeSessionSchema.parse(body);

        const result =
            await SecuritySettingsService.revokeSession(
                user.id,
                user.accountId,
                data.sessionId,
                session.id
            );

        return NextResponse.json({
            success: true,
            data: result,
        });
    }

    const data =
        revokeOtherSessionsSchema.parse(body);

    const result =
        await SecuritySettingsService.revokeOtherSessions(
            user.id,
            user.accountId,
            session.id
        );

    return NextResponse.json({
        success: true,
        data: result,
    });
});