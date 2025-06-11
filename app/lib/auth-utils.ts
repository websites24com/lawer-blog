import { auth} from '@/app/lib/auth';

export async function requireAuth(options?: {
    roles?: string[];
}) {
    const session = await auth();
    if (!session || !session.user) throw new Error('Not authenticated');
    
    const allowedRoles = options?.roles || [];

    if (allowedRoles.length && !allowedRoles.includes(session.user.role)) {
        throw new Error ('Unauthorized')
    }

    return session;
}