import { NextResponse } from "next/server";
import PermissionService from "@/services/permission.service";
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

    const permissions =
        await PermissionService.getPermissions(
            user.id,
            user.accountId
        );

    return NextResponse.json({
        success: true,
        data: permissions,
    });
});